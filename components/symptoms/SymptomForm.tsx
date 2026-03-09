"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Send, Loader2 } from "lucide-react";

interface SymptomFormProps {
  onSubmit: (symptoms: string[]) => Promise<void>;
  isLoading: boolean;
}

const commonSymptoms = [
  "Headache",
  "Fever",
  "Cough",
  "Fatigue",
  "Sore Throat",
  "Nausea",
  "Dizziness",
  "Back Pain",
  "Joint Pain",
  "Runny Nose",
  "Stomach Pain",
  "Insomnia",
];

export function SymptomForm({ onSubmit, isLoading }: SymptomFormProps) {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const addSymptom = (symptom: string) => {
    const trimmed = symptom.trim();
    if (trimmed && !symptoms.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSymptoms([...symptoms, trimmed]);
    }
    setInputValue("");
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSymptom(inputValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (symptoms.length > 0) {
      await onSubmit(symptoms);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Describe Your Symptoms</CardTitle>
        <CardDescription>
          Enter or select your symptoms below to receive AI-powered health suggestions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="symptom-input">Add Symptoms</Label>
            <div className="flex gap-2">
              <Input
                id="symptom-input"
                placeholder="Type a symptom and press Enter..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addSymptom(inputValue)}
                disabled={!inputValue.trim() || isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {symptoms.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Symptoms</Label>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 py-1.5 pl-3 pr-2"
                  >
                    {symptom}
                    <button
                      type="button"
                      onClick={() => removeSymptom(index)}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {symptom}</span>
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Common Symptoms</Label>
            <div className="flex flex-wrap gap-2">
              {commonSymptoms.map((symptom) => {
                const isSelected = symptoms.some(
                  (s) => s.toLowerCase() === symptom.toLowerCase()
                );
                return (
                  <Button
                    key={symptom}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (isSelected) {
                        setSymptoms(
                          symptoms.filter((s) => s.toLowerCase() !== symptom.toLowerCase())
                        );
                      } else {
                        addSymptom(symptom);
                      }
                    }}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    {symptom}
                  </Button>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={symptoms.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing Symptoms...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Get Treatment Suggestions
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
