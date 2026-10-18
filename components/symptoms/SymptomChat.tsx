"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage, ChatResponse, TreatmentSuggestion } from "@/lib/types";

interface SymptomChatProps {
  symptoms: string[];
  treatment: TreatmentSuggestion;
}

interface DisplayMessage extends ChatMessage {
  id: string;
}

function getAnswerOptions(question: string | null) {
  if (!question) {
    return ["Home care options", "Warning signs to watch for", "When to see a doctor"];
  }

  if (/how long|when did|started|duration/i.test(question)) {
    return ["Today", "1-3 days ago", "More than 3 days ago"];
  }

  if (/how (bad|severe)|severity|intensity|rate the pain/i.test(question)) {
    return ["Mild", "Moderate", "Severe"];
  }

  if (/where|which part|location/i.test(question)) {
    return ["Upper area", "Middle area", "Lower area"];
  }

  if (/how often|how many times|frequency/i.test(question)) {
    return ["Once", "A few times", "Frequently"];
  }

  return ["Yes", "No", "Not sure"];
}

export function SymptomChat({ symptoms, treatment }: SymptomChatProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState(treatment.followUpQuestion);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pendingQuestion]);

  const sendMessage = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    const userMessage: DisplayMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };
    const history = messages.map(({ role, content }) => ({ role, content }));

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch("/api/symptoms/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          symptoms,
          assessment: treatment.suggestion,
          followUpQuestion: treatment.followUpQuestion,
          history,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to get a response. Please try again.");
      }

      const answer = result.data as ChatResponse;
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-model`, role: "model", content: answer.suggestion },
      ]);
      setPendingQuestion(answer.isFollowUp ? answer.followUpQuestion : null);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send your message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-primary" />
          Ask a follow-up
        </CardTitle>
        <CardDescription>
          Get practical guidance based on this assessment. For emergencies, seek care now.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          ref={transcriptRef}
          aria-live="polite"
          className="max-h-80 space-y-3 overflow-y-auto rounded-md border bg-muted/30 p-3"
        >
          {pendingQuestion && (
            <div className="max-w-[92%] rounded-md bg-card p-3 text-sm shadow-sm">
              <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                One detail would help
              </p>
              <p className="whitespace-pre-line text-muted-foreground">{pendingQuestion}</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`w-fit max-w-[92%] whitespace-pre-line rounded-md px-3 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-card text-card-foreground shadow-sm"
              }`}
            >
              {message.content}
            </div>
          ))}
          {isSending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing guidance...
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isSending && (
          <div className="flex flex-wrap gap-2" aria-label="Suggested replies">
            {getAnswerOptions(pendingQuestion).map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void sendMessage(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder="Add a detail or ask a question..."
            aria-label="Message the health assistant"
            className="min-h-10 max-h-32 resize-y"
            disabled={isSending}
          />
          <Button type="submit" size="icon" aria-label="Send message" disabled={!input.trim() || isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}