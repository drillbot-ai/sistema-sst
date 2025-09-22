"use client";

import Link from "next/link";

/**
 * Top navigation bar for the SG‑SST system. Displays a logo and a search bar.
 * This component uses client-side rendering to allow interactions like search.
 */
export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Logo placeholder */}
          <div className="h-8 w-8 rounded-xl bg-blue-600" />
          <Link href="/" className="text-lg font-semibold text-gray-800">
            Sistema SG‑SST
          </Link>
          <span className="hidden text-xs text-gray-500 sm:block">Transporte</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Global search input (non functional placeholder) */}
          <div className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 md:flex">
            <input
              type="text"
              placeholder="Buscar…"
              className="w-64 border-none bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
