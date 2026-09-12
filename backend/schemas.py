from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class CustomerOut(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Vehicle Schemas
class VehicleBase(BaseModel):
    vehicle_number: str
    make_model: str
    vin_chassis: Optional[str] = None

class VehicleCreate(VehicleBase):
    customer_id: Optional[int] = None  # If existing customer

class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    make_model: Optional[str] = None
    vin_chassis: Optional[str] = None
    customer_id: Optional[int] = None

class VehicleOut(VehicleBase):
    id: int
    customer_id: int
    created_at: datetime
    customer: Optional[CustomerOut] = None  # Nested customer details for auto-fill

    class Config:
        from_attributes = True

# Inventory Item Schemas
class InventoryItemBase(BaseModel):
    item_code: str
    item_name: str
    applicable_model: Optional[str] = "Universal / All Peugeot Models"
    quantity_in_stock: int = 0
    cost_price: Optional[Decimal] = Decimal("0.00")
    markup_type: Optional[str] = "percentage"  # 'percentage' or 'amount'
    markup_value: Optional[Decimal] = Decimal("0.00")
    unit_price: Decimal = Decimal("0.00")  # Selling Retail Price
    unit_of_measure: Optional[str] = "pcs"

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    item_code: Optional[str] = None
    item_name: Optional[str] = None
    applicable_model: Optional[str] = None
    quantity_in_stock: Optional[int] = None
    cost_price: Optional[Decimal] = None
    markup_type: Optional[str] = None
    markup_value: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None
    unit_of_measure: Optional[str] = None

class InventoryItemOut(InventoryItemBase):
    id: int
    created_at: datetime


    class Config:
        from_attributes = True


# Inventory Issue Schemas
class IssueInventoryItemRequest(BaseModel):
    inventory_item_id: int
    quantity_issued: int = Field(..., gt=0)

class JobInventoryIssueOut(BaseModel):
    id: int
    job_card_id: int
    inventory_item_id: int
    quantity_issued: int
    unit_price: Decimal
    total_price: Decimal
    issued_at: datetime
    inventory_item: Optional[InventoryItemOut] = None

    class Config:
        from_attributes = True

class LabourItemRequest(BaseModel):
    description: str
    amount: Decimal = Decimal("0.00")

# Job Card Opening Schema
class JobCardCreate(BaseModel):
    # Customer details (either customer_id for existing, or new customer fields)
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    customer_address: Optional[str] = None

    # Vehicle details (either vehicle_id for existing, or new vehicle fields)
    vehicle_id: Optional[int] = None
    vehicle_number: Optional[str] = None
    make_model: Optional[str] = None
    vin_chassis: Optional[str] = None

    # Job info
    mileage: Optional[int] = 0
    repair_fault: str
    technician_notes: Optional[str] = None
    labour_charge: Optional[Decimal] = Decimal("0.00")
    labour_items: Optional[List[LabourItemRequest]] = []
    initial_issued_items: Optional[List[IssueInventoryItemRequest]] = []

class JobCardStatusUpdate(BaseModel):
    status: str
    technician_notes: Optional[str] = None
    labour_charge: Optional[Decimal] = None
    labour_items: Optional[List[LabourItemRequest]] = None

class JobCardPaymentUpdate(BaseModel):
    payment_status: str # 'unpaid' | 'paid'
    payment_method: Optional[str] = "Cash" # 'Cash', 'Card', 'Online Bank Transfer', 'Cheque'

class JobCardReleaseUpdate(BaseModel):
    car_released: bool = True

class JobCardOut(BaseModel):
    id: int
    job_number: str
    customer_id: int
    vehicle_id: int
    mileage: Optional[int] = 0
    repair_fault: str
    technician_notes: Optional[str] = None
    labour_charge: Optional[Decimal] = Decimal("0.00")
    labour_details: Optional[str] = None
    parsed_labour_items: Optional[List[LabourItemRequest]] = []
    status: str
    payment_status: Optional[str] = "unpaid"
    payment_method: Optional[str] = None
    payment_received_at: Optional[datetime] = None
    car_released: Optional[bool] = False
    car_released_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerOut] = None
    vehicle: Optional[VehicleOut] = None
    inventory_issues: Optional[List[JobInventoryIssueOut]] = []

    class Config:
        from_attributes = True

# Quotation Schemas
class QuotationCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    vehicle_number: str
    make_model: Optional[str] = "Peugeot 407 P"
    mileage: Optional[int] = 0
    repair_description: Optional[str] = None
    labour_items: Optional[List[LabourItemRequest]] = []
    parts_items: Optional[List[dict]] = []

class QuotationOut(BaseModel):
    id: int
    quotation_number: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    vehicle_number: str
    make_model: Optional[str] = "Peugeot 407 P"
    mileage: Optional[int] = 0
    repair_description: Optional[str] = None
    labour_details: Optional[str] = None
    parts_details: Optional[str] = None
    total_amount: Decimal = Decimal("0.00")
    status: str
    converted_job_card_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Quotation Schemas
class QuotationCreate(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    vehicle_number: str
    make_model: Optional[str] = "Peugeot 407 P"
    mileage: Optional[int] = 0
    repair_description: Optional[str] = None
    labour_items: Optional[List[LabourItemRequest]] = []
    parts_items: Optional[List[dict]] = []

class QuotationOut(BaseModel):
    id: int
    quotation_number: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    vehicle_number: str
    make_model: Optional[str] = "Peugeot 407 P"
    mileage: Optional[int] = 0
    repair_description: Optional[str] = None
    labour_details: Optional[str] = None
    parts_details: Optional[str] = None
    total_amount: Decimal = Decimal("0.00")
    status: str
    converted_job_card_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
