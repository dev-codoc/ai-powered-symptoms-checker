import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { generateSessionToken, verifyPassword, toPublicUser } from "@/lib/auth";
import { ApiResponse, User, UserPublic } from "@/lib/types";

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ user: UserPublic; token: string }>>> {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide an email address" },
        { status: 400 }
      );
    }

    // Validate password
    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Please provide a password" },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);

    // Find user by email
    const user = await usersCollection.findOne({ email: email.trim().toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash || "");
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate session token
    const token = generateSessionToken(user.id);

    const response = NextResponse.json({
      success: true,
      data: { user: toPublicUser(user), token },
    });

    // Set cookie for session management
    response.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
