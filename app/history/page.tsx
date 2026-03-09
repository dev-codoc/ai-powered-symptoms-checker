"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SymptomSubmission } from "@/lib/types";
import { 
  Loader2, 
  AlertCircle, 
  Calendar, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  ArrowLeft,
  FileText
} from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<SymptomSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/symptoms/history");
      const data = await response.json();

      if (data.success) {
        setHistory(data.data.history);
      } else {
        setError(data.error || "Failed to load history");
      }
    } catch {
      setError("An error occurred while loading history");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "severe":
        return { variant: "destructive" as const, label: "Severe" };
      case "moderate":
        return { variant: "warning" as const, label: "Moderate" };
      default:
        return { variant: "success" as const, label: "Mild" };
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Symptom History
              </h1>
              <p className="mt-1 text-muted-foreground">
                View your past symptom checks and AI suggestions
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to Checker
              </Link>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No history yet</h3>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  Your symptom checks will appear here after you submit them
                </p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard">
                    <Activity className="h-4 w-4" />
                    Check Symptoms
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((submission) => {
                const isExpanded = expandedId === submission.id;
                const severityConfig = getSeverityConfig(submission.severity);

                return (
                  <Card key={submission.id} className="overflow-hidden">
                    <CardHeader
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() => setExpandedId(isExpanded ? null : submission.id)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {formatDate(submission.timestamp)}
                          </div>
                          <CardTitle className="mt-2 text-lg">
                            {submission.symptoms.length} Symptom{submission.symptoms.length !== 1 ? "s" : ""} Reported
                          </CardTitle>
                          <CardDescription className="mt-1">
                            <span className="flex flex-wrap gap-1.5">
                              {submission.symptoms.slice(0, 3).map((symptom, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {symptom}
                                </Badge>
                              ))}
                              {submission.symptoms.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{submission.symptoms.length - 3} more
                                </Badge>
                              )}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={severityConfig.variant}>
                            {severityConfig.label}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="border-t border-border bg-muted/30 pt-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                              All Symptoms
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {submission.symptoms.map((symptom, index) => (
                                <Badge key={index} variant="secondary">
                                  {symptom}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                              AI Suggestion
                            </h4>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                              {submission.aiSuggestion}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
