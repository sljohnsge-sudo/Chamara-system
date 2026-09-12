from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas, crud
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Peugeot Land Workshop System API",
    description="Backend API for Peugeot Land Vehicle Repair & Inventory Control System",
    version="1.0.0"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "system": "Peugeot Land Workshop Management System"}

# Customer Endpoints
@app.get("/api/customers", response_model=List[schemas.CustomerOut])
def list_customers(search: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return crud.get_customers(db, search=search)

@app.post("/api/customers", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED)
def add_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, customer)

@app.put("/api/customers/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(customer_id: int, customer: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    return crud.update_customer(db, customer_id, customer)

# Vehicle Endpoints
@app.get("/api/vehicles", response_model=List[schemas.VehicleOut])
def list_vehicles(
    customer_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_vehicles(db, customer_id=customer_id, search=search)

@app.post("/api/vehicles", response_model=schemas.VehicleOut, status_code=status.HTTP_201_CREATED)
def add_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(get_db)):
    return crud.create_vehicle(db, vehicle)

@app.put("/api/vehicles/{vehicle_id}", response_model=schemas.VehicleOut)
def update_vehicle(vehicle_id: int, vehicle: schemas.VehicleUpdate, db: Session = Depends(get_db)):
    return crud.update_vehicle(db, vehicle_id, vehicle)

# Inventory Item Endpoints
@app.get("/api/inventory", response_model=List[schemas.InventoryItemOut])
def list_inventory(
    search: Optional[str] = Query(None),
    vehicle_model: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_inventory_items(db, search=search, vehicle_model=vehicle_model)

@app.get("/api/inventory/summary")
def get_inventory_summary(db: Session = Depends(get_db)):
    return crud.get_inventory_stock_summary(db)

@app.post("/api/inventory", response_model=schemas.InventoryItemOut, status_code=status.HTTP_201_CREATED)
def add_inventory_item(item: schemas.InventoryItemCreate, db: Session = Depends(get_db)):
    return crud.create_inventory_item(db, item)

@app.put("/api/inventory/{item_id}", response_model=schemas.InventoryItemOut)
def update_inventory_item(item_id: int, item: schemas.InventoryItemUpdate, db: Session = Depends(get_db)):
    return crud.update_inventory_item(db, item_id, item)

# Job Card Endpoints
@app.get("/api/jobs", response_model=List[schemas.JobCardOut])
def list_jobs(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_job_cards(db, search=search, status_filter=status, payment_status_filter=payment_status)

@app.get("/api/jobs/{job_id}", response_model=schemas.JobCardOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = crud.get_job_card(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job card not found")
    return job

@app.post("/api/jobs", response_model=schemas.JobCardOut, status_code=status.HTTP_201_CREATED)
def create_job_card(data: schemas.JobCardCreate, db: Session = Depends(get_db)):
    return crud.open_job_card(db, data)

@app.post("/api/jobs/{job_id}/issue-inventory", response_model=schemas.JobInventoryIssueOut)
def issue_part_to_job(job_id: int, req: schemas.IssueInventoryItemRequest, db: Session = Depends(get_db)):
    return crud.issue_inventory_to_job(db, job_id, req.inventory_item_id, req.quantity_issued)

@app.patch("/api/jobs/{job_id}/status", response_model=schemas.JobCardOut)
def update_status(job_id: int, payload: schemas.JobCardStatusUpdate, db: Session = Depends(get_db)):
    return crud.update_job_status(db, job_id, payload.status, payload.technician_notes, payload.labour_charge)

@app.patch("/api/jobs/{job_id}/payment", response_model=schemas.JobCardOut)
def update_payment(job_id: int, payload: schemas.JobCardPaymentUpdate, db: Session = Depends(get_db)):
    return crud.update_job_payment(db, job_id, payload.payment_status, payload.payment_method)

@app.patch("/api/jobs/{job_id}/release", response_model=schemas.JobCardOut)
def release_vehicle(job_id: int, payload: schemas.JobCardReleaseUpdate, db: Session = Depends(get_db)):
    return crud.release_job_vehicle(db, job_id, payload.car_released)

# Manager Executive Analytics Endpoint
@app.get("/api/analytics/summary")
def get_manager_analytics_summary(
    period: str = Query("month", description="Time period: today, week, month, year"),
    db: Session = Depends(get_db)
):
    return crud.get_manager_analytics(db, period=period)

# Quotation Endpoints
@app.post("/api/quotations", response_model=schemas.QuotationOut, status_code=status.HTTP_201_CREATED)
def create_quotation_endpoint(data: schemas.QuotationCreate, db: Session = Depends(get_db)):
    return crud.create_quotation(db, data)

@app.get("/api/quotations", response_model=List[schemas.QuotationOut])
def list_quotations_endpoint(search: str = "", db: Session = Depends(get_db)):
    return crud.get_quotations(db, search=search)

@app.get("/api/quotations/{quotation_id}", response_model=schemas.QuotationOut)
def get_quotation_endpoint(quotation_id: int, db: Session = Depends(get_db)):
    return crud.get_quotation_by_id(db, quotation_id)

# Customer History Endpoints
@app.get("/api/customers-history/search")
def search_customer_history(search: Optional[str] = Query(""), db: Session = Depends(get_db)):
    return crud.search_customers_with_summary(db, search=search)

@app.get("/api/customers-history/{customer_id}")
def get_customer_history(customer_id: int, db: Session = Depends(get_db)):
    return crud.get_customer_detailed_history(db, customer_id=customer_id)

