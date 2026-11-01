'use strict';

const { getDb } = require('./_lib/db');
const { sendJson, requireSameOrigin } = require('./_lib/http');
const {
  createSession,
  hashPassword,
  publicUser,
  removeSession,
  requireUser,
  verifyPassword
} = require('./_lib/auth');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 16 * 1024;

module.exports = async function auth(req, res) {
  try {
    if (req.method === 'GET') {
      const user = await requireUser(req, res);
      if (!user) return;
      return sendJson(res, 200, { user: publicUser(user) });
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return sendJson(res, 405, { error: 'Method not allowed.' });
    }
    if (!requireSameOrigin(req)) return sendJson(res, 403, { error: 'Request origin was not allowed.' });
    if (Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8') > MAX_BODY_BYTES) {
      return sendJson(res, 413, { error: 'Request is too large.' });
    }
    const body = req.body || {};
    if (body.action === 'logout') {
      await removeSession(req, res);
      return sendJson(res, 200, { ok: true });
    }
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return sendJson(res, 400, { error: 'Enter a valid email address.' });
    }
    if (password.length < 10 || password.length > 256) {
      return sendJson(res, 400, { error: 'Password must be between 10 and 256 characters.' });
    }

    const db = await getDb();
    const users = db.collection('users');
    let user;
    if (body.action === 'signup') {
      const name = String(body.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
      if (!name) return sendJson(res, 400, { error: 'Enter your name to create an account.' });
      user = {
        email,
        name: name.toLowerCase(),
        passwordHash: await hashPassword(password),
        createdAt: new Date()
      };
      try {
        const result = await users.insertOne(user);
        user._id = result.insertedId;
      } catch (error) {
        if (error && error.code === 11000) return sendJson(res, 409, { error: 'An account with this email already exists.' });
        throw error;
      }
    } else if (body.action === 'login') {
      user = await users.findOne({ email });
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return sendJson(res, 401, { error: 'Email or password is incorrect.' });
      }
    } else {
      return sendJson(res, 400, { error: 'Choose log in or sign up.' });
    }

    await createSession(res, user);
    return sendJson(res, body.action === 'signup' ? 201 : 200, { user: publicUser(user) });
  } catch (error) {
    console.error('Waypoint auth API failed:', error);
    return sendJson(res, 500, { error: 'Authentication is temporarily unavailable.' });
  }
};
