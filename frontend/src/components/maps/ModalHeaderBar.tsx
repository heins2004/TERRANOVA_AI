"use client";

interface ModalHeaderBarProps {
  mode: "gov" | "planner";
  tileMode: "dark" | "satellite";
  onToggleTileMode: () => void;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  onSearchSubmit: (e?: React.FormEvent) => void;
  isSearching: boolean;
  onClose: () => void;
}

export function ModalHeaderBar({
  mode,
  tileMode,
  onToggleTileMode,
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  isSearching,
  onClose,
}: ModalHeaderBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between border-b border-white/10 bg-black/50 px-4 py-3 gap-2">
      <div className="flex items-center gap-3">
        <h3 className="font-display-md text-sm font-semibold uppercase tracking-wider text-primary">
          {mode === "gov" ? "Site Area Center & Radius Picker" : "Site Location Pin Picker"}
        </h3>
        <button
          type="button"
          id="map-modal-layer-toggle"
          onClick={onToggleTileMode}
          className="rounded border border-white/20 bg-white/5 px-2.5 py-1 font-data-mono text-[11px] uppercase tracking-wider text-foreground hover:bg-white/10"
        >
          {tileMode === "dark" ? "Satellite View" : "Dark View"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={onSearchSubmit} className="flex items-center gap-1">
          <input
            type="text"
            id="map-modal-search-input"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search place in India..."
            className="w-44 sm:w-56 rounded border border-white/20 bg-white/5 px-2.5 py-1 font-data-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            id="map-modal-search-btn"
            onClick={() => onSearchSubmit()}
            disabled={isSearching}
            className="rounded border border-primary/40 bg-primary/10 px-2.5 py-1 font-data-mono text-xs text-primary hover:bg-primary/20"
          >
            {isSearching ? "..." : "Search"}
          </button>
        </form>
        <button
          type="button"
          id="map-modal-close-btn"
          onClick={onClose}
          aria-label="Close full map"
          className="rounded p-1 text-on-surface-variant hover:bg-white/10 hover:text-foreground"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
