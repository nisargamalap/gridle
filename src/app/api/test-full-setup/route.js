export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Group from '@/models/Group';
import Task from '@/models/Task';
import Note from '@/models/Note';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function GET() {
  try {
    await connectDB();

    // 1️⃣ Create a test user with a dynamic email
    const hashedPassword = await bcrypt.hash('password123', 10);
    const timestamp = Date.now();
    const user = await User.create({
      name: 'Test User',
      email: `testuser${timestamp}@example.com`, // dynamic email
      password: hashedPassword,
    });

    // 2️⃣ Create a group for the user with manual joinCode
    const joinCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    const group = new Group({
      name: 'Test Group',
      description: 'A group for testing',
      user: user._id,
      joinCode, // manually set to avoid validation error
    });
    await group.save();

    // 3️⃣ Create a task under the group
    const task = await Task.create({
      title: 'Test Task',
      description: 'Complete the test setup',
      user: user._id,
      group: group._id,
      status: 'todo',
      priority: 'high',
    });

    // 4️⃣ Create a note for the task
    const note = await Note.create({
      title: 'Test Note',
      content: 'This is a note for the test task',
      user: user._id,
      task: task._id,
    });

    // 5️⃣ Fetch full nested data: user → groups → tasks → notes
    const fullUserData = await User.findById(user._id)
      .populate({
        path: 'groups',
        populate: {
          path: 'tasks',
          populate: { path: 'notes' },
        },
      });

    return NextResponse.json({
      message: 'Full test setup created successfully',
      data: fullUserData,
    });
  } catch (error) {
    console.error('Test setup error:', error);
    return NextResponse.json(
      { message: 'Error creating test setup', error },
      { status: 500 }
    );
  }
}
