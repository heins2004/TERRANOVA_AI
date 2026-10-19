"use client";

import { useEffect, useState } from "react";
import { getLoginLog, LoginLogItem } from "@/services/admin";

export function AdminLoginLogSection() {
  const [items, setItems] = useState<LoginLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getLoginLog({ limit, offset: (page - 1) * limit })
      .then((res) => {
        if (active) {
          setItems(res.items);
          setTotal(res.total);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load login history");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(total, page * limit);

  return (
    <section id="admin-login-log-section" className="glass-card rounded-[20px] p-[24px] border border-white/10 mt-[24px]">
      <div className="flex flex-wrap items-center justify-between gap-[16px] pb-[16px] border-b border-white/10">
        <div>
          <span className="font-data-mono text-[11px] font-semibold tracking-wider text-primary uppercase">
            Audit Log // Authentication
          </span>
          <h2 className="text-xl font-bold font-display-md text-foreground mt-[2px]">Login History</h2>
          <p className="mt-[4px] text-[12px] text-on-surface-variant">
            Note: Login history tracking starts from the day this feature was added.
          </p>
        </div>

        <div className="flex items-center gap-[8px] text-[12px] font-data-mono text-on-surface-variant">
          <span>Show:</span>
          <select
            id="login-log-limit-select"
            value={limit}
            onChange={(e) => {
              setLoading(true);
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="h-[32px] px-[8px] rounded-[6px] bg-surface-muted/60 border border-white/15 text-foreground focus:outline-none focus:border-primary text-[12px]"
          >
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="py-[32px] text-center text-danger font-data-mono text-[12px]">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto mt-[16px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-data-mono uppercase tracking-wider text-on-surface-variant">
                <th className="py-[12px] px-[12px]">User</th>
                <th className="py-[12px] px-[12px]">Role</th>
                <th className="py-[12px] px-[12px]">Time</th>
                <th className="py-[12px] px-[12px]">Browser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[13px]">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-[32px] text-center text-on-surface-variant font-data-mono text-[12px]">
                    LOADING LOGIN AUDIT…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-[32px] text-center text-on-surface-variant font-data-mono text-[12px]">
                    No logins recorded yet
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-[10px] px-[12px]">
                      <span className="font-semibold text-foreground">{item.full_name}</span>
                      <span className="block text-[11px] font-data-mono text-on-surface-variant/70">
                        UID: #{item.user_id}
                      </span>
                    </td>
                    <td className="py-[10px] px-[12px]">
                      <span className="inline-block px-[8px] py-[2px] rounded-[6px] bg-surface-muted/60 border border-white/10 text-[11px] font-sans font-medium text-foreground">
                        {item.role}
                      </span>
                    </td>
                    <td className="py-[10px] px-[12px] font-data-mono text-[12px] text-foreground">
                      {item.logged_in_at ? item.logged_in_at.replace("T", " ").slice(0, 19) : "—"}
                    </td>
                    <td className="py-[10px] px-[12px] font-data-mono text-[12px] text-on-surface-variant">
                      <span className="inline-flex items-center gap-[4px] px-[8px] py-[2px] rounded bg-white/5 border border-white/10 text-[11px]">
                        {item.browser || "Other"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-[16px] pt-[16px] mt-[12px] border-t border-white/10 text-[12px] font-data-mono text-on-surface-variant">
        <div>Showing {startIdx}–{endIdx} of {total} logins</div>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            id="login-log-prev-page-btn"
            disabled={page <= 1}
            onClick={() => {
              setLoading(true);
              setPage((p) => Math.max(1, p - 1));
            }}
            className="px-[10px] py-[4px] rounded-[6px] border border-white/15 bg-surface-muted/60 hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            id="login-log-next-page-btn"
            disabled={page >= totalPages}
            onClick={() => {
              setLoading(true);
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            className="px-[10px] py-[4px] rounded-[6px] border border-white/15 bg-surface-muted/60 hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
