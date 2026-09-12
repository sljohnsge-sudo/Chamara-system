import os
import re
import datetime
import openpyxl
import pymysql

EXCEL_PATH = r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New format\New folder\Peugeot_Invoices_Formatted.xlsx"

DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = ""
DB_NAME = "peugeot_land"
DB_PORT = 3306

def clean_int(raw):
    if not raw:
        return 0
    s = re.sub(r'[^0-9]', '', str(raw))
    try:
        return int(s) if s else 0
    except:
        return 0

def clean_float(raw):
    if not raw:
        return 0.0
    s = str(raw).replace('LKR', '').replace('Rs', '').replace(',', '').replace(' ', '').strip()
    try:
        return float(s)
    except:
        return 0.0

def parse_date(raw_d):
    if not raw_d:
        return datetime.datetime.now()
    if isinstance(raw_d, datetime.datetime):
        return raw_d
    if isinstance(raw_d, datetime.date):
        return datetime.datetime.combine(raw_d, datetime.time(9, 0, 0))
    s = str(raw_d).strip()
    # Try YYYY-MM-DD
    try:
        return datetime.datetime.strptime(s, "%Y-%m-%d")
    except:
        pass
    # Try DD/MM/YYYY
    try:
        return datetime.datetime.strptime(s, "%d/%m/%Y")
    except:
        pass
    # Try MM/DD/YYYY
    try:
        return datetime.datetime.strptime(s, "%m/%d/%Y")
    except:
        pass
    return datetime.datetime.now()

def slugify(text):
    s = re.sub(r'[^a-zA-Z0-9]', '-', text).strip('-').upper()
    return s[:40] if s else "PART"

def main():
    print(f"Reading Excel: {EXCEL_PATH}")
    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb['Sheet1']

    invoices_dict = {}
    for r in range(4, ws.max_row + 1):
        inv_no = str(ws.cell(r, 2).value or '').strip()
        inv_date = ws.cell(r, 3).value
        model = str(ws.cell(r, 4).value or '').strip()
        veh_no = str(ws.cell(r, 5).value or '').strip()
        chassis = str(ws.cell(r, 6).value or '').strip()
        mileage = ws.cell(r, 7).value
        desc = str(ws.cell(r, 8).value or '').strip()
        qt = str(ws.cell(r, 9).value or '1').strip()
        unit = ws.cell(r, 10).value
        total_rs = ws.cell(r, 11).value
        grand_tot = ws.cell(r, 12).value

        if not veh_no or not inv_no:
            continue

        inv_key = (inv_no, veh_no)
        if inv_key not in invoices_dict:
            invoices_dict[inv_key] = {
                'invoice_no': inv_no,
                'invoice_date': parse_date(inv_date),
                'make_model': model or 'Peugeot',
                'vehicle_no': veh_no,
                'chassis_no': chassis,
                'mileage': clean_int(mileage),
                'grand_total': clean_float(grand_tot),
                'items': []
            }

        if desc:
            invoices_dict[inv_key]['items'].append({
                'description': desc,
                'qt': clean_int(qt) or 1,
                'unit': clean_float(unit),
                'total_rs': clean_float(total_rs)
            })

    print(f"Parsed {len(invoices_dict)} invoices for upload into MySQL database '{DB_NAME}'...")

    conn = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT,
        autocommit=False
    )
    cursor = conn.cursor()

    cust_count = 0
    veh_count = 0
    job_count = 0
    issue_count = 0
    inv_item_count = 0

    # Cache maps
    vehicle_map = {} # veh_number -> (vehicle_id, customer_id)
    customer_map = {} # veh_number -> customer_id
    inventory_map = {} # item_name_lower -> item_id

    # Load existing customers & vehicles
    cursor.execute("SELECT id, vehicle_number, customer_id FROM vehicles")
    for v_id, v_num, c_id in cursor.fetchall():
        v_num_clean = v_num.strip().upper()
        vehicle_map[v_num_clean] = (v_id, c_id)
        customer_map[v_num_clean] = c_id

    cursor.execute("SELECT id, LOWER(item_name) FROM inventory_items")
    for i_id, i_name in cursor.fetchall():
        inventory_map[i_name] = i_id

    # Load existing job card numbers
    existing_jobs = set()
    cursor.execute("SELECT job_number FROM job_cards")
    for (j_num,) in cursor.fetchall():
        existing_jobs.add(j_num.strip())

    print(f"Existing in DB: {len(vehicle_map)} vehicles, {len(inventory_map)} inventory items, {len(existing_jobs)} job cards.")

    # Process all invoices
    sorted_invoices = sorted(invoices_dict.values(), key=lambda x: x['invoice_date'])

    phone_seq = 1000
    for inv in sorted_invoices:
        v_num = inv['vehicle_no'].strip().upper()
        inv_no = inv['invoice_no']
        inv_date = inv['invoice_date']
        make_model = inv['make_model']
        chassis_no = inv['chassis_no']
        mileage = inv['mileage']
        grand_total = inv['grand_total']

        # 1. Customer & Vehicle
        if v_num not in vehicle_map:
            # Check if customer exists by name or create
            cust_name = f"Customer ({v_num})"
            phone_seq += 1
            # Generate deterministic phone if none exists
            clean_digits = re.sub(r'[^0-9]', '', v_num)
            cust_phone = f"077{phone_seq:04d}{clean_digits[:3]}"[:12]

            cursor.execute(
                "INSERT INTO customers (name, phone, email, address, created_at) VALUES (%s, %s, %s, %s, %s)",
                (cust_name, cust_phone, f"{slugify(v_num).lower()}@client.peugeot", "Panadura / Colombo", inv_date)
            )
            c_id = cursor.lastrowid
            cust_count += 1

            cursor.execute(
                "INSERT INTO vehicles (customer_id, vehicle_number, make_model, vin_chassis, created_at) VALUES (%s, %s, %s, %s, %s)",
                (c_id, v_num, make_model, chassis_no, inv_date)
            )
            v_id = cursor.lastrowid
            veh_count += 1

            vehicle_map[v_num] = (v_id, c_id)
            customer_map[v_num] = c_id
        else:
            v_id, c_id = vehicle_map[v_num]

        # 2. Job Card
        job_number = f"INV-{inv_no}"
        if job_number in existing_jobs:
            continue
        existing_jobs.add(job_number)

        # Classify items into labour vs parts
        labour_items = []
        parts_items = []
        total_labour_amount = 0.0

        for it in inv['items']:
            d_str = it['description']
            if any(w in d_str.upper() for w in ['LABOUR', 'CHARGE', 'REPAIR', 'REMOVE', 'SERVICE', 'SCANNER', 'OVERHAUL', 'TEST', 'FIT', 'CLEAN']):
                labour_items.append(d_str)
                total_labour_amount += it['total_rs']
            else:
                parts_items.append(it)

        repair_fault_summary = " | ".join([it['description'] for it in inv['items'][:5]])
        if not repair_fault_summary:
            repair_fault_summary = f"Routine service & repairs - {make_model}"

        labour_details_str = " | ".join(labour_items) if labour_items else "General workshop labor"

        cursor.execute(
            """INSERT INTO job_cards 
               (job_number, customer_id, vehicle_id, mileage, repair_fault, technician_notes, 
                labour_charge, labour_details, status, payment_status, payment_method, 
                payment_received_at, car_released, car_released_at, created_at, updated_at) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                job_number,
                c_id,
                v_id,
                mileage,
                repair_fault_summary,
                f"Historical Invoice No {inv_no} imported from Peugeot Land archives.",
                total_labour_amount,
                labour_details_str,
                "Delivered",
                "paid",
                "Cheque / Cash",
                inv_date,
                True,
                inv_date,
                inv_date,
                inv_date
            )
        )
        job_card_id = cursor.lastrowid
        job_count += 1

        # 3. Inventory Items & Issues
        for part in parts_items:
            p_name = part['description'].strip()
            p_name_lower = p_name.lower()
            qty = part['qt']
            tot_price = part['total_rs']
            u_price = part['unit'] if part['unit'] > 0 else (tot_price / qty if qty > 0 else tot_price)

            if p_name_lower not in inventory_map:
                item_code = f"PART-{slugify(p_name)[:20]}-{len(inventory_map)+1}"
                cursor.execute(
                    """INSERT INTO inventory_items 
                       (item_code, item_name, applicable_model, quantity_in_stock, cost_price, 
                        markup_type, markup_value, unit_price, unit_of_measure, created_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (
                        item_code,
                        p_name,
                        make_model,
                        10,
                        u_price * 0.8,
                        "percentage",
                        25.0,
                        u_price,
                        "pcs",
                        inv_date
                    )
                )
                item_id = cursor.lastrowid
                inventory_map[p_name_lower] = item_id
                inv_item_count += 1
            else:
                item_id = inventory_map[p_name_lower]

            cursor.execute(
                """INSERT INTO job_inventory_issues 
                   (job_card_id, inventory_item_id, quantity_issued, unit_price, total_price, issued_at)
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (job_card_id, item_id, qty, u_price, tot_price, inv_date)
            )
            issue_count += 1

    conn.commit()
    conn.close()

    print("\n=======================================================")
    print("SUCCESSFULLY IMPORTED DATA INTO PEUGEOT LAND DATABASE!")
    print(f"  + New Customers Created:     {cust_count}")
    print(f"  + New Vehicles Registered:   {veh_count}")
    print(f"  + Job Cards Ingested:        {job_count}")
    print(f"  + Inventory Parts Cataloged: {inv_item_count}")
    print(f"  + Job Inventory Issues Logged: {issue_count}")
    print("=======================================================")

if __name__ == "__main__":
    main()
