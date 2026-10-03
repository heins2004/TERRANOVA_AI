import { InfrastructureAsset } from "@/services/infrastructure";
import { ConditionBadge } from "./ConditionBadge";
export function AssetCard({ asset }: { asset: InfrastructureAsset }) {
  return (
    <article className="glass-card rounded-xl p-[20px] sm:p-[24px]">
      <div className="flex items-start justify-between gap-[12px] sm:gap-[16px]">
        <div className="min-w-0 flex-1">
          <p className="font-data-mono text-[11px] uppercase tracking-[0.16em] text-on-surface-variant">
            {asset.asset_type ?? "Infrastructure"}
          </p>
          <h2 className="mt-[8px] font-display-md text-[20px] sm:text-[22px] text-on-surface break-all">
            {asset.name}
          </h2>
        </div>
        <div className="shrink-0">
          <ConditionBadge condition={asset.condition} />
        </div>
      </div>
      <p className="mt-[20px] border-t border-white/10 pt-[16px] font-data-mono text-[11px] text-on-surface-variant break-words">
        {asset.last_inspected_at
          ? `LAST INSPECTED ${asset.last_inspected_at}`
          : "INSPECTION DATE PENDING"}
      </p>
    </article>
  );
}
