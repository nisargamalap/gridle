export const dynamic = "force-dynamic";
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const group = searchParams.get('group');
    const user = searchParams.get('user');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    let query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (group) query.group = group;
    if (user) query.user = user;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(query)
      .populate('user', 'name email')
      .populate('group', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Task.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ tasks, currentPage: page, totalPages, total });
  } catch (error) {
    console.error('GET /tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (body.action && body.taskIds) {
      const { action, taskIds, ...updates } = body;
      let updateQuery = {};

      switch (action) {
        case 'delete':
          await Task.deleteMany({ _id: { $in: taskIds } });
          return NextResponse.json({ message: 'Tasks deleted successfully' });
        case 'archive':
          updateQuery.isArchived = true;
          break;
        case 'unarchive':
          updateQuery.isArchived = false;
          break;
        case 'status':
          updateQuery.status = updates.status;
          break;
        case 'priority':
          updateQuery.priority = updates.priority;
          break;
        case 'assign':
          updateQuery.user = updates.userId;
          break;
        default:
          return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 });
      }

      await Task.updateMany({ _id: { $in: taskIds } }, { $set: updateQuery });
      return NextResponse.json({ message: 'Bulk action completed successfully' });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('POST /tasks error:', error);
    return NextResponse.json({ error: 'Failed to process bulk action' }, { status: 500 });
  }
}
