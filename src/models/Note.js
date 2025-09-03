import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a note title'],
    maxlength: [200, 'Title cannot be more than 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Please provide note content'],
    maxlength: [10000, 'Content cannot be more than 10000 characters'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  task: { // 🔹 Changed from required to optional
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: false, // Changed from true to false
  },
  tags: [{ type: String }],
  isArchived: { type: Boolean, default: false },
  summary: { type: String }, // AI-generated summary
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// 🔹 Index for better search
NoteSchema.index({ user: 1, title: 'text', content: 'text' });

export default mongoose.models.Note || mongoose.model('Note', NoteSchema);