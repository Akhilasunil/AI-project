import mongoose from 'mongoose';

export async function connectDb(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
}

export async function disconnectDb() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
}
