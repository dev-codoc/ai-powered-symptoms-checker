import { NextRequest, NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/mongodb";
import { parseSessionToken } from "@/lib/auth";
import { chatWithMedicalAssistant } from "@/lib/mockAI";
import { ApiResponse, SymptomSubmission, TreatmentSuggestion, User } from "@/lib/types";

interface SubmitResponse {
  submission: SymptomSubmission;
  treatment: TreatmentSuggestion;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<SubmitResponse>>> {
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

    // Parse request body
    const body = await request.json();
    const { symptoms } = body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide at least one symptom" },
        { status: 400 }
      );
    }

    // Validate symptoms
    const validSymptoms = symptoms
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s) => s.trim());

    if (validSymptoms.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide at least one valid symptom" },
        { status: 400 }
      );
    }

    // Generate AI treatment suggestion
    const treatment = await chatWithMedicalAssistant(validSymptoms.join(", "));

    // Save to database
    const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const submission: SymptomSubmission = {
      id: submissionId,
      userId: user.id,
      symptoms: validSymptoms,
      aiSuggestion: treatment.suggestion,
      severity: treatment.severity,
      timestamp: new Date().toISOString(),
    };

    const symptomsCollection = await getCollection<SymptomSubmission>(COLLECTIONS.SYMPTOMS);
    await symptomsCollection.insertOne(submission);

    return NextResponse.json({
      success: true,
      data: {
        submission,
        treatment,
      },
    });
  } catch (error) {
    console.error("Symptom submission error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred while processing your symptoms" },
      { status: 500 }
    );
  }
}
