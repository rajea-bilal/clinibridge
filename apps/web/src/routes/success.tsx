import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/success" as any)({
  component: SuccessComponent,
});

function SuccessComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard with success flag
    navigate({
      to: "/dashboard",
      search: {
        action: undefined,
        purchaseSuccess: "true",
      },
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="font-mono text-white/60">Redirecting...</div>
    </div>
  );
}
