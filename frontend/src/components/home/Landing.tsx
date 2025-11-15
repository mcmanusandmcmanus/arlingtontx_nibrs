"use client";

import Link from "next/link";
import { ArrowLongRightIcon } from "@heroicons/react/24/outline";

import { AccountRequestForm } from "./account-request-form";

const districts = [
  {
    name: "East",
    slug: "east",
    beats: ["E1", "E2", "E3", "E4", "E5", "E6", "E7", "E8"],
    headline: "High-density residential + entertainment corridor",
  },
  {
    name: "North",
    slug: "north",
    beats: ["N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8"],
    headline: "Commercial hubs & university adjacency",
  },
  {
    name: "South",
    slug: "south",
    beats: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"],
    headline: "Industrial spine & logistics partners",
  },
  {
    name: "West",
    slug: "west",
    beats: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    headline: "Retail villages & stadium zone overlap",
  },
];

const journey = [
  { title: "Ingest", detail: "Paste or upload XLSX/CSV. Schema is detected and validated automatically." },
  { title: "Refresh", detail: "Manual 'single job' refresh ensures everyone knows when a dataset is live." },
  { title: "Analyze", detail: "EDA, anomaly scores, and tuned ML pipelines are generated for every column." },
  { title: "Deploy", detail: "Share dashboards, export KPIs, and publish to GitHub/Render for your district." },
];

export function Landing() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-10 lg:px-0">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-brand-900/70 via-slate-900 to-slate-950 p-10 shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Arlington Police - Data Empowerment</p>
        <div className="mt-6 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-6 lg:w-2/3">
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl">
              Command-ready dashboards that officers can refresh in minutes.
            </h1>
            <p className="text-lg text-slate-200">
              Select your district, upload spreadsheets or paste raw tables, and immediately explore KPIs, EDA, and machine
              learning diagnostics. Every beat becomes a data contributor.
            </p>
            <div className="flex flex-wrap gap-4 text-sm uppercase text-slate-300">
              <span className="rounded-full border border-white/10 px-4 py-2">Role-based access</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Manual refresh log</span>
              <span className="rounded-full border border-white/10 px-4 py-2">GIS overlays</span>
              <span className="rounded-full border border-white/10 px-4 py-2">ML lab</span>
            </div>
          </div>
          <div className="grid gap-4 rounded-2xl bg-white/5 p-6 backdrop-blur">
            <div>
              <p className="text-5xl font-black text-white">4</p>
              <p className="text-slate-300">districts live in pilot</p>
            </div>
            <div>
              <p className="text-5xl font-black text-white">8</p>
              <p className="text-slate-300">beats per district with linked uploads</p>
            </div>
            <div>
              <p className="text-5xl font-black text-accent">10</p>
              <p className="text-slate-300">uploads per week (avg) tracked</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-200">District Jump-off</p>
            <h2 className="text-3xl font-semibold text-white">Choose a district to enter the operational site.</h2>
          </div>
          <p className="hidden max-w-sm text-sm text-slate-300 lg:block">
            District selection routes directly into the full-stack site. Officers see only the beats granted via their
            profile.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {districts.map((district) => (
            <div key={district.slug} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm uppercase tracking-[0.4em] text-brand-200">{district.name} district</p>
                <span className="text-xs text-slate-400">Beats {district.beats.join(" - ")}</span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold text-white">{district.headline}</h3>
              <p className="mt-2 text-sm text-slate-300">
                Upload exports across patrol, investigations, property crimes, and special operations within this geography.
              </p>
              <Link
                href={`/district/${district.slug}`}
                className="mt-5 inline-flex items-center gap-2 text-brand-200 hover:text-brand-100"
              >
                Enter {district.name} Dashboard
                <ArrowLongRightIcon className="h-5 w-5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-card">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-200">Refresh blueprint</p>
            <h3 className="mt-4 text-3xl font-semibold text-white">Manual, transparent refresh steps.</h3>
            <p className="mt-4 text-slate-300">
              Officer uploads, manual review, refresh job trigger, GitHub/Render deployment note, and QA sign-off are all
              stamped per district. Everyone can see when the latest job started and finished.
            </p>
            <div className="mt-6 grid gap-4">
              {journey.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-200">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-200">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-200">Need access?</p>
            <h3 className="mt-4 text-3xl font-semibold text-white">Request an upload account.</h3>
            <p className="mt-4 text-slate-300">
              Civic partners and officers can request invites below. Command staff triages, approves, and assigns districts.
            </p>
            <AccountRequestForm />
          </div>
        </div>
      </section>
    </div>
  );
}
