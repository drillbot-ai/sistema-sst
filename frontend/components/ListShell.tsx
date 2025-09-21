"use client";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { ReactNode } from "react";

/**
 * Layout wrapper for list pages. Provides the navbar, sidebar and a top section for
 * header, actions and KPI metrics. The main content is rendered via the children prop.
 */
export default function ListShell({
  title,
  subtitle,
  actions,
  kpis,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  kpis?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[16rem_1fr] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex-shrink-0">{actions}</div>}
          </div>
          {kpis}
          {children}
        </main>
      </div>
    </div>
  );
}