import { config } from "@root/config";
import { Building2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export default function OrganizationSwitcher() {
  // Hooks must be called unconditionally - config check happens at parent level
  const { data: organizations, isPending } =
    authClient.useListOrganizations?.() ?? {
      data: undefined,
      isPending: false,
    };
  const { data: activeOrganization } = authClient.useActiveOrganization?.() ?? {
    data: undefined,
  };
  const [isSwitching, setIsSwitching] = useState(false);

  if (!config.features.organizations) {
    return null;
  }

  const handleSetActive = async (organizationId: string) => {
    setIsSwitching(true);
    try {
      await authClient.organization.setActive({
        organizationId,
      });
    } catch (error) {
      console.error("Failed to switch organization:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  if (isPending) {
    return (
      <Button className="font-mono" disabled variant="outline">
        <Building2 className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  const orgs = organizations || [];
  const active = activeOrganization || null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="font-mono"
          disabled={isSwitching}
          size="sm"
          variant="outline"
        >
          <Building2 className="mr-1 h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">
            {active?.name || "Select Organization"}
          </span>
          <span className="sm:hidden">Org</span>
          <ChevronDown className="ml-1 h-4 w-4 sm:ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs.length === 0 ? (
          <DropdownMenuItem disabled>No organizations</DropdownMenuItem>
        ) : (
          orgs.map((org) => (
            <DropdownMenuItem
              className={active?.id === org.id ? "bg-accent" : ""}
              key={org.id}
              onClick={() => handleSetActive(org.id)}
            >
              <Building2 className="mr-2 h-4 w-4" />
              {org.name}
              {active?.id === org.id && (
                <span className="ml-auto text-xs">Active</span>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
