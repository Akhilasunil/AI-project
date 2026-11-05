import mongoose from 'mongoose';

const knowledgeGapSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, maxlength: 1000 },
    normalizedQuestion: { type: String, required: true, unique: true },
    askCount: { type: Number, default: 1 },
    lastAskedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    suggestedAction: { type: String, default: 'Add knowledge' },
  },
  { timestamps: true },
);

export const KnowledgeGap = mongoose.model('KnowledgeGap', knowledgeGapSchema);
