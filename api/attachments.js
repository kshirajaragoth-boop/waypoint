'use strict';

const { ObjectId, GridFSBucket } = require('mongodb');
const { getDb } = require('./_lib/db');
const { requireUser } = require('./_lib/auth');
const { sendJson, requireSameOrigin } = require('./_lib/http');

const MAX_FILE_BYTES = 2.5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv'
]);

function safeFileName(name) {
  return String(name || 'attachment')
    .replace(/[\\/"\r\n]/g, '_')
    .slice(0, 160);
}

module.exports = async function attachmentsHandler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return sendJson(res, 405, { error: 'Method not allowed.' });
    }
    if (req.method === 'POST' && !requireSameOrigin(req)) {
      return sendJson(res, 403, { error: 'Request origin was not allowed.' });
    }
    const user = await requireUser(req, res);
    if (!user) return;
    const db = await getDb();
    const bucket = new GridFSBucket(db, { bucketName: 'attachments' });

    if (req.method === 'POST') {
      const { projectId, noteId } = req.body || {};
      const name = safeFileName(req.body?.name);
      const contentType = String(req.body?.type || 'application/octet-stream').toLowerCase();
      const base64 = String(req.body?.data || '');
      if (!projectId || !noteId || !base64 || !ALLOWED_TYPES.has(contentType)) {
        return sendJson(res, 400, { error: 'Choose a supported image or document.' });
      }
      const encodedFile = base64.match(/^data:([a-z0-9.+/-]+);base64,([a-z0-9+/]+={0,2})$/i);
      if (!encodedFile || encodedFile[1].toLowerCase() !== contentType) {
        return sendJson(res, 400, { error: 'Attachment data is invalid.' });
      }
      const bytes = Buffer.from(encodedFile[2], 'base64');
      if (bytes.toString('base64') !== encodedFile[2]) {
        return sendJson(res, 400, { error: 'Attachment encoding is invalid.' });
      }
      if (!bytes.length || bytes.length > MAX_FILE_BYTES) {
        return sendJson(res, 413, { error: 'Files must be 2.5 MB or smaller.' });
      }
      const userId = new ObjectId(user._id);
      const workspaceDocument = await db.collection('workspaces').findOne({ userId });
      const project = workspaceDocument?.workspace?.projects?.find(item => item.id === projectId);
      const note = project?.notes?.find(item => item.id === noteId);
      if (!note) return sendJson(res, 404, { error: 'The note for this file was not found.' });
      const upload = bucket.openUploadStream(name, {
        contentType,
        metadata: { userId, projectId, noteId, contentType, name }
      });
      upload.end(bytes);
      const file = await new Promise((resolve, reject) => {
        upload.once('finish', () => resolve(upload));
        upload.once('error', reject);
      });
      return sendJson(res, 201, {
        attachment: {
          id: file.id.toString(),
          name,
          type: contentType,
          size: bytes.length,
          storage: 'server'
        }
      });
    }

    if (req.method === 'GET') {
      const fileId = String(req.query?.id || '');
      if (!ObjectId.isValid(fileId)) return sendJson(res, 400, { error: 'Attachment id is invalid.' });
      const file = await db.collection('attachments.files').findOne({
        _id: new ObjectId(fileId),
        'metadata.userId': new ObjectId(user._id)
      });
      if (!file) return sendJson(res, 404, { error: 'Attachment not found.' });
      res.statusCode = 200;
      res.setHeader('Content-Type', ALLOWED_TYPES.has(file.metadata?.contentType) ? file.metadata.contentType : 'application/octet-stream');
      res.setHeader('Content-Length', file.length);
      const fileName=safeFileName(file.metadata?.name || file.filename);
      const asciiFileName=fileName.replace(/[^\x20-\x7E]/g,'_');
      res.setHeader('Content-Disposition', `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-store');
      return bucket.openDownloadStream(new ObjectId(fileId)).pipe(res);
    }

    return sendJson(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    console.error('Waypoint attachment API failed:', error);
    if (!res.headersSent) return sendJson(res, 500, { error: 'Could not store or download this attachment.' });
    res.destroy(error);
  }
};
