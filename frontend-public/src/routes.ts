export const ROUTES = {
  home: "/pharmacare",
  dashboard: "/pharmacare/dashboard",
  catalogue: "/pharmacare/catalogue",
  drugDetail: (drugName: string) =>
    `/pharmacare/catalogue/${encodeURIComponent(drugName)}`,
  history: "/pharmacare/history",
} as const

export type AppView = "search" | "catalogue" | "drug" | "history"

export function getViewFromPath(pathname: string): AppView {
  if (pathname.startsWith(ROUTES.history)) return "history"
  if (/^\/pharmacare\/catalogue\/[^/]+/.test(pathname)) return "drug"
  if (pathname.startsWith(ROUTES.catalogue)) return "catalogue"
  return "search"
}

export function getDrugNameFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/pharmacare\/catalogue\/(.+)$/)
  return match ? decodeURIComponent(match[1]) : null
}
