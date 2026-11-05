import mongoose from 'mongoose';
import { hashPassword } from '../utils/password.js';
import { ROLES } from '../utils/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 128,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
    team: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    skills: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 40,
        },
      ],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashIfNeeded() {
  if (!this.isModified('password')) return;
  this.password = await hashPassword(this.password);
});

userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: String(email).toLowerCase().trim() }).select('+password +tokenVersion');
};

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password;
    delete ret.tokenVersion;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
