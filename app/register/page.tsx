"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Input, Button, useToast } from "@/app/components/ui";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password) {
      showToast("Semua kolom wajib diisi.", "warning");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Password dan konfirmasi password tidak cocok.", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password minimal 6 karakter.", "warning");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const origin = window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      showToast(error.message || "Registrasi gagal, silakan coba lagi.", "error");
      setIsLoading(false);
      return;
    }

    showToast("Akun berhasil dibuat! Silakan cek email untuk konfirmasi.", "success");
    router.push("/login");
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
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h2>
          <p className="text-sm text-gray-400 mb-6">Mulai kelola klien dan invoice-mu.</p>

          <form className="space-y-4" onSubmit={handleRegister}>
            <Input
              label="Full name"
              type="text"
              placeholder="Ridho Hidayat"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button variant="primary" className="w-full mt-2" isLoading={isLoading} type="submit">
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}
