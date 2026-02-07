import { useConvexMutation } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { api } from "@yugen/backend/convex/_generated/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function WaitlistForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const joinWaitlist = useConvexMutation(api.waitlist.joinWaitlist);

  const form = useForm({
    defaultValues: {
      email: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await joinWaitlist({
          email: value.email,
          name: value.name || undefined,
        });
        toast.success("Successfully joined the waitlist!");
      } catch (error) {
        // Extract clean error message from Convex error
        let errorMessage = "Failed to join waitlist. Please try again.";

        if (error instanceof Error) {
          // Convex errors often have format: "[CONVEX ...] Error: actual message"
          // Extract just the actual message
          const match = error.message.match(/Error: (.+?)(?:\s+at\s+|$)/);
          errorMessage = match ? match[1] : error.message;

          // Clean up common error prefixes
          errorMessage = errorMessage
            .replace(/^Uncaught Error:\s*/i, "")
            .replace(/^Server Error\s*/i, "")
            .trim();
        }

        toast.error(errorMessage);
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Invalid email address"),
        name: z
          .string()
          .min(2, "Name must be at least 2 characters")
          .or(z.literal("")),
      }),
    },
  });

  return (
    <div className="w-full max-w-md">
      <div className="border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h1 className="mb-4 text-center font-bold font-mono text-3xl text-white">
          Join Waitlist
        </h1>
        <p className="mb-8 text-center font-mono text-sm text-white/60">
          We're currently in early access. Join the waitlist to get notified!
        </p>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div>
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <Label
                    className="font-mono text-white/80"
                    htmlFor={field.name}
                  >
                    Name
                  </Label>
                  <Input
                    className="border-white/20 bg-white/5 font-mono text-white placeholder:text-white/40"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Your name"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="font-mono text-red-400 text-sm">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          <div>
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <Label
                    className="font-mono text-white/80"
                    htmlFor={field.name}
                  >
                    Email
                  </Label>
                  <Input
                    className="border-white/20 bg-white/5 font-mono text-white placeholder:text-white/40"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="font-mono text-red-400 text-sm">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          <Button
            className="w-full bg-white font-mono text-black hover:bg-white/90"
            disabled={form.state.isSubmitting}
            type="submit"
          >
            {form.state.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Waitlist"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center font-mono text-sm text-white/60">
          Already have an account?{" "}
          <button
            className="font-bold text-white hover:underline"
            onClick={onSwitchToSignIn}
            type="button"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
