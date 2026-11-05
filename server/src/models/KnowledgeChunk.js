import mongoose from 'mongoose';

const knowledgeChunkSchema = new mongoose.Schema(
  {
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyDocument', index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
    text: { type: String, required: true },
    position: { type: Number, required: true },
    embedding: { type: [Number], default: undefined },
  },
  { timestamps: true },
);

export const KnowledgeChunk = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);
