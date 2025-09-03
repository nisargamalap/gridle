import { z } from "zod";

export const TaskStatus = z.enum(["todo", "in-progress", "done"]);
export const TaskPriority = z.enum(["low", "medium", "high"]);

export const TaskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(""),
  status: TaskStatus.default("todo"),
  priority: TaskPriority.default("medium"),
  dueDate: z.coerce.date().optional().nullable(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional().default([]),
  projectId: z.string().optional()
});

export const TaskUpdateSchema = TaskCreateSchema.partial();

export const TaskQuerySchema = z.object({
  status: TaskStatus.optional(),
  priority: TaskPriority.optional(),
  search: z.string().max(200).optional(),
  projectId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1)
});
