import { useConvexQuery } from "@convex-dev/react-query";
import { config } from "@root/config";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { api } from "@yugen/backend/convex/_generated/api";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useQuery,
} from "convex/react";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  Loader2,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState } from "react";
import CreateOrganizationForm from "@/components/create-organization-form";
import OrganizationMembers from "@/components/organization-members";
import OrganizationSwitcher from "@/components/organization-switcher";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import TodoList from "@/components/todo-list";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/user-menu";
import WaitlistForm from "@/components/waitlist-form";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    action: (search.action as string) || undefined,
    purchaseSuccess: (search.purchaseSuccess as string) || undefined,
  }),
});

function AuthenticatedDashboard({
  navigate,
  showSuccessModal,
}: {
  navigate: ReturnType<typeof useNavigate>;
  showSuccessModal: boolean;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  // const [isNavigatingToPricing, setIsNavigatingToPricing] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] =
    useState(showSuccessModal);
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  // Check if user has active purchase (only if tracking in Convex)
  const purchaseStatus = useQuery(
    api.payments.hasActivePurchase,
    config.payments.trackInConvex ? {} : "skip"
  );

  useEffect(() => {
    authClient.getSession().then(({ data: session }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
      setIsChecking(false);
    });
  }, []);

  const onboardingStatus = useConvexQuery(
    api.userProfiles.checkOnboardingStatus,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    if (isChecking || !userId) return;

    // If onboarding is enabled and user hasn't onboarded, redirect
    if (
      config.features.onboarding &&
      onboardingStatus &&
      !onboardingStatus.hasOnboarded
    ) {
      navigate({ to: "/onboarding" });
    }
  }, [onboardingStatus, isChecking, userId, navigate]);

  const handleBackToHome = () => {
    navigate({ to: "/" });
  };

  const handleBuyNow = () => {
    window.location.href =
      "https://buy.polar.sh/polar_cl_gb1xF1lHthbnUYhF4PQWScdekYVKwD5flqs7x3ddnZ8";
  };

  if (isChecking || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="font-mono text-white/60">Loading...</div>
      </div>
    );
  }

  // If onboarding is required but status is still loading
  if (config.features.onboarding && !onboardingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="font-mono text-white/60">Loading...</div>
      </div>
    );
  }

  // Check if user is admin
  const isAdmin = onboardingStatus?.isAdmin === true;

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    // Remove the search param from URL
    navigate({
      to: "/dashboard",
      search: { action: undefined, purchaseSuccess: undefined },
    });
  };

  return (
    <>
      <AlertDialog
        onOpenChange={setIsSuccessModalOpen}
        open={isSuccessModalOpen}
      >
        <AlertDialogContent className="border-white/20 bg-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-mono text-white">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              Thanks for purchasing!
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-white/60">
              You now have full access to all features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              className="border border-white/20 bg-white/15 font-mono text-white hover:bg-white/25"
              onClick={handleCloseSuccessModal}
            >
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="container mx-auto max-w-4xl px-4 py-4 sm:py-8">
        {/* Top Navbar */}
        <div className="mb-6 flex items-center justify-between border-white/10 border-b pb-4 sm:mb-8 sm:pb-6">
          <h1 className="font-bold font-mono text-2xl text-white sm:text-3xl">
            Dashboard
          </h1>
          <UserMenu />
        </div>

        {/* Secondary Navigation */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <Button
            className="w-fit font-mono text-white/60 hover:bg-white/10 hover:text-white"
            onClick={handleBackToHome}
            size="sm"
            variant="ghost"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {config.features.organizations && <OrganizationSwitcher />}
            {isAdmin && (
              <Button
                className="border-white/20 font-mono text-white hover:bg-white/10"
                onClick={() => navigate({ to: "/admin/waitlist" })}
                size="sm"
                variant="outline"
              >
                Waitlist
              </Button>
            )}
          </div>
        </div>

        {config.features.organizations && (
          <div className="mb-6 space-y-4 sm:mb-8">
            {showCreateOrg ? (
              <CreateOrganizationForm
                onCancel={() => setShowCreateOrg(false)}
                onSuccess={() => {
                  setShowCreateOrg(false);
                }}
              />
            ) : (
              <div className="flex flex-col gap-4 border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-mono font-semibold text-base text-white sm:text-lg">
                    Organizations
                  </h2>
                  <p className="font-mono text-white/60 text-xs sm:text-sm">
                    Manage your organizations and team members
                  </p>
                </div>
                <Button
                  className="border-white/20 font-mono text-white hover:bg-white/10"
                  onClick={() => setShowCreateOrg(true)}
                  size="sm"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Organization
                </Button>
              </div>
            )}
            <OrganizationMembers />
          </div>
        )}

        <div className="border border-white/10 bg-white/5 p-4 sm:p-8">
          <TodoList />
        </div>
        {!(config.payments.trackInConvex && purchaseStatus?.hasPurchase) && (
          <div className="mt-8 flex justify-center">
            <Button
              className="border border-white/20 bg-white/15 font-mono text-white shadow-none hover:bg-white/25 disabled:opacity-50"
              // disabled={isNavigatingToPricing}
              onClick={handleBuyNow}
            >
              {
                /* {isNavigatingToPricing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : */ <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Buy Now
                </>
              }
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function RouteComponent() {
  const search = useSearch({ from: "/dashboard" });
  const [showSignIn, setShowSignIn] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const handleBackClick = async () => {
    setIsNavigating(true);
    await navigate({ to: "/" });
  };

  // Check if user is coming from approval email or admin bypass
  const bypassWaitlist = search.action === "signup";

  // Determine which form to show based on config and params
  const showWaitlist =
    config.features.waitlist && !showSignIn && !bypassWaitlist;

  const showSuccessModal = search.purchaseSuccess === "true";

  return (
    <div className="min-h-screen bg-black">
      <Authenticated>
        <AuthenticatedDashboard
          navigate={navigate}
          showSuccessModal={showSuccessModal}
        />
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-screen bg-black px-4">
          <div className="container mx-auto max-w-4xl pt-8">
            <Button
              className="font-mono text-white/60 hover:bg-white/10 hover:text-white"
              disabled={isNavigating}
              onClick={handleBackClick}
              type="button"
              variant="ghost"
            >
              {isNavigating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </>
              )}
            </Button>
          </div>
          <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
            {showSignIn ? (
              <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
            ) : showWaitlist ? (
              <WaitlistForm onSwitchToSignIn={() => setShowSignIn(true)} />
            ) : (
              <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
            )}
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="font-mono text-white/60">Loading...</div>
        </div>
      </AuthLoading>
    </div>
  );
}
