export const queryKeys = {
  products: () => ['products'] as const,
  categories: () => ['categories'] as const,
  customers: () => ['customers'] as const,
  dashboardShell: () => ['dashboard', 'shell'] as const,
  dashboardMetrics: (filtersKey: string) => ['dashboard', 'metrics', filtersKey] as const,
  dashboard: (filtersKey: string) => ['dashboard', filtersKey] as const,
  dashboardLive: (filtersKey: string) => ['dashboard', 'live', filtersKey] as const,
  dashboardTrend: (filtersKey: string) => ['dashboard', 'trend', filtersKey] as const,
  posQuickPicks: () => ['pos-quick-picks'] as const,
  posSearch: (q: string) => ['pos-search', q] as const,
  heldBills: () => ['held-bills'] as const,
}
