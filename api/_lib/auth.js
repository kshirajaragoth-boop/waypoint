'use strict';

const {
  createHash,
  randomBytes,
  scrypt: scryptCallback,
  timingSafeEqual
} = require('node:crypto');
const { promisify } = require('node:util');
const { getDb } = require('./db');
const scrypt = promisify(scryptCallback);

const COOKIE_NAME = 'waypoint_session';
const SESSION_DAYS = 30;

function cookieValue(req, name) {
  const cookies = String(req.headers.cookie || '').split(';');
  const entry = cookies.map(item => item.trim()).find(item => item.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : '';
}

function sessionCookie(token, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name
  };
}

async function createSession(res, user) {
  const db = await getDb();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.collection('sessions').insertOne({
    userId: user._id,
    tokenHash: createHash('sha256').update(token).digest('hex'),
    expiresAt,
    createdAt: new Date()
  });
  res.setHeader('Set-Cookie', sessionCookie(token, SESSION_DAYS * 24 * 60 * 60));
}

async function getSessionUser(req) {
  const token = cookieValue(req, COOKIE_NAME);
  if (!token) return null;
  const db = await getDb();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const session = await db.collection('sessions').findOne({
    tokenHash,
    expiresAt: { $gt: new Date() }
  });
  if (!session) return null;
  return db.collection('users').findOne({ _id: session.userId });
}

async function requireUser(req, res) {
  const user = await getSessionUser(req);
  if (!user) {
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Please log in to continue.' }));
    return null;
  }
  return user;
}

async function removeSession(req, res) {
  const token = cookieValue(req, COOKIE_NAME);
  if (token) {
    const db = await getDb();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await db.collection('sessions').deleteOne({ tokenHash });
  }
  res.setHeader('Set-Cookie', sessionCookie('', 0));
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, saltHex, hashHex] = String(storedHash || '').split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

module.exports = {
  createSession,
  getSessionUser,
  hashPassword,
  publicUser,
  removeSession,
  requireUser,
  verifyPassword
};
