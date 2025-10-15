import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface UserMenuProps {
  email: string;
}

export default function UserMenu({ email }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Logged out successfully");
        window.location.href = "/login";
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred during logout");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex items-center gap-4" data-testid="user-menu">
      <span className="text-md text-gray-700 dark:text-gray-300" data-testid="welcome-message">
        Welcome, {email}
      </span>
      <Button
        data-testid="logout-button"
        variant="outline"
        size="lg"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="text-md"
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Button>
    </div>
  );
}
