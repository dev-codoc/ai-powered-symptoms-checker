import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { generateSessionToken, hashPassword, toPublicUser } from "@/lib/auth";
import { ApiResponse, User, UserPublic } from "@/lib/types";

interface RegisterRequest {
  email: string;
  name: string;
  age: number;
  password: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ user: UserPublic; token: string }>>> {
  try {
    const body: RegisterRequest = await request.json();
    const { email, name, age, password } = body;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Validate age
    if (!age || typeof age !== "number" || age < 1 || age > 150) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid age" },
        { status: 400 }
      );
    }

    // Validate password
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const usersCollection = await getCollection<User>(COLLECTIONS.USERS);

    // Check if email already exists
    const existingUser = await usersCollection.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newUser: User = {
      id: userId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      age: Math.floor(age),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await usersCollection.insertOne(newUser);

    // Generate session token
    const token = generateSessionToken(userId);

    const response = NextResponse.json({
      success: true,
      data: { user: toPublicUser(newUser), token },
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
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
