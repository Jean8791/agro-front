/** Um degrau do breadcrumb. */
export interface Step {
  label: string;
  /** Sem url, o degrau é o atual e não vira link. */
  url?: string;
}
