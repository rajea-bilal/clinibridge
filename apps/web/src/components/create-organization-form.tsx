import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface CreateOrganizationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateOrganizationForm({
  onSuccess,
  onCancel,
}: CreateOrganizationFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkSlugAvailability = async (slugValue: string) => {
    if (slugValue.length === 0) {
      return;
    }
    setIsCheckingSlug(true);
    try {
      const result = await authClient.organization.checkSlug({
        slug: slugValue,
      });
      if (result.error || !result.data?.status) {
        toast.error("This slug is already taken");
      }
    } catch (error) {
      console.error("Failed to check slug:", error);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(sanitized);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only check if slug is not empty and has at least 2 characters
    if (sanitized.length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        checkSlugAvailability(sanitized);
      }, 500); // Wait 500ms after user stops typing
    }
  };

  // Cleanup timer on unmount
  useEffect(
    () => () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(name.trim() && slug.trim())) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authClient.organization.create({
        name: name.trim(),
        slug: slug.trim(),
      });

      if (result.error) {
        toast.error(result.error.message || "Failed to create organization");
        return;
      }

      toast.success("Organization created successfully!");
      setName("");
      setSlug("");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error("Failed to create organization. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Organization</CardTitle>
        <CardDescription>
          Create a new organization to collaborate with your team
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              disabled={isLoading}
              id="org-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corporation"
              required
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug</Label>
            <Input
              disabled={isLoading}
              id="org-slug"
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="acme-corp"
              required
              value={slug}
            />
            <p className="text-muted-foreground text-sm">
              URL-friendly identifier (lowercase letters, numbers, and hyphens
              only)
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              disabled={isLoading || isCheckingSlug}
              type="submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Organization"
              )}
            </Button>
            {onCancel && (
              <Button
                className="w-full sm:w-auto"
                disabled={isLoading}
                onClick={onCancel}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
