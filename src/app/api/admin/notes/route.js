import { connectDB } from '@/lib/mongodb';
import Note from '@/models/Note';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 15;
    const search = searchParams.get('search');
    const user = searchParams.get('user');
    const task = searchParams.get('task');
    const archived = searchParams.get('archived');
    
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Apply filters
    if (user) query.user = user;
    if (task) query.task = task;
    if (archived !== null && archived !== undefined) {
      query.isArchived = archived === 'true';
    }
    
    // Search across multiple fields
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const notes = await Note.find(query)
      .populate('user', 'name email')
      .populate('task', 'title')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Note.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({
      notes,
      currentPage: page,
      totalPages,
      total
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}