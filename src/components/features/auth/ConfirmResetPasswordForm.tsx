import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const confirmResetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ConfirmResetPasswordFormData = z.infer<typeof confirmResetPasswordSchema>;

export default function ConfirmResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ConfirmResetPasswordFormData>({
    resolver: zodResolver(confirmResetPasswordSchema),
  });

  const onSubmit = async (data: ConfirmResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/confirm-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: data.password }),
      });

      if (response.ok) {
        // Redirect to login page after successful password reset
        window.location.href = "/login";
      } else {
        const errorData = await response.json();
        setError("root", {
          message: errorData.error || "Failed to reset password",
        });
      }
    } catch (error) {
      console.error("Confirm reset password error:", error);
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
        <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">Reset your password</h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-1"
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm new password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="mt-1"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        {errors.root && (
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{errors.root.message}</p>
          </div>
        )}

        <div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting password..." : "Reset password"}
          </Button>
        </div>

        <div className="text-center">
          <a
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to sign in
          </a>
        </div>
      </form>
    </div>
  );
}
