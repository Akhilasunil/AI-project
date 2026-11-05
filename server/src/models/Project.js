import mongoose from 'mongoose';

const accessSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ['all', 'team', 'restricted'], default: 'all' },
    teams: { type: [String], default: [] },
    emails: { type: [String], default: [] },
    userIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    summary: { type: String, trim: true, maxlength: 2000, default: '' },
    siteUrl: { type: String, default: '' },
    ownerName: { type: String, required: true, trim: true, maxlength: 120 },
    department: { type: String, trim: true, maxlength: 80, default: '' },
    imageKey: { type: String, required: true },
    imageMime: { type: String, required: true },
    documentKey: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    processingStatus: {
      type: String,
      enum: ['uploaded', 'processing', 'indexed', 'failed'],
      default: 'uploaded',
    },
    processingError: { type: String, default: '' },
    chunkCount: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    access: { type: accessSchema, default: () => ({}) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

projectSchema.index({ status: 1, processingStatus: 1 });

export const Project = mongoose.model('Project', projectSchema);
