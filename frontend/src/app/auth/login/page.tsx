"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    try {
      setLoading(true);
      setError(null);
      await login(username, password);
      router.push("/district/east");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 shadow-card">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-brand-200">Secure Sign-in</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Officer / analyst login</h1>
        <p className="mt-2 text-slate-300">
          Accounts are reviewed by command staff. Two-factor enforcement coming soon via Azure AD.
        </p>
      </div>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="text-sm text-slate-300">
          Email / username
          <input
            name="username"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
        <label className="text-sm text-slate-300">
          Password
          <input
            name="password"
            type="password"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white shadow-card disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Enter secure area"}
        </button>
        {error && <p className="text-sm text-rose-300">{error}</p>}
      </form>
    </div>
  );
}
