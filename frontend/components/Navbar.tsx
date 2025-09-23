"use client";

import Link from "next/link";

/**
 * Top navigation bar for the SG‑SST system. Displays a logo and a search bar.
 * This component uses client-side rendering to allow interactions like search.
 */
export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-fg)' }}>
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Logo placeholder */}
          <div className="h-8 w-8 rounded-xl" style={{ backgroundColor: 'var(--color-primary)' }} />
          <Link href="/" className="text-lg font-semibold" style={{ color: 'var(--color-fg)' }}>
            Sistema SG‑SST
          </Link>
          <span className="hidden text-xs sm:block" style={{ color: 'var(--color-fg)' }}>Transporte</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Global search input (non functional placeholder) */}
          <div className="hidden items-center gap-2 border px-3 py-2 md:flex" style={{ borderColor: 'var(--color-border)', borderRadius: 'var(--radius-base)' }}>
            <input
              type="text"
              placeholder="Buscar…"
              className="w-64 border-none bg-transparent text-sm placeholder-gray-400 focus:outline-none"
              style={{ color: 'var(--color-fg)' }}
              onFocus={(e) => (e.currentTarget.parentElement!.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--focus-ring) 30%, transparent)')}
              onBlur={(e) => (e.currentTarget.parentElement!.style.boxShadow = 'none')}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
