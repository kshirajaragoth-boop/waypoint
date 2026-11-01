'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');
const createCarePathDemo = require('../carepath-demo');
const isLocalPreview = require('../local-preview');
const { hashPassword, verifyPassword } = require('../api/_lib/auth');
const { requireSameOrigin } = require('../api/_lib/http');
const authHandler = require('../api/auth');
const workspaceHandler = require('../api/workspace');
const attachmentsHandler = require('../api/attachments');

function responseStub() {
  return {
    headers: {},
    statusCode: 200,
    body: '',
    setHeader(name, value) { this.headers[name] = value; },
    end(body='') { this.body = body; }
  };
}

test('CarePath demo has scripted replies, source links, and a Google search prompt', () => {
  const { project, people } = createCarePathDemo();
  const replies = project.chats[0].messages.filter(message => message.role === 'assistant');
  assert.equal(project.isDemo, true);
  assert.equal(replies.length, 2);
  assert.ok(replies[0].links.length > 0);
  assert.ok(replies[1].searchPrompt);
  assert.equal(people.length, 3);
});

test('existing CarePath projects receive the latest demo reply actions', () => {
  const fixture = createCarePathDemo().project;
  const oldProject = {
    demoId: 'healthcare-research',
    chats: [{
      id: 'demo-carepath-chat',
      title: 'Existing chat title',
      messages: fixture.chats[0].messages.map(({ id, role, text, createdAt }) => ({ id, role, text, createdAt }))
    }]
  };
  createCarePathDemo.mergeProject(oldProject, fixture);
  assert.equal(oldProject.chats[0].title, 'Existing chat title');
  assert.ok(oldProject.chats[0].messages.find(message => message.id === 'demo-message-2').links.length > 0);
  assert.ok(oldProject.chats[0].messages.find(message => message.id === 'demo-message-4').searchPrompt);
});

test('password verification accepts only the matching secret', async () => {
  const passwordHash = await hashPassword('research-passphrase-2026');
  assert.equal(await verifyPassword('research-passphrase-2026', passwordHash), true);
  assert.equal(await verifyPassword('wrong-passphrase', passwordHash), false);
});

test('state-changing requests must have the same origin', () => {
  assert.equal(requireSameOrigin({
    headers: {
      origin: 'https://waypoint.example',
      'x-forwarded-host': 'waypoint.example',
      'x-forwarded-proto': 'https'
    }
  }), true);
  assert.equal(requireSameOrigin({
    headers: {
      origin: 'https://attacker.example',
      host: 'waypoint.example',
      'x-forwarded-proto': 'https'
    }
  }), false);
  assert.equal(requireSameOrigin({ headers: { host: 'waypoint.example' } }), false);
});

test('API routes reject invalid origins and unsupported methods before database access', async () => {
  const attackerRequest = {
    method: 'POST',
    headers: { origin: 'https://attacker.example', host: 'waypoint.example' },
    body: { action: 'signup' }
  };
  const authResponse = responseStub();
  await authHandler(attackerRequest, authResponse);
  assert.equal(authResponse.statusCode, 403);

  const workspaceResponse = responseStub();
  await workspaceHandler({ method: 'POST', headers: {} }, workspaceResponse);
  assert.equal(workspaceResponse.statusCode, 405);

  const attachmentResponse = responseStub();
  await attachmentsHandler({ method: 'PUT', headers: {} }, attachmentResponse);
  assert.equal(attachmentResponse.statusCode, 405);
});

test('hosted preview URLs load the preview gate and keep the app in local mode', () => {
  const html = fs.readFileSync(path.join(__dirname, '../Waypoint.html'), 'utf8');
  assert.match(html, /<script src="local-preview\.js" defer><\/script>/);
  assert.match(html, /<script src="waypoint\.js" defer><\/script>/);
  assert.equal(isLocalPreview('https:', '?preview=1'), true);
  assert.equal(isLocalPreview('https:', ''), false);
});
