"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { SymptomForm } from "@/components/symptoms/SymptomForm";
import { TreatmentDisplay } from "@/components/symptoms/TreatmentDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TreatmentSuggestion } from "@/lib/types";
import { Loader2, AlertCircle, RefreshCw, History } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [treatment, setTreatment] = useState<TreatmentSuggestion | null>(null);
  const [submittedSymptoms, setSubmittedSymptoms] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmitSymptoms = async (symptoms: string[]) => {
    setIsSubmitting(true);
    setError(null);
    setTreatment(null);

    try {
      const response = await fetch("/api/symptoms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms }),
      });

      const data = await response.json();

      if (data.success) {
        setTreatment(data.data.treatment);
        setSubmittedSymptoms(symptoms);
      } else {
        setError(data.error || "Failed to analyze symptoms");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTreatment(null);
    setSubmittedSymptoms([]);
    setError(null);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              AI Symptom Checker
            </h1>
            <p className="mt-2 text-muted-foreground">
              Describe your symptoms and receive AI-powered health suggestions
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!treatment ? (
            <SymptomForm onSubmit={handleSubmitSymptoms} isLoading={isSubmitting} />
          ) : (
            <div className="space-y-4">
              <TreatmentDisplay treatment={treatment} symptoms={submittedSymptoms} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4" />
                  Check New Symptoms
                </Button>
                <Button asChild variant="secondary" className="flex-1">
                  <Link href="/history">
                    <History className="h-4 w-4" />
                    View History
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
