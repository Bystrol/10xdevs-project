import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Redirect will be handled by the page/component that uses this form
        window.location.href = "/";
      } else {
        const errorData = await response.json();
        setError("root", {
          message: errorData.error || "Invalid credentials",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("root", {
        message: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">Sign in to your account</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <Input
              id="email"
              data-testid="email-input"
              type="email"
              autoComplete="email"
              className="mt-1"
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <Input
              id="password"
              data-testid="password-input"
              type="password"
              autoComplete="current-password"
              className="mt-1"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>
        </div>

        {errors.root && (
          <div className="text-center" data-testid="error-message">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
          </div>
        )}

        <div>
          <Button type="submit" data-testid="login-button" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div>
            <a
              href="/reset-password"
              data-testid="reset-password-link"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot your password?
            </a>
          </div>
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <a
                href="/register"
                data-testid="register-link"
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Sign up
              </a>
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
