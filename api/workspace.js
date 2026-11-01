'use strict';

const { ObjectId, GridFSBucket } = require('mongodb');
const createCarePathDemo = require('../carepath-demo');
const { getDb } = require('./_lib/db');
const { requireUser } = require('./_lib/auth');
const { sendJson, requireSameOrigin } = require('./_lib/http');

const MAX_WORKSPACE_BYTES = 2 * 1024 * 1024;

function initialWorkspace(user) {
  const demo = createCarePathDemo();
  return {
    profile: {
      id: user._id.toString(),
      name: user.name,
      email: user.email
    },
    projects: [demo.project],
    people: demo.people,
    demoDismissed: false
  };
}

function ensureCarePath(workspace, user) {
  workspace.profile = {
    id: user._id.toString(),
    name: user.name,
    email: user.email
  };
  workspace.projects = Array.isArray(workspace.projects) ? workspace.projects : [];
  workspace.people = Array.isArray(workspace.people) ? workspace.people : [];
  const demo = createCarePathDemo();
  const demoIndex = workspace.projects.findIndex(project => project.demoId === 'healthcare-research');
  if (demoIndex === -1) {
    workspace.projects.unshift(demo.project);
  } else workspace.projects[demoIndex] = createCarePathDemo.mergeProject(workspace.projects[demoIndex], demo.project);
  demo.people.forEach(person => {
    if (!workspace.people.some(existing => existing.id === person.id)) workspace.people.push(person);
  });
  workspace.projects.forEach(project => {
    project.chats = Array.isArray(project.chats) ? project.chats : [];
    project.notes = Array.isArray(project.notes) ? project.notes : [];
    project.links = Array.isArray(project.links) ? project.links : [];
    project.people = Array.isArray(project.people) ? project.people : [];
    project.brief = project.brief && typeof project.brief === 'object' ? project.brief : {};
    project.tags = Array.isArray(project.tags) ? project.tags : [];
    project.notes.forEach(note => {
      note.tags = Array.isArray(note.tags) ? note.tags : [];
      note.attachments = Array.isArray(note.attachments) ? note.attachments : [];
    });
  });
  return workspace;
}

function referencedAttachmentIds(workspace) {
  const ids = new Set();
  workspace.projects.forEach(project => {
    project.notes.forEach(note => {
      note.attachments.forEach(attachment => {
        if (attachment.storage === 'server' && ObjectId.isValid(attachment.id)) {
          ids.add(attachment.id);
        }
      });
    });
  });
  return ids;
}

async function removeOrphanedAttachments(db, userId, workspace) {
  const referenced = referencedAttachmentIds(workspace);
  const bucket = new GridFSBucket(db, { bucketName: 'attachments' });
  const files = db.collection('attachments.files').find(
    { 'metadata.userId': userId },
    { projection: { _id: 1 } }
  );
  let cleanupWarning = false;
  for await (const file of files) {
    if (referenced.has(file._id.toString())) continue;
    try {
      await bucket.delete(file._id);
    } catch (error) {
      cleanupWarning = true;
      console.error('Could not remove an orphaned Waypoint attachment:', error);
    }
  }
  return cleanupWarning;
}

module.exports = async function workspaceHandler(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'PUT') {
      res.setHeader('Allow', 'GET, PUT');
      return sendJson(res, 405, { error: 'Method not allowed.' });
    }
    if (req.method === 'PUT' && !requireSameOrigin(req)) {
      return sendJson(res, 403, { error: 'Request origin was not allowed.' });
    }
    const user = await requireUser(req, res);
    if (!user) return;
    const db = await getDb();
    const workspaces = db.collection('workspaces');
    const userId = new ObjectId(user._id);

    if (req.method === 'GET') {
      let document = await workspaces.findOne({ userId });
      if (!document) {
        const workspace = initialWorkspace(user);
        await workspaces.insertOne({ userId, workspace, updatedAt: new Date() });
        return sendJson(res, 200, workspace);
      }
      const workspace = ensureCarePath(document.workspace || {}, user);
      await workspaces.updateOne({ userId }, { $set: { workspace, updatedAt: new Date() } });
      return sendJson(res, 200, workspace);
    }

    const bodySize = Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
    if (bodySize > MAX_WORKSPACE_BYTES) return sendJson(res, 413, { error: 'Workspace is too large.' });
    if (!req.body || !Array.isArray(req.body.projects) || !Array.isArray(req.body.people)) {
      return sendJson(res, 400, { error: 'Workspace data is invalid.' });
    }
    const existing = await workspaces.findOne({ userId });
    const incoming = {
      projects: req.body.projects,
      people: req.body.people,
      demoDismissed: false
    };
    const previousDemo = existing?.workspace?.projects?.find(project => project.demoId === 'healthcare-research');
    const incomingHasDemo = incoming.projects.some(project => project.demoId === 'healthcare-research');
    if (!incomingHasDemo) {
      const demo = previousDemo ? { ...previousDemo } : createCarePathDemo().project;
      incoming.projects.unshift(demo);
    }
    const workspace = ensureCarePath(incoming, user);
    await workspaces.updateOne(
      { userId },
      { $set: { workspace, updatedAt: new Date() } },
      { upsert: true }
    );
    const cleanupWarning=await removeOrphanedAttachments(db,userId,workspace);
    return sendJson(res, 200, cleanupWarning?{...workspace,warning:'Workspace saved, but a deleted attachment could not be removed.'}:workspace);
  } catch (error) {
    console.error('Waypoint workspace API failed:', error);
    return sendJson(res, 500, { error: 'Could not load or save workspace data.' });
  }
};
