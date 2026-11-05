import mongoose from 'mongoose';
import { ALL_DOCUMENT_CATEGORIES } from '../utils/catalog.js';

const accessSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ['all', 'team', 'restricted'], default: 'all' },
    teams: { type: [String], default: [] },
    emails: { type: [String], default: [] },
    userIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { _id: false },
);

const companyDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    category: { type: String, enum: ALL_DOCUMENT_CATEGORIES, required: true },
    library: { type: String, enum: ['company', 'learning'], default: 'company' },
    department: { type: String, trim: true, maxlength: 80, default: '' },
    sourceUrl: { type: String, trim: true, default: '' },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageKey: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    processingStatus: {
      type: String,
      enum: ['uploaded', 'processing', 'indexed', 'failed'],
      default: 'uploaded',
    },
    processingError: { type: String, default: '' },
    approvalStatus: {
      type: String,
      enum: ['draft', 'pending_review', 'published'],
      default: 'published',
    },
    chunkCount: { type: Number, default: 0 },
    access: { type: accessSchema, default: () => ({}) },
  },
  { timestamps: true },
);

companyDocumentSchema.index({ approvalStatus: 1, processingStatus: 1 });

export const CompanyDocument = mongoose.model('CompanyDocument', companyDocumentSchema);
