import { useConvexMutation } from "@convex-dev/react-query";
import { config } from "@root/config";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@yugen/backend/convex/_generated/api";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const navigate = useNavigate({
    from: "/",
  });

  const getOrCreateUserProfile = useConvexMutation(
    api.userProfiles.getOrCreateUserProfile
  );

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: async () => {
            try {
              // Get the user session
              const { data: session } = await authClient.getSession();
              if (!session?.user?.id) {
                throw new Error("No user session found");
              }

              // Create user profile in Convex
              const profile = await getOrCreateUserProfile({
                userId: session.user.id,
              });

              // Redirect based on onboarding config
              if (config.features.onboarding && !profile.hasOnboarded) {
                navigate({ to: "/onboarding" });
              } else {
                navigate({
                  to: "/dashboard",
                  search: { action: undefined, purchaseSuccess: undefined },
                });
              }

              toast.success("Sign up successful");
            } catch (error) {
              console.error("Error creating user profile:", error);
              // Still navigate to dashboard on error
              navigate({
                to: "/dashboard",
                search: { action: undefined, purchaseSuccess: undefined },
              });
              toast.success("Sign up successful");
            }
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  return (
    <div className="w-full max-w-md">
      <div className="border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h1 className="mb-8 text-center font-bold font-mono text-3xl text-white">
          Create Account
        </h1>

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
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="font-mono text-red-400 text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
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
                    type="email"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="font-mono text-red-400 text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <div>
            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <Label
                    className="font-mono text-white/80"
                    htmlFor={field.name}
                  >
                    Password
                  </Label>
                  <Input
                    className="border-white/20 bg-white/5 font-mono text-white placeholder:text-white/40"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="password"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p
                      className="font-mono text-red-400 text-sm"
                      key={error?.message}
                    >
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>

          <form.Subscribe>
            {(state) => (
              <Button
                className="w-full font-mono font-semibold"
                disabled={!state.canSubmit || state.isSubmitting}
                type="submit"
              >
                {state.isSubmitting ? "Submitting..." : "Sign Up"}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <div className="mt-6 text-center">
          <Button
            className="font-mono text-white/60 hover:text-white"
            onClick={onSwitchToSignIn}
            variant="link"
          >
            Already have an account? Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
