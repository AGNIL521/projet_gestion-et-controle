from fastapi import FastAPI, HTTPException, Body, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import uvicorn
import pandas as pd
import io

from .models import SalesDataInput, PredictionResponse, SalesRecord, ManualOverrideInput
from .ml_engine import SalesForecaster, DataSimulator
from .database import engine, get_db, Base
from .sql_models import SalesRecordDB, SystemStateDB

# Create Tables
Base.metadata.create_all(bind=engine)

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

def init_db(db: Session):
    """Initialize DB with default data if empty"""
    if db.query(SalesRecordDB).count() == 0:
        default_data = DataSimulator.generate_scenario("growth")
        for record in default_data:
            db_record = SalesRecordDB(
                date=record.date,
                revenue=record.revenue,
                units_sold=record.units_sold,
                region=record.region
            )
            db.add(db_record)
        
        # Set default scenario state
        db.add(SystemStateDB(key="current_scenario", value="growth"))
        db.add(SystemStateDB(key="target", value="15000.0"))
        db.commit()

@app.on_event("startup")
def on_startup():
    db = next(get_db())
    init_db(db)

@app.get("/")
def read_root():
    return {"message": "PerfOptima AI System Ready. Operational (Persistent Mode)."}

@app.post("/api/upload")
async def upload_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Uploads a CSV file to replace the current dataset.
    CSV Format: date (YYYY-MM-DD), revenue, units_sold, region
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV.")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Validation
        required_cols = ['date', 'revenue', 'units_sold', 'region']
        if not all(col in df.columns for col in required_cols):
             raise HTTPException(status_code=400, detail=f"Missing columns. Required: {required_cols}")
        
        # Clear existing data
        db.query(SalesRecordDB).delete()
        
        # Insert new data
        for _, row in df.iterrows():
            db_record = SalesRecordDB(
                date=pd.to_datetime(row['date']).date(),
                revenue=float(row['revenue']),
                units_sold=int(row['units_sold']),
                region=str(row['region'])
            )
            db.add(db_record)
        
        # Update System State to 'custom'
        scenario_setting = db.query(SystemStateDB).filter(SystemStateDB.key == "current_scenario").first()
        if scenario_setting:
            scenario_setting.value = "custom"
        
        db.commit()
        return {"message": "Data uploaded successfully", "records_processed": len(df)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@app.post("/api/override")
def set_override(data: ManualOverrideInput, db: Session = Depends(get_db)):
    """Sets manual values for current revenue and target."""
    
    # Update Target in System State
    target_setting = db.query(SystemStateDB).filter(SystemStateDB.key == "target").first()
    if not target_setting:
        target_setting = SystemStateDB(key="target", value=str(data.target))
        db.add(target_setting)
    else:
        target_setting.value = str(data.target)
    
    # Update Latest Revenue Record
    latest_record = db.query(SalesRecordDB).order_by(SalesRecordDB.date.desc()).first()
    if latest_record:
        latest_record.revenue = data.current_revenue
        latest_record.units_sold = int(data.current_revenue / 50)
    
    db.commit()
        
    return {"message": "User overrides applied successfully."}

@app.post("/api/scenario/{scenario_type}")
def set_scenario(scenario_type: str, db: Session = Depends(get_db)):
    """
    Sets the active simulation scenario.
    Options: 'growth', 'decline', 'seasonal', 'volatile'
    """
    if scenario_type not in ["growth", "decline", "seasonal", "volatile"]:
        raise HTTPException(status_code=400, detail="Invalid scenario type")
    
    # Update System State
    scenario_setting = db.query(SystemStateDB).filter(SystemStateDB.key == "current_scenario").first()
    if not scenario_setting:
        scenario_setting = SystemStateDB(key="current_scenario", value=scenario_type)
        db.add(scenario_setting)
    else:
        scenario_setting.value = scenario_type
    
    # Regenerate Data
    # 1. Clear existing data
    db.query(SalesRecordDB).delete()
    
    # 2. Generate new data
    new_data = DataSimulator.generate_scenario(scenario_type)
    for record in new_data:
        db_record = SalesRecordDB(
            date=record.date,
            revenue=record.revenue,
            units_sold=record.units_sold,
            region=record.region
        )
        db.add(db_record)
    
    db.commit()
        
    return {"message": f"Scenario switched to: {scenario_type.upper()}", "data_points": len(new_data)}

@app.get("/api/history", response_model=List[SalesRecord])
def get_history(db: Session = Depends(get_db)):
    """Returns the current historical data being used for analysis."""
    records = db.query(SalesRecordDB).order_by(SalesRecordDB.date.asc()).all()
    return [SalesRecord(
        date=r.date,
        revenue=r.revenue,
        units_sold=r.units_sold,
        region=r.region
    ) for r in records]

@app.get("/api/current-status")
def get_current_status(db: Session = Depends(get_db)):
    """Returns the latest known performance metrics based on active scenario."""
    latest = db.query(SalesRecordDB).order_by(SalesRecordDB.date.desc()).first()
    target_setting = db.query(SystemStateDB).filter(SystemStateDB.key == "target").first()
    
    if not latest:
        raise HTTPException(status_code=404, detail="No data available")
        
    target = float(target_setting.value) if target_setting else 15000.0
    
    return {
        "current_month_revenue": latest.revenue,
        "target": target,
        "performance_gap": round(((latest.revenue - target) / target) * 100, 2)
    }

@app.get("/api/predict", response_model=PredictionResponse)
def predict_performance(model_type: str = "linear", db: Session = Depends(get_db)):
    """
    Analyzes the CURRENT active scenario and returns a forecast.
    """
    try:
        records = db.query(SalesRecordDB).order_by(SalesRecordDB.date.asc()).all()
        history_data = [SalesRecord(
            date=r.date,
            revenue=r.revenue,
            units_sold=r.units_sold,
            region=r.region
        ) for r in records]
        
        result = forecaster.predict(history_data, model_type=model_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
