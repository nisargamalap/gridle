// app/api/admin/groups/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import User from "@/models/User";
import { auth } from "@/auth";

export const dynamic = "force-dynamic"; // ⬅️ prevents build-time pre-render error

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const nameFilter = searchParams.get("name");
    const ownerFilter = searchParams.get("owner");
    const privacyFilter = searchParams.get("privacy");

    await connectDB();

    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (nameFilter) {
      query.name = { $regex: nameFilter, $options: "i" };
    }

    if (privacyFilter) {
      query.isPublic = privacyFilter === "public";
    }

    let groups = await Group.find(query)
      .populate("user", "name email")
      .populate("members.user", "name email role")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    if (ownerFilter) {
      groups = groups.filter(
        (group) =>
          group.user?.name
            ?.toLowerCase()
            .includes(ownerFilter.toLowerCase()) ||
          group.user?.email
            ?.toLowerCase()
            .includes(ownerFilter.toLowerCase())
      );
    }

    const total = await Group.countDocuments(query);

    return NextResponse.json({
      groups,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Get groups error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
