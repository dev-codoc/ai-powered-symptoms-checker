"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { TreatmentSuggestion } from "@/lib/types";
import { AlertTriangle, CheckCircle, Info, ShieldAlert } from "lucide-react";

interface TreatmentDisplayProps {
  treatment: TreatmentSuggestion;
  symptoms: string[];
}

export function TreatmentDisplay({ treatment, symptoms }: TreatmentDisplayProps) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "severe":
        return {
          icon: ShieldAlert,
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          badgeVariant: "destructive" as const,
          label: "Seek Medical Attention",
        };
      case "moderate":
        return {
          icon: AlertTriangle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          badgeVariant: "secondary" as const, // ✅ Fixed: was "warning"
          label: "Monitor Closely",
        };
      default:
        return {
          icon: CheckCircle,
          color: "text-accent",
          bgColor: "bg-accent/10",
          badgeVariant: "outline" as const, // ✅ Fixed: was "success"
          label: "Self-Care Recommended",
        };
    }
  };

  const config = getSeverityConfig(treatment.severity);
  const SeverityIcon = config.icon;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <SeverityIcon className={`h-5 w-5 ${config.color}`} />
              AI Health Suggestions
            </CardTitle>
            <CardDescription className="mt-1">
              Based on your reported symptoms
            </CardDescription>
          </div>
          <Badge variant={config.badgeVariant}>{config.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Reported Symptoms
          </h4>
          <div className="flex flex-wrap gap-2">
            {symptoms.map((symptom, index) => (
              <Badge key={index} variant="outline">
                {symptom}
              </Badge>
            ))}
          </div>
        </div>

        <div className={`rounded-lg p-4 ${config.bgColor}`}>
          <h4 className="mb-2 font-medium text-foreground">Suggested Actions</h4>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {treatment.suggestion}
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Important Disclaimer</AlertTitle>
          <AlertDescription className="text-sm">
            {treatment.disclaimer}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}