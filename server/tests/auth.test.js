import './setup.js';
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';

let memoryServer;

async function loginAs(email, password = 'Password123!') {
  const response = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(response.status, 200);
  return response.body;
}

before(async () => {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
  await User.create([
    {
      name: 'Ada Admin',
      email: 'admin@company.test',
      password: 'Password123!',
      role: 'admin',
    },
    {
      name: 'Evan Employee',
      email: 'evan@company.test',
      password: 'Password123!',
      role: 'employee',
      team: 'Design',
      skills: ['Accessibility'],
    },
  ]);
});

after(async () => {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});

test('health check responds', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('there is no public registration route', async () => {
  const response = await request(app).post('/api/auth/register').send({
    email: 'new-admin@company.test',
    password: 'Password123!',
    role: 'admin',
  });
  assert.equal(response.status, 404);
});

test('login validates email and password', async () => {
  const response = await request(app).post('/api/auth/login').send({
    email: 'not-an-email',
    password: '',
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.ok(Array.isArray(response.body.errors));
});

test('login rejects an unknown email', async () => {
  const response = await request(app).post('/api/auth/login').send({
    email: 'missing@company.test',
    password: 'Password123!',
  });
  assert.equal(response.status, 401);
  assert.equal(response.body.message, 'Email or password is incorrect.');
});

test('login rejects a wrong password', async () => {
  const response = await request(app).post('/api/auth/login').send({
    email: 'evan@company.test',
    password: 'wrong-password',
  });
  assert.equal(response.status, 401);
  assert.equal(response.body.message, 'Email or password is incorrect.');
});

test('login stores a hash and returns a token without secrets', async () => {
  const stored = await User.findOne({ email: 'evan@company.test' }).select('+password +tokenVersion');
  assert.notEqual(stored.password, 'Password123!');
  assert.match(stored.password, /^\$2[aby]\$/);

  const body = await loginAs('evan@company.test');
  assert.equal(typeof body.token, 'string');
  assert.equal(body.user.email, 'evan@company.test');
  assert.equal(body.user.role, 'employee');
  assert.equal(body.user.team, 'Design');
  assert.deepEqual(body.user.skills, ['Accessibility']);
  assert.equal(body.user.password, undefined);
  assert.equal(body.user.tokenVersion, undefined);
  assert.equal(body.token.includes('Password123!'), false);
});

test('a client cannot promote itself by sending a role', async () => {
  const response = await request(app).post('/api/auth/login').send({
    email: 'evan@company.test',
    password: 'Password123!',
    role: 'admin',
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.user.role, 'employee');
});

test('current user requires a valid token', async () => {
  const missing = await request(app).get('/api/auth/me');
  assert.equal(missing.status, 401);

  const invalid = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-token');
  assert.equal(invalid.status, 401);

  const body = await loginAs('evan@company.test');
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, 'evan@company.test');
  assert.equal(me.body.user.password, undefined);
});

test('employees cannot call admin APIs', async () => {
  const body = await loginAs('evan@company.test');
  const response = await request(app)
    .get('/api/admin/session')
    .set('Authorization', `Bearer ${body.token}`);
  assert.equal(response.status, 403);
});

test('anonymous requests to admin APIs are rejected', async () => {
  const response = await request(app).get('/api/admin/session');
  assert.equal(response.status, 401);
});

test('admins can call admin APIs and unknown admin routes stay protected', async () => {
  const body = await loginAs('admin@company.test');
  const session = await request(app)
    .get('/api/admin/session')
    .set('Authorization', `Bearer ${body.token}`);
  assert.equal(session.status, 200);
  assert.equal(session.body.role, 'admin');

  const missing = await request(app)
    .get('/api/admin/missing')
    .set('Authorization', `Bearer ${body.token}`);
  assert.equal(missing.status, 404);
});

test('authorization uses the role stored in the database', async () => {
  const body = await loginAs('admin@company.test');
  const admin = await User.findOne({ email: 'admin@company.test' });
  admin.role = 'employee';
  await admin.save({ validateModifiedOnly: true });

  const denied = await request(app)
    .get('/api/admin/session')
    .set('Authorization', `Bearer ${body.token}`);
  assert.equal(denied.status, 403);

  admin.role = 'admin';
  await admin.save({ validateModifiedOnly: true });
});

test('logout invalidates the existing token', async () => {
  const body = await loginAs('evan@company.test');
  const logout = await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${body.token}`);
  assert.equal(logout.status, 200);

  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);
  assert.equal(me.status, 401);
});

test('inactive accounts cannot sign in', async () => {
  await User.create({
    name: 'Inactive User',
    email: 'inactive@company.test',
    password: 'Password123!',
    role: 'employee',
    isActive: false,
  });

  const response = await request(app).post('/api/auth/login').send({
    email: 'inactive@company.test',
    password: 'Password123!',
  });
  assert.equal(response.status, 403);
  assert.equal(response.body.message, 'This account is not active. Contact an administrator.');
});

test('employees cannot add accounts or list them', async () => {
  const body = await loginAs('evan@company.test');
  const listed = await request(app)
    .get('/api/admin/users')
    .set('Authorization', `Bearer ${body.token}`);
  assert.equal(listed.status, 403);

  const created = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${body.token}`)
    .send({
      name: 'Promoted Person',
      email: 'promoted@company.test',
      password: 'Password123!',
      role: 'admin',
    });
  assert.equal(created.status, 403);
  assert.equal(await User.exists({ email: 'promoted@company.test' }), null);
});

test('an admin can add an employee and that account only gets employee access', async () => {
  const admin = await loginAs('admin@company.test');
  const created = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      name: 'Nora New',
      email: 'nora@company.test',
      password: 'Password123!',
      role: 'employee',
      team: 'People',
    });

  assert.equal(created.status, 201);
  assert.equal(created.body.user.role, 'employee');
  assert.equal(created.body.user.password, undefined);
  assert.equal(created.body.user.tokenVersion, undefined);

  const stored = await User.findOne({ email: 'nora@company.test' }).select('+password');
  assert.match(stored.password, /^\$2[aby]\$/);

  const employee = await loginAs('nora@company.test');
  assert.equal(employee.user.role, 'employee');
  const denied = await request(app)
    .get('/api/admin/session')
    .set('Authorization', `Bearer ${employee.token}`);
  assert.equal(denied.status, 403);
});

test('an admin can assign admin access and list every registered account', async () => {
  const admin = await loginAs('admin@company.test');
  const created = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      name: 'Casey Admin',
      email: 'casey@company.test',
      password: 'Password123!',
      role: 'admin',
    });
  assert.equal(created.status, 201);

  const promoted = await loginAs('casey@company.test');
  const session = await request(app)
    .get('/api/admin/session')
    .set('Authorization', `Bearer ${promoted.token}`);
  assert.equal(session.status, 200);

  const listed = await request(app)
    .get('/api/admin/users')
    .set('Authorization', `Bearer ${admin.token}`);
  assert.equal(listed.status, 200);
  const emails = listed.body.users.map((account) => account.email);
  assert.equal(emails.includes('evan@company.test'), true);
  assert.equal(emails.includes('nora@company.test'), true);
  assert.equal(emails.includes('casey@company.test'), true);
  assert.equal(listed.body.users.some((account) => account.password), false);

  const rejected = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      name: 'Casey Again',
      email: 'casey@company.test',
      password: 'Password123!',
      role: 'manager',
    });
  assert.equal(rejected.status, 400);

  const duplicate = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({
      name: 'Casey Again',
      email: 'casey@company.test',
      password: 'Password123!',
      role: 'employee',
    });
  assert.equal(duplicate.status, 409);
});

test('changing a role takes away the previous access', async () => {
  const admin = await loginAs('admin@company.test');
  const casey = await User.findOne({ email: 'casey@company.test' });
  const updated = await request(app)
    .patch(`/api/admin/users/${casey.id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ role: 'employee', isActive: true });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.user.role, 'employee');

  const oldSession = await loginAs('casey@company.test');
  const caseyToken = oldSession.token;
  await request(app)
    .patch(`/api/admin/users/${casey.id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ role: 'admin', isActive: true });
  await request(app)
    .patch(`/api/admin/users/${casey.id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ role: 'employee', isActive: true });

  const denied = await request(app)
    .get('/api/admin/session')
    .set('Authorization', `Bearer ${caseyToken}`);
  assert.equal(denied.status, 401);

  const current = await loginAs('casey@company.test');
  const stillDenied = await request(app)
    .get('/api/admin/session')
    .set('Authorization', `Bearer ${current.token}`);
  assert.equal(stillDenied.status, 403);
});

test('an admin can delete another account and cannot delete their own', async () => {
  const admin = await loginAs('admin@company.test');
  const nora = await User.findOne({ email: 'nora@company.test' });
  const removed = await request(app)
    .delete(`/api/admin/users/${nora.id}`)
    .set('Authorization', `Bearer ${admin.token}`);
  assert.equal(removed.status, 200);
  assert.equal(await User.exists({ email: 'nora@company.test' }), null);

  const self = await User.findOne({ email: 'admin@company.test' });
  const denied = await request(app)
    .delete(`/api/admin/users/${self.id}`)
    .set('Authorization', `Bearer ${admin.token}`);
  assert.equal(denied.status, 400);

  const employee = await loginAs('evan@company.test');
  const blocked = await request(app)
    .delete(`/api/admin/users/${self.id}`)
    .set('Authorization', `Bearer ${employee.token}`);
  assert.equal(blocked.status, 403);
});

test('malformed JSON is rejected', async () => {
  const response = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email":');
  assert.equal(response.status, 400);
  assert.equal(response.body.message, 'Request body must be valid JSON.');
});
