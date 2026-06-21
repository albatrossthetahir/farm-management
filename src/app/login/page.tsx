"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Warehouse, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || "Invalid username or password");
        setIsSubmitting(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 transition-colors duration-200">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl shadow-black/5">

        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 mb-4">
            <Warehouse className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Farm ERP</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in to access your operations dashboard</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-xs font-semibold text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-input pl-4 pr-10 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" />
                ) : (
                  <Eye className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:bg-primary/95 hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Demo Credentials Alert Info */}
        <div className="mt-8 rounded-xl bg-secondary/50 border border-border p-4 text-xs text-muted-foreground">
          <span className="block font-semibold text-foreground mb-1">Demo Credentials:</span>
          <div className="grid grid-cols-2 gap-2 mt-1.5 font-medium">
            <div>Admin: <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-bold">admin / admin123</code></div>
            <div>Manager: <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-bold">manager / manager123</code></div>
            <div>Accountant: <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-bold">accountant / accountant123</code></div>
            <div>Staff: <code className="bg-muted px-1 py-0.5 rounded text-[11px] font-bold">staff / staff123</code></div>
          </div>
        </div>

      </div>
    </div>
  );
}
