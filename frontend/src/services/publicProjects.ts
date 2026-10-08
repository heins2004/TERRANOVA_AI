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
  is_mine?: boolean;
  can_delete?: boolean;
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
  is_mine?: boolean;
  can_delete?: boolean;
};

export type ProjectFilters = {
  q?: string;
  category?: string;
  past?: boolean;
  sort?: "talk" | "new" | "soon";
  limit?: number;
  offset?: number;
};

export function formatIndianBudget(amount: unknown): string {
  if (
    amount == null ||
    typeof amount !== "number" ||
    isNaN(amount) ||
    amount < 0
  ) {
    return "Not announced";
  }

  if (amount === 0) return "₹0";

  function formatNumber(num: number): string {
    const rounded = Math.round(num * 100) / 100;
    const parts = rounded.toString().split(".");
    const intPart = parseInt(parts[0], 10).toLocaleString("en-IN");
    return parts.length > 1 ? `${intPart}.${parts[1]}` : intPart;
  }

  if (amount >= 10_000_000) {
    const cr = amount / 10_000_000;
    return `₹${formatNumber(cr)} Cr`;
  }

  if (amount >= 100_000) {
    const roundedLakh = Math.round((amount / 100_000) * 100) / 100;
    if (roundedLakh >= 100) {
      const cr = amount / 10_000_000;
      return `₹${formatNumber(cr)} Cr`;
    }
    return `₹${formatNumber(roundedLakh)} Lakh`;
  }

  const rounded = Math.round(amount * 100) / 100;
  return `₹${rounded.toLocaleString("en-IN")}`;
}

export type BudgetTestCase = {
  input: unknown;
  expected: string;
};

export const BUDGET_TEST_CASES: BudgetTestCase[] = [
  { input: 0, expected: "₹0" },
  { input: 99999, expected: "₹99,999" },
  { input: 100000, expected: "₹1 Lakh" },
  { input: 150000, expected: "₹1.5 Lakh" },
  { input: 9999999, expected: "₹1 Cr" },
  { input: 10000000, expected: "₹1 Cr" },
  { input: 125000000, expected: "₹12.5 Cr" },
  { input: 186000000, expected: "₹18.6 Cr" },
  { input: 1860000000, expected: "₹186 Cr" },
  { input: 12500000000, expected: "₹1,250 Cr" },
  { input: null, expected: "Not announced" },
  { input: -5, expected: "Not announced" },
  { input: NaN, expected: "Not announced" },
  { input: "abc", expected: "Not announced" },
];

export function runBudgetTests(): {
  input: unknown;
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
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail ?? `Failed to fetch comments: ${response.status}`);
  }

  return response.json();
}
