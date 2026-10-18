import { NextRequest, NextResponse } from "next/server";
import { parseSessionToken } from "@/lib/auth";
import { chatWithMedicalAssistant } from "@/lib/mockAI";
import { ApiResponse, ChatMessage, ChatResponse, User } from "@/lib/types";
import { COLLECTIONS, getCollection } from "@/lib/mongodb";

interface ChatRequest {
  message: string;
  symptoms: string[];
  assessment: string;
  followUpQuestion: string | null;
  history: ChatMessage[];
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ChatResponse>>> {
  try {
    const token = request.cookies.get("session_token")?.value;
    const parsed = token ? parseSessionToken(token) : null;

    if (!parsed) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
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

    const body = (await request.json()) as Partial<ChatRequest>;
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const symptoms = Array.isArray(body.symptoms)
      ? body.symptoms.filter((symptom): symptom is string => typeof symptom === "string").slice(0, 20)
      : [];

    if (!message || message.length > 1000 || symptoms.length === 0) {
      return NextResponse.json(
        { success: false, error: "A message and symptom context are required" },
        { status: 400 }
      );
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (item): item is ChatMessage =>
              !!item &&
              (item.role === "user" || item.role === "model") &&
              typeof item.content === "string"
          )
          .slice(-12)
          .map((item) => ({ role: item.role, content: item.content.slice(0, 2000) }))
      : [];

    const initialContext = `The user's reported symptoms are: ${symptoms.join(", ")}.`;
    const initialAssessment = [
      typeof body.assessment === "string" ? body.assessment.slice(0, 3000) : "",
      body.followUpQuestion ? `Follow-up question: ${body.followUpQuestion.slice(0, 500)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await chatWithMedicalAssistant(message, [
      { role: "user", content: initialContext },
      { role: "model", content: initialAssessment },
      ...history,
    ]);

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Symptom chat error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to get a response right now. Please try again." },
      { status: 500 }
    );
  }
}