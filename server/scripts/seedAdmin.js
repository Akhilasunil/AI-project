import '../src/config/loadEnv.js';
import { connectDb, disconnectDb } from '../src/config/db.js';
import { assertRuntimeEnv } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { ROLES } from '../src/utils/roles.js';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readRequired(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    fail(`Missing ${name}. Add it to server/.env before seeding.`);
  }
  return value;
}

function assertEmail(value, label) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    fail(`${label} must be a valid email address.`);
  }
}

function assertPassword(value, label) {
  if (value.length < 8 || value.length > 128) {
    fail(`${label} must be 8 to 128 characters.`);
  }
}

async function upsertUser({ email, password, name, role, team = '', skills = [] }) {
  let user = await User.findByEmail(email);
  if (!user) {
    user = new User({ email, role });
  }

  user.name = name;
  user.password = password;
  user.role = role;
  user.team = team;
  user.skills = skills;
  user.isActive = true;
  await user.save();
  return user;
}

if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW !== 'true') {
  fail('Seeding is disabled when NODE_ENV=production. Set SEED_ALLOW=true only to create the initial administrator.');
}

try {
  assertRuntimeEnv();
} catch (error) {
  fail(error.message);
}

const adminEmail = readRequired('ADMIN_EMAIL').toLowerCase();
const adminPassword = readRequired('ADMIN_PASSWORD');
const adminName = readRequired('ADMIN_NAME');
assertEmail(adminEmail, 'ADMIN_EMAIL');
assertPassword(adminPassword, 'ADMIN_PASSWORD');

const employeeEmail = process.env.SEED_EMPLOYEE_EMAIL?.trim().toLowerCase() || '';
let employee = null;

if (employeeEmail) {
  const employeePassword = readRequired('SEED_EMPLOYEE_PASSWORD');
  const employeeName = readRequired('SEED_EMPLOYEE_NAME');
  assertEmail(employeeEmail, 'SEED_EMPLOYEE_EMAIL');
  assertPassword(employeePassword, 'SEED_EMPLOYEE_PASSWORD');
  if (employeeEmail === adminEmail) {
    fail('SEED_EMPLOYEE_EMAIL must be different from ADMIN_EMAIL.');
  }
  employee = {
    email: employeeEmail,
    password: employeePassword,
    name: employeeName,
    role: ROLES.EMPLOYEE,
    team: process.env.SEED_EMPLOYEE_TEAM?.trim() || '',
    skills: (process.env.SEED_EMPLOYEE_SKILLS || '')
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
  };
}

try {
  await connectDb(process.env.MONGODB_URI);
  await upsertUser({
    email: adminEmail,
    password: adminPassword,
    name: adminName,
    role: ROLES.ADMIN,
  });
  console.log(`Administrator ready: ${adminEmail}`);

  if (employee) {
    await upsertUser(employee);
    console.log(`Employee ready: ${employee.email}`);
  }
} catch (error) {
  console.error('Seeding failed.');
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await disconnectDb();
}
