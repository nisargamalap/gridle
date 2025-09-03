export const dynamic = "force-dynamic";

// src/app/api/notes/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Note from '@/models/Note';
import { auth } from '@/auth';

// 🔹 GET: Fetch notes
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    await connectDB();

    let query = { user: session.user.id, isArchived: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const notes = await Note.find(query)
      .populate('task', 'title')
      .sort({ updatedAt: -1 });

    return NextResponse.json(notes);

  } catch (error) {
    console.error('Get notes error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 🔹 POST: Create note
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { title, content, tags, task } = data;

    if (!title || !content) {
      return NextResponse.json(
        { message: 'Title and content are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const note = await Note.create({
      title,
      content,
      tags: tags || [],
      task: task || null, // Task is now optional
      user: session.user.id,
    });

    const populatedNote = await Note.findById(note._id).populate('task', 'title');

    return NextResponse.json(populatedNote, { status: 201 });

  } catch (error) {
    console.error('Create note error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 🔹 PUT: Update note
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const noteId = params.id;
    const data = await request.json();
    const { title, content, tags, task } = data;

    if (!title || !content) {
      return NextResponse.json({ message: 'Title and content are required' }, { status: 400 });
    }

    await connectDB();

    const note = await Note.findOneAndUpdate(
      { _id: noteId, user: session.user.id },
      { title, content, tags: tags || [], task: task || null }, // Task is now optional
      { new: true }
    ).populate('task', 'title');

    if (!note) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);

  } catch (error) {
    console.error('Update note error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// 🔹 DELETE: Delete note
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const noteId = params.id;

    await connectDB();

    const note = await Note.findOneAndDelete({ _id: noteId, user: session.user.id });

    if (!note) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ message: `Note "${note.title}" deleted successfully.` });

  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}