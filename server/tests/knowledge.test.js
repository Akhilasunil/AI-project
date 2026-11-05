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

test('employees cannot upload company documents', async () => {
  const response = await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${employeeToken}`)
    .field('category', 'WFH')
    .attach('files', Buffer.from('Employees may work from home.'), 'wfh.txt');

  assert.equal(response.status, 403);
});

test('rejects files that are not PDF, DOCX, or TXT', async () => {
  const response = await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('category', 'Policy')
    .attach('files', Buffer.from('not a policy'), 'notes.exe');

  assert.equal(response.status, 400);
  assert.match(response.body.message, /PDF, DOCX, and TXT/);
});

test('an uploaded policy answers an employee question and cites the source', async () => {
  const uploaded = await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'WFH Policy')
    .field('description', 'Where employees can work')
    .field('category', 'WFH')
    .field('department', 'HR')
    .field('approvalStatus', 'published')
    .field('accessScope', 'all')
    .attach('files', Buffer.from('Employees may work from home two days each week.'), 'wfh-policy.txt');

  assert.equal(uploaded.status, 201);
  assert.equal(uploaded.body.documents[0].displayStatus, 'Published');
  assert.equal(uploaded.body.documents[0].processingStatus, 'indexed');

  const answer = await request(app)
    .post('/api/ask')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ question: 'What is our WFH policy?' });

  assert.equal(answer.status, 200);
  assert.equal(answer.body.sufficientEvidence, true);
  assert.match(answer.body.answer, /two days/i);
  assert.equal(answer.body.sources[0].title, 'WFH Policy');
  assert.equal(answer.body.sources[0].path, `/knowledge/documents/${uploaded.body.documents[0].id}`);

  const detail = await request(app)
    .get(`/api/knowledge/documents/${uploaded.body.documents[0].id}`)
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.equal(detail.status, 200);
  assert.match(detail.body.text, /two days/i);
});

test('draft documents are not used for answers', async () => {
  await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Secret Holiday Draft')
    .field('category', 'Holidays')
    .field('approvalStatus', 'draft')
    .attach('files', Buffer.from('The secret holiday code is mango-festival.'), 'draft-holidays.txt');

  const answer = await request(app)
    .post('/api/ask')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ question: 'What is the secret holiday code?' });

  assert.equal(answer.status, 200);
  assert.equal(answer.body.sufficientEvidence, false);
  assert.equal(answer.body.answer, "I couldn't find this information in the approved company sources.");
  assert.equal(answer.body.sources.length, 0);
});

test('team-restricted documents are hidden from other teams', async () => {
  const uploaded = await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Finance leave rule')
    .field('category', 'Leave')
    .field('approvalStatus', 'published')
    .field('accessScope', 'team')
    .field('team', 'Finance')
    .attach('files', Buffer.from('Finance leave code is quantum-leave-42.'), 'finance-leave.txt');

  assert.equal(uploaded.status, 201);

  const answer = await request(app)
    .post('/api/ask')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ question: 'What is the finance leave code?' });

  assert.equal(answer.body.sufficientEvidence, false);
  assert.doesNotMatch(answer.body.answer, /quantum-leave-42/);

  const download = await request(app)
    .get(`/api/documents/${uploaded.body.documents[0].id}/file`)
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.equal(download.status, 404);
});

test('a learning video is suggested from its title without claiming the video was watched', async () => {
  const created = await request(app)
    .post('/api/learning-resources')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Accessibility intro')
    .field('description', 'A short video about accessibility')
    .field('resourceType', 'Video')
    .field('category', 'Accessibility')
    .field('resourceUrl', 'https://www.youtube.com/watch?v=abc123')
    .field('thumbnailUrl', 'https://images.example.com/accessibility.jpg')
    .field('approvalStatus', 'published')
    .field('status', 'published')
    .field('accessScope', 'all');

  assert.equal(created.status, 201, created.body.message || 'created');
  assert.equal(created.body.resource.resourceUrl, 'https://www.youtube.com/watch?v=abc123');

  const answer = await request(app)
    .post('/api/ask')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ question: 'Is there an accessibility video?' });

  assert.equal(answer.status, 200);
  assert.equal(answer.body.resources[0].title, 'Accessibility intro');
  assert.equal(answer.body.resources[0].resourceUrl, 'https://www.youtube.com/watch?v=abc123');
  assert.match(answer.body.answer, /has not been watched/i);
});

test('learning resource links must be public HTTPS URLs', async () => {
  const response = await request(app)
    .post('/api/learning-resources')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Internal notes')
    .field('resourceType', 'Document')
    .field('category', 'Other')
    .field('resourceUrl', 'http://example.com/notes')
    .field('status', 'published');

  assert.equal(response.status, 400);
  assert.match(response.body.message, /HTTPS/);
});

test('employees can list published resources and not admin drafts', async () => {
  await request(app)
    .post('/api/learning-resources')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Draft AWS course')
    .field('resourceType', 'Course')
    .field('category', 'AWS')
    .field('resourceUrl', 'https://learning.example.com/aws')
    .field('status', 'draft');

  const response = await request(app)
    .get('/api/knowledge/resources')
    .set('Authorization', `Bearer ${employeeToken}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.resources.some((resource) => resource.title === 'Accessibility intro'), true);
  assert.equal(response.body.resources.some((resource) => resource.title === 'Draft AWS course'), false);
});

test('a PDF is indexed from its text', async () => {
  const uploaded = await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Dummy Notes')
    .field('category', 'Other')
    .field('approvalStatus', 'published')
    .attach('files', 'tests/fixtures/dummy.pdf');

  assert.equal(uploaded.status, 201, uploaded.body.documents?.[0]?.processingError || uploaded.body.message || 'uploaded');
  assert.equal(uploaded.body.documents[0].processingStatus, 'indexed');

  const answer = await request(app)
    .post('/api/ask')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ question: 'What does the dummy PDF file contain?' });

  assert.equal(answer.status, 200);
  assert.match(answer.body.answer, /Dummy PDF file/);
});

test('learning documents stay out of the company document list', async () => {
  const uploaded = await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Frontend notes')
    .field('category', 'Frontend')
    .field('library', 'learning')
    .field('approvalStatus', 'published')
    .attach('files', Buffer.from('Components live in the design system.'), 'frontend-notes.txt');

  assert.equal(uploaded.status, 201, uploaded.body.message || 'uploaded');
  assert.equal(uploaded.body.documents[0].library, 'learning');

  const companyList = await request(app)
    .get('/api/documents')
    .query({ library: 'company' })
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(companyList.body.documents.some((document) => document.title === 'Frontend notes'), false);

  const learningList = await request(app)
    .get('/api/knowledge/documents')
    .query({ library: 'learning' })
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.equal(learningList.body.documents.some((document) => document.title === 'Frontend notes'), true);

  const employeeCompany = await request(app)
    .get('/api/knowledge/documents')
    .query({ library: 'company' })
    .set('Authorization', `Bearer ${employeeToken}`);
  assert.equal(employeeCompany.body.documents.some((document) => document.title === 'Frontend notes'), false);
});

test('a learning document can be a public link instead of an uploaded file', async () => {
  const created = await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Drive notes')
    .field('description', 'Shared training notes')
    .field('category', 'AI')
    .field('library', 'learning')
    .field('approvalStatus', 'published')
    .field('sourceUrl', 'https://drive.google.com/file/d/abc/view');

  assert.equal(created.status, 201, created.body.message || 'created');
  assert.equal(created.body.documents[0].sourceUrl, 'https://drive.google.com/file/d/abc/view');
  assert.equal(created.body.documents[0].processingStatus, 'indexed');

  const listed = await request(app)
    .get('/api/knowledge/documents')
    .query({ library: 'learning' })
    .set('Authorization', `Bearer ${employeeToken}`);
  const match = listed.body.documents.find((document) => document.title === 'Drive notes');
  assert.equal(match.sourceUrl, 'https://drive.google.com/file/d/abc/view');

  const rejected = await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Bad link')
    .field('category', 'AI')
    .field('library', 'learning')
    .field('approvalStatus', 'published')
    .field('sourceUrl', 'http://drive.google.com/file');
  assert.equal(rejected.status, 400);
});

test('a question about Diwali matches a holiday list that says Deepavali', async () => {
  const uploaded = await request(app)
    .post('/api/documents')
    .set('Authorization', `Bearer ${adminToken}`)
    .field('title', 'Holiday list')
    .field('category', 'Holidays')
    .field('approvalStatus', 'published')
    .attach('files', Buffer.from('Deepavali is on 8 November 2026 and is a mandatory holiday.'), 'holiday-list.txt');

  assert.equal(uploaded.status, 201, uploaded.body.message || 'uploaded');

  const answer = await request(app)
    .post('/api/ask')
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ question: 'When is Diwali?' });

  assert.equal(answer.status, 200);
  assert.match(answer.body.answer, /Deepavali/);
  assert.match(answer.body.answer, /8 November 2026/);
});
