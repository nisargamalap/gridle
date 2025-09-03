// src/app/api/tasks/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { auth } from "@/auth";
import mongoose from "mongoose";

// ---------------------------
// GET: fetch all tasks for current user
// ---------------------------
export async function GET() {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    // Try to populate group if the model exists, otherwise get tasks without populate
    let tasks;
    
    // Check if Group model exists before trying to populate
    if (mongoose.models.Group) {
      tasks = await Task.find({ user: session.user.id })
        .populate("group", "name")
        .sort({ updatedAt: -1 });
    } else {
      tasks = await Task.find({ user: session.user.id })
        .sort({ updatedAt: -1 });
    }

    return NextResponse.json(tasks);
  } catch (err) {
    console.error("Fetch tasks error:", err);
    
    // Fallback: get tasks without populate if there's any error
    try {
      const tasks = await Task.find({ user: session.user.id })
        .sort({ updatedAt: -1 });
      return NextResponse.json(tasks);
    } catch (fallbackError) {
      console.error("Fallback fetch error:", fallbackError);
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
  }
}

// ---------------------------
// POST: create a new task
// ---------------------------
export async function POST(request) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { title, description, dueDate, priority, category, status, group } = data;

    // ✅ validate required fields
    if (!title || !dueDate) {
      return NextResponse.json(
        { message: "Title and due date are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const task = await Task.create({
      title,
      description: description || "",
      dueDate,
      priority: priority || "medium",
      category: category || "Uncategorized",
      status: status || "todo",
      group: group || null,
      user: session.user.id,
    });

    // Try to populate group if the model exists
    let populatedTask;
    if (mongoose.models.Group) {
      populatedTask = await Task.findById(task._id).populate("group", "name");
    } else {
      populatedTask = task;
    }

    return NextResponse.json(populatedTask, { status: 201 });
  } catch (err) {
    console.error("Create task error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}