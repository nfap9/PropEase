export const REPORTS = {
  HEADING: 'reports-heading',
  YEAR_SELECT: 'reports-year-select',
  INCOME_TAB: 'reports-income-tab',
  OCCUPANCY_TAB: 'reports-occupancy-tab',
  OVERVIEW_TAB: 'reports-overview-tab',
} as const;

export const REPORT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'] as const;

export function getReportYearOptions() {
  return [2024, 2025, 2026];
}
