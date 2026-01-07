export interface SalesRecord {
  date: string;
  revenue: number;
  units_sold: number;
  region: string;
}

export interface PredictionResponse {
  next_month_revenue_forecast: number;
  confidence_score: number;
  trend: "up" | "down" | "stable";
  alert: string | null;
}

export interface StatusResponse {
  current_month_revenue: number;
  target: number;
  performance_gap: number;
}

export interface ManualOverrideInput {
  current_revenue: number;
  target: number;
}
