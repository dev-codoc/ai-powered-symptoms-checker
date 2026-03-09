import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { parseSessionToken } from "@/lib/auth";
import { ApiResponse, SymptomSubmission, User } from "@/lib/types";

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ history: SymptomSubmission[] }>>> {
  try {
    // Verify authentication
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

    // Get user's symptom history from MongoDB
    const symptomsCollection = await getCollection<SymptomSubmission>(COLLECTIONS.SYMPTOMS);
    const history = await symptomsCollection
      .find({ userId: user.id })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while fetching history" },
      { status: 500 }
    );
  }
}
