import { useNavigate } from "@tanstack/react-router";
import { api } from "@yugen/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";

export default function UserMenu() {
  const navigate = useNavigate();
  const user = useQuery(api.auth.getCurrentUser);
  const purchaseStatus = useQuery(
    api.payments.hasActivePurchase,
    user ? {} : "skip"
  );

  const getPlanLabel = () => {
    if (!purchaseStatus?.hasPurchase) return null;
    if (purchaseStatus.type === "subscription") return "Subscription";
    if (purchaseStatus.type === "payment") return "Lifetime";
    return null;
  };

  const planLabel = getPlanLabel();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="font-mono" size="sm" variant="outline">
          <span className="hidden sm:inline">{user?.name}</span>
          <span className="sm:hidden">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </span>
          {planLabel && (
            <span className="ml-1 flex items-center gap-1 text-green-400 text-xs sm:ml-2">
              <CheckCircle2 className="h-3 w-3" />
              <span className="hidden sm:inline">{planLabel}</span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card" sideOffset={8}>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="max-w-[200px] truncate">
          {user?.email}
        </DropdownMenuItem>
        {planLabel && (
          <DropdownMenuItem className="text-green-400">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {planLabel} Plan
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button
            className="w-full"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    navigate({
                      to: "/dashboard",
                      search: {
                        action: undefined,
                        purchaseSuccess: undefined,
                      },
                    });
                  },
                },
              });
            }}
            variant="destructive"
          >
            Sign Out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
