import { useConvexMutation } from "@convex-dev/react-query";
import { config } from "@root/config";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { api } from "@yugen/backend/convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import CreateOrganizationForm from "../components/create-organization-form";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authClient } from "../lib/auth-client";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      throw redirect({
        to: "/dashboard",
        search: { action: undefined, purchaseSuccess: undefined },
      });
    }
  },
  component: OnboardingComponent,
});

function OnboardingComponent() {
  const maxSteps = config.features.organizations ? 4 : 3;
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    step1: "",
    step2: "",
    step3: "",
  });
  const [orgCreated, setOrgCreated] = useState(false);
  const navigate = useNavigate();

  const completeOnboarding = useConvexMutation(
    api.userProfiles.completeOnboarding
  );

  const handleNext = () => {
    if (step < maxSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const { data: session } = await authClient.getSession();
      if (!session?.user?.id) {
        toast.error("Please sign in to complete onboarding");
        navigate({
          to: "/dashboard",
          search: { action: undefined, purchaseSuccess: undefined },
        });
        return;
      }

      await completeOnboarding({ userId: session.user.id });
      toast.success("Welcome! Your account is all set up");
      navigate({
        to: "/dashboard",
        search: { action: undefined, purchaseSuccess: undefined },
      });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete onboarding. Please try again.");
    }
  };

  const handleOrgCreated = () => {
    setOrgCreated(true);
    if (step === maxSteps) {
      handleComplete();
    } else {
      handleNext();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Welcome! Let's get you set up</CardTitle>
          <CardDescription>
            Step {step} of {maxSteps}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="flex gap-2">
            {Array.from({ length: maxSteps }, (_, i) => i + 1).map((i) => (
              <div
                className={`h-2 flex-1 rounded-full ${
                  i <= step ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                }`}
                key={i}
              />
            ))}
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="step1">What brings you here today?</Label>
                <Input
                  id="step1"
                  onChange={(e) =>
                    setFormData({ ...formData, step1: e.target.value })
                  }
                  placeholder="Enter your response..."
                  type="text"
                  value={formData.step1}
                />
                <p className="text-muted-foreground text-sm">
                  Tell us about your goals (placeholder)
                </p>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="step2">How did you hear about us?</Label>
                <Input
                  id="step2"
                  onChange={(e) =>
                    setFormData({ ...formData, step2: e.target.value })
                  }
                  placeholder="Enter your response..."
                  type="text"
                  value={formData.step2}
                />
                <p className="text-muted-foreground text-sm">
                  Help us understand how you found us (placeholder)
                </p>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="step3">What's your experience level?</Label>
                <Input
                  id="step3"
                  onChange={(e) =>
                    setFormData({ ...formData, step3: e.target.value })
                  }
                  placeholder="Enter your response..."
                  type="text"
                  value={formData.step3}
                />
                <p className="text-muted-foreground text-sm">
                  This helps us customize your experience (placeholder)
                </p>
              </div>
            </div>
          )}

          {/* Step 4 - Organization Creation (only if organizations enabled) */}
          {config.features.organizations && step === 4 && (
            <div className="space-y-4">
              <CreateOrganizationForm
                onCancel={orgCreated ? undefined : handleBack}
                onSuccess={handleOrgCreated}
              />
              {orgCreated && (
                <div className="rounded-md bg-green-500/10 p-3 text-green-400 text-sm">
                  Organization created! You can create more organizations later
                  from your dashboard.
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Button
              disabled={step === 1}
              onClick={handleBack}
              type="button"
              variant="outline"
            >
              Back
            </Button>
            {config.features.organizations && step === 4 ? (
              orgCreated ? (
                <Button onClick={handleComplete} type="button">
                  Complete Setup
                </Button>
              ) : null
            ) : step < maxSteps ? (
              <Button onClick={handleNext} type="button">
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete} type="button">
                Complete Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
