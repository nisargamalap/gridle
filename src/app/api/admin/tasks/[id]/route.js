export const dynamic = "force-dynamic";
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET(request, context) {
  const { params } = context;
  try {
    await connectDB();
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });

    const task = await Task.findById(id)
      .populate('user', 'name email')
      .populate('group', 'name')
      .populate('notes'); // virtual populate

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json(task);
  } catch (error) {
    console.error('GET /tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(request, context) {
  const { params } = context;
  try {
    await connectDB();
    const { id } = params;
    const updates = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });

    const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate', 'user', 'group'];
    const filteredUpdates = {};
    for (const key of allowedUpdates)
      if (updates[key] !== undefined) filteredUpdates[key] = updates[key];

    const task = await Task.findByIdAndUpdate(id, filteredUpdates, { new: true, runValidators: true })
      .populate('user', 'name email')
      .populate('group', 'name')
      .populate('notes');

    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json(task);
  } catch (error) {
    console.error('PUT /tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });

    const task = await Task.findByIdAndDelete(id);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('DELETE /tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
