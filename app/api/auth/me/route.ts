import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { parseSessionToken, toPublicUser } from "@/lib/auth";
import { ApiResponse, User, UserPublic } from "@/lib/types";

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ user: UserPublic }>>> {
  try {
    const token = request.cookies.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const parsed = parseSessionToken(token);
    
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);
    const user = await usersCollection.findOne({ id: parsed.userId });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user: toPublicUser(user) },
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred" },
      { status: 500 }
    );
  }
}
