// src/app/api/groups/[id]/members/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
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

    const group = await Group.findOne({
      _id: params.id,
      $or: [
        { user: session.user.id },
        { "members.user": session.user.id }
      ],
    }).populate("members.user", "name email");

    if (!group) {
      return NextResponse.json({ message: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group.members);
  } catch (error) {
    console.error("Get group members error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}