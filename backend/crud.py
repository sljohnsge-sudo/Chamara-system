from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc
from datetime import datetime, timedelta
from decimal import Decimal
import models, schemas
from fastapi import HTTPException, status

def get_customers(db: Session, search: str = None):
    query = db.query(models.Customer)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Customer.name.like(pattern),
                models.Customer.phone.like(pattern),
                models.Customer.email.like(pattern)
            )
        )
    return query.order_by(desc(models.Customer.id)).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def update_customer(db: Session, customer_id: int, data: schemas.CustomerUpdate):
    db_customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_dict = data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(db_customer, key, value)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

def get_vehicles(db: Session, customer_id: int = None, search: str = None):
    query = db.query(models.Vehicle).options(joinedload(models.Vehicle.customer))
    if customer_id:
        query = query.filter(models.Vehicle.customer_id == customer_id)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Vehicle.vehicle_number.like(pattern),
                models.Vehicle.make_model.like(pattern),
                models.Vehicle.vin_chassis.like(pattern)
            )
        )
    return query.order_by(desc(models.Vehicle.id)).all()

def create_vehicle(db: Session, vehicle: schemas.VehicleCreate):
    db_vehicle = models.Vehicle(**vehicle.dict())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

def update_vehicle(db: Session, vehicle_id: int, data: schemas.VehicleUpdate):
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not db_vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_dict = data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        if value is not None:
            setattr(db_vehicle, key, value)
    
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle

def get_inventory_items(db: Session, search: str = None, vehicle_model: str = None):
    query = db.query(models.InventoryItem)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.InventoryItem.item_code.like(pattern),
                models.InventoryItem.item_name.like(pattern),
                models.InventoryItem.applicable_model.like(pattern)
            )
        )
    if vehicle_model and vehicle_model != "All Models":
        query = query.filter(
            or_(
                models.InventoryItem.applicable_model == vehicle_model,
                models.InventoryItem.applicable_model == "Universal / All Peugeot Models"
            )
        )
    return query.order_by(models.InventoryItem.item_name).all()

def create_inventory_item(db: Session, item: schemas.InventoryItemCreate):
    existing = db.query(models.InventoryItem).filter(models.InventoryItem.item_code == item.item_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Item code '{item.item_code}' already exists.")
    
    item_dict = item.dict()
    cost = Decimal(str(item_dict.get("cost_price", 0.00)))
    markup_type = item_dict.get("markup_type", "percentage")
    markup_val = Decimal(str(item_dict.get("markup_value", 0.00)))

    # Auto calculate selling price if not provided or 0
    if "unit_price" not in item_dict or item_dict["unit_price"] == Decimal("0.00"):
        if markup_type == "percentage":
            calculated_unit_price = cost + (cost * markup_val / Decimal("100"))
        else:
            calculated_unit_price = cost + markup_val
        item_dict["unit_price"] = calculated_unit_price

    db_item = models.InventoryItem(**item_dict)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

def update_inventory_item(db: Session, item_id: int, item_update: schemas.InventoryItemUpdate):
    db_item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found.")

    update_data = item_update.dict(exclude_unset=True)

    cost = Decimal(str(update_data.get("cost_price", db_item.cost_price)))
    markup_type = update_data.get("markup_type", db_item.markup_type)
    markup_val = Decimal(str(update_data.get("markup_value", db_item.markup_value)))

    # Auto calculate selling price if not explicitly provided or zero
    if "unit_price" not in update_data or update_data["unit_price"] is None or update_data["unit_price"] == Decimal("0.00"):
        if markup_type == "percentage":
            calculated_unit_price = cost + (cost * markup_val / Decimal("100"))
        else:
            calculated_unit_price = cost + markup_val
        update_data["unit_price"] = calculated_unit_price

    for key, value in update_data.items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)
    return db_item

def get_inventory_stock_summary(db: Session):
    items = db.query(models.InventoryItem).all()
    total_items = len(items)
    total_stock_units = sum(i.quantity_in_stock or 0 for i in items)
    
    total_cost_val = sum(float(i.cost_price or 0) * (i.quantity_in_stock or 0) for i in items)
    total_retail_val = sum(float(i.unit_price or 0) * (i.quantity_in_stock or 0) for i in items)
    potential_profit = total_retail_val - total_cost_val
    
    # Group stock by vehicle model
    model_map = {}
    for i in items:
        model = i.applicable_model or "Universal / All Peugeot Models"
        if model not in model_map:
            model_map[model] = {"items_count": 0, "stock_units": 0, "retail_value": 0.0}
        model_map[model]["items_count"] += 1
        model_map[model]["stock_units"] += (i.quantity_in_stock or 0)
        model_map[model]["retail_value"] += float(i.unit_price or 0) * (i.quantity_in_stock or 0)

    model_breakdown = [
        {"applicable_model": k, "items_count": v["items_count"], "stock_units": v["stock_units"], "retail_value": round(v["retail_value"], 2)}
        for k, v in sorted(model_map.items(), key=lambda x: x[1]["retail_value"], reverse=True)
    ]

    return {
        "total_items_count": total_items,
        "total_stock_units": total_stock_units,
        "total_cost_value": round(total_cost_val, 2),
        "total_retail_value": round(total_retail_val, 2),
        "potential_profit": round(potential_profit, 2),
        "margin_percent": round((potential_profit / total_retail_val * 100), 1) if total_retail_val > 0 else 0.0,
        "model_breakdown": model_breakdown
    }


def generate_job_number(db: Session) -> str:
    today_prefix = f"JOB-{datetime.now().strftime('%Y%m')}-"
    last_job = db.query(models.JobCard).filter(models.JobCard.job_number.like(f"{today_prefix}%")).order_by(desc(models.JobCard.id)).first()
    if not last_job:
        return f"{today_prefix}0001"
    last_seq = int(last_job.job_number.split("-")[-1])
    return f"{today_prefix}{last_seq + 1:04d}"

def open_job_card(db: Session, data: schemas.JobCardCreate):
    # 1. Resolve Customer (Existing or New)
    if data.customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == data.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Selected customer not found")
    else:
        if not data.customer_name or not data.customer_phone:
            raise HTTPException(status_code=400, detail="Customer Name and Phone Number are required for new customer")
        customer = models.Customer(
            name=data.customer_name,
            phone=data.customer_phone,
            email=data.customer_email,
            address=data.customer_address
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    # 2. Resolve Vehicle (Existing or New)
    if data.vehicle_id:
        vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == data.vehicle_id).first()
        if not vehicle:
            raise HTTPException(status_code=404, detail="Selected vehicle not found")
    else:
        if not data.vehicle_number:
            raise HTTPException(status_code=400, detail="Vehicle Number is required")
        
        # Check if vehicle number exists
        existing_v = db.query(models.Vehicle).filter(models.Vehicle.vehicle_number == data.vehicle_number.upper().strip()).first()
        if existing_v:
            vehicle = existing_v
        else:
            vehicle = models.Vehicle(
                customer_id=customer.id,
                vehicle_number=data.vehicle_number.upper().strip(),
                make_model=data.make_model or "Peugeot 407 P",
                vin_chassis=data.vin_chassis
            )
            db.add(vehicle)
            db.commit()
            db.refresh(vehicle)

    # 3. Create Job Card
    job_number = generate_job_number(db)
    
    import json
    labour_items_list = []
    if data.labour_items:
        labour_items_list = [{"description": item.description, "amount": float(item.amount)} for item in data.labour_items]
        total_labour = sum(item["amount"] for item in labour_items_list)
    else:
        total_labour = float(data.labour_charge or 0.00)
        if total_labour > 0:
            labour_items_list = [{"description": "Labour Charge / Repair Charges", "amount": total_labour}]

    job_card = models.JobCard(
        job_number=job_number,
        customer_id=customer.id,
        vehicle_id=vehicle.id,
        mileage=data.mileage or 0,
        repair_fault=data.repair_fault,
        technician_notes=data.technician_notes,
        labour_charge=Decimal(str(total_labour)),
        labour_details=json.dumps(labour_items_list),
        status="Open",
        payment_status="unpaid",
        car_released=False
    )
    db.add(job_card)
    db.commit()
    db.refresh(job_card)

    # 4. Issue Initial Inventory Items
    if data.initial_issued_items:
        for item_req in data.initial_issued_items:
            issue_inventory_to_job(db, job_card.id, item_req.inventory_item_id, item_req.quantity_issued)

    db.refresh(job_card)
    return job_card

def issue_inventory_to_job(db: Session, job_card_id: int, inventory_item_id: int, quantity: int):
    job_card = db.query(models.JobCard).filter(models.JobCard.id == job_card_id).first()
    if not job_card:
        raise HTTPException(status_code=404, detail="Job card not found")

    item = db.query(models.InventoryItem).filter(models.InventoryItem.id == inventory_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    # Deduct stock gracefully
    if item.quantity_in_stock >= quantity:
        item.quantity_in_stock -= quantity
    else:
        item.quantity_in_stock = 0

    total_price = Decimal(str(item.unit_price)) * Decimal(str(quantity))

    issue = models.JobInventoryIssue(
        job_card_id=job_card_id,
        inventory_item_id=inventory_item_id,
        quantity_issued=quantity,
        unit_price=item.unit_price,
        total_price=total_price
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue

import json

def parse_labour_details(job_card):
    if not job_card:
        return None
    items = []
    if job_card.labour_details:
        try:
            items = json.loads(job_card.labour_details)
        except Exception:
            items = []
    if not items and job_card.labour_charge and float(job_card.labour_charge) > 0:
        items = [{"description": "Labour Charge / Repair Charges", "amount": float(job_card.labour_charge)}]
    job_card.parsed_labour_items = items
    return job_card

def get_job_cards(db: Session, search: str = None, status_filter: str = None, payment_status_filter: str = None):
    query = db.query(models.JobCard).options(
        joinedload(models.JobCard.customer),
        joinedload(models.JobCard.vehicle),
        joinedload(models.JobCard.inventory_issues).joinedload(models.JobInventoryIssue.inventory_item)
    )

    if status_filter:
        query = query.filter(models.JobCard.status == status_filter)

    if payment_status_filter:
        query = query.filter(models.JobCard.payment_status == payment_status_filter)

    if search:
        pattern = f"%{search}%"
        query = query.join(models.Customer).join(models.Vehicle).filter(
            or_(
                models.JobCard.job_number.like(pattern),
                models.Customer.name.like(pattern),
                models.Customer.phone.like(pattern),
                models.Vehicle.vehicle_number.like(pattern)
            )
        )

    results = query.order_by(desc(models.JobCard.id)).all()
    for j in results:
        parse_labour_details(j)
    return results

def get_job_card(db: Session, job_card_id: int):
    j = db.query(models.JobCard).options(
        joinedload(models.JobCard.customer),
        joinedload(models.JobCard.vehicle),
        joinedload(models.JobCard.inventory_issues).joinedload(models.JobInventoryIssue.inventory_item)
    ).filter(models.JobCard.id == job_card_id).first()
    if j:
        parse_labour_details(j)
    return j

def update_job_status(db: Session, job_card_id: int, new_status: str, technician_notes: str = None, labour_charge: Decimal = None):
    job_card = get_job_card(db, job_card_id)
    if not job_card:
        raise HTTPException(status_code=404, detail="Job card not found")

    job_card.status = new_status
    if technician_notes is not None:
        job_card.technician_notes = technician_notes
    if labour_charge is not None:
        job_card.labour_charge = labour_charge
    db.commit()
    db.refresh(job_card)
    return job_card

def update_job_payment(db: Session, job_card_id: int, payment_status: str, payment_method: str = "Cash"):
    job_card = get_job_card(db, job_card_id)
    if not job_card:
        raise HTTPException(status_code=404, detail="Job card not found")

    job_card.payment_status = payment_status
    job_card.payment_method = payment_method
    if payment_status == "paid":
        job_card.payment_received_at = datetime.now()
    else:
        job_card.payment_received_at = None
    db.commit()
    db.refresh(job_card)
    return job_card

def release_job_vehicle(db: Session, job_card_id: int, car_released: bool = True):
    job_card = get_job_card(db, job_card_id)
    if not job_card:
        raise HTTPException(status_code=404, detail="Job card not found")

    job_card.car_released = car_released
    if car_released:
        job_card.car_released_at = datetime.now()
        job_card.status = "Delivered"
    else:
        job_card.car_released_at = None
    db.commit()
    db.refresh(job_card)
    return job_card

def get_manager_analytics(db: Session, period: str = "all"):
    now = datetime.now()
    if period == "today":
        start_date = datetime(now.year, now.month, now.day, 0, 0, 0)
    elif period == "week":
        # Start of current week (Monday)
        start_date = datetime(now.year, now.month, now.day, 0, 0, 0) - timedelta(days=now.weekday())
    elif period == "month":
        start_date = datetime(now.year, now.month, 1, 0, 0, 0)
    elif period == "year":
        start_date = datetime(now.year, 1, 1, 0, 0, 0)
    else:
        # Default: 'all' (Lifetime historical sales value)
        start_date = datetime(2000, 1, 1, 0, 0, 0)

    # Fetch job cards created since start_date
    jobs = db.query(models.JobCard).options(
        joinedload(models.JobCard.vehicle),
        joinedload(models.JobCard.inventory_issues).joinedload(models.JobInventoryIssue.inventory_item)
    ).filter(models.JobCard.created_at >= start_date).all()

    # If no jobs in filtered period, also pull all jobs to ensure non-empty fallback data for manager
    if not jobs:
        jobs = db.query(models.JobCard).options(
            joinedload(models.JobCard.vehicle),
            joinedload(models.JobCard.inventory_issues).joinedload(models.JobInventoryIssue.inventory_item)
        ).all()

    total_jobs = len(jobs)
    open_count = sum(1 for j in jobs if j.status == "Open")
    in_progress_count = sum(1 for j in jobs if j.status == "In-Progress")
    completed_count = sum(1 for j in jobs if j.status == "Completed")
    delivered_count = sum(1 for j in jobs if j.status == "Delivered")
    
    pending_count = open_count + in_progress_count
    closed_count = completed_count + delivered_count

    labour_revenue = sum(float(j.labour_charge or 0) for j in jobs)
    
    parts_issued_value = 0.0
    parts_cost_value = 0.0
    parts_count_map = {}
    vehicle_model_map = {}

    total_cash_received = 0.0
    total_pending_receivables = 0.0
    paid_invoices_count = 0
    unpaid_invoices_count = 0

    for j in jobs:
        job_total = float(j.labour_charge or 0)
        for issue in j.inventory_issues:
            val = float(issue.total_price or 0)
            qty = issue.quantity_issued or 0
            job_total += val
            parts_issued_value += val
            parts_cost_value += val * 0.65  # 65% cost basis estimate

            item_name = issue.inventory_item.item_name if issue.inventory_item else f"Item #{issue.inventory_item_id}"
            if item_name not in parts_count_map:
                parts_count_map[item_name] = {"quantity": 0, "revenue": 0.0}
            parts_count_map[item_name]["quantity"] += qty
            parts_count_map[item_name]["revenue"] += val

        if j.payment_status == "paid":
            total_cash_received += job_total
            paid_invoices_count += 1
        else:
            total_pending_receivables += job_total
            unpaid_invoices_count += 1

        if j.vehicle and j.vehicle.make_model:
            model_name = j.vehicle.make_model
            vehicle_model_map[model_name] = vehicle_model_map.get(model_name, 0) + 1

    total_business_value = labour_revenue + parts_issued_value
    net_profit = total_business_value - parts_cost_value - (labour_revenue * 0.20)  # Overhead estimate
    avg_job_value = (total_business_value / total_jobs) if total_jobs > 0 else 0.0

    # Top Spare Parts sorted by revenue
    top_spare_parts = [
        {"item_name": k, "quantity": v["quantity"], "revenue": round(v["revenue"], 2)}
        for k, v in sorted(parts_count_map.items(), key=lambda x: x[1]["revenue"], reverse=True)[:5]
    ]

    # Vehicle model breakdown
    top_vehicle_models = [
        {"make_model": k, "count": v}
        for k, v in sorted(vehicle_model_map.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    return {
        "period": period,
        "total_business_value": round(total_business_value, 2),
        "total_cash_received": round(total_cash_received, 2),
        "total_pending_receivables": round(total_pending_receivables, 2),
        "paid_invoices_count": paid_invoices_count,
        "unpaid_invoices_count": unpaid_invoices_count,
        "labour_revenue": round(labour_revenue, 2),
        "parts_issued_value": round(parts_issued_value, 2),
        "estimated_parts_cost": round(parts_cost_value, 2),
        "net_profit": round(net_profit, 2),
        "profit_margin_percent": round((net_profit / total_business_value * 100), 1) if total_business_value > 0 else 0.0,
        "avg_job_value": round(avg_job_value, 2),
        "job_cards": {
            "total": total_jobs,
            "open": open_count,
            "in_progress": in_progress_count,
            "pending": pending_count,
            "completed": completed_count,
            "delivered": delivered_count,
            "closed": closed_count
        },
        "top_spare_parts": top_spare_parts,
        "top_vehicle_models": top_vehicle_models
    }

# =========================================================================
# QUOTATION CRUD OPERATIONS
# =========================================================================

def _decimal_default(obj):
    """JSON encoder helper — converts Decimal to float so json.dumps works."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

def create_quotation(db: Session, data: schemas.QuotationCreate):
    count = db.query(models.Quotation).count()
    date_str = datetime.now().strftime("%Y%m")
    quotation_number = f"QUO-{date_str}-{count + 1:04d}"

    # Use _decimal_default to handle Decimal amounts in labour_items
    labour_json = json.dumps(
        [item.model_dump() for item in data.labour_items],
        default=_decimal_default
    ) if data.labour_items else "[]"

    parts_json = json.dumps(
        data.parts_items,
        default=_decimal_default
    ) if data.parts_items else "[]"

    labour_total = sum(item.amount for item in data.labour_items) if data.labour_items else Decimal("0.00")
    parts_total = sum(Decimal(str(item.get("total_price", 0))) for item in data.parts_items) if data.parts_items else Decimal("0.00")
    grand_total = labour_total + parts_total

    quotation = models.Quotation(
        quotation_number=quotation_number,
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        customer_email=data.customer_email,
        vehicle_number=data.vehicle_number.upper().strip(),
        make_model=data.make_model or "Peugeot 407 P",
        mileage=data.mileage or 0,
        repair_description=data.repair_description,
        labour_details=labour_json,
        parts_details=parts_json,
        total_amount=grand_total,
        status="Draft"
    )
    db.add(quotation)
    db.commit()
    db.refresh(quotation)
    return quotation

def get_quotations(db: Session, search: str = ""):
    query = db.query(models.Quotation)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (models.Quotation.quotation_number.like(s)) |
            (models.Quotation.customer_name.like(s)) |
            (models.Quotation.customer_phone.like(s)) |
            (models.Quotation.vehicle_number.like(s))
        )
    return query.order_by(models.Quotation.created_at.desc()).all()

def get_quotation_by_id(db: Session, quotation_id: int):
    q = db.query(models.Quotation).filter(models.Quotation.id == quotation_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return q

# =========================================================================
# CUSTOMER INDIVIDUAL HISTORY & DOSSIER OPERATIONS
# =========================================================================

def search_customers_with_summary(db: Session, search: str = ""):
    query = db.query(models.Customer)
    if search:
        s = f"%{search}%"
        matching_vehicle_customer_ids = db.query(models.Vehicle.customer_id).filter(models.Vehicle.vehicle_number.like(s)).subquery()
        query = query.filter(
            or_(
                models.Customer.name.like(s),
                models.Customer.phone.like(s),
                models.Customer.email.like(s),
                models.Customer.id.in_(matching_vehicle_customer_ids)
            )
        )
    customers = query.order_by(desc(models.Customer.id)).all()
    
    results = []
    for c in customers:
        vehicles = db.query(models.Vehicle).filter(models.Vehicle.customer_id == c.id).all()
        jobs_count = db.query(models.JobCard).filter(models.JobCard.customer_id == c.id).count()
        results.append({
            "id": c.id,
            "name": c.name,
            "phone": c.phone,
            "email": c.email,
            "address": c.address,
            "created_at": c.created_at,
            "vehicles": [{"id": v.id, "vehicle_number": v.vehicle_number, "make_model": v.make_model, "vin_chassis": v.vin_chassis} for v in vehicles],
            "total_jobs": jobs_count
        })
    return results

def get_customer_detailed_history(db: Session, customer_id: int):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    vehicles = db.query(models.Vehicle).filter(models.Vehicle.customer_id == customer_id).all()
    
    job_cards = (
        db.query(models.JobCard)
        .options(
            joinedload(models.JobCard.vehicle),
            joinedload(models.JobCard.inventory_issues).joinedload(models.JobInventoryIssue.inventory_item)
        )
        .filter(models.JobCard.customer_id == customer_id)
        .order_by(desc(models.JobCard.created_at))
        .all()
    )

    phone_clean = customer.phone.strip()
    quotations = (
        db.query(models.Quotation)
        .filter(
            or_(
                models.Quotation.customer_phone == phone_clean,
                models.Quotation.customer_name.like(f"%{customer.name}%")
            )
        )
        .order_by(desc(models.Quotation.created_at))
        .all()
    )

    total_spent = Decimal("0.00")
    total_jobs = len(job_cards)
    completed_jobs = 0
    active_jobs = 0

    for job in job_cards:
        if job.status in ["Completed", "Delivered"]:
            completed_jobs += 1
        else:
            active_jobs += 1
        
        parts_total = sum(issue.total_price for issue in job.inventory_issues) if job.inventory_issues else Decimal("0.00")
        labour_tot = job.labour_charge or Decimal("0.00")
        total_spent += (parts_total + labour_tot)

    return {
        "customer": {
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "email": customer.email,
            "address": customer.address,
            "created_at": customer.created_at
        },
        "stats": {
            "total_spent": float(total_spent),
            "total_jobs": total_jobs,
            "completed_jobs": completed_jobs,
            "active_jobs": active_jobs,
            "total_vehicles": len(vehicles),
            "total_quotations": len(quotations),
            "last_visit": job_cards[0].created_at if job_cards else customer.created_at
        },
        "vehicles": [
            {
                "id": v.id,
                "vehicle_number": v.vehicle_number,
                "make_model": v.make_model,
                "vin_chassis": v.vin_chassis,
                "created_at": v.created_at
            }
            for v in vehicles
        ],
        "job_cards": [
            {
                "id": j.id,
                "job_number": j.job_number,
                "vehicle_number": j.vehicle.vehicle_number if j.vehicle else "Unknown",
                "make_model": j.vehicle.make_model if j.vehicle else "Peugeot",
                "mileage": j.mileage,
                "repair_fault": j.repair_fault,
                "technician_notes": j.technician_notes,
                "status": j.status,
                "payment_status": j.payment_status,
                "payment_method": j.payment_method,
                "car_released": j.car_released,
                "created_at": j.created_at,
                "labour_charge": float(j.labour_charge or 0),
                "labour_details": j.labour_details,
                "parts_total": float(sum(i.total_price for i in j.inventory_issues) if j.inventory_issues else 0),
                "grand_total": float((j.labour_charge or 0) + (sum(i.total_price for i in j.inventory_issues) if j.inventory_issues else 0)),
                "inventory_issues": [
                    {
                        "id": i.id,
                        "item_code": i.inventory_item.item_code if i.inventory_item else "PART",
                        "item_name": i.inventory_item.item_name if i.inventory_item else "Part",
                        "quantity_issued": i.quantity_issued,
                        "unit_price": float(i.unit_price),
                        "total_price": float(i.total_price)
                    }
                    for i in j.inventory_issues
                ]
            }
            for j in job_cards
        ],
        "quotations": [
            {
                "id": q.id,
                "quotation_number": q.quotation_number,
                "vehicle_number": q.vehicle_number,
                "make_model": q.make_model,
                "mileage": q.mileage,
                "repair_description": q.repair_description,
                "total_amount": float(q.total_amount or 0),
                "status": q.status,
                "created_at": q.created_at
            }
            for q in quotations
        ]
    }
