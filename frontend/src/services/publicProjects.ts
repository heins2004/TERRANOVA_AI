const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type PublicProject = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  city: string | null;
  city_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  stage: string;
  response_deadline: string | null;
  days_left: number | null;
  halt_reason: string | null;
  is_demo: boolean;
  support_count: number;
  concern_count: number;
  neutral_count: number;
  participants: number;
};

export type PublicProjectsResponse = {
  items: PublicProject[];
  total: number;
  limit: number;
  offset: number;
};

export type PublicCommentReply = {
  id: number;
  author_name: string;
  badge: string | null;
  stance: string | null;
  body: string;
  created_at: string;
  parent_id?: number | null;
};

export type PublicComment = {
  id: number;
  author_name: string;
  badge: string | null;
  stance: string | null;
  body: string;
  created_at: string;
  parent_id?: number | null;
  replies: PublicCommentReply[];
};

export type ProjectFilters = {
  q?: string;
  category?: string;
  past?: boolean;
  sort?: "talk" | "new" | "soon";
  limit?: number;
  offset?: number;
};

export function formatIndianBudget(amount: number | null | undefined): string {
  if (amount == null) return "–";
  if (amount === 0) return "₹0";

  if (amount >= 10_000_000) {
    const cr = amount / 10_000_000;
    const formatted = Number.isInteger(cr)
      ? cr.toLocaleString("en-IN")
      : parseFloat(cr.toFixed(2)).toLocaleString("en-IN");
    return `₹${formatted} Cr`;
  }

  if (amount >= 100_000) {
    const lakh = amount / 100_000;
    const formatted = Number.isInteger(lakh)
      ? lakh.toLocaleString("en-IN")
      : parseFloat(lakh.toFixed(2)).toLocaleString("en-IN");
    return `₹${formatted} Lakh`;
  }

  return `₹${amount.toLocaleString("en-IN")}`;
}

export type BudgetTestCase = {
  input: number | null | undefined;
  expected: string;
};

export const BUDGET_TEST_CASES: BudgetTestCase[] = [
  { input: 1_860_000_000, expected: "₹186 Cr" },
  { input: 12_500_000_000, expected: "₹1,250 Cr" },
  { input: 240_000_000, expected: "₹24 Cr" },
  { input: 5_000_000, expected: "₹50 Lakh" },
  { input: 75_000, expected: "₹75,000" },
];

export function runBudgetTests(): {
  input: number | null | undefined;
  expected: string;
  actual: string;
  passed: boolean;
}[] {
  return BUDGET_TEST_CASES.map((tc) => {
    const actual = formatIndianBudget(tc.input);
    return {
      input: tc.input,
      expected: tc.expected,
      actual,
      passed: actual === tc.expected,
    };
  });
}

export async function listProjects(
  filters: ProjectFilters = {},
  signal?: AbortSignal
): Promise<PublicProjectsResponse> {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category && filters.category !== "All") params.set("category", filters.category);
  if (filters.past !== undefined) params.set("past", String(filters.past));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));

  const qs = params.toString();
  const url = `${API_BASE_URL}/api/public/projects${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    signal,
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail ?? `Failed to fetch public projects: ${response.status}`);
  }

  return response.json();
}

export async function getProject(
  id: number,
  signal?: AbortSignal
): Promise<PublicProject> {
  const url = `${API_BASE_URL}/api/public/projects/${id}`;
  const response = await fetch(url, {
    signal,
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail ?? `Failed to fetch project: ${response.status}`);
  }

  return response.json();
}

export async function listComments(
  id: number,
  options?: { limit?: number; offset?: number },
  signal?: AbortSignal
): Promise<PublicComment[]> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) params.set("limit", String(options.limit));
  if (options?.offset !== undefined) params.set("offset", String(options.offset));

  const qs = params.toString();
  const url = `${API_BASE_URL}/api/public/projects/${id}/comments${qs ? `?${qs}` : ""}`;
  const response = await fetch(url, {
    signal,
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail ?? `Failed to fetch comments: ${response.status}`);
  }

  return response.json();
}
