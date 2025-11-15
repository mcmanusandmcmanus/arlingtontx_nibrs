"use client";

import { FormEvent, useState } from "react";

import { requestAccess } from "@/lib/api";

const districtOptions = ["east", "north", "south", "west"];

export function AccountRequestForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    try {
      setLoading(true);
      setStatus(null);
      await requestAccess({
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        organization: payload.organization,
        message: payload.message,
        district: payload.district || null,
      });
      form.reset();
      setStatus("Request submitted. Command staff will reach out shortly.");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-slate-300">
          First name
          <input name="firstName" required className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white" />
        </label>
        <label className="text-sm text-slate-300">
          Last name
          <input name="lastName" required className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white" />
        </label>
      </div>
      <label className="text-sm text-slate-300">
        Email
        <input
          name="email"
          required
          type="email"
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
        />
      </label>
      <label className="text-sm text-slate-300">
        Organization / Unit
        <input name="organization" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white" />
      </label>
      <label className="text-sm text-slate-300">
        District interest
        <select
          name="district"
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
          defaultValue=""
        >
          <option value="">Any / not sure</option>
          {districtOptions.map((district) => (
            <option key={district} value={district}>
              {district.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-slate-300">
        How will you use the platform?
        <textarea
          name="message"
          rows={3}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-brand-500 px-4 py-3 text-center font-semibold text-white shadow-card disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Request account"}
      </button>
      {status && <p className="text-sm text-slate-200">{status}</p>}
    </form>
  );
}
