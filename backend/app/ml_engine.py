import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import make_pipeline
from datetime import date, timedelta
from .models import SalesRecord, PredictionResponse

class DataSimulator:
    """
    Generates realistic sales data based on different business scenarios.
    """
    @staticmethod
    def generate_scenario(scenario_type: str = "growth", months: int = 24) -> list[SalesRecord]:
        base_revenue = 10000
        data = []
        today = date.today()
        
        # Create a date range ending today
        dates = [today - timedelta(days=30 * i) for i in range(months)]
        dates.reverse() # Oldest to newest
        
        for i, d in enumerate(dates):
            t = i  # Time step
            noise = np.random.normal(0, 500) # Random noise
            
            if scenario_type == "growth":
                # Linear growth + slight seasonality
                revenue = base_revenue + (t * 500) + (np.sin(t / 2) * 1000) + noise
            elif scenario_type == "decline":
                # Linear decline after a peak
                revenue = base_revenue + 5000 - (t * 400) + (np.sin(t / 2) * 1000) + noise
            elif scenario_type == "seasonal":
                # Strong seasonality (e.g., holiday spikes)
                revenue = base_revenue + (np.sin(t / 1.5) * 4000) + (t * 100) + noise
            elif scenario_type == "volatile":
                # High randomness
                revenue = base_revenue + (t * 100) + np.random.normal(0, 2000)
            else:
                revenue = base_revenue
                
            # Ensure no negative revenue
            revenue = max(revenue, 2000)
            
            data.append(SalesRecord(
                date=d,
                revenue=round(revenue, 2),
                units_sold=int(revenue / 50), # Approx price $50
                region="Global"
            ))
            
        return data

class SalesForecaster:
    def __init__(self):
        self.models = {
            "linear": LinearRegression(),
            "polynomial": make_pipeline(PolynomialFeatures(degree=2), LinearRegression()),
            "polynomial_high": make_pipeline(PolynomialFeatures(degree=3), LinearRegression())
        }
    
    def predict(self, history: list[SalesRecord], model_type: str = "linear") -> PredictionResponse:
        if not history:
            return PredictionResponse(
                next_month_revenue_forecast=0.0,
                confidence_score=0.0,
                trend="stable",
                alert="No data provided"
            )

        # Convert to DataFrame
        df = pd.DataFrame([h.dict() for h in history])
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        
        # Feature Engineering
        df['date_ordinal'] = df['date'].map(pd.Timestamp.toordinal)
        df['month_index'] = range(len(df))
        
        X = df[['month_index']]
        y = df['revenue']

        # WEIGHTED LINEAR REGRESSION LOGIC
        # Give higher weight to recent data points to make the model reactive
        # Weights grow exponentially: 1, 1.1, 1.21...
        weights = np.power(1.15, df['month_index'])
        
        # Select and Train Model
        model = self.models.get(model_type, self.models["linear"])
        
        # Handle sample_weight for Pipeline vs Regressor
        if hasattr(model, 'fit'):
             # Pipelines accept fit params via **kwargs, but simpler to just try/except or check type
             # Standard LinearRegression accepts sample_weight directly
             # Pipeline: step_name__sample_weight
             if "pipeline" in str(type(model)).lower():
                 # For pipeline, we pass weights to the 'linearregression' step
                 model.fit(X, y, linearregression__sample_weight=weights)
             else:
                 model.fit(X, y, sample_weight=weights)
        
        # Predict next month
        next_index = len(df)
        prediction = model.predict(pd.DataFrame({'month_index': [next_index]}))[0]
        
        # Calculate Trend
        # Compare prediction to the LAST ACTUAL value, not just the slope
        last_actual = df['revenue'].iloc[-1]
        
        # Slope calculation depends on model, so we use point-to-point comparison for robustness
        if prediction > last_actual * 1.05:
            trend = "up"
        elif prediction < last_actual * 0.95:
            trend = "down"
        else:
            trend = "stable"
        
        # Logic for Alerts & Confidence
        # Calculate R-squared (simple confidence metric)
        if "pipeline" in str(type(model)).lower():
            r2_score = model.score(X, y, linearregression__sample_weight=weights)
        else:
            r2_score = model.score(X, y, sample_weight=weights)
        
        # Linearity Check: Calculate standard deviation of residuals
        predictions_on_history = model.predict(X)
        residuals = y - predictions_on_history
        residual_std = np.std(residuals)
        mean_revenue = np.mean(y)
        
        # Coefficient of Variation of the RMSE (CV-RMSE) approach for confidence
        # If residuals are large compared to the mean, confidence drops
        error_ratio = residual_std / mean_revenue
        
        # Base confidence on R2 but heavily penalized by error ratio
        confidence = r2_score
        
        if error_ratio > 0.15: # If error is >15% of the revenue
            confidence -= (error_ratio * 2) # Heavy penalty
            
        # Adjust confidence based on recent volatility (Short term stability)
        last_3_std = df['revenue'].tail(3).std()
        if last_3_std > 2000:
            confidence -= 0.25 # Penalize for high short-term volatility

        # Allow confidence to drop lower for realism, but cap at 95%
        confidence = max(min(confidence, 0.95), 0.10)

        # Smart Alerts Logic
        alert = None
        
        # Detect immediate crash (Current vs Previous)
        if len(df) >= 2:
            prev_actual = df['revenue'].iloc[-2]
            if last_actual < prev_actual * 0.7:
                 alert = "CRITICAL: Sudden revenue crash detected (-30%)."
        
        # If no crash, check forecast
        if not alert:
            if prediction < last_actual * 0.8:
                alert = "WARNING: Forecast indicates steep decline next month."
            elif prediction > last_actual * 1.2:
                # Distinguish between "Growth" and "Recovery"
                recent_max = df['revenue'].tail(6).max()
                if prediction < recent_max:
                    alert = "INSIGHT: Recovery phase expected. Rebound in progress."
                else:
                    alert = "OPPORTUNITY: New record growth predicted. Prepare inventory."
            elif confidence < 0.5:
                alert = "CAUTION: Market volatility high. Forecast uncertain."
            
        return PredictionResponse(
            next_month_revenue_forecast=round(prediction, 2),
            confidence_score=round(confidence, 2),
            trend=trend,
            alert=alert
        )
