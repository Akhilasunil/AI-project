import mongoose from 'mongoose';
import { RESOURCE_CATEGORIES, RESOURCE_TYPES } from '../utils/catalog.js';

const accessSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ['all', 'team', 'restricted'], default: 'all' },
    teams: { type: [String], default: [] },
    emails: { type: [String], default: [] },
    userIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  },
  { _id: false },
);

const learningResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    resourceType: { type: String, enum: RESOURCE_TYPES, required: true },
    category: { type: String, enum: RESOURCE_CATEGORIES, required: true },
    thumbnailUrl: { type: String, default: '' },
    thumbnailKey: { type: String, default: '' },
    resourceUrl: { type: String, required: true },
    targetAudience: { type: String, trim: true, maxlength: 120, default: '' },
    trainer: { type: String, trim: true, maxlength: 120, default: '' },
    duration: { type: String, trim: true, maxlength: 40, default: '' },
    access: { type: accessSchema, default: () => ({}) },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

learningResourceSchema.index({ status: 1, resourceType: 1, category: 1 });
learningResourceSchema.index({ title: 'text', description: 'text' });

export const LearningResource = mongoose.model('LearningResource', learningResourceSchema);
