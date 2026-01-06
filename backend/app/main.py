from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from .models import SalesDataInput, PredictionResponse, SalesRecord, ManualOverrideInput
from .ml_engine import SalesForecaster, DataSimulator
from typing import List, Optional

app = FastAPI(title="PerfOptima AI API")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

forecaster = SalesForecaster()
# State Management
current_scenario_data = DataSimulator.generate_scenario("growth")
user_overrides: Optional[ManualOverrideInput] = None

@app.get("/")
def read_root():
    return {"message": "PerfOptima AI System Ready. Operational."}

@app.post("/api/override")
def set_override(data: ManualOverrideInput):
    """Sets manual values for current revenue and target."""
    global user_overrides, current_scenario_data
    user_overrides = data
    
    # Update the latest record in history to match user input
    if current_scenario_data:
        latest = current_scenario_data[-1]
        latest.revenue = data.current_revenue
        # Adjust units sold roughly based on new revenue
        latest.units_sold = int(data.current_revenue / 50)
        
    return {"message": "User overrides applied successfully."}

@app.post("/api/scenario/{scenario_type}")
def set_scenario(scenario_type: str):
    """
    Sets the active simulation scenario.
    Options: 'growth', 'decline', 'seasonal', 'volatile'
    """
    global current_scenario_data, user_overrides
    if scenario_type not in ["growth", "decline", "seasonal", "volatile"]:
        raise HTTPException(status_code=400, detail="Invalid scenario type")
    
    current_scenario_data = DataSimulator.generate_scenario(scenario_type)
    
    # If a user override exists, we ONLY keep the target, but RESET the revenue
    # This allows the new scenario's characteristics (Growth vs Decline) to actually show up
    if user_overrides:
        # We update the user_overrides object to reflect that we are no longer forcing revenue
        # But we keep the target the user set
        user_overrides.current_revenue = current_scenario_data[-1].revenue
        
    return {"message": f"Scenario switched to: {scenario_type.upper()}", "data_points": len(current_scenario_data)}

@app.get("/api/history", response_model=List[SalesRecord])
def get_history():
    """Returns the current historical data being used for analysis."""
    return current_scenario_data

@app.get("/api/current-status")
def get_current_status():
    """Returns the latest known performance metrics based on active scenario."""
    latest = current_scenario_data[-1]
    
    # Use user target if set, otherwise default
    target = user_overrides.target if user_overrides else 15000.0
    
    return {
        "current_month_revenue": latest.revenue,
        "target": target,
        "performance_gap": round(((latest.revenue - target) / target) * 100, 2)
    }

@app.get("/api/predict", response_model=PredictionResponse)
def predict_performance():
    """
    Analyzes the CURRENT active scenario and returns a forecast.
    """
    try:
        result = forecaster.predict(current_scenario_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
