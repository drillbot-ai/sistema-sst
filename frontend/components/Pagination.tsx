"use client";

/**
 * A simple pagination component with previous/next buttons and page number display.
 */
export default function Pagination({
  page,
  onPrev,
  onNext,
}: {
  page: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrev}
        className="border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 focus:outline-none"
        style={{ borderRadius: 'var(--radius-base)' }}
        onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--focus-ring) 30%, transparent)')}
        onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
        disabled={page === 1}
      >
        Anterior
      </button>
      <span className="text-sm text-gray-600">Página {page}</span>
      <button
        onClick={onNext}
        className="border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
        style={{ borderRadius: 'var(--radius-base)' }}
        onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px color-mix(in srgb, var(--focus-ring) 30%, transparent)')}
        onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
      >
        Siguiente
      </button>
    </div>
  );
}
