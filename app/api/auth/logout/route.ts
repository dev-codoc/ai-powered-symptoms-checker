import { NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";

export async function POST(): Promise<NextResponse<ApiResponse>> {
  const response = NextResponse.json({
    success: true,
    data: { message: "Logged out successfully" },
  });

  // Clear the session cookie
  response.cookies.set("session_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
