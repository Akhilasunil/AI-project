import os from 'os';
import path from 'path';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-0123456789';
process.env.JWT_EXPIRES_IN = '1h';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.AI_PROVIDER = 'mock';
process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'company-ai-test-uploads');
