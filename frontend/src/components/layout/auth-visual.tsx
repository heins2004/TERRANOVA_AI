"use client";

import { HudBackground, HudCornerReadouts } from "@/components/hud/Hud";

type AuthVisualProps = { mode: "login" | "register" };

export function AuthVisual({ mode }: AuthVisualProps) {
  if (mode === "login") {
    return (
      <>
        <HudBackground />
        <HudCornerReadouts
          topLeft="SYS.INIT.SEQ // V.4.2.1"
          topRight="NET_ID: TERRA-NOVA-99"
          bottomLeft="SYSTEM STATUS: STABLE"
          bottomRight="ENCRYPTION: AES-256"
        />
      </>
    );
  }

  return (
    <>
      <HudBackground />
      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="absolute top-[32px] left-[32px] flex items-center gap-2 font-label-caps text-label-caps text-primary opacity-80">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          REGISTRATION GATEWAY: ACTIVE
        </div>
        <div className="absolute bottom-[32px] left-[32px] hidden font-data-mono text-xs tracking-widest text-primary opacity-80 md:block">
          ACCESS_LEVEL: STANDARD / ENCRYPTION: ACTIVE / NETWORK_ID: TERRANOVA_99
        </div>
        <div className="absolute bottom-[32px] right-[32px] hidden text-right font-data-mono text-xs text-outline-variant opacity-60 md:block">
          SYS.NODE.774 // SECURE_CHANNEL<br />DATA_STREAM: ENCRYPTED
        </div>
      </div>
    </>
  );
}

