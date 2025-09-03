// app/api/admin/groups/[id]/members/[userId]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Group from '@/models/Group';
import { auth } from '@/auth';

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const group = await Group.findById(params.id);
    if (!group) {
      return NextResponse.json({ message: 'Group not found' }, { status: 404 });
    }

    // Check if user is a member
    const memberIndex = group.members.findIndex(
      member => member.user.toString() === params.userId
    );

    if (memberIndex === -1) {
      return NextResponse.json({ message: 'User is not a member of this group' }, { status: 400 });
    }

    // Don't allow removing the User
    if (group.user.toString() === params.userId) {
      return NextResponse.json({ message: 'Cannot remove group user' }, { status: 400 });
    }

    // Remove member
    group.members.splice(memberIndex, 1);
    await group.save();

    return NextResponse.json({ message: 'Member removed successfully' });

  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}