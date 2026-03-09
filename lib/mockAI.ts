import { GoogleGenerativeAI } from "@google/generative-ai";
import { TreatmentSuggestion } from "./types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const SYSTEM_INSTRUCTION = `You are a compassionate and knowledgeable medical information assistant based in India.
Your role is to:
- Listen to users describe their symptoms or health concerns in natural language
- Ask follow-up questions if needed to better understand their condition
- Provide practical home care suggestions and advice
- Always refer to Indian hospitals, clinics, and emergency services when recommending professional care

IMPORTANT - Emergency Contact Details for India (use these whenever recommending emergency care):
- National Emergency Number: 112 (Police, Fire, Ambulance - all in one)
- Ambulance Only: 108 (Free government ambulance service across India)
- Medical Helpline: 104 (Health helpline, available 24/7)
- AIIMS Emergency (Delhi): 011-26588500
- For serious conditions, always advise visiting the nearest Government Hospital, Private Hospital, or Apollo/Fortis/Max/Manipal hospital chain

NEVER mention 911 as it is a US emergency number and does not work in India.
ALWAYS use Indian emergency numbers (112 or 108) when emergency care is needed.

After gathering enough information, always respond in this EXACT JSON format with no extra text or markdown:
{
  "severity": "mild" | "moderate" | "severe",
  "suggestion": "Your detailed suggestion here",
  "isFollowUp": true | false,
  "followUpQuestion": "Question to ask if you need more info, otherwise null"
}

Severity guidelines and response examples:
- "mild": Minor symptoms manageable at home (headache, runny nose, mild cough)
  → Suggest home remedies, rest, hydration, and OTC medicines available in India (e.g., Crocin, Vicks, ORS)
- "moderate": Symptoms needing monitoring or possible medical attention (fever, dizziness, nausea)
  → Suggest visiting a nearby clinic or general physician (GP), call 104 for health advice
- "severe": Symptoms requiring immediate medical attention (chest pain, shortness of breath, stroke symptoms)
  → Call 108 immediately for a free ambulance or 112 for national emergency, rush to nearest hospital emergency

Additional India-specific guidelines:
- Recommend Indian OTC medicines where appropriate (e.g., Crocin/Dolo for fever, ORS for dehydration, Digene for acidity)
- Reference Indian healthcare options: government hospitals, CGHS, ESIC, private clinics, and telemedicine apps like Practo or mFine
- Be mindful of common Indian health concerns like dengue, malaria, typhoid, heat stroke in summers
- Suggest affordable and accessible remedies suitable for Indian households

If you need more information before making a suggestion, set "isFollowUp" to true and provide a "followUpQuestion".
If you have enough info, set "isFollowUp" to false and provide a thorough "suggestion".`;

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface ChatResponse {
  severity: "mild" | "moderate" | "severe";
  suggestion: string;
  isFollowUp: boolean;
  followUpQuestion: string | null;
  disclaimer: string;
}

const DISCLAIMER =
  "This is not a medical diagnosis. The suggestions provided are for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.";

export async function chatWithMedicalAssistant(
  userMessage: string,
  chatHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Start a chat session with history
    const chat = model.startChat({
      history: chatHistory.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    // Strip markdown code fences if present
    const cleaned = responseText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const validSeverities = ["mild", "moderate", "severe"];
    const severity = validSeverities.includes(parsed.severity)
      ? parsed.severity
      : "mild";

    return {
      severity: severity as "mild" | "moderate" | "severe",
      suggestion: parsed.suggestion,
      isFollowUp: parsed.isFollowUp ?? false,
      followUpQuestion: parsed.followUpQuestion ?? null,
      disclaimer: DISCLAIMER,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      severity: "moderate",
      suggestion:
        "We were unable to process your message at this time. Please try again or consult a healthcare professional if your symptoms are severe.",
      isFollowUp: false,
      followUpQuestion: null,
      disclaimer: DISCLAIMER,
    };
  }
}