import { api } from "@yugen/backend/convex/_generated/api";
import { useAction } from "convex/react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CustomSelect } from "@/components/ui/custom-select";
import { HyperText } from "@/components/ui/hyper-text";
import { Slider } from "@/components/ui/slider-number-flow";

interface Package {
  id: string;
  name: string;
  price: number;
  conversionRate: number;
}

export function ProductionCalculator() {
  const [mau, setMau] = useState(1000);
  const [devs, setDevs] = useState(1);
  const [devSalary, setDevSalary] = useState(8000);
  // R2 storage is now auto-calculated - no manual state needed
  const [marketingSpend, setMarketingSpend] = useState(0);
  const [churnRate, setChurnRate] = useState(13);

  // User-configurable settings
  const [emailsPerUser, setEmailsPerUser] = useState(5);
  const [blobContentType, setBlobContentType] = useState<
    "Images" | "Videos" | "Documents" | "Mixed"
  >("Images");
  const [blobAvgFileSize, setBlobAvgFileSize] = useState(2); // MB
  const [blobUploadsPerUser, setBlobUploadsPerUser] = useState(10);
  const [costPerAPICall, setCostPerAPICall] = useState(0.01); // In dollars
  const [apiCallsPerUser, setApiCallsPerUser] = useState(10); // Per month

  // Retention months by content type
  const retentionMonths: Record<typeof blobContentType, number> = {
    Images: 12,
    Videos: 6,
    Documents: 24,
    Mixed: 12,
  };

  // Auto-calculated based on MAU and user settings
  const emails = (mau * emailsPerUser) / 1_000_000; // Convert to millions
  // 500 worker requests per MAU per month (realistic for modern apps with API calls, page loads, real-time subscriptions)
  const requests = (mau * 500) / 1_000_000; // Convert to millions (stored in millions scale)

  // Calculate suggested R2 storage
  // Monthly growth = MAU × uploads × avg_size (in MB)
  // Total storage = Monthly growth × retention (convert MB to GB then to TB)
  const monthlyGrowthGB = (mau * blobUploadsPerUser * blobAvgFileSize) / 1000;
  const suggestedR2StorageTB =
    (monthlyGrowthGB * retentionMonths[blobContentType]) / 1000;

  const [packages, setPackages] = useState<Package[]>([
    { id: "1", name: "Free", price: 0, conversionRate: 95 },
    { id: "2", name: "Pro", price: 19, conversionRate: 5 },
  ]);

  const [manualInputMode, setManualInputMode] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Estimation state
  const [ideaDescription, setIdeaDescription] = useState("");
  const [isCheckingFit, setIsCheckingFit] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [hasEstimated, setHasEstimated] = useState(false);
  const [hasCheckedFit, setHasCheckedFit] = useState(false);
  const [fitRecommendation, setFitRecommendation] = useState<
    "yes" | "maybe" | "no" | null
  >(null);
  const [fitReason, setFitReason] = useState<string | null>(null);
  const [fitKeyPoints, setFitKeyPoints] = useState<string[]>([]);
  const [tooltips, setTooltips] = useState<{
    database: string;
    cloudflare: string;
    fileStorage: string;
    sendingEmails: string;
    loggingAndMonitoring: string;
    aiApiCosts: string;
  } | null>(null);
  const [showFullCalculator, setShowFullCalculator] = useState(false);
  const [rateLimitUsage, setRateLimitUsage] = useState(0);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  const estimateCosts = useAction(
    api.costEstimator.estimateInfrastructureCosts
  );
  const validateProductIdea = useAction(api.costEstimator.validateProductIdea);
  const checkBoilerplateFit = useAction(api.costEstimator.checkBoilerplateFit);

  // Resend tiered pricing
  const resendTier = (emailsM: number) => {
    if (emailsM <= 0.05) return 20;
    if (emailsM <= 0.5) return 40;
    if (emailsM <= 1) return 70;
    if (emailsM <= 2) return 100;
    return 100 + Math.ceil((emailsM - 2) / 1) * 70;
  };

  // Sentry tiered pricing (based on estimated errors)
  // Pricing: Developer (Free) - 5k errors, Team ($26/mo) - 50k errors, Business ($80/mo) - 50k+ errors
  const sentryTier = () => {
    // Estimate errors: ~1 error per 1000 requests (0.1% error rate)
    // requests is in millions, so: requests * 1,000,000 * 0.001 = requests * 1000
    const estimatedErrors = requests * 1000;

    if (estimatedErrors < 5000) return 0; // Developer (Free): <5k errors
    if (estimatedErrors < 50_000) return 26; // Team: 5k-50k errors
    return 80; // Business: >=50k errors
  };

  // Calculate Convex costs based on pricing tiers
  // Free & Starter tier limits:
  // - Developers: 1-6 developers (FREE)
  // - Function Calls: 1,000,000/month included
  // - Database Storage: 0.5 GiB included
  // - Database Bandwidth: 1 GiB/month included
  // - Action Compute: 20 GB-hours/month included
  // If usage exceeds free tier limits, must upgrade to Professional ($25/dev/month, first dev free)

  // Function calls: ~150 calls per MAU/month (queries, mutations, subscriptions)
  const functionCallsPerMAU = 150;
  const totalFunctionCalls = mau * functionCallsPerMAU;

  // Action compute: ~0.02 GB-hours per MAU (external API calls, AI features)
  const actionComputePerMAU = 0.02;
  const totalActionCompute = mau * actionComputePerMAU;

  // Database storage: ~5 MB per MAU accumulated (user profiles, todos, messages)
  const storagePerMAU = 0.005; // GB
  const totalStorage = mau * storagePerMAU;

  // Database bandwidth: ~20 MB per MAU/month (reading data for queries)
  const bandwidthPerMAU = 0.02; // GB
  const totalBandwidth = mau * bandwidthPerMAU;

  // Check if usage exceeds free tier limits
  const exceedsFreeTier =
    totalFunctionCalls > 1_000_000 ||
    totalStorage > 0.5 ||
    totalBandwidth > 1 ||
    totalActionCompute > 20 ||
    devs > 6;

  // If exceeds free tier, must upgrade to Professional plan
  // Professional plan: $25/dev/month (first dev free) with higher included limits
  // Professional tier limits:
  // - Function Calls: 25,000,000/month included
  // - Database Storage: 50 GiB included
  // - Database Bandwidth: 50 GiB/month included
  // - Action Compute: 250 GB-hours/month included, then $0.30 per GB-hour

  let convexSeats = 0;
  let convexFunctionCalls = 0;
  let convexActionCompute = 0;
  let convexDBStorage = 0;
  let convexDBBandwidth = 0;

  if (exceedsFreeTier) {
    // Pro plan: $25/dev/month (first dev free)
    convexSeats = Math.max(0, (devs - 1) * 25);

    // Calculate usage costs beyond Pro tier included limits
    const billableFunctionCalls = Math.max(0, totalFunctionCalls - 25_000_000);
    convexFunctionCalls = (billableFunctionCalls / 1_000_000) * 2.2;

    const billableActionCompute = Math.max(0, totalActionCompute - 250);
    convexActionCompute = billableActionCompute * 0.3; // Pro plan: $0.30 per GB-hour after 250 included

    const billableStorage = Math.max(0, totalStorage - 50);
    convexDBStorage = billableStorage * 0.22;

    const billableBandwidth = Math.max(0, totalBandwidth - 50);
    convexDBBandwidth = billableBandwidth * 0.22;
  } else {
    // Stay on free tier - no costs
    convexSeats = 0;
    convexFunctionCalls = 0;
    convexActionCompute = 0;
    convexDBStorage = 0;
    convexDBBandwidth = 0;
  }

  const convex =
    convexSeats +
    convexFunctionCalls +
    convexActionCompute +
    convexDBStorage +
    convexDBBandwidth;

  const totalRequests = requests * 1_000_000; // Convert millions to actual number
  // Cloudflare Workers: $5/month subscription + $0.30 per million requests after 10M free
  const workersSubscription = totalRequests > 10_000_000 ? 5 : 0; // $5/month if over free tier
  const workersRequests = Math.max(0, (totalRequests / 1_000_000 - 10) * 0.3); // $0.30/M requests
  const workers = workersSubscription + workersRequests;

  // Workers Logs: 20M free/month, then $0.60 per million
  // Assuming ~2 logs per request (1 invocation + 1 console.log)
  const totalLogs = totalRequests * 2;
  const billableLogs = Math.max(0, totalLogs - 20_000_000);
  const workerLogs = (billableLogs / 1_000_000) * 0.6;

  // R2 storage is auto-calculated from blob storage settings
  const r2StorageTB = suggestedR2StorageTB;
  const r2 = 0.015 * r2StorageTB * 1000; // $0.015/GB, convert TB to GB

  // AI API costs
  const aiCost = mau * apiCallsPerUser * costPerAPICall;

  const resend = resendTier(emails);
  const sentry = sentryTier();

  // Revenue calculations (with churn adjustment)
  const churnMultiplier = 1 - churnRate / 100;
  const monthlyRevenue = packages.reduce((sum, pkg) => {
    const conversions = (mau * pkg.conversionRate) / 100;
    const activeConversions = conversions * churnMultiplier;
    return sum + activeConversions * pkg.price;
  }, 0);

  // Polar processing fees: 4% + $0.40 per transaction
  const paidTransactions = packages.reduce((sum, pkg) => {
    if (pkg.price > 0) {
      const conversions = (mau * pkg.conversionRate) / 100;
      const activeConversions = conversions * churnMultiplier;
      return sum + activeConversions;
    }
    return sum;
  }, 0);
  const polarFees = monthlyRevenue * 0.04 + paidTransactions * 0.4;

  const developerCosts = devs > 1 ? (devs - 1) * devSalary : 0;

  // Infrastructure costs (excluding payment processing fees)
  const infrastructureCost =
    convex +
    workers +
    workerLogs +
    r2 +
    resend +
    sentry +
    marketingSpend +
    developerCosts +
    aiCost;

  // Total costs including payment processing fees (for profit calculation)
  const totalCostsForProfit = infrastructureCost + polarFees;

  const addPackage = () => {
    setPackages([
      ...packages,
      { id: Date.now().toString(), name: "", price: 0, conversionRate: 0 },
    ]);
  };

  const removePackage = (id: string) => {
    setPackages(packages.filter((pkg) => pkg.id !== id));
  };

  const updatePackage = (
    id: string,
    field: keyof Package,
    value: string | number
  ) => {
    setPackages(
      packages.map((pkg) => (pkg.id === id ? { ...pkg, [field]: value } : pkg))
    );
  };

  const shareAsJSON = async () => {
    const data = {
      settings: {
        mau,
        devs,
        devSalary,
        r2StorageTB: suggestedR2StorageTB,
        emailsPerUser,
        emails,
        requests,
        marketingSpend,
        churnRate,
        blobStorage: {
          contentType: blobContentType,
          avgFileSizeMB: blobAvgFileSize,
          uploadsPerUser: blobUploadsPerUser,
          retentionMonths: retentionMonths[blobContentType],
          suggestedStorageTB: suggestedR2StorageTB,
        },
      },
      packages,
      calculations: {
        monthlyRevenue,
        infrastructureCost,
        polarFees,
        totalCostsForProfit,
        monthlyProfit: monthlyRevenue - totalCostsForProfit,
        profitMargin:
          monthlyRevenue > 0
            ? ((monthlyRevenue - totalCostsForProfit) / monthlyRevenue) * 100
            : 0,
        breakdown: {
          convex,
          workers,
          workerLogs,
          r2,
          resend,
          sentry,
          marketingSpend,
          developerCosts,
        },
      },
    };

    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsCSV = () => {
    const csvRows = [
      ["Metric", "Value"],
      ["Monthly Active Users", mau.toLocaleString()],
      ["Developer Seats", devs],
      ["Developer Salary", `$${devSalary.toLocaleString()}`],
      ["R2 Storage (TB)", suggestedR2StorageTB.toFixed(3)],
      ["Emails Per User/Month", emailsPerUser],
      ["Resend Emails (M)", emails.toFixed(1)],
      ["Worker Requests (M)", requests.toFixed(1)],
      ["Cost per API call", `$${costPerAPICall.toFixed(4)}`],
      ["API calls per user/month", apiCallsPerUser],
      ["Marketing Spend", `$${marketingSpend.toLocaleString()}`],
      ["Churn Rate", `${churnRate.toFixed(1)}%`],
      [""],
      ["BLOB STORAGE SETTINGS"],
      ["Content Type", blobContentType],
      ["Avg File Size (MB)", blobAvgFileSize.toFixed(1)],
      ["Uploads Per User/Month", blobUploadsPerUser],
      ["Retention Months", retentionMonths[blobContentType]],
      ["Suggested R2 Storage (TB)", suggestedR2StorageTB.toFixed(3)],
      [""],
      ["PACKAGES"],
      ...packages.map((pkg) => [
        `${pkg.name}`,
        `$${pkg.price}/mo, ${pkg.conversionRate}% conversion`,
      ]),
      [""],
      ["FINANCIAL SUMMARY"],
      ["Monthly Revenue", `$${monthlyRevenue.toLocaleString()}`],
      ["Infrastructure Costs", `$${infrastructureCost.toFixed(2)}`],
      ["Polar Fees", `$${polarFees.toFixed(2)}`],
      ["Total Costs", `$${totalCostsForProfit.toFixed(2)}`],
      [
        "Monthly Profit",
        `$${(monthlyRevenue - totalCostsForProfit).toLocaleString()}`,
      ],
      [
        "Profit Margin",
        monthlyRevenue > 0
          ? `${(((monthlyRevenue - totalCostsForProfit) / monthlyRevenue) * 100).toFixed(2)}%`
          : "0%",
      ],
      [""],
      ["COST BREAKDOWN"],
      ["Convex", `$${convex.toFixed(2)}`],
      ["Cloudflare Workers", `$${workers.toFixed(2)}`],
      ["Workers Logs", `$${workerLogs.toFixed(2)}`],
      ["R2 Storage", `$${r2.toFixed(2)}`],
      ["Resend", `$${resend.toFixed(2)}`],
      ["Sentry", `$${sentry.toFixed(2)}`],
      ["Marketing Spend", `$${marketingSpend.toFixed(2)}`],
      ["Developer Costs", `$${developerCosts.toFixed(2)}`],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cost-calculation-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleManualInput = (
    value: string,
    setter: (v: number) => void,
    min: number,
    max: number
  ) => {
    const num = Number.parseFloat(value);
    if (!Number.isNaN(num)) {
      const clamped = Math.max(min, Math.min(max, num));
      setter(clamped);
    }
  };

  const handleCheckFit = async () => {
    const trimmed = ideaDescription.trim();

    if (!trimmed) {
      toast.error("Please describe your product idea first");
      return;
    }

    setIsCheckingFit(true);

    // Validate product idea using AI
    try {
      const validation = await validateProductIdea({
        ideaDescription: trimmed,
      });

      if (!validation.isValid) {
        toast.error(
          validation.reason || "Please provide a valid product idea description"
        );
        setIsCheckingFit(false);
        return;
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Failed to validate product idea. Please try again.");
      setIsCheckingFit(false);
      return;
    }

    try {
      const result = await checkBoilerplateFit({
        ideaDescription: trimmed,
      });

      setFitRecommendation(result.recommendation);
      setFitReason(result.reason);
      setFitKeyPoints(result.keyPoints);
      setHasCheckedFit(true);

      // Scroll to fit results section after a short delay to ensure DOM is updated
      setTimeout(() => {
        const fitResults = document.querySelector("#fit-results");
        if (fitResults) {
          const elementRect = fitResults.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const viewportHeight = window.innerHeight;
          const elementHeight = elementRect.height;
          const scrollPosition =
            absoluteElementTop - viewportHeight / 2 + elementHeight / 2;
          window.scrollTo({ top: scrollPosition, behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("Fit check error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to check boilerplate fit. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsCheckingFit(false);
    }
  };

  const handleAIEstimate = async () => {
    const trimmed = ideaDescription.trim();

    if (!trimmed) {
      toast.error("Please describe your product idea first");
      return;
    }

    setIsEstimating(true);
    setConfidenceScore(null);

    // Validate product idea using AI
    try {
      const validation = await validateProductIdea({
        ideaDescription: trimmed,
      });

      if (!validation.isValid) {
        toast.error(
          validation.reason || "Please provide a valid product idea description"
        );
        setIsEstimating(false);
        return;
      }
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Failed to validate product idea. Please try again.");
      setIsEstimating(false);
      return;
    }

    try {
      const result = await estimateCosts({
        ideaDescription: ideaDescription.trim(),
        mau,
        currentValues: {
          devs,
          devSalary,
          marketingSpend,
          churnRate,
          emailsPerUser,
          blobContentType,
          blobAvgFileSize,
          blobUploadsPerUser,
          costPerAPICall,
          apiCallsPerUser,
        },
      });

      // Update all calculator state with AI estimates
      setDevs(result.devs);
      setDevSalary(result.devSalary);
      setMarketingSpend(result.marketingSpend);
      setChurnRate(result.churnRate);
      setEmailsPerUser(result.emailsPerUser);
      setBlobContentType(result.blobContentType);
      setBlobAvgFileSize(result.blobAvgFileSize);
      setBlobUploadsPerUser(result.blobUploadsPerUser);
      setCostPerAPICall(result.costPerAPICall);
      setApiCallsPerUser(result.apiCallsPerUser);

      // Update packages
      setPackages(
        result.packages.map(
          (
            pkg: { name: string; price: number; conversionRate: number },
            index: number
          ) => ({
            id: (index + 1).toString(),
            name: pkg.name,
            price: pkg.price,
            conversionRate: pkg.conversionRate,
          })
        )
      );

      setConfidenceScore(result.confidenceScore);
      setTooltips(result.tooltips);
      setHasEstimated(true);

      // Track rate limit usage (client-side, resets hourly)
      const hourKey = `rateLimit_${Math.floor(Date.now() / (60 * 60 * 1000))}`;
      const stored = localStorage.getItem(hourKey);
      const currentCount = stored ? Number.parseInt(stored, 10) + 1 : 1;
      localStorage.setItem(hourKey, currentCount.toString());
      setRateLimitUsage(currentCount);

      // Scroll to cost breakdown section after a short delay to ensure DOM is updated
      setTimeout(() => {
        const costBreakdown = document.querySelector("#cost-breakdown");
        if (costBreakdown) {
          const elementRect = costBreakdown.getBoundingClientRect();
          const absoluteElementTop = elementRect.top + window.pageYOffset;
          const viewportHeight = window.innerHeight;
          const elementHeight = elementRect.height;
          const scrollPosition =
            absoluteElementTop - viewportHeight / 2 + elementHeight / 2;
          window.scrollTo({ top: scrollPosition, behavior: "smooth" });
        }
      }, 100);
    } catch (error) {
      console.error("AI estimation error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "AI estimation failed. Please try again or configure manually.";
      toast.error(errorMessage);
    } finally {
      setIsEstimating(false);
    }
  };

  // Load rate limit usage on mount
  useEffect(() => {
    const hourKey = `rateLimit_${Math.floor(Date.now() / (60 * 60 * 1000))}`;
    const stored = localStorage.getItem(hourKey);
    if (stored) {
      setRateLimitUsage(Number.parseInt(stored, 10));
    }
  }, []);

  // Close tooltips when clicking/touching outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking/touching on an Info icon, tooltip content, or the clickable wrapper
      if (
        target.closest("svg") || // Info icon
        target.closest('[class*="z-50"]') || // Tooltip content
        target.closest('[class*="z-10"]') // Clickable wrapper
      ) {
        return;
      }
      setOpenTooltip(null);
    };

    if (openTooltip) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("touchend", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("touchend", handleClickOutside);
      };
    }
  }, [openTooltip]);

  const getConfidenceBadgeColor = (score: number) => {
    if (score >= 80)
      return "bg-green-500/20 border-green-500/30 text-green-400";
    if (score >= 50)
      return "bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
    return "bg-red-500/20 border-red-500/30 text-red-400";
  };

  const handleReset = () => {
    // Reset all state
    setIdeaDescription("");
    setHasCheckedFit(false);
    setHasEstimated(false);
    setFitRecommendation(null);
    setFitReason(null);
    setFitKeyPoints([]);
    setConfidenceScore(null);
    setTooltips(null);
    setShowFullCalculator(false);
    // Reset calculator values to defaults
    setMau(1000);
    setDevs(1);
    setDevSalary(8000);
    setMarketingSpend(0);
    setChurnRate(13);
    setEmailsPerUser(5);
    setBlobContentType("Images");
    setBlobAvgFileSize(2);
    setBlobUploadsPerUser(10);
    setCostPerAPICall(0.01);
    setApiCallsPerUser(10);
    setPackages([
      { id: "1", name: "Free", price: 0, conversionRate: 95 },
      { id: "2", name: "Pro", price: 19, conversionRate: 5 },
    ]);
    setShowResetDialog(false);
  };

  return (
    <section className="bg-black py-12 sm:py-24" id="calculator">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto mb-8 max-w-3xl space-y-4 text-center sm:mb-12">
          <HyperText
            as="h2"
            className="px-4 font-bold font-mono text-2xl text-white sm:px-0 sm:text-3xl md:text-4xl"
            duration={1000}
            startOnView
          >
            Should you use this boilerplate?
          </HyperText>
          <p className="px-4 font-mono text-sm text-white/60 sm:px-0 sm:text-base lg:text-lg">
            You shouldn't feel pressured or misled into using the wrong Stack.
            Find out if this one is a good fit for your idea.
          </p>
        </div>

        <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
          {/* AI Estimation Input */}
          <div className="border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <div className="mb-3 flex items-start gap-3">
              <Sparkles className="mt-1 h-5 w-5 flex-shrink-0 text-purple-400" />
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <label className="font-medium font-mono text-sm text-white/80 sm:text-base">
                    Describe Your Product Idea
                  </label>
                  {rateLimitUsage > 0 && (
                    <span className="font-mono text-white/40 text-xs">
                      {rateLimitUsage}/5 estimates this hour
                    </span>
                  )}
                </div>
                <textarea
                  className="min-h-[100px] w-full resize-y rounded border border-white/20 bg-white/5 px-3 py-2 font-mono text-sm text-white focus:border-purple-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isCheckingFit || isEstimating}
                  maxLength={5000}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      if (hasCheckedFit) {
                        handleAIEstimate();
                      } else {
                        handleCheckFit();
                      }
                    }
                  }}
                  placeholder="e.g., A social media app for photographers with image uploads, comments, and direct messaging"
                  value={ideaDescription}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-mono text-white/40 text-xs">
                    {ideaDescription.length}/5000 characters
                  </span>
                  {confidenceScore !== null && (
                    <div
                      className={`rounded border px-2 py-1 font-mono text-xs ${getConfidenceBadgeColor(confidenceScore)}`}
                      title="How confident the AI is in these estimates based on your description"
                    >
                      Confidence: {confidenceScore}%
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasCheckedFit ? (
                <button
                  className="flex items-center justify-center gap-2 rounded border border-white/20 bg-white/5 px-4 py-2 font-mono font-semibold text-sm text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isCheckingFit || isEstimating}
                  onClick={() => setShowResetDialog(true)}
                  type="button"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              ) : (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded bg-purple-500 px-4 py-2 font-mono font-semibold text-sm text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:bg-purple-500/50 sm:w-auto"
                  disabled={isCheckingFit || !ideaDescription.trim()}
                  onClick={handleCheckFit}
                  type="button"
                >
                  {isCheckingFit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking fit...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Check if this Boilerplate fits
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Fit Check Results */}
          {hasCheckedFit && fitRecommendation && (
            <div
              className={`border p-4 backdrop-blur-xl sm:p-6 ${
                fitRecommendation === "yes"
                  ? "border-green-500/30 bg-green-500/5"
                  : fitRecommendation === "maybe"
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-red-500/30 bg-red-500/5"
              }`}
              id="fit-results"
            >
              <div className="mb-4 flex items-start gap-4">
                {fitRecommendation === "yes" && (
                  <CheckCircle2 className="mt-1 h-8 w-8 flex-shrink-0 text-green-400" />
                )}
                {fitRecommendation === "maybe" && (
                  <AlertCircle className="mt-1 h-8 w-8 flex-shrink-0 text-yellow-400" />
                )}
                {fitRecommendation === "no" && (
                  <XCircle className="mt-1 h-8 w-8 flex-shrink-0 text-red-400" />
                )}
                <div className="flex-1">
                  <h3 className="mb-2 font-mono font-semibold text-white text-xl sm:text-2xl">
                    {fitRecommendation === "yes" &&
                      "Yes, this boilerplate is a great fit!"}
                    {fitRecommendation === "maybe" &&
                      "Maybe — depends on your needs"}
                    {fitRecommendation === "no" && "Probably not the best fit"}
                  </h3>
                  <p className="font-mono text-sm text-white/60 leading-relaxed sm:text-base">
                    {fitReason}
                  </p>
                </div>
              </div>
              {fitKeyPoints.length > 0 && fitRecommendation !== "no" && (
                <div className="space-y-2 border-white/10 border-t pt-4">
                  <ul className="space-y-2 font-mono text-sm text-white/60">
                    {fitKeyPoints.map((point, idx) => (
                      <li className="flex items-start gap-2" key={idx}>
                        <span
                          className={`mt-1 ${
                            fitRecommendation === "yes"
                              ? "text-green-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {fitRecommendation === "yes" ? "✓" : "•"}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {fitRecommendation === "yes" && !hasEstimated && (
                <div className="mt-6 border-white/10 border-t pt-4">
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded bg-purple-500 px-4 py-2 font-mono font-semibold text-sm text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:bg-purple-500/50"
                    disabled={isEstimating || !ideaDescription.trim()}
                    onClick={handleAIEstimate}
                    type="button"
                  >
                    {isEstimating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating estimates...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        See how much it costs to run
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Estimation Results - Cost Breakdown */}
          {hasEstimated && confidenceScore !== null && (
            <div
              className="border border-purple-500/30 bg-purple-500/5 p-4 backdrop-blur-xl sm:p-6"
              id="cost-breakdown"
            >
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 flex-shrink-0 text-purple-400" />
                  <h3 className="font-medium font-mono text-sm text-white/80 sm:text-base">
                    Estimated Infrastructure Costs
                  </h3>
                </div>
                <span className="font-mono text-white/60 text-xs">
                  For {mau.toLocaleString()} MAUs
                </span>
              </div>

              {/* MAU Slider */}
              <div className="mb-6 pb-6">
                <label className="mb-2 block font-medium font-mono text-sm text-white/80">
                  Monthly Active Users
                </label>
                <div className="flex items-center gap-4">
                  <Slider
                    className="flex-1"
                    max={10_000}
                    min={0}
                    onValueChange={(v) => setMau(v[0])}
                    step={1}
                    value={[mau]}
                  />
                  <span className="min-w-[60px] text-right font-mono text-blue-400 text-sm">
                    {mau >= 1000
                      ? `${(mau / 1000).toFixed(1)}K`
                      : mau.toLocaleString()}
                  </span>
                </div>
                <div className="mt-6 border-white/20 border-t pt-6" />
              </div>
              <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 sm:text-sm">
                <div className="flex items-center justify-between font-mono text-white/80">
                  <div className="flex items-center gap-1.5">
                    <span>Database</span>
                    <div
                      className="z-10 -m-2 touch-manipulation select-none p-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "database" ? null : "database"
                        );
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "database" ? null : "database"
                        );
                      }}
                    >
                      <div className="group relative">
                        <Info className="h-3.5 w-3.5 cursor-help text-white/40 transition-colors hover:text-white/60" />
                        <div
                          className={`absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded border border-white/20 bg-black px-3 py-2 font-mono text-white/80 text-xs transition-all duration-200 sm:w-64 ${
                            openTooltip === "database"
                              ? "pointer-events-auto visible opacity-100"
                              : "pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100"
                          }`}
                        >
                          {tooltips?.database ||
                            "Stores your app's data, user accounts, and handles real-time updates"}
                          <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-white/20 border-r border-b bg-black" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-blue-400">${convex.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-white/80">
                  <div className="flex items-center gap-1.5">
                    <span>Cloudflare</span>
                    <div
                      className="z-10 -m-2 touch-manipulation select-none p-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "cloudflare" ? null : "cloudflare"
                        );
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "cloudflare" ? null : "cloudflare"
                        );
                      }}
                    >
                      <div className="group relative">
                        <Info className="h-3.5 w-3.5 cursor-help text-white/40 transition-colors hover:text-white/60" />
                        <div
                          className={`absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded border border-white/20 bg-black px-3 py-2 font-mono text-white/80 text-xs transition-all duration-200 sm:w-64 ${
                            openTooltip === "cloudflare"
                              ? "pointer-events-auto visible opacity-100"
                              : "pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100"
                          }`}
                        >
                          {tooltips?.cloudflare ||
                            "Hosts your app's API routes and serves your web pages globally"}
                          <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-white/20 border-r border-b bg-black" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-orange-400">
                    ${(workers + workerLogs).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between font-mono text-white/80">
                  <div className="flex items-center gap-1.5">
                    <span>File Storage</span>
                    <div
                      className="z-10 -m-2 touch-manipulation select-none p-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "fileStorage" ? null : "fileStorage"
                        );
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "fileStorage" ? null : "fileStorage"
                        );
                      }}
                    >
                      <div className="group relative">
                        <Info className="h-3.5 w-3.5 cursor-help text-white/40 transition-colors hover:text-white/60" />
                        <div
                          className={`absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded border border-white/20 bg-black px-3 py-2 font-mono text-white/80 text-xs transition-all duration-200 sm:w-64 ${
                            openTooltip === "fileStorage"
                              ? "pointer-events-auto visible opacity-100"
                              : "pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100"
                          }`}
                        >
                          {tooltips?.fileStorage ||
                            "Stores user-uploaded files like images, videos, and documents"}
                          <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-white/20 border-r border-b bg-black" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-purple-400">${r2.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-white/80">
                  <div className="flex items-center gap-1.5">
                    <span>Sending Emails</span>
                    <div
                      className="z-10 -m-2 touch-manipulation select-none p-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "sendingEmails"
                            ? null
                            : "sendingEmails"
                        );
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "sendingEmails"
                            ? null
                            : "sendingEmails"
                        );
                      }}
                    >
                      <div className="group relative">
                        <Info className="h-3.5 w-3.5 cursor-help text-white/40 transition-colors hover:text-white/60" />
                        <div
                          className={`absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded border border-white/20 bg-black px-3 py-2 font-mono text-white/80 text-xs transition-all duration-200 sm:w-64 ${
                            openTooltip === "sendingEmails"
                              ? "pointer-events-auto visible opacity-100"
                              : "pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100"
                          }`}
                        >
                          {tooltips?.sendingEmails ||
                            "Transactional emails like welcome messages, password resets, and notifications"}
                          <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-white/20 border-r border-b bg-black" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-green-400">${resend.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-white/80">
                  <div className="flex items-center gap-1.5">
                    <span>Logging and Monitoring</span>
                    <div
                      className="z-10 -m-2 touch-manipulation select-none p-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "loggingAndMonitoring"
                            ? null
                            : "loggingAndMonitoring"
                        );
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "loggingAndMonitoring"
                            ? null
                            : "loggingAndMonitoring"
                        );
                      }}
                    >
                      <div className="group relative">
                        <Info className="h-3.5 w-3.5 cursor-help text-white/40 transition-colors hover:text-white/60" />
                        <div
                          className={`absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded border border-white/20 bg-black px-3 py-2 font-mono text-white/80 text-xs transition-all duration-200 sm:w-64 ${
                            openTooltip === "loggingAndMonitoring"
                              ? "pointer-events-auto visible opacity-100"
                              : "pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100"
                          }`}
                        >
                          {tooltips?.loggingAndMonitoring ||
                            "Tracks errors and performance issues to help you debug and improve your app"}
                          <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-white/20 border-r border-b bg-black" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-yellow-400">${sentry.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between font-mono text-white/80">
                  <div className="flex items-center gap-1.5">
                    <span>AI API Costs</span>
                    <div
                      className="z-10 -m-2 touch-manipulation select-none p-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "aiApiCosts" ? null : "aiApiCosts"
                        );
                      }}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenTooltip(
                          openTooltip === "aiApiCosts" ? null : "aiApiCosts"
                        );
                      }}
                    >
                      <div className="group relative">
                        <Info className="h-3.5 w-3.5 cursor-help text-white/40 transition-colors hover:text-white/60" />
                        <div
                          className={`absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded border border-white/20 bg-black px-3 py-2 font-mono text-white/80 text-xs transition-all duration-200 sm:w-64 ${
                            openTooltip === "aiApiCosts"
                              ? "pointer-events-auto visible opacity-100"
                              : "pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100"
                          }`}
                        >
                          {tooltips?.aiApiCosts ||
                            "Costs for AI features like chat, content generation, or image analysis"}
                          <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-white/20 border-r border-b bg-black" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-blue-400">${aiCost.toFixed(2)}</span>
                </div>
                {marketingSpend > 0 && (
                  <div className="flex items-center justify-between font-mono text-white/80">
                    <div className="flex items-center gap-1.5">
                      <span>Marketing</span>
                      <div
                        className="z-10 -m-1 p-1"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenTooltip(
                            openTooltip === "marketing" ? null : "marketing"
                          );
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenTooltip(
                            openTooltip === "marketing" ? null : "marketing"
                          );
                        }}
                      >
                        <div className="group relative">
                          <Info className="h-3.5 w-3.5 cursor-help text-white/40 transition-colors hover:text-white/60" />
                          <div
                            className={`absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded border border-white/20 bg-black px-3 py-2 font-mono text-white/80 text-xs transition-all duration-200 sm:w-64 ${
                              openTooltip === "marketing"
                                ? "pointer-events-auto visible opacity-100"
                                : "pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100"
                            }`}
                          >
                            Monthly marketing budget for ads, content, and user
                            acquisition
                            <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-white/20 border-r border-b bg-black" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-yellow-400">
                      ${marketingSpend.toFixed(2)}
                    </span>
                  </div>
                )}
                {devs > 1 && (
                  <div className="flex items-center justify-between font-mono text-white/80">
                    <div className="flex items-center gap-1.5">
                      <span>Developer Costs</span>
                      <div
                        className="z-10 -m-1 p-1"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenTooltip(
                            openTooltip === "developerCosts"
                              ? null
                              : "developerCosts"
                          );
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenTooltip(
                            openTooltip === "developerCosts"
                              ? null
                              : "developerCosts"
                          );
                        }}
                      >
                        <div className="group relative">
                          <Info className="h-3.5 w-3.5 cursor-help text-white/40 transition-colors hover:text-white/60" />
                          <div
                            className={`absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded border border-white/20 bg-black px-3 py-2 font-mono text-white/80 text-xs transition-all duration-200 sm:w-64 ${
                              openTooltip === "developerCosts"
                                ? "pointer-events-auto visible opacity-100"
                                : "pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100"
                            }`}
                          >
                            Monthly salary costs for additional developers
                            beyond the first
                            <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-white/20 border-r border-b bg-black" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-cyan-400">
                      ${developerCosts.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-col gap-2 border-white/20 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-mono text-white/60 text-xs">
                  Total Infrastructure Cost
                </span>
                <span className="font-bold font-mono text-base text-white sm:text-lg">
                  ${infrastructureCost.toFixed(2)}/mo
                </span>
              </div>

              {/* Packages, Revenue, Profit */}
              <div className="mt-6 space-y-4 border-white/20 border-t pt-6">
                {/* Packages */}
                <div>
                  <h4 className="mb-3 font-medium font-mono text-sm text-white/80">
                    Packages
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {packages.map((pkg) => (
                      <div
                        className="min-w-0 rounded border border-white/10 bg-white/5 p-3"
                        key={pkg.id}
                      >
                        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <input
                            className="min-w-0 flex-1 rounded border border-white/20 bg-white/5 px-2 py-1 font-medium font-mono text-sm text-white focus:border-purple-400 focus:outline-none"
                            onChange={(e) =>
                              updatePackage(pkg.id, "name", e.target.value)
                            }
                            placeholder="Package name"
                            type="text"
                            value={pkg.name}
                          />
                          <div className="flex flex-shrink-0 items-center gap-1">
                            <span className="whitespace-nowrap font-mono text-sm text-white/60">
                              $
                            </span>
                            <input
                              className="w-16 rounded border border-white/20 bg-white/5 px-2 py-1 font-mono text-green-400 text-sm focus:border-purple-400 focus:outline-none sm:w-20"
                              min={0}
                              onChange={(e) =>
                                updatePackage(
                                  pkg.id,
                                  "price",
                                  Number.parseFloat(e.target.value) || 0
                                )
                              }
                              step={0.01}
                              type="number"
                              value={pkg.price}
                            />
                            <span className="whitespace-nowrap font-mono text-white/60 text-xs">
                              /mo
                            </span>
                          </div>
                        </div>
                        <div className="break-words font-mono text-white/60 text-xs">
                          {pkg.conversionRate}% conversion
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue & Profit */}
                <div className="grid grid-cols-1 gap-3 border-white/10 border-t pt-4 sm:grid-cols-3 sm:gap-4">
                  <div>
                    <div className="mb-1 font-mono text-white/60 text-xs">
                      Monthly Revenue
                    </div>
                    <div className="break-words font-bold font-mono text-base text-green-400 sm:text-lg">
                      ${monthlyRevenue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-white/60 text-xs">
                      Total Costs (inc. Polar Fees)
                    </div>
                    <div className="break-words font-bold font-mono text-base text-red-400 sm:text-lg">
                      ${totalCostsForProfit.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 font-mono text-white/60 text-xs">
                      Monthly Profit
                    </div>
                    <div
                      className={`break-words font-bold font-mono text-base sm:text-lg ${(monthlyRevenue - totalCostsForProfit) >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      ${(monthlyRevenue - totalCostsForProfit).toFixed(2)}
                    </div>
                    <div className="mt-1 font-mono text-white/40 text-xs">
                      {monthlyRevenue > 0
                        ? `${(((monthlyRevenue - totalCostsForProfit) / monthlyRevenue) * 100).toFixed(1)}% margin`
                        : "0% margin"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggle to show/hide full calculator */}
              <div className="mt-6 border-white/20 border-t pt-6">
                <button
                  className="flex w-full items-center justify-center gap-2 font-mono text-white/60 text-xs transition-colors hover:text-white/80"
                  onClick={() => setShowFullCalculator(!showFullCalculator)}
                  type="button"
                >
                  {showFullCalculator ? "Hide" : "Show"} Full Calculator
                  <span
                    className={`transform transition-transform ${showFullCalculator ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Full Calculator - Conditionally Rendered */}
          {showFullCalculator && (
            <>
              {/* Total Cost Display */}
              <div className="border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl sm:p-8">
                <div className="mb-4 flex items-center justify-center gap-3">
                  <span className="font-mono text-white/60 text-xs">
                    Slider Mode
                  </span>
                  <button
                    aria-checked={manualInputMode}
                    aria-label="Toggle manual input mode"
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      manualInputMode ? "bg-green-500" : "bg-white/20"
                    }`}
                    onClick={() => setManualInputMode(!manualInputMode)}
                    role="switch"
                    type="button"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        manualInputMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="font-mono text-white/60 text-xs">
                    Manual Input
                  </span>
                </div>
                <div className="mb-2 font-mono text-white/60 text-xs sm:text-sm">
                  MONTHLY COST
                </div>
                <div className="mb-2 font-bold font-mono text-4xl text-white sm:text-5xl md:text-6xl">
                  ${infrastructureCost.toFixed(2)}
                </div>
                <div className="font-mono text-white/40 text-xs sm:text-sm">
                  ${(infrastructureCost / mau).toFixed(6)}/MAU
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4 sm:space-y-6">
                {/* MAU */}
                <div className="border border-white/10 bg-white/5 p-4 px-4 pb-10 backdrop-blur-xl sm:p-6 sm:px-8 sm:pb-12">
                  <div className="mb-3 flex justify-between">
                    <label className="font-medium font-mono text-sm text-white/80 sm:text-base">
                      Monthly Active Users
                    </label>
                    {manualInputMode ? (
                      <input
                        className="w-24 rounded border border-white/20 bg-white/5 px-2 py-1 font-mono text-blue-400 text-sm focus:border-blue-400 focus:outline-none"
                        max={1_000_000}
                        min={1}
                        onChange={(e) =>
                          handleManualInput(
                            e.target.value,
                            setMau,
                            1,
                            1_000_000
                          )
                        }
                        type="number"
                        value={mau}
                      />
                    ) : (
                      <span className="font-mono text-blue-400 text-sm sm:text-base">
                        {mau >= 1_000_000
                          ? `${(mau / 1_000_000).toFixed(1)}M`
                          : mau >= 1000
                            ? `${(mau / 1000).toFixed(1)}K`
                            : mau}
                      </span>
                    )}
                  </div>
                  {!manualInputMode && (
                    <Slider
                      max={1_000_000}
                      min={1}
                      onValueChange={(v) => setMau(v[0])}
                      step={1}
                      value={[mau]}
                    />
                  )}
                </div>

                {/* Devs and Salary */}
                <div
                  className={`grid gap-4 ${devs > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
                >
                  <div className="border border-white/10 bg-white/5 p-4 px-4 pb-10 backdrop-blur-xl sm:p-6 sm:px-8 sm:pb-12">
                    <div className="mb-3 flex justify-between">
                      <label className="font-medium font-mono text-sm text-white/80 sm:text-base">
                        Developer Seats
                      </label>
                      {manualInputMode ? (
                        <input
                          className="w-24 rounded border border-white/20 bg-white/5 px-2 py-1 font-mono text-cyan-400 text-sm focus:border-cyan-400 focus:outline-none"
                          max={20}
                          min={1}
                          onChange={(e) =>
                            handleManualInput(e.target.value, setDevs, 1, 20)
                          }
                          type="number"
                          value={devs}
                        />
                      ) : (
                        <span className="font-mono text-cyan-400 text-sm sm:text-base">
                          {devs}
                        </span>
                      )}
                    </div>
                    {!manualInputMode && (
                      <Slider
                        max={20}
                        min={1}
                        onValueChange={(v) => setDevs(v[0])}
                        step={1}
                        value={[devs]}
                      />
                    )}
                  </div>

                  {devs > 1 && (
                    <div className="border border-white/10 bg-white/5 p-4 px-4 pb-10 backdrop-blur-xl sm:p-6 sm:px-8 sm:pb-12">
                      <div className="mb-3 flex justify-between">
                        <label className="font-medium font-mono text-sm text-white/80 sm:text-base">
                          Developer Salary (monthly)
                        </label>
                        {manualInputMode ? (
                          <input
                            className="w-32 rounded border border-white/20 bg-white/5 px-2 py-1 font-mono text-cyan-400 text-sm focus:border-cyan-400 focus:outline-none"
                            max={20_000}
                            min={0}
                            onChange={(e) =>
                              handleManualInput(
                                e.target.value,
                                setDevSalary,
                                0,
                                20_000
                              )
                            }
                            type="number"
                            value={devSalary}
                          />
                        ) : (
                          <span className="font-mono text-cyan-400 text-sm sm:text-base">
                            $
                            {devSalary >= 1000
                              ? `${(devSalary / 1000).toFixed(1)}K`
                              : devSalary}
                          </span>
                        )}
                      </div>
                      {!manualInputMode && (
                        <Slider
                          max={20_000}
                          min={0}
                          onValueChange={(v) => setDevSalary(v[0])}
                          step={500}
                          value={[devSalary]}
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Storage */}
                <div className="border border-white/10 bg-white/5 p-4 px-4 pb-10 backdrop-blur-xl sm:p-6 sm:px-8 sm:pb-12">
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="mb-1 block font-mono text-white/80 text-xs">
                        Primary content type
                      </label>
                      <CustomSelect
                        onChange={(type) => {
                          const newType = type as typeof blobContentType;
                          setBlobContentType(newType);
                          // Update defaults when type changes
                          if (newType === "Images") {
                            setBlobAvgFileSize(2);
                            setBlobUploadsPerUser(10);
                          } else if (newType === "Videos") {
                            setBlobAvgFileSize(50);
                            setBlobUploadsPerUser(1);
                          } else if (newType === "Documents") {
                            setBlobAvgFileSize(1);
                            setBlobUploadsPerUser(5);
                          } else {
                            setBlobAvgFileSize(10);
                            setBlobUploadsPerUser(5);
                          }
                        }}
                        options={[
                          { value: "Images", label: "Images" },
                          { value: "Videos", label: "Videos" },
                          { value: "Documents", label: "Documents" },
                          { value: "Mixed", label: "Mixed" },
                        ]}
                        value={blobContentType}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block font-mono text-white/80 text-xs">
                          Avg file size (MB)
                        </label>
                        <input
                          className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 font-mono text-sm text-white focus:border-white/40 focus:outline-none"
                          min={0.1}
                          onChange={(e) => {
                            const val = Number.parseFloat(e.target.value);
                            if (!Number.isNaN(val) && val > 0) {
                              setBlobAvgFileSize(val);
                            }
                          }}
                          step={0.1}
                          type="number"
                          value={blobAvgFileSize}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block font-mono text-white/80 text-xs">
                          Uploads per user/month
                        </label>
                        <input
                          className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 font-mono text-sm text-white focus:border-white/40 focus:outline-none"
                          min={0}
                          onChange={(e) => {
                            const val = Number.parseFloat(e.target.value);
                            if (!Number.isNaN(val) && val >= 0) {
                              setBlobUploadsPerUser(val);
                            }
                          }}
                          step={0.1}
                          type="number"
                          value={blobUploadsPerUser}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="font-medium font-mono text-sm text-white/80 sm:text-base">
                        R2 Storage
                      </label>
                      <span className="font-mono text-white/40 text-xs">
                        (auto-calculated)
                      </span>
                      <div
                        className="z-10 -m-1 p-1"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenTooltip(
                            openTooltip === "r2Storage" ? null : "r2Storage"
                          );
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenTooltip(
                            openTooltip === "r2Storage" ? null : "r2Storage"
                          );
                        }}
                      >
                        <div className="group relative">
                          <Info className="h-4 w-4 flex-shrink-0 cursor-help text-white/40 transition-colors hover:text-white/60" />
                          <div
                            className={`absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded border border-white/20 bg-black px-3 py-2 font-mono text-white/80 text-xs transition-all duration-200 sm:w-64 ${
                              openTooltip === "r2Storage"
                                ? "pointer-events-auto visible opacity-100"
                                : "pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100"
                            }`}
                          >
                            Cloudflare R2 object storage for storing images,
                            videos, documents, and other large files
                            <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-white/20 border-r border-b bg-black" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="flex-shrink-0 font-mono text-purple-400 text-sm sm:text-base">
                      {suggestedR2StorageTB < 0.001
                        ? `${(suggestedR2StorageTB * 1000).toFixed(1)} GB`
                        : `${suggestedR2StorageTB.toFixed(2)} TB`}
                    </span>
                  </div>
                  <div className="pointer-events-none opacity-50">
                    <Slider
                      disabled
                      displayValue={(n) => n * 1000} // Disabled - auto-calculated
                      max={500}
                      min={0}
                      onValueChange={() => {}}
                      step={0.1}
                      suffix="GB"
                      value={[suggestedR2StorageTB]}
                    />
                  </div>
                </div>

                {/* Emails */}
                <div className="border border-white/10 bg-white/5 p-4 px-4 pb-10 backdrop-blur-xl sm:p-6 sm:px-8 sm:pb-12">
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="mb-1 block font-mono text-white/80 text-xs">
                        Emails per user/month
                      </label>
                      <input
                        className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 font-mono text-sm text-white focus:border-white/40 focus:outline-none"
                        min={0}
                        onChange={(e) => {
                          const val = Number.parseFloat(e.target.value);
                          if (!Number.isNaN(val) && val >= 0) {
                            setEmailsPerUser(val);
                          }
                        }}
                        type="number"
                        value={emailsPerUser}
                      />
                      <div className="mt-1 font-mono text-white/40 text-xs">
                        {emailsPerUser} × {mau.toLocaleString()} MAU ={" "}
                        {(emailsPerUser * mau).toLocaleString()} emails/month
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="font-medium font-mono text-sm text-white/80 sm:text-base">
                        Resend Emails
                      </label>
                      <span className="font-mono text-white/40 text-xs">
                        (auto-calculated)
                      </span>
                    </div>
                    <span className="flex-shrink-0 font-mono text-green-400 text-sm sm:text-base">
                      {emails.toFixed(1)}M
                    </span>
                  </div>
                  <div className="pointer-events-none opacity-50">
                    <Slider
                      disabled
                      displayValue={(n) => n * 1_000_000} // Disabled - auto-calculated
                      max={10}
                      min={0}
                      onValueChange={() => {}}
                      step={0.1}
                      value={[emails]}
                    />
                  </div>
                </div>

                {/* Requests */}
                <div className="border border-white/10 bg-white/5 p-4 px-4 pb-10 backdrop-blur-xl sm:p-6 sm:px-8 sm:pb-12">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="font-medium font-mono text-sm text-white/80 sm:text-base">
                        Worker Requests
                      </label>
                      <span className="font-mono text-white/40 text-xs">
                        (auto-calculated)
                      </span>
                    </div>
                    <span className="flex-shrink-0 font-mono text-orange-400 text-sm sm:text-base">
                      {requests < 0.001
                        ? `${(requests * 1000).toFixed(0)}K`
                        : requests < 1000
                          ? `${requests.toFixed(1)}M`
                          : `${(requests / 1000).toFixed(1)}B`}
                    </span>
                  </div>
                  <div className="pointer-events-none opacity-50">
                    <Slider
                      disabled
                      displayValue={(n) => n * 1_000_000} // Disabled - auto-calculated
                      max={2000}
                      min={0}
                      onValueChange={() => {}}
                      step={1}
                      value={[requests]}
                    />
                  </div>
                </div>

                {/* AI Model API Costs */}
                <div className="border border-white/10 bg-white/5 p-4 px-4 pb-10 backdrop-blur-xl sm:p-6 sm:px-8 sm:pb-12">
                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="mb-1 block font-mono text-white/80 text-xs">
                        Cost per API call
                      </label>
                      <div className="relative">
                        <span className="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-white/60">
                          $
                        </span>
                        <input
                          className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 pl-7 font-mono text-sm text-white focus:border-white/40 focus:outline-none"
                          min={0}
                          onChange={(e) => {
                            const val = Number.parseFloat(e.target.value);
                            if (!Number.isNaN(val) && val >= 0) {
                              setCostPerAPICall(val);
                            }
                          }}
                          placeholder="0.01"
                          step={0.0001}
                          type="number"
                          value={costPerAPICall}
                        />
                      </div>
                      <div className="mt-1 font-mono text-white/40 text-xs">
                        e.g., $0.015 for GPT-4, $0.003 for Claude
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block font-mono text-white/80 text-xs">
                        API calls per user/month
                      </label>
                      <input
                        className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 font-mono text-sm text-white focus:border-white/40 focus:outline-none"
                        min={0}
                        onChange={(e) => {
                          const val = Number.parseFloat(e.target.value);
                          if (!Number.isNaN(val) && val >= 0) {
                            setApiCallsPerUser(val);
                          }
                        }}
                        step={1}
                        type="number"
                        value={apiCallsPerUser}
                      />
                      <div className="mt-1 font-mono text-white/40 text-xs">
                        {mau.toLocaleString()} MAU × {apiCallsPerUser} calls ={" "}
                        {(mau * apiCallsPerUser).toLocaleString()} total
                        calls/month
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 flex justify-between">
                    <label className="font-medium font-mono text-sm text-white/80 sm:text-base">
                      Monthly AI API Cost
                    </label>
                    <span className="font-mono text-blue-400 text-sm sm:text-base">
                      ${aiCost.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Marketing Spend */}
                <div className="border border-white/10 bg-white/5 p-4 px-4 pb-10 backdrop-blur-xl sm:p-6 sm:px-8 sm:pb-12">
                  <div className="mb-3 flex justify-between">
                    <label className="font-medium font-mono text-sm text-white/80 sm:text-base">
                      Marketing Spend
                    </label>
                    {manualInputMode ? (
                      <input
                        className="w-32 rounded border border-white/20 bg-white/5 px-2 py-1 font-mono text-sm text-yellow-400 focus:border-yellow-400 focus:outline-none"
                        max={100_000}
                        min={0}
                        onChange={(e) =>
                          handleManualInput(
                            e.target.value,
                            setMarketingSpend,
                            0,
                            100_000
                          )
                        }
                        step={1000}
                        type="number"
                        value={marketingSpend}
                      />
                    ) : (
                      <span className="font-mono text-sm text-yellow-400 sm:text-base">
                        $
                        {marketingSpend >= 1000
                          ? `${(marketingSpend / 1000).toFixed(1)}K`
                          : marketingSpend}
                      </span>
                    )}
                  </div>
                  {!manualInputMode && (
                    <Slider
                      max={100_000}
                      min={0}
                      onValueChange={(v) => setMarketingSpend(v[0])}
                      step={1000}
                      value={[marketingSpend]}
                    />
                  )}
                </div>

                {/* Churn Rate */}
                <div className="border border-white/10 bg-white/5 p-4 px-4 pb-10 backdrop-blur-xl sm:p-6 sm:px-8 sm:pb-12">
                  <div className="mb-3 flex justify-between">
                    <label className="font-medium font-mono text-sm text-white/80 sm:text-base">
                      Churn Rate
                    </label>
                    {manualInputMode ? (
                      <div className="relative">
                        <input
                          className="w-24 rounded border border-white/20 bg-white/5 px-2 py-1 pr-6 font-mono text-red-400 text-sm focus:border-red-400 focus:outline-none"
                          max={100}
                          min={0}
                          onChange={(e) =>
                            handleManualInput(
                              e.target.value,
                              setChurnRate,
                              0,
                              100
                            )
                          }
                          step={0.5}
                          type="number"
                          value={churnRate}
                        />
                        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 font-mono text-red-400 text-sm">
                          %
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-red-400 text-sm sm:text-base">
                        {churnRate.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {!manualInputMode && (
                    <Slider
                      max={100}
                      min={0}
                      onValueChange={(v) => setChurnRate(v[0])}
                      step={0.5}
                      value={[churnRate]}
                    />
                  )}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
                <h3 className="mb-4 font-medium font-mono text-white/60 text-xs sm:text-sm">
                  BREAKDOWN
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between font-mono text-white/80">
                    <span>
                      Convex ({exceedsFreeTier ? "Pro Plan" : "Free Tier"})
                    </span>
                    <span>${convex.toFixed(2)}</span>
                  </div>
                  {exceedsFreeTier ? (
                    <>
                      <div className="flex justify-between pl-4 font-mono text-white/60 text-xs">
                        <span>
                          • Seats (
                          {devs === 1 ? "1 free" : `1 free + ${devs - 1} × $25`}
                          )
                        </span>
                        <span>${convexSeats.toFixed(2)}</span>
                      </div>
                      {convexFunctionCalls > 0 && (
                        <div className="flex justify-between pl-4 font-mono text-white/60 text-xs">
                          <span>
                            • Function Calls (
                            {(totalFunctionCalls / 1_000_000).toFixed(1)}M,
                            beyond 25M included)
                          </span>
                          <span>${convexFunctionCalls.toFixed(2)}</span>
                        </div>
                      )}
                      {convexActionCompute > 0 && (
                        <div className="flex justify-between pl-4 font-mono text-white/60 text-xs">
                          <span>
                            • Action Compute ({totalActionCompute.toFixed(1)}{" "}
                            GB-hrs, beyond 250 included)
                          </span>
                          <span>${convexActionCompute.toFixed(2)}</span>
                        </div>
                      )}
                      {convexDBStorage > 0 && (
                        <div className="flex justify-between pl-4 font-mono text-white/60 text-xs">
                          <span>
                            • DB Storage ({totalStorage.toFixed(2)} GB, beyond
                            50 GB included)
                          </span>
                          <span>${convexDBStorage.toFixed(2)}</span>
                        </div>
                      )}
                      {convexDBBandwidth > 0 && (
                        <div className="flex justify-between pl-4 font-mono text-white/60 text-xs">
                          <span>
                            • DB Bandwidth ({totalBandwidth.toFixed(2)} GB,
                            beyond 50 GB included)
                          </span>
                          <span>${convexDBBandwidth.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between pl-4 font-mono text-white/60 text-xs">
                      <span>
                        • Free tier (within limits:{" "}
                        {totalFunctionCalls.toLocaleString()} calls,{" "}
                        {totalStorage.toFixed(2)} GB storage,{" "}
                        {totalBandwidth.toFixed(2)} GB bandwidth,{" "}
                        {totalActionCompute.toFixed(1)} GB-hrs)
                      </span>
                      <span>$0</span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between font-mono text-white/80">
                    <span>Cloudflare Workers</span>
                    <span>${workers.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-white/80">
                    <span>Workers Logs</span>
                    <span>${workerLogs.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pl-4 font-mono text-white/60 text-xs">
                    <span>
                      • {(totalLogs / 1_000_000).toFixed(1)}M logs (~2 per
                      request)
                    </span>
                    <span>
                      $
                      {workerLogs > 0
                        ? `${(billableLogs / 1_000_000).toFixed(1)}M billable`
                        : "within free tier"}
                    </span>
                  </div>
                  <div className="flex justify-between font-mono text-white/80">
                    <span>R2 Storage</span>
                    <span>${r2.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-white/80">
                    <span>AI API Costs</span>
                    <span>${aiCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-white/80">
                    <span>Resend</span>
                    <span>${resend.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-mono text-white/80">
                    <span>Sentry {sentry === 0 ? "(Free)" : "(Team)"}</span>
                    <span>${sentry}</span>
                  </div>
                  <div className="flex justify-between font-mono text-white/80">
                    <span>Marketing Spend</span>
                    <span>${marketingSpend.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-mono text-white/80">
                    <span>Developer Costs</span>
                    <span>${developerCosts.toLocaleString()}</span>
                  </div>
                  {devs > 1 && (
                    <div className="flex justify-between pl-4 font-mono text-white/60 text-xs">
                      <span>
                        • {devs - 1} additional dev{devs - 1 > 1 ? "s" : ""} × $
                        {devSalary.toLocaleString()}/mo
                      </span>
                      <span>${developerCosts.toLocaleString()}</span>
                    </div>
                  )}
                  {devs === 1 && (
                    <div className="flex justify-between pl-4 font-mono text-white/60 text-xs">
                      <span>• First developer (yourself) - no cost</span>
                      <span>$0</span>
                    </div>
                  )}
                  <div className="flex justify-between border-white/20 border-t pt-2 font-mono text-white/80">
                    <span>BetterAuth + OSS</span>
                    <span className="text-green-400">$0</span>
                  </div>
                </div>
              </div>

              {/* Revenue Calculator */}
              <div className="border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                  <h3 className="font-medium font-mono text-white/60 text-xs sm:text-sm">
                    REVENUE POTENTIAL
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="flex items-center gap-1 rounded-full bg-white px-3 py-1 font-mono font-semibold text-black text-xs transition-colors hover:bg-white/90 sm:text-sm"
                      onClick={addPackage}
                      type="button"
                    >
                      <Plus className="sm:h-4 sm:w-4" size={14} />
                      Add Package
                    </button>
                    <button
                      className={`flex items-center gap-1 rounded-full px-3 py-1 font-mono font-semibold text-xs transition-colors sm:text-sm ${
                        copied
                          ? "border border-green-500/30 bg-green-500/20 text-green-400"
                          : "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                      }`}
                      onClick={shareAsJSON}
                      type="button"
                    >
                      {copied ? (
                        <>
                          <Check className="sm:h-4 sm:w-4" size={14} />
                          Copied to clipboard
                        </>
                      ) : (
                        <>Share Calculations</>
                      )}
                    </button>
                    <button
                      className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono font-semibold text-white text-xs transition-colors hover:bg-white/20 sm:text-sm"
                      onClick={exportAsCSV}
                      type="button"
                    >
                      <Download className="sm:h-4 sm:w-4" size={14} />
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="mb-4 space-y-3">
                  {packages.map((pkg) => (
                    <div
                      className="border border-white/10 bg-black/40 p-3 backdrop-blur-xl sm:p-4"
                      key={pkg.id}
                    >
                      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_auto]">
                        <div className="sm:col-span-2 md:col-span-1">
                          <div className="mb-1 font-mono text-white/60 text-xs">
                            Package Name
                          </div>
                          <input
                            className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 font-mono text-white text-xs focus:border-white/40 focus:outline-none sm:text-sm"
                            onChange={(e) =>
                              updatePackage(pkg.id, "name", e.target.value)
                            }
                            placeholder="e.g. Pro, Enterprise"
                            type="text"
                            value={pkg.name}
                          />
                        </div>
                        <div>
                          <div className="mb-1 font-mono text-white/60 text-xs">
                            Price/mo
                          </div>
                          <div className="relative">
                            <span className="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-white/60 text-xs sm:text-sm">
                              $
                            </span>
                            <input
                              className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 pl-6 font-mono text-white text-xs focus:border-white/40 focus:outline-none sm:text-sm"
                              min="0"
                              onChange={(e) =>
                                updatePackage(
                                  pkg.id,
                                  "price",
                                  Number(e.target.value)
                                )
                              }
                              placeholder="0"
                              type="number"
                              value={pkg.price}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 font-mono text-white/60 text-xs">
                            Conversion %
                          </div>
                          <div className="relative">
                            <input
                              className="w-full rounded border border-white/20 bg-white/5 px-3 py-2 pr-6 font-mono text-white text-xs focus:border-white/40 focus:outline-none sm:text-sm"
                              max="100"
                              min="0"
                              onChange={(e) =>
                                updatePackage(
                                  pkg.id,
                                  "conversionRate",
                                  Number(e.target.value)
                                )
                              }
                              placeholder="0"
                              type="number"
                              value={pkg.conversionRate}
                            />
                            <span className="absolute top-1/2 right-3 -translate-y-1/2 font-mono text-white/60 text-xs sm:text-sm">
                              %
                            </span>
                          </div>
                        </div>
                        <button
                          aria-label="Delete package"
                          className="flex-shrink-0 self-end rounded p-2 text-red-400 transition-colors hover:bg-red-950/30 hover:text-red-300 sm:self-auto"
                          onClick={() => removePackage(pkg.id)}
                          type="button"
                        >
                          <Trash2 className="sm:h-4 sm:w-4" size={14} />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-1 border-white/20 border-t pt-3 font-mono text-white/60 text-xs">
                        <span className="text-white/80">
                          {((mau * pkg.conversionRate) / 100).toLocaleString()}
                        </span>
                        <span>users ×</span>
                        <span className="text-white/80">${pkg.price}</span>
                        <span>=</span>
                        <span className="font-medium text-green-400">
                          $
                          {(
                            ((mau * pkg.conversionRate) / 100) *
                            pkg.price
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                          /mo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-3 border-white/20 border-t pt-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium font-mono text-sm text-white/80 sm:text-base">
                      Monthly Revenue
                    </span>
                    <span className="font-bold font-mono text-2xl text-green-400 sm:text-3xl md:text-2xl">
                      $
                      {monthlyRevenue.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium font-mono text-sm text-white/80 sm:text-base">
                      Infra Costs
                    </span>
                    <span className="font-bold font-mono text-red-400 text-xl sm:text-2xl md:text-xl">
                      $
                      {infrastructureCost.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-medium font-mono text-sm text-white/80 sm:text-base">
                      Polar Fees (4% + $0.40/tx)
                    </span>
                    <span className="font-bold font-mono text-orange-400 text-xl sm:text-2xl md:text-xl">
                      $
                      {polarFees.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pl-4 font-mono text-white/60 text-xs">
                    <div className="flex justify-between">
                      <span>
                        • {paidTransactions.toLocaleString()} transactions
                      </span>
                      <span>${(paidTransactions * 0.4).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 4% of revenue</span>
                      <span>${(monthlyRevenue * 0.04).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs sm:gap-4 sm:text-sm">
                    <div className="flex flex-col">
                      <span className="mb-1 font-mono text-white/60 text-xs">
                        Monthly Profit
                      </span>
                      <span
                        className={`font-mono text-lg ${monthlyRevenue - totalCostsForProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        $
                        {(monthlyRevenue - totalCostsForProfit).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="mb-1 font-mono text-white/60 text-xs">
                        Profit Margin
                      </span>
                      <span
                        className={`font-mono text-lg ${monthlyRevenue > 0 && monthlyRevenue - totalCostsForProfit >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {monthlyRevenue > 0
                          ? (
                              ((monthlyRevenue - totalCostsForProfit) /
                                monthlyRevenue) *
                              100
                            ).toFixed(2)
                          : "0"}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog onOpenChange={setShowResetDialog} open={showResetDialog}>
        <AlertDialogContent className="border-white/10 bg-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono text-white">
              Are you sure you want to reset?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-white/60">
              This will clear your product idea, fit check results, and all cost
              estimates. You'll need to start over.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 bg-white/5 font-mono text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 font-mono text-white hover:bg-red-600"
              onClick={handleReset}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
