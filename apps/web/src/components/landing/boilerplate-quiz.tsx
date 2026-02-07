"use client";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HyperText } from "@/components/ui/hyper-text";

type AppType =
  | "saas"
  | "realtime"
  | "marketplace"
  | "content"
  | "dashboard"
  | "api"
  | "other"
  | null;
type FeatureNeeds =
  | "auth"
  | "payments"
  | "realtime"
  | "storage"
  | "email"
  | "waitlist";
type RealTimeNeeds = "yes" | "no" | "unsure" | null;
type DeploymentPreference =
  | "edge"
  | "traditional"
  | "agnostic"
  | "unsure"
  | null;
type DatabaseComplexity =
  | "simple"
  | "realtime"
  | "complex"
  | "relational"
  | "unsure"
  | null;

interface QuizAnswers {
  appType: AppType;
  featureNeeds: FeatureNeeds[];
  realTimeNeeds: RealTimeNeeds;
  deploymentPreference: DeploymentPreference;
  databaseComplexity: DatabaseComplexity;
}

type Recommendation = "yes" | "maybe" | "no";

type QuizStep = {
  id: string;
  title: string;
  subtitle?: string;
  options: Array<{ value: string; label: string }>;
  multiSelect?: boolean;
};

function calculateRecommendation(answers: QuizAnswers): Recommendation {
  let score = 0;
  let warningFlags = 0;

  // App type scoring
  if (
    answers.appType === "saas" ||
    answers.appType === "realtime" ||
    answers.appType === "dashboard"
  ) {
    score += 3;
  } else if (
    answers.appType === "marketplace" ||
    answers.appType === "content"
  ) {
    score += 2;
  } else if (answers.appType === "api") {
    score -= 2;
    warningFlags++;
  }

  // Feature needs scoring
  if (answers.featureNeeds.length >= 4) {
    score += 3;
  } else if (answers.featureNeeds.length >= 3) {
    score += 2;
  } else if (answers.featureNeeds.length <= 2) {
    score -= 1;
  }

  // Real-time needs scoring
  if (answers.realTimeNeeds === "yes") {
    score += 3;
  } else if (answers.realTimeNeeds === "no") {
    score += 1; // Still works, just not leveraging key feature
  }

  // Deployment preference scoring
  if (answers.deploymentPreference === "edge") {
    score += 2;
  } else if (answers.deploymentPreference === "traditional") {
    score -= 2;
    warningFlags++;
  } else if (answers.deploymentPreference === "agnostic") {
    score += 1;
  }

  // Database complexity scoring
  if (
    answers.databaseComplexity === "simple" ||
    answers.databaseComplexity === "realtime"
  ) {
    score += 2;
  } else if (answers.databaseComplexity === "relational") {
    score -= 2;
    warningFlags++;
  } else if (answers.databaseComplexity === "complex") {
    score -= 1;
  }

  // Determine recommendation
  if (warningFlags >= 2) {
    return "no";
  }
  if (score >= 7) {
    return "yes";
  }
  if (score >= 4) {
    return "maybe";
  }
  return "no";
}

const STEPS: QuizStep[] = [
  {
    id: "appType",
    title: "What type of application are you building?",
    options: [
      { value: "saas", label: "SaaS / Subscription-based product" },
      {
        value: "realtime",
        label: "Real-time collaborative app (chat, docs, whiteboards)",
      },
      { value: "marketplace", label: "Marketplace / E-commerce" },
      { value: "content", label: "Content platform / Blog / CMS" },
      { value: "dashboard", label: "Dashboard / Analytics tool" },
      { value: "api", label: "API / Backend service" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "featureNeeds",
    title: "Which features do you need?",
    subtitle: "Select all that apply",
    options: [
      { value: "auth", label: "User authentication & accounts" },
      { value: "payments", label: "Subscription payments / billing" },
      { value: "realtime", label: "Real-time data sync" },
      { value: "storage", label: "File uploads / storage" },
      { value: "email", label: "Email notifications" },
      { value: "waitlist", label: "Waitlist / access control" },
    ],
    multiSelect: true,
  },
  {
    id: "realTimeNeeds",
    title: "Do you need real-time features?",
    options: [
      {
        value: "yes",
        label: "Yes — live updates, collaboration, notifications",
      },
      { value: "no", label: "No — traditional request/response is fine" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "deploymentPreference",
    title: "What's your deployment preference?",
    options: [
      {
        value: "edge",
        label: "Edge/serverless (Cloudflare Workers, Vercel, etc.)",
      },
      {
        value: "traditional",
        label: "Traditional server (Node.js, Python backend)",
      },
      { value: "agnostic", label: "Infrastructure-agnostic" },
      { value: "unsure", label: "Not sure" },
    ],
  },
  {
    id: "databaseComplexity",
    title: "What's your database complexity?",
    options: [
      { value: "simple", label: "Simple CRUD operations" },
      { value: "realtime", label: "Real-time sync across users" },
      { value: "complex", label: "Complex queries / analytics" },
      { value: "relational", label: "Heavy relational data with many joins" },
      { value: "unsure", label: "Not sure" },
    ],
  },
];

export function BoilerplateQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    appType: null,
    featureNeeds: [],
    realTimeNeeds: null,
    deploymentPreference: null,
    databaseComplexity: null,
  });
  const [showResult, setShowResult] = useState(false);

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const canProceed =
    step.id === "featureNeeds"
      ? answers.featureNeeds.length > 0
      : step.id === "appType"
        ? answers.appType !== null
        : step.id === "realTimeNeeds"
          ? answers.realTimeNeeds !== null
          : step.id === "deploymentPreference"
            ? answers.deploymentPreference !== null
            : answers.databaseComplexity !== null;

  const handleNext = () => {
    if (isLastStep) {
      setShowResult(true);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (showResult) {
      setShowResult(false);
    } else {
      setCurrentStep((prev) => Math.max(0, prev - 1));
    }
  };

  const handleOptionSelect = (value: string) => {
    if (step.id === "featureNeeds") {
      setAnswers((prev) => ({
        ...prev,
        featureNeeds: prev.featureNeeds.includes(value as FeatureNeeds)
          ? prev.featureNeeds.filter((f) => f !== value)
          : [...prev.featureNeeds, value as FeatureNeeds],
      }));
    } else if (step.id === "appType") {
      setAnswers((prev) => ({ ...prev, appType: value as AppType }));
    } else if (step.id === "realTimeNeeds") {
      setAnswers((prev) => ({
        ...prev,
        realTimeNeeds: value as RealTimeNeeds,
      }));
    } else if (step.id === "deploymentPreference") {
      setAnswers((prev) => ({
        ...prev,
        deploymentPreference: value as DeploymentPreference,
      }));
    } else if (step.id === "databaseComplexity") {
      setAnswers((prev) => ({
        ...prev,
        databaseComplexity: value as DatabaseComplexity,
      }));
    }
  };

  const handleReset = () => {
    setAnswers({
      appType: null,
      featureNeeds: [],
      realTimeNeeds: null,
      deploymentPreference: null,
      databaseComplexity: null,
    });
    setCurrentStep(0);
    setShowResult(false);
  };

  const recommendation = calculateRecommendation(answers);

  if (showResult) {
    return (
      <section className="bg-black py-12 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <HyperText
                as="h2"
                className="font-bold font-mono text-2xl text-white sm:text-3xl md:text-4xl"
                duration={1000}
              >
                Should you even use this boilerplate?
              </HyperText>
            </div>

            <div className="border border-white/10 bg-white/5 p-6 sm:p-8 md:p-10">
              {recommendation === "yes" && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="mt-1 h-8 w-8 flex-shrink-0 text-green-400" />
                    <div>
                      <h3 className="mb-2 font-mono font-semibold text-white text-xl sm:text-2xl">
                        Yes, this boilerplate is perfect for you!
                      </h3>
                      <p className="font-mono text-sm text-white/60 leading-relaxed sm:text-base">
                        Based on your answers, this boilerplate aligns perfectly
                        with your needs. You'll get real-time capabilities,
                        payments, authentication, and edge deployment all set up
                        and ready to go.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 border-white/10 border-t pt-4">
                    <h4 className="font-mono font-semibold text-base text-white">
                      Why it's a great fit:
                    </h4>
                    <ul className="space-y-2 font-mono text-sm text-white/60">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 text-green-400">✓</span>
                        <span>
                          Real-time database with automatic sync (Convex)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 text-green-400">✓</span>
                        <span>Subscription payments ready (Polar.sh)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 text-green-400">✓</span>
                        <span>
                          Authentication & user management (BetterAuth)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 text-green-400">✓</span>
                        <span>
                          Edge deployment for global performance (Cloudflare
                          Workers)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 text-green-400">✓</span>
                        <span>
                          Cheap file storage with zero egress fees (Cloudflare
                          R2)
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="border-white/10 border-t pt-6">
                    <Button
                      className="w-full bg-purple-500 font-mono font-semibold text-white hover:bg-purple-600"
                      onClick={() => {
                        const element = document.querySelector("#calculator");
                        if (element) {
                          const elementRect = element.getBoundingClientRect();
                          const absoluteElementTop =
                            elementRect.top + window.pageYOffset;
                          const viewportHeight = window.innerHeight;
                          const elementHeight = elementRect.height;
                          const scrollPosition =
                            absoluteElementTop -
                            viewportHeight / 2 +
                            elementHeight / 2;
                          window.scrollTo({
                            top: scrollPosition,
                            behavior: "smooth",
                          });
                        }
                      }}
                    >
                      See how much it costs to run
                    </Button>
                  </div>
                </div>
              )}

              {recommendation === "maybe" && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="mt-1 h-8 w-8 flex-shrink-0 text-yellow-400" />
                    <div>
                      <h3 className="mb-2 font-mono font-semibold text-white text-xl sm:text-2xl">
                        Maybe — depends on your needs
                      </h3>
                      <p className="font-mono text-sm text-white/60 leading-relaxed sm:text-base">
                        This boilerplate could work for you, but you might not
                        use all of its features. Consider whether you'll grow
                        into these capabilities or if a simpler stack would be
                        better.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 border-white/10 border-t pt-4">
                    <h4 className="font-mono font-semibold text-base text-white">
                      Things to consider:
                    </h4>
                    <ul className="space-y-2 font-mono text-sm text-white/60">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 text-yellow-400">•</span>
                        <span>
                          You might not need all the pre-built features
                          (payments, real-time, etc.)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 text-yellow-400">•</span>
                        <span>
                          There could be simpler alternatives for your use case
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 text-yellow-400">•</span>
                        <span>
                          Consider if you'll need these features as you scale
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {recommendation === "no" && (
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <XCircle className="mt-1 h-8 w-8 flex-shrink-0 text-red-400" />
                    <div>
                      <h3 className="mb-2 font-mono font-semibold text-white text-xl sm:text-2xl">
                        Probably not the best fit
                      </h3>
                      <p className="font-mono text-sm text-white/60 leading-relaxed sm:text-base">
                        Based on your answers, this boilerplate might not be
                        ideal for your project. The stack is optimized for
                        edge/serverless deployment and real-time applications,
                        which might not match your requirements.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 border-white/10 border-t pt-4">
                    <h4 className="font-mono font-semibold text-base text-white">
                      Why it might not fit:
                    </h4>
                    <ul className="space-y-2 font-mono text-sm text-white/60">
                      {answers.deploymentPreference === "traditional" && (
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-red-400">✗</span>
                          <span>
                            You prefer traditional server deployment (this is
                            designed for edge/serverless)
                          </span>
                        </li>
                      )}
                      {answers.databaseComplexity === "relational" && (
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-red-400">✗</span>
                          <span>
                            You need heavy relational database with complex
                            joins (Convex is document-based)
                          </span>
                        </li>
                      )}
                      {answers.appType === "api" && (
                        <li className="flex items-start gap-2">
                          <span className="mt-1 text-red-400">✗</span>
                          <span>
                            You're building an API-only backend (this includes
                            full frontend stack)
                          </span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <span className="mt-1 text-red-400">✗</span>
                        <span>
                          Consider PostgreSQL/MySQL with a traditional backend
                          if you need complex SQL queries
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-4 border-white/10 border-t pt-6 sm:flex-row">
                <Button
                  className="flex-1 border-white/20 bg-white/5 font-mono hover:border-white/30 hover:bg-white/10"
                  onClick={handleReset}
                  variant="outline"
                >
                  Start Over
                </Button>
                <Button
                  className="flex-1 border-white/20 bg-white/5 font-mono hover:border-white/30 hover:bg-white/10"
                  onClick={handleBack}
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Questions
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-black py-12 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <HyperText
              as="h2"
              className="font-bold font-mono text-2xl text-white sm:text-3xl md:text-4xl"
              duration={1000}
              startOnView
            >
              Should you even use this?
            </HyperText>
            <p className="mt-4 font-mono text-sm text-white/60 sm:text-base">
              You shouldn't feel pressured or misled into choosing a
              boilerplate.
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-white/60 text-xs">
                Step {currentStep + 1} of {STEPS.length}
              </span>
              <span className="font-mono text-white/60 text-xs">
                {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question card */}
          <div className="border border-white/10 bg-white/5 p-6 sm:p-8 md:p-10">
            <h3 className="mb-2 font-mono font-semibold text-lg text-white sm:text-xl md:text-2xl">
              {step.title}
            </h3>
            {step.subtitle && (
              <p className="mb-6 font-mono text-sm text-white/60">
                {step.subtitle}
              </p>
            )}

            <div className="mt-6 space-y-3">
              {step.options.map((option) => {
                const isSelected = step.multiSelect
                  ? answers.featureNeeds.includes(option.value as FeatureNeeds)
                  : step.id === "appType"
                    ? answers.appType === option.value
                    : step.id === "realTimeNeeds"
                      ? answers.realTimeNeeds === option.value
                      : step.id === "deploymentPreference"
                        ? answers.deploymentPreference === option.value
                        : answers.databaseComplexity === option.value;

                return (
                  <button
                    className={`w-full border p-4 text-left font-mono text-sm transition-all sm:text-base ${
                      isSelected
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/5 hover:text-white/80"
                    }`}
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="mt-8 flex flex-col gap-4 border-white/10 border-t pt-6 sm:flex-row">
              {currentStep > 0 && (
                <Button
                  className="border-white/20 bg-white/5 font-mono hover:border-white/30 hover:bg-white/10"
                  onClick={handleBack}
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              <Button
                className="ml-auto bg-white font-mono text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canProceed}
                onClick={handleNext}
              >
                {isLastStep ? "See Result" : "Next"}
                {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
