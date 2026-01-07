from sqlalchemy import Column, Integer, Float, String, Date
from .database import Base

class SalesRecordDB(Base):
    __tablename__ = "sales_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True)
    revenue = Column(Float)
    units_sold = Column(Integer)
    region = Column(String, default="Global")

class SystemStateDB(Base):
    __tablename__ = "system_state"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String) 
    # We will store values as strings and cast them. 
    # Example keys: "target", "current_scenario"
