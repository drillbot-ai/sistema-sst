"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Submodule = { id: string; name: string; route?: string };
type AppModule = { id: string; name: string; order?: number; enabled?: boolean; submodules?: Submodule[] };

/**
 * Sidebar navigation for the SG‑SST system. Lists all top-level modules.
 * Active links are highlighted based on the current pathname.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const [modules, setModules] = useState<AppModule[]>([]);
  const loadModules = async () => {
    try {
      const res = await fetch('http://localhost:3002/api/settings/modules');
      const data = await res.json();
      const mods: AppModule[] = (data.modules || [])
        .filter((m: AppModule) => m.enabled !== false)
        .sort((a: AppModule, b: AppModule) => (a.order ?? 0) - (b.order ?? 0));
      setModules(mods);
    } catch (e) {}
  };
  useEffect(() => { loadModules(); }, []);
  useEffect(() => {
    const onUpdated = () => loadModules();
    const onVisible = () => { if (document.visibilityState === 'visible') loadModules(); };
    window.addEventListener('modules-updated', onUpdated);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('modules-updated', onUpdated);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  // Build groups: one group per enabled module (order preserved from backend). If a module has no submodules, show a disabled-looking placeholder.
  const groups = useMemo(() => {
    return modules.map(m => {
      const seen = new Set<string>();
      const items = (m.submodules || [])
        .filter(s => !!s.route)
        .filter(s => {
          const key = String(s.route);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map(s => ({ href: s.route as string, label: s.name }));
      // If there are no submodules with routes, add a non-clickable placeholder
      if (items.length === 0) {
        return { title: m.name, items: [{ href: '#', label: 'Sin submódulos' }] };
      }
      return { title: m.name, items };
    });
  }, [modules]);
  // Determine which group is active based on the current pathname
  const isItemActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  const activeGroupTitle = useMemo(() => {
    return (
      groups.find((g) => g.items.some((it) => isItemActive(it.href)))?.title || groups[0]?.title || ""
    );
  }, [pathname, groups]);

  // Single-open accordion: only one group expanded at a time
  const [openGroup, setOpenGroup] = useState<string>(activeGroupTitle);
  useEffect(() => {
    // Sync open group with route changes so the current module stays visible
    if (activeGroupTitle && activeGroupTitle !== openGroup) {
      setOpenGroup(activeGroupTitle);
    }
  }, [activeGroupTitle]);
  return (
    <aside className="hidden w-64 border-r border-gray-200 bg-white md:block">
      <nav className="space-y-4 p-3">
        {groups.map((group) => {
          const expanded = openGroup === group.title;
          return (
            <div key={group.title}>
              <button
                type="button"
                onClick={() => setOpenGroup(group.title)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 hover:bg-gray-50"
                aria-expanded={expanded}
              >
                <span>{group.title}</span>
                <span className={`transition-transform ${expanded ? "rotate-90" : "rotate-0"}`}>▸</span>
              </button>
              {expanded && (
                <div className="mt-1 space-y-1">
                  {group.items.map(({ href, label }) => {
                    const active = isItemActive(href);
                    // Placeholder entries are not clickable
                    if (href === '#') {
                      return (
                        <div key={`${group.title}-empty`} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-400">
                          {label}
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "border border-blue-600 bg-blue-50 text-blue-700"
                            : "border border-transparent text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
