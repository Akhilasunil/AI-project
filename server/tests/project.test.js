import './setup.js';
import fs from 'fs/promises';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { uploadRoot } from '../src/services/storage.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

let memoryServer;
let adminToken;
let employeeToken;

async function login(email) {
  const response = await request(app).post('/api/auth/login').send({
    email,
    password: 'Password123!',
  });
  assert.equal(response.status, 200);
  return response.body.token;
}

before(async () => {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  await User.create([
    { name: 'Ada Admin', email: 'admin@company.test', password: 'Password123!', role: 'admin' },
    {
      name: 'Evan Employee',
      email: 'evan@company.test',
      password: 'Password123!',
      role: 'employee',
      team: 'Design',
    },
  ]);
  adminToken = await login('admin@company.test');
  employeeToken = await login('evan@company.test');
});

after(async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
  await fs.rm(uploadRoot(), { recursive: true, force: true });
});

function projectRequest() {
  return request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('name', 'Harbor')
    .field('summary', 'Client portal for shipment tracking')
    .field('siteUrl', 'https://harbor.example.com')
    .field('ownerName', 'Priya Raman')
    .field('department', 'Engineering')
    .field('status', 'published')
    .field('accessScope', 'all')
    .attach('image', PNG, { filename: 'harbor.png', contentType: 'image/png' })
    .attach('document', Buffer.from('The Harbor release code is harbor-release-77.'), {
      filename: 'harbor.txt',
      contentType: 'text/plain',
    });
}

test('employees cannot add projects', async () => {
  const response = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${employeeToken}`)
    .field('name', 'Harbor')
    .field('ownerName', 'Priya Raman')
    .attach('image', PNG, { filename: 'harbor.png', contentType: 'image/png' })
    .attach('document', Buffer.from('Secret.'), { filename: 'harbor.txt', contentType: 'text/plain' });

  assert.equal(response.status, 403);
});

test('a project requires an image, documentation, and a public site URL', async () => {
  const missingImage = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('name', 'Harbor')
    .field('ownerName', 'Priya Raman')
    .attach('document', Buffer.from('Notes.'), { filename: 'notes.txt', contentType: 'text/plain' });
  assert.equal(missingImage.status, 400);
  assert.match(missingImage.body.message, /image/);

  const privateSite = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('name', 'Harbor')
    .field('ownerName', 'Priya Raman')
    .field('siteUrl', 'http://harbor.example.com')
    .attach('image', PNG, { filename: 'harbor.png', contentType: 'image/png' })
    .attach('document', Buffer.from('Notes.'), { filename: 'notes.txt', contentType: 'text/plain' });
  assert.equal(privateSite.status, 400);
  assert.match(privateSite.body.message, /HTTPS/);
});

test('employees see a published project card and its documentation', async () => {
  const created = await projectRequest();
  assert.equal(created.status, 201, created.body.project?.processingError || created.body.message);
  assert.equal(created.body.project.processingStatus, 'indexed');
  assert.equal(created.body.project.ownerName, 'Priya Raman');
  assert.equal(created.body.project.siteUrl, 'https://harbor.example.com');

  const list = await request(app)
    .get('/api/projects')
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.equal(list.status, 200);
  assert.equal(list.body.projects.some((project) => project.name === 'Harbor'), true);

  const detail = await request(app)
    .get(`/api/projects/${created.body.project.id}`)
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.equal(detail.status, 200);
  assert.match(detail.body.text, /harbor-release-77/);
  assert.equal(detail.body.project.siteUrl, 'https://harbor.example.com');

  const image = await request(app)
    .get(`/api/projects/${created.body.project.id}/image`)
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.equal(image.status, 200);
  assert.equal(image.headers['content-type'], 'image/png');

  const answer = await request(app)
    .post('/api/ask')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ question: 'What is the Harbor release code?' });
  assert.equal(answer.status, 200);
  assert.match(answer.body.answer, /harbor-release-77/);
  assert.equal(answer.body.sources[0].path, `/projects/${created.body.project.id}`);
});

test('draft projects stay hidden from employees', async () => {
  const created = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('name', 'Draft Dock')
    .field('ownerName', 'Priya Raman')
    .field('status', 'draft')
    .attach('image', PNG, { filename: 'dock.png', contentType: 'image/png' })
    .attach('document', Buffer.from('The draft dock code is dock-secret-3.'), {
      filename: 'dock.txt',
      contentType: 'text/plain',
    });
  assert.equal(created.status, 201, created.body.message);

  const list = await request(app)
    .get('/api/projects')
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.equal(list.body.projects.some((project) => project.name === 'Draft Dock'), false);

  const detail = await request(app)
    .get(`/api/projects/${created.body.project.id}`)
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.equal(detail.status, 404);
});
