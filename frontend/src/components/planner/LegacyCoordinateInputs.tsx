"use client";

interface LegacyCoordinateInputsProps {
  siteLat: string;
  siteLng: string;
  onLatChange: (val: string) => void;
  onLngChange: (val: string) => void;
  latError?: string;
  lngError?: string;
}

export function LegacyCoordinateInputs({
  siteLat,
  siteLng,
  onLatChange,
  onLngChange,
  latError,
  lngError,
}: LegacyCoordinateInputsProps) {
  return (
    <div className="grid gap-[16px] sm:grid-cols-2">
      <div>
        <label className="block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
          Latitude (6.0 - 38.0)
        </label>
        <input
          type="number"
          id="planner-site-lat"
          step="0.0001"
          placeholder="e.g. 28.6139"
          value={siteLat}
          onChange={(e) => onLatChange(e.target.value)}
          className="mt-[6px] w-full rounded border border-white/15 bg-white/[0.03] px-[14px] py-[10px] font-data-mono text-sm text-foreground focus:border-primary-container/80 focus:outline-none"
        />
        {latError && <p className="mt-[4px] font-data-mono text-[11px] text-danger">{latError}</p>}
      </div>

      <div>
        <label className="block font-data-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
          Longitude (68.0 - 98.0)
        </label>
        <input
          type="number"
          id="planner-site-lng"
          step="0.0001"
          placeholder="e.g. 77.2090"
          value={siteLng}
          onChange={(e) => onLngChange(e.target.value)}
          className="mt-[6px] w-full rounded border border-white/15 bg-white/[0.03] px-[14px] py-[10px] font-data-mono text-sm text-foreground focus:border-primary-container/80 focus:outline-none"
        />
        {lngError && <p className="mt-[4px] font-data-mono text-[11px] text-danger">{lngError}</p>}
      </div>
    </div>
  );
}
