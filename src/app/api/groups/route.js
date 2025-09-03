export const dynamic = "force-dynamic";

// src/app/api/groups/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Group from '@/models/Group';
import User from '@/models/User';
import { auth } from '@/auth';

// Function to generate join code
const generateJoinCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const groups = await Group.find({
      $or: [
        { user: session.user.id },
        { 'members.user': session.user.id }
      ]
    })
    .populate('user', 'name email')
    .populate('members.user', 'name email')
    .sort({ createdAt: -1 });

    return NextResponse.json(groups);

  } catch (error) {
    console.error('Get groups error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, description, isPrivate } = data;

    if (!name) {
      return NextResponse.json(
        { message: 'Group name is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Generate join code manually to ensure it's always set
    const joinCode = generateJoinCode();

    const group = await Group.create({
      name,
      description,
      user: session.user.id,
      isPrivate: isPrivate || false,
      joinCode: joinCode, // Manually set the joinCode
      members: [{
        user: session.user.id,
        role: 'admin',
      }],
    });

    const populatedGroup = await Group.findById(group._id)
      .populate('user', 'name email')
      .populate('members.user', 'name email');

    return NextResponse.json(populatedGroup, { status: 201 });

  } catch (error) {
    console.error('Create group error:', error);
    // Return more detailed error information
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error.message,
        details: error.errors || null
      },
      { status: 500 }
    );
  }
}