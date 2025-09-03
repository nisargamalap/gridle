import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a group name'],
    maxlength: [100, 'Group name cannot be more than 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  user: { // 🔹 Changed from createdBy for consistency with User virtual
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  joinCode: {
    type: String,
    unique: true,
    required: true,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// 🔹 Generate join code before saving
GroupSchema.pre('save', function(next) {
  if (!this.joinCode) {
    this.joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// 🔹 Virtual for tasks under this group
GroupSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'group'
});

export default mongoose.models.Group || mongoose.model('Group', GroupSchema);
