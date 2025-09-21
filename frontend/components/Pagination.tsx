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
        className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        disabled={page === 1}
      >
        Anterior
      </button>
      <span className="text-sm text-gray-600">Página {page}</span>
      <button
        onClick={onNext}
        className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
      >
        Siguiente
      </button>
    </div>
  );
}