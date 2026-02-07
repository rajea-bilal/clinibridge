import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { api } from "@yugen/backend/convex/_generated/api";
import type { Id } from "@yugen/backend/convex/_generated/dataModel";
import { CheckCircle, ShieldAlert, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin/waitlist")({
  component: AdminWaitlistComponent,
});

function AdminWaitlistComponent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    authClient.getSession().then(({ data: session }) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
      setIsCheckingAuth(false);
    });
  }, []);

  const isAdmin = useConvexQuery(
    api.userProfiles.isUserAdmin,
    userId ? { userId } : "skip"
  );

  const waitlist = useConvexQuery(api.waitlist.listWaitlist, {});
  const approveEntry = useConvexMutation(api.waitlist.approveWaitlistEntry);
  const removeEntry = useConvexMutation(api.waitlist.removeWaitlistEntry);

  const handleApprove = async (waitlistId: Id<"waitlist">) => {
    try {
      await approveEntry({ waitlistId });
      toast.success("User approved and invitation email sent!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to approve user";
      toast.error(errorMessage);
    }
  };

  const handleRemove = async (waitlistId: Id<"waitlist">) => {
    try {
      await removeEntry({ waitlistId });
      toast.success("User removed from waitlist");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove user";
      toast.error(errorMessage);
    }
  };

  if (isCheckingAuth || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="font-mono text-white/60">Loading...</div>
      </div>
    );
  }

  // Show unauthorized message if not admin
  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="max-w-md text-center">
          <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h1 className="mb-2 font-bold font-mono text-2xl text-white">
            Access Denied
          </h1>
          <p className="font-mono text-white/60">
            You don't have permission to access this page.
          </p>
          <Button
            className="mt-6 font-mono"
            onClick={() => window.history.back()}
            type="button"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!waitlist) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="font-mono text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 font-bold font-mono text-3xl text-white">
          Waitlist Management
        </h1>

        <div className="space-y-4">
          {waitlist.length === 0 ? (
            <div className="border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="font-mono text-white/60">No users on waitlist</p>
            </div>
          ) : (
            waitlist.map((entry) => (
              <div
                className="flex items-center justify-between border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
                key={entry._id}
              >
                <div>
                  <p className="font-mono text-white">{entry.email}</p>
                  {entry.name && (
                    <p className="font-mono text-sm text-white/60">
                      {entry.name}
                    </p>
                  )}
                  <p className="font-mono text-white/40 text-xs">
                    Joined: {new Date(entry._creationTime).toLocaleDateString()}
                  </p>
                  {entry.approved && (
                    <p className="font-mono text-green-400 text-xs">
                      ✓ Approved{" "}
                      {entry.invitedAt &&
                        `on ${new Date(entry.invitedAt).toLocaleDateString()}`}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  {!entry.approved && (
                    <Button
                      className="bg-green-600 font-mono hover:bg-green-700"
                      onClick={() => handleApprove(entry._id)}
                      size="sm"
                      type="button"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  )}
                  <Button
                    className="font-mono"
                    onClick={() => handleRemove(entry._id)}
                    size="sm"
                    type="button"
                    variant="destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
