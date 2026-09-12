from sqlalchemy import Column, Integer, String, Text, Numeric, Enum, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import relationship
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False, unique=True, index=True)
    email = Column(String(255), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    vehicles = relationship("Vehicle", back_populates="customer", cascade="all, delete-orphan")
    job_cards = relationship("JobCard", back_populates="customer")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    vehicle_number = Column(String(50), nullable=False, unique=True, index=True)
    make_model = Column(String(100), nullable=False)
    vin_chassis = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    customer = relationship("Customer", back_populates="vehicles")
    job_cards = relationship("JobCard", back_populates="vehicle")

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    item_code = Column(String(50), nullable=False, unique=True, index=True)
    item_name = Column(String(255), nullable=False)
    applicable_model = Column(String(100), nullable=False, default="Universal / All Peugeot Models")
    quantity_in_stock = Column(Integer, nullable=False, default=0)
    cost_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    markup_type = Column(String(20), nullable=False, default="percentage") # 'percentage' or 'amount'
    markup_value = Column(Numeric(10, 2), nullable=False, default=0.00)
    unit_price = Column(Numeric(10, 2), nullable=False, default=0.00) # Selling Retail Price
    unit_of_measure = Column(String(50), default="pcs")
    created_at = Column(DateTime, server_default=func.now())

    issues = relationship("JobInventoryIssue", back_populates="inventory_item")


class JobCard(Base):
    __tablename__ = "job_cards"

    id = Column(Integer, primary_key=True, index=True)
    job_number = Column(String(50), nullable=False, unique=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    mileage = Column(Integer, default=0)
    repair_fault = Column(Text, nullable=False)
    technician_notes = Column(Text, nullable=True)
    labour_charge = Column(Numeric(10, 2), default=0.00)
    labour_details = Column(Text, nullable=True)
    status = Column(
        Enum("Open", "In-Progress", "Pending Parts", "Completed", "Delivered"),
        default="Open"
    )
    payment_status = Column(String(20), default="unpaid")
    payment_method = Column(String(30), nullable=True)
    payment_received_at = Column(DateTime, nullable=True)
    car_released = Column(Boolean, default=False)
    car_released_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="job_cards")
    vehicle = relationship("Vehicle", back_populates="job_cards")
    inventory_issues = relationship("JobInventoryIssue", back_populates="job_card", cascade="all, delete-orphan")

class JobInventoryIssue(Base):
    __tablename__ = "job_inventory_issues"

    id = Column(Integer, primary_key=True, index=True)
    job_card_id = Column(Integer, ForeignKey("job_cards.id", ondelete="CASCADE"), nullable=False)
    inventory_item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity_issued = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    issued_at = Column(DateTime, server_default=func.now())

    job_card = relationship("JobCard", back_populates="inventory_issues")
    inventory_item = relationship("InventoryItem", back_populates="issues")

class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quotation_number = Column(String(50), nullable=False, unique=True, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(30), nullable=False)
    customer_email = Column(String(100), nullable=True)
    vehicle_number = Column(String(50), nullable=False)
    make_model = Column(String(100), default="Peugeot 407 P")
    mileage = Column(Integer, default=0)
    repair_description = Column(Text, nullable=True)
    labour_details = Column(Text, nullable=True)
    parts_details = Column(Text, nullable=True)
    total_amount = Column(Numeric(10, 2), default=0.00)
    status = Column(String(30), default="Draft") # 'Draft', 'Sent', 'Approved', 'Converted'
    converted_job_card_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
