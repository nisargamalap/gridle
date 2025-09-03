import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema(
  {
    user: { // 🔹 Renamed from userId to user
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    group: { // 🔹 Renamed from groupId to group
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    project: { // Optional project reference
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    title: {
      type: String,
      required: [true, "Please provide a task title"],
      trim: true,
      maxlength: [200, "Task title cannot be more than 200 characters"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot be more than 1000 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done", "pending", "completed"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "Low", "Medium", "High"],
      default: "medium",
      index: true,
    },
    dueDate: { type: Date },
    tags: [{ type: String }],
    aiSuggested: { type: Boolean, default: false },
    aiInsight: { type: String },
    attachments: [{ name: String, url: String, type: String }],
    category: { type: String, default: "Uncategorized" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🔹 Virtual for notes under this task
TaskSchema.virtual("notes", {
  ref: "Note",
  localField: "_id",
  foreignField: "task",
});

// Indexes
TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ user: 1, dueDate: 1 });
TaskSchema.index({ title: "text", description: "text" });
TaskSchema.index({ tags: 1 });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
