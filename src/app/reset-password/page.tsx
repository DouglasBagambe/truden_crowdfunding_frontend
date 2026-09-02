"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";

function ResetPasswordContent() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    {
      label: "Special character",
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];
  const allRequirementsMet = passwordRequirements.every((r) => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token) {
      setErrorMsg("Enter the reset code from your email.");
      return;
    }
    if (!allRequirementsMet) {
      setErrorMsg("Password does not meet requirements.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setStatus("loading");
    try {
      await apiClient.post("/auth/reset-password", {
        token,
        newPassword: password,
      });
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof err.response === "object" &&
        err.response !== null &&
        "data" in err.response &&
        typeof err.response.data === "object" &&
        err.response.data !== null &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
          ? err.response.data.message
          : "Reset failed. The link may have expired.";
      setErrorMsg(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#070710] flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {status === "success" ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center space-y-6 backdrop-blur-xl">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white mb-2">
                Password Reset!
              </h1>
              <p className="text-white/60 font-medium">
                Your password has been updated. You can now log in with your new
                password.
              </p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-4 bg-[var(--primary,#3b82f6)] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 space-y-8 backdrop-blur-xl">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mx-auto">
                <KeyRound size={28} className="text-blue-400" />
              </div>
              <h1 className="text-3xl font-black text-white">Reset Password</h1>
              <p className="text-white/50 text-sm font-medium">
                Create a strong new password for your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Reset Code
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.trim())}
                  autoComplete="one-time-code"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
                  placeholder="Paste the code from your email"
                />
              </div>
              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  New Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Requirements */}
                {password && (
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    {passwordRequirements.map((r) => (
                      <div
                        key={r.label}
                        className={`flex items-center gap-1.5 text-xs ${r.met ? "text-emerald-400" : "text-white/30"}`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${r.met ? "bg-emerald-400" : "bg-white/20"}`}
                        />
                        {r.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full bg-white/5 border rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 focus:outline-none transition-all ${
                      confirm && confirm !== password
                        ? "border-rose-500/50 focus:border-rose-500"
                        : "border-white/10 focus:border-blue-500/50"
                    }`}
                  />
                </div>
                {confirm && confirm !== password && (
                  <p className="text-xs text-rose-400">
                    Passwords don&apos;t match
                  </p>
                )}
              </div>

              {/* Error */}
              {errorMsg && (
                <div className="flex gap-2 items-start p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-200 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  status === "loading" ||
                  !allRequirementsMet ||
                  password !== confirm
                }
                className="w-full py-4 bg-[var(--primary,#3b82f6)] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>

            <p className="text-center text-xs text-white/30">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-white/50 hover:text-white underline font-medium"
              >
                Back to Login
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
