import mongoose from 'mongoose';

const questionLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true, maxlength: 1000 },
    answerStatus: { type: String, enum: ['answered', 'unanswered', 'error'], required: true },
    sufficientEvidence: { type: Boolean, required: true },
    topic: { type: String, default: '' },
    sources: {
      type: [
        {
          sourceId: String,
          sourceType: String,
          title: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

questionLogSchema.index({ createdAt: -1 });
questionLogSchema.index({ topic: 1 });

export const QuestionLog = mongoose.model('QuestionLog', questionLogSchema);
