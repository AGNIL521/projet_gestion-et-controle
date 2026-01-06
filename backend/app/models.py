from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class SalesRecord(BaseModel):
    date: date
    revenue: float
    units_sold: int
    region: str

class SalesDataInput(BaseModel):
    history: List[SalesRecord]

class ManualOverrideInput(BaseModel):
    current_revenue: float
    target: float

class PredictionResponse(BaseModel):
    next_month_revenue_forecast: float
    confidence_score: float
    trend: str  # "up", "down", "stable"
    alert: Optional[str] = None
