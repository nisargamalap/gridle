export const dynamic = "force-dynamic";
// src/app/api/tasks/[id]/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { auth } from "@/auth";
import mongoose from "mongoose";

// ---------------------------
// GET Task by ID
// ---------------------------
export async function GET(request, context) {
  const { id } = context.params;
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const task = await Task.findOne({ _id: id, user: session.user.id })
      .populate("project", "name")
      .populate("group", "name");

    if (!task) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Get task error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------
// UPDATE Task by ID
// ---------------------------
export async function PUT(request, context) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params; // ✅ must await
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const data = await request.json().catch(() => ({}));

    await connectDB();

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: session.user.id },
      { $set: data },
      { new: true, runValidators: true, omitUndefined: true } // ✅ prevents overwriting with undefined
    )
      .populate("project", "name")
      .populate("group", "name");

    if (!updatedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------
// DELETE Task by ID
// ---------------------------
export async function DELETE(request, context) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params; // ✅ must await
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    await connectDB();

    const deletedTask = await Task.findOneAndDelete({ _id: id, user: session.user.id });
    if (!deletedTask) {
      return NextResponse.json({ message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: `Task "${deletedTask.title}" deleted successfully`,
      task: deletedTask,
    });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
