export interface User {
  _id?: string;
  id: string;
  email: string;
  name: string;
  age: number;
  passwordHash?: string;
  createdAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  age: number;
  createdAt: string;
}

export interface SymptomSubmission {
  id: string;
  userId: string;
  symptoms: string[];
  aiSuggestion: string;
  severity: "mild" | "moderate" | "severe";
  timestamp: string;
}

export interface AuthSession {
  user: User | null;
  isAuthenticated: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TreatmentSuggestion {
  suggestion: string;
  severity: "mild" | "moderate" | "severe";
  disclaimer: string;
}

export interface TreatmentSuggestion {
  suggestion: string;
  severity: "mild" | "moderate" | "severe";
  disclaimer: string;
}

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