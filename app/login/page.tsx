"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Input, Button, useToast } from "@/app/components/ui";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Email dan password wajib diisi.", "warning");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      showToast(error.message || "Login gagal, periksa kembali email dan password.", "error");
      setIsLoading(false);
      return;
    }

    showToast("Login berhasil! Mengalihkan ke dashboard...", "success");
    router.push("/");
    router.refresh();
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-soft mb-3">
            <Icon icon="solar:bill-list-bold" className="text-white text-2xl" />
          </div>
          <h1 className="font-semibold text-lg text-gray-900">Freelancer Invoice</h1>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl2 shadow-card p-7">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-400 mb-6">Masuk untuk mengelola invoice kamu.</p>

          <form className="space-y-4" onSubmit={handleLogin}>
            <Input
              label="Email"
              type="email"
              placeholder="you@email.com"
              icon="solar:letter-linear"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon="solar:lock-password-linear"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2 text-gray-500 text-xs">
                <input type="checkbox" className="rounded border-gray-300 text-brand-600 focus:ring-brand-300" />
                Remember me
              </label>
              <a href="#" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                Forgot password?
              </a>
            </div>

            <Button variant="primary" className="w-full mt-2" isLoading={isLoading} type="submit">
              Login
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand-600 font-medium hover:text-brand-700">
            Register
          </Link>
        </p>
      </div>
    </section>
  );
}
