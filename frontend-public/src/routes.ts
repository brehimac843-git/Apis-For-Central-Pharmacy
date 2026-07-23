export const ROUTES = {
  home: "/pharmahub",
  dashboard: "/pharmahub/dashboard",
  catalogue: "/pharmahub/catalogue",
  drugDetail: (drugName: string) =>
    `/pharmahub/catalogue/${encodeURIComponent(drugName)}`,
  history: "/pharmahub/history",
} as const

export type AppView = "search" | "catalogue" | "drug" | "history"

export function getViewFromPath(pathname: string): AppView {
  if (pathname.startsWith(ROUTES.history)) return "history"
  if (/^\/pharmahub\/catalogue\/[^/]+/.test(pathname)) return "drug"
  if (pathname.startsWith(ROUTES.catalogue)) return "catalogue"
  return "search"
}

export function getDrugNameFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/pharmahub\/catalogue\/(.+)$/)
  return match ? decodeURIComponent(match[1]) : null
}
