"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function SignUpForm() {
  // ✅ State for user input
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ Function to handle signup
  const handleSignup = async (e) => {
    e.preventDefault();

    // Check if passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    const res = await fetch("/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, password }),
});


    const data = await res.json();

    if (res.ok) {
      window.location.href = "/signin"; // ✅ Redirect to sign-in page
    } else {
      setError(data.message || "An error occurred. Please try again."); // ❌ Show error message
    }
  };

  const handleGoogleLogin = () => {
  signIn("google");
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 rounded-[30px] bg-[#f3f4f6]">
        <div className="flex flex-col items-center mb-6">
          {/* Logo Image */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4">
            <img src="logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-[24px] font-bold text-[#1E3A8A]">Create your account</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSignup}>
          {error && <p className="text-red-500 text-center">{error}</p>} {/* ❌ Show error message */}

          <div className="relative">
            <Input 
              id="name" 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="h-[52px] px-4 rounded-xl border border-[#767676]" 
              placeholder="Enter your name"
              required
            />
            <Label htmlFor="name" className="absolute left-2 -top-2.5 bg-[#f3f4f6] px-1 text-xs text-[#767676]">
              Name
            </Label>
          </div>

          <div className="relative">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[52px] px-4 rounded-xl border border-[#767676]"
              placeholder="Enter your email"
              required
            />
            <Label htmlFor="email" className="absolute left-2 -top-2.5 bg-[#f3f4f6] px-1 text-xs text-[#767676]">
              Email
            </Label>
          </div>

          <div className="relative">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[52px] px-4 rounded-xl border border-[#767676]"
              placeholder="Enter your password"
              required
            />
            <Label htmlFor="password" className="absolute left-2 -top-2.5 bg-[#f3f4f6] px-1 text-xs text-[#767676]">
              Password
            </Label>
          </div>

          <div className="relative">
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-[52px] px-4 rounded-xl border border-[#767676]"
              placeholder="Confirm your password"
              required
            />
            <Label htmlFor="confirm-password" className="absolute left-2 -top-2.5 bg-[#f3f4f6] px-1 text-xs text-[#767676]">
              Confirm password
            </Label>
          </div>

          <Button type="submit" className="w-full h-[52px] bg-[#1E3A8A] hover:bg-[#3B82F6] text-white font-bold text-base rounded-full">
            Sign up
          </Button>
        </form>

        <div className="text-center text-sm text-[#767676] mt-4">
          Already have an account?{" "}
          <Link href="/signin" className="text-[#767676] hover:underline">
            Sign in
          </Link>
        </div>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#767676]"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#f3f4f6] px-4 text-[#767676]">OR</span>
          </div>
        </div>

        {/* Google Login Button */}
        <Button 
          onClick={handleGoogleLogin} 
          variant="outline" 
          className="w-full h-[52px] font-medium border-[#767676] text-base rounded-full bg-[#f3f4f6] hover:bg-[#232323] hover:text-[#f3f4f6]" 
          type="button"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign up with Google
        </Button>
      </Card>
    </div>
  );
}
