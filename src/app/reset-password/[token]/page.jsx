"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    async function verifyToken() {
      try {
        const res = await fetch(`/api/verify-reset-token?token=${token}`);
        const data = await res.json();
        if (data.valid) setIsTokenValid(true);
        else setError(data.message || "Invalid or expired token.");
      } catch {
        setError("Server error verifying token.");
      }
    }
    if (token) verifyToken();
  }, [token]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6]">
      <Card className="w-full max-w-md p-8 rounded-[30px] bg-[#f3f4f6]">
        <h1 className="text-[24px] font-bold text-[#1E3A8A] text-center mb-6">
          Reset Password
        </h1>

        {!isTokenValid ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setMessage("");
              setError("");

              if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
              }

              setIsLoading(true);
              try {
                const res = await fetch("/api/reset-password", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token, password }),
                });
                const data = await res.json();
                if (res.ok) {
                  setMessage("Password reset successfully!");
                  setTimeout(() => router.push("/signin"), 2000);
                } else setError(data.message || "Error resetting password.");
              } catch {
                setError("Network error. Please try again.");
              } finally {
                setIsLoading(false);
              }
            }}
            className="space-y-6"
          >
            <div className="relative">
              <Label htmlFor="password" className="absolute left-3 -top-2.5 bg-[#f3f4f6] px-1 text-xs text-[#767676]">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                className="h-[52px] px-4 rounded-xl border border-[#767676]"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Label htmlFor="confirmPassword" className="absolute left-3 -top-2.5 bg-[#f3f4f6] px-1 text-xs text-[#767676]">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                className="h-[52px] px-4 rounded-xl border border-[#767676]"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] bg-[#1E3A8A] hover:bg-[#3B82F6] text-white font-bold text-base rounded-full"
            >
              {isLoading ? "Resetting..." : "Set New Password"}
            </Button>

            {message && <div className="mt-6 p-3 bg-green-100 border border-green-400 text-green-700 text-center rounded-lg">{message}</div>}
            {error && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 text-center rounded-lg">{error}</div>}
          </form>
        )}
      </Card>
    </div>
  );
}
