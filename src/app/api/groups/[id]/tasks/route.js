// src/app/api/groups/[id]/tasks/route.js
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import Group from "@/models/Group";
import { auth } from "@/auth";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(params.id)) {
      return NextResponse.json({ message: "Invalid group ID" }, { status: 400 });
    }

    await connectDB();

    // Check if user has access to this group
    const group = await Group.findOne({
      _id: params.id,
      $or: [
        { user: session.user.id },
        { "members.user": session.user.id }
      ],
    });

    if (!group) {
      return NextResponse.json({ message: "Group not found or access denied" }, { status: 404 });
    }

    // Get tasks for this group
    const tasks = await Task.find({ 
      group: params.id 
    }).sort({ createdAt: -1 });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Get group tasks error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}