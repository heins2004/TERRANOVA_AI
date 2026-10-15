"use client";

interface ModalFooterGovProps {
  mode: "gov";
  draftCenterLat: number | null;
  draftCenterLng: number | null;
  draftRadiusKm: number;
  radiusInput: string;
  radiusError: string;
  onClearCenter: () => void;
  onSliderChange: (val: number) => void;
  onRadiusInputChange: (val: string) => void;
}

interface ModalFooterPlannerProps {
  mode: "planner";
  draftPinLat: number | null;
  draftPinLng: number | null;
  outsideMsg: string;
}

export type ModalFooterControlsProps = (ModalFooterGovProps | ModalFooterPlannerProps) & {
  onCancel: () => void;
  onConfirm: () => void;
};

export function ModalFooterControls(props: ModalFooterControlsProps) {
  return (
    <div className="border-t border-white/10 bg-black/60 p-3 sm:px-4 sm:py-3 space-y-2">
      {props.mode === "gov" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 font-data-mono text-xs">
          <div className="flex items-center gap-3">
            <span id="map-modal-center-readout" className="text-foreground">
              Centre: {props.draftCenterLat != null && props.draftCenterLng != null
                ? `${props.draftCenterLat.toFixed(4)}, ${props.draftCenterLng.toFixed(4)}`
                : "None"}
            </span>
            {props.draftCenterLat != null && (
              <button
                type="button"
                id="map-modal-clear-btn"
                onClick={props.onClearCenter}
                className="text-danger hover:underline"
              >
                Clear centre
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Radius:</span>
            <input
              type="range"
              id="map-modal-radius-slider"
              min="0.5"
              max="50"
              step="0.5"
              value={props.draftRadiusKm}
              onChange={(e) => props.onSliderChange(parseFloat(e.target.value))}
              className="w-24 sm:w-32"
            />
            <input
              type="number"
              id="map-modal-radius-input"
              min="0.5"
              max="50"
              step="0.1"
              value={props.radiusInput}
              onChange={(e) => props.onRadiusInputChange(e.target.value)}
              className="w-16 rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-center text-foreground"
            />
            <span>km</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 font-data-mono text-xs">
          <span id="map-modal-pin-readout" className="text-foreground">
            Pin: {props.draftPinLat != null && props.draftPinLng != null
              ? `${props.draftPinLat.toFixed(4)}, ${props.draftPinLng.toFixed(4)}`
              : "None (click inside circle)"}
          </span>
          {props.outsideMsg && (
            <span id="map-modal-outside-click-msg" className="text-danger">
              {props.outsideMsg}
            </span>
          )}
        </div>
      )}

      {props.mode === "gov" && props.radiusError && (
        <p id="map-modal-radius-error" className="font-data-mono text-[11px] text-danger">
          {props.radiusError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          id="map-modal-cancel-btn"
          onClick={props.onCancel}
          className="rounded border border-white/20 bg-transparent px-4 py-1.5 font-data-mono text-xs uppercase tracking-wider text-foreground hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="button"
          id="map-modal-confirm-btn"
          onClick={props.onConfirm}
          className="rounded border border-primary/50 bg-primary/20 px-4 py-1.5 font-data-mono text-xs uppercase tracking-wider text-primary hover:bg-primary/30"
        >
          Confirm location
        </button>
      </div>
    </div>
  );
}
