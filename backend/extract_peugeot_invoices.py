import os
import re
import glob
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import pdfplumber
import pypdf
import docx

BASE_DIR = r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New folder"
OUTPUT_EXCEL = r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\Peugeot_Land_Customer_Invoices_Master.xlsx"

def clean_vehicle_no(raw):
    if not raw:
        return ""
    v = raw.strip().upper()
    v = re.sub(r'PEUGEOT\s*LAND.*', '', v, flags=re.I)
    v = re.sub(r'CUSTOMER\s*DETAILS', '', v, flags=re.I)
    v = re.sub(r'[\r\n\t]', ' ', v)
    v = re.sub(r'\s+', ' ', v).strip()
    # Normalize common Sri Lankan vehicle formats like CBE-6254 -> CBE 6254 or WP CBE 6254
    v = re.sub(r'\s*-\s*', ' ', v)
    return v

def clean_number(raw):
    if not raw:
        return 0.0
    s = str(raw).replace('LKR', '').replace('Rs', '').replace('rs', '').replace('=', '').replace(' ', '').replace(',', '').strip()
    try:
        return float(s)
    except:
        return 0.0

def clean_mileage(raw):
    if not raw:
        return None
    s = str(raw).upper().replace('KM', '').replace('Km', '').replace('km', '').replace(' ', '').replace(',', '').strip()
    # Sometimes OCR puts spaces between digits e.g. "1 8 8 6 9 7"
    s = re.sub(r'[^0-9]', '', s)
    try:
        val = int(s)
        return val if val > 0 else None
    except:
        return None

def parse_pdf_invoice(file_path):
    record = {
        "file_name": os.path.basename(file_path),
        "folder_name": os.path.basename(os.path.dirname(file_path)),
        "file_path": file_path,
        "doc_type": "INVOICE",
        "invoice_no": "",
        "invoice_date": "",
        "vehicle_no": "",
        "make_model": "",
        "mileage": None,
        "chassis_no": "",
        "customer_name": "",
        "customer_phone": "",
        "labour_desc": [],
        "parts_desc": [],
        "line_items": [],
        "total_amount": 0.0
    }

    try:
        with pdfplumber.open(file_path) as pdf:
            full_text = ""
            all_tables = []
            for page in pdf.pages:
                t = page.extract_text() or ""
                full_text += "\n" + t
                tbls = page.extract_tables() or []
                all_tables.extend(tbls)
    except Exception as e:
        # Fallback to pypdf
        try:
            reader = pypdf.PdfReader(file_path)
            full_text = "\n".join([p.extract_text() or "" for p in reader.pages])
            all_tables = []
        except:
            return None

    # Check Document Type (Invoice vs Estimate)
    if "ESTIMATE" in full_text.upper() or "Estimate No" in full_text:
        record["doc_type"] = "ESTIMATE"

    # Invoice / Estimate Number
    inv_m = re.search(r'(?:Invoice\s*No|Invoice\s*#|Estimate\s*No|Estimate\s*#)\s*[:#]?\s*([A-Za-z0-9\-_]+)', full_text, re.I)
    if inv_m and inv_m.group(1).upper() not in ['DATE', 'TECHNICIAN', 'MILEAGE']:
        record["invoice_no"] = inv_m.group(1).strip()
    else:
        # Try from filename e.g. "7682.pdf" or "8156 HE 7159.pdf"
        fn_m = re.search(r'([0-9]{3,5})', os.path.basename(file_path))
        if fn_m:
            record["invoice_no"] = fn_m.group(1)

    # Invoice Date
    date_m = re.search(r'(?:Invoice\s*Date|Estimate\s*Date|Date)\s*[:#]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})', full_text, re.I)
    if date_m:
        record["invoice_date"] = date_m.group(1).strip()

    # Vehicle Number
    veh_m = re.search(r'Vehicle\s*(?:No|Number)?\s*[:#]?\s*([A-Za-z0-9\s\-]+?)(?:Mile|Chassis|Date|\n|$)', full_text, re.I)
    if veh_m:
        record["vehicle_no"] = clean_vehicle_no(veh_m.group(1))
    
    if not record["vehicle_no"] or len(record["vehicle_no"]) < 3 or record["vehicle_no"] in ['PEUGEOT', 'DATE']:
        # Try Customer Details block (Layout B)
        cust_m = re.search(r'Customer\s*Details\s*\n\s*([A-Za-z0-9\s\-]+)', full_text, re.I)
        if cust_m:
            record["vehicle_no"] = clean_vehicle_no(cust_m.group(1))

    # If still no vehicle no, try from filename e.g. "CBE 5916 invoice no 7698.pdf"
    if not record["vehicle_no"] or len(record["vehicle_no"]) < 3:
        fn_veh_m = re.search(r'([A-Z]{2,3}\s*[\-]?\s*[0-9]{3,4})', os.path.basename(file_path), re.I)
        if fn_veh_m:
            record["vehicle_no"] = clean_vehicle_no(fn_veh_m.group(1))

    # Make / Model
    model_m = re.search(r'Make\s*/?\s*Model\s*[:#]?\s*([A-Za-z0-9\s\-]+?)(?:Chassis|Vehicle|Mile|Date|\n|$)', full_text, re.I)
    if model_m:
        m_str = model_m.group(1).strip()
        if m_str and len(m_str) < 35 and not m_str.upper().startswith('CHASSIS'):
            record["make_model"] = f"Peugeot {m_str}" if "PEUGEOT" not in m_str.upper() else m_str

    # Mileage
    mile_m = re.search(r'Mile\s*age\s*[:;#]?\s*([0-9\s,]+)\s*(?:KM|Km)?', full_text, re.I)
    if mile_m:
        record["mileage"] = clean_mileage(mile_m.group(1))

    # Chassis / VIN
    chassis_m = re.search(r'Chassis\s*(?:no|No)?\s*[:#]?\s*([A-Za-z0-9\s\-]+?)(?:Vehicle|Mile|Date|\n|$)', full_text, re.I)
    if chassis_m:
        c_str = chassis_m.group(1).strip()
        if len(c_str) >= 5:
            record["chassis_no"] = c_str

    # Parse Tables / Line Items
    parsed_items = []
    for table in all_tables:
        if not table:
            continue
        for row in table:
            if not row or len(row) < 2:
                continue
            row_str = " ".join([str(c) for c in row if c is not None])
            if "DESCRIPTION" in row_str.upper() or "TOTAL(RS)" in row_str.upper() or "ITEM CODE" in row_str.upper():
                continue
            
            # Check for total row
            if "TOTAL" in row_str.upper() and any(re.search(r'[0-9]{3,}', str(c)) for c in row if c):
                tot_cand = [clean_number(c) for c in row if c and clean_number(c) > 0]
                if tot_cand:
                    record["total_amount"] = max(tot_cand)
                continue

            # Extract line item
            desc = ""
            qty = 1
            price = 0.0
            line_tot = 0.0

            # Find strings vs numbers
            strs = [str(c).strip() for c in row if c and len(str(c).strip()) > 0]
            if not strs:
                continue

            # Check if this is a line item row
            item_desc = ""
            for s in strs:
                if not re.match(r'^[0-9\s,\.\-LKRrs%]+$', s) and len(s) > 2 and s.upper() not in ['TOTAL', 'NO', 'ITEM CODE', 'APPROVED BY', 'CUSTOMER SIGNATURE', 'CLIENT']:
                    item_desc = s
                    break
            
            nums = [clean_number(s) for s in strs if clean_number(s) > 0]
            if item_desc and nums:
                line_tot = nums[-1]
                price = nums[-2] if len(nums) >= 2 else line_tot
                
                # Check for Qty
                for s in strs:
                    if re.match(r'^[0-9]{1,2}$', s):
                        qty = int(s)
                        break

                parsed_items.append({
                    "description": item_desc.replace('\n', ' ').strip(),
                    "qty": qty,
                    "unit_price": price,
                    "total": line_tot
                })

                if "LABOUR" in item_desc.upper() or "CHARGE" in item_desc.upper() or "REPAIR" in item_desc.upper() or "REMOVE" in item_desc.upper() or "SERVICE" in item_desc.upper() or "TEST" in item_desc.upper():
                    record["labour_desc"].append(item_desc.replace('\n', ' ').strip())
                else:
                    record["parts_desc"].append(item_desc.replace('\n', ' ').strip())

    record["line_items"] = parsed_items

    # If Total Amount not found from table, find from text regex
    if record["total_amount"] == 0.0:
        tot_matches = re.findall(r'(?:Total|LKR|Rs\.?)\s*[:#]?\s*(?:LKR|Rs\.?)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)', full_text, re.I)
        if tot_matches:
            cand_vals = [clean_number(m) for m in tot_matches if clean_number(m) > 100]
            if cand_vals:
                record["total_amount"] = cand_vals[-1]

    # If still 0, sum of line items
    if record["total_amount"] == 0.0 and parsed_items:
        record["total_amount"] = sum(item["total"] for item in parsed_items)

    return record

def parse_docx_invoice(file_path):
    record = {
        "file_name": os.path.basename(file_path),
        "folder_name": os.path.basename(os.path.dirname(file_path)),
        "file_path": file_path,
        "doc_type": "INVOICE",
        "invoice_no": "",
        "invoice_date": "",
        "vehicle_no": "",
        "make_model": "",
        "mileage": None,
        "chassis_no": "",
        "customer_name": "",
        "customer_phone": "",
        "labour_desc": [],
        "parts_desc": [],
        "line_items": [],
        "total_amount": 0.0
    }

    try:
        doc = docx.Document(file_path)
        full_text = "\n".join([p.text for p in doc.paragraphs])
        for table in doc.tables:
            for row in table.rows:
                full_text += "\n" + " ".join([cell.text for cell in row.cells])
    except:
        return None

    # Invoice No
    inv_m = re.search(r'(?:Invoice\s*No|Invoice\s*#|Estimate\s*No)\s*[:#]?\s*([A-Za-z0-9\-_]+)', full_text, re.I)
    if inv_m:
        record["invoice_no"] = inv_m.group(1).strip()
    else:
        fn_m = re.search(r'([0-9]{3,5})', os.path.basename(file_path))
        if fn_m:
            record["invoice_no"] = fn_m.group(1)

    # Date
    date_m = re.search(r'(?:Invoice\s*Date|Date)\s*[:#]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})', full_text, re.I)
    if date_m:
        record["invoice_date"] = date_m.group(1).strip()

    # Vehicle No
    veh_m = re.search(r'Vehicle\s*(?:No|Number)?\s*[:#]?\s*([A-Za-z0-9\s\-]+?)(?:Mile|Chassis|Date|\n|$)', full_text, re.I)
    if veh_m:
        record["vehicle_no"] = clean_vehicle_no(veh_m.group(1))
    if not record["vehicle_no"]:
        fn_veh_m = re.search(r'([A-Z]{2,3}\s*[\-]?\s*[0-9]{3,4})', os.path.basename(file_path), re.I)
        if fn_veh_m:
            record["vehicle_no"] = clean_vehicle_no(fn_veh_m.group(1))

    # Make Model
    model_m = re.search(r'Make\s*/?\s*Model\s*[:#]?\s*([A-Za-z0-9\s\-]+?)(?:Chassis|Vehicle|Mile|Date|\n|$)', full_text, re.I)
    if model_m:
        record["make_model"] = model_m.group(1).strip()

    # Mileage
    mile_m = re.search(r'Mile\s*age\s*[:;#]?\s*([0-9\s,]+)', full_text, re.I)
    if mile_m:
        record["mileage"] = clean_mileage(mile_m.group(1))

    # Total Amount
    tot_matches = re.findall(r'(?:Total|LKR|Rs\.?)\s*[:#]?\s*(?:LKR|Rs\.?)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)', full_text, re.I)
    if tot_matches:
        cand_vals = [clean_number(m) for m in tot_matches if clean_number(m) > 100]
        if cand_vals:
            record["total_amount"] = cand_vals[-1]

    return record

def main():
    print(f"Traversing directory: {BASE_DIR}")
    all_files = []
    for root, dirs, files in os.walk(BASE_DIR):
        for f in files:
            if not f.startswith('~$') and not f.endswith('.lnk') and not f.endswith('.tmp'):
                all_files.append(os.path.join(root, f))

    print(f"Total valid files to parse: {len(all_files)}")

    invoices_data = []
    line_items_data = []

    for i, file_path in enumerate(all_files):
        ext = os.path.splitext(file_path)[1].lower()
        rec = None
        if ext == '.pdf':
            rec = parse_pdf_invoice(file_path)
        elif ext in ['.docx', '.doc']:
            rec = parse_docx_invoice(file_path)
        elif ext in ['.xlsx', '.xls']:
            # Excel files
            rec = {
                "file_name": os.path.basename(file_path),
                "folder_name": os.path.basename(os.path.dirname(file_path)),
                "file_path": file_path,
                "doc_type": "INVOICE",
                "invoice_no": os.path.splitext(os.path.basename(file_path))[0],
                "invoice_date": "",
                "vehicle_no": "",
                "make_model": "Peugeot",
                "mileage": None,
                "chassis_no": "",
                "customer_name": "",
                "customer_phone": "",
                "labour_desc": [],
                "parts_desc": [],
                "line_items": [],
                "total_amount": 0.0
            }
            # Try extract vehicle no from filename
            fn_veh_m = re.search(r'([A-Z]{2,3}\s*[\-]?\s*[0-9]{3,4})', os.path.basename(file_path), re.I)
            if fn_veh_m:
                rec["vehicle_no"] = clean_vehicle_no(fn_veh_m.group(1))

        if rec:
            # Fallback vehicle no if empty: check folder/file
            if not rec["vehicle_no"] or len(rec["vehicle_no"]) < 3:
                fn_veh_m = re.search(r'([A-Z]{2,3}\s*[\-]?\s*[0-9]{3,4})', os.path.basename(file_path), re.I)
                if fn_veh_m:
                    rec["vehicle_no"] = clean_vehicle_no(fn_veh_m.group(1))
                else:
                    rec["vehicle_no"] = "UNKNOWN / GENERAL"

            invoices_data.append(rec)
            for li in rec.get("line_items", []):
                line_items_data.append({
                    "Invoice_Number": rec["invoice_no"],
                    "Invoice_Date": rec["invoice_date"],
                    "Vehicle_Number": rec["vehicle_no"],
                    "Item_Description": li["description"],
                    "Quantity": li["qty"],
                    "Unit_Price_LKR": li["unit_price"],
                    "Total_Amount_LKR": li["total"],
                    "Source_File": rec["file_name"],
                    "Folder": rec["folder_name"]
                })

        if (i + 1) % 100 == 0 or (i + 1) == len(all_files):
            print(f"Processed {i + 1} / {len(all_files)} files...")

    print(f"Total parsed invoice records: {len(invoices_data)}")

    # ── AGGREGATE BY VEHICLE NUMBER (PRIMARY KEY) ──────────────────────────
    vehicles_dict = {}
    for inv in invoices_data:
        v_num = inv["vehicle_no"]
        if not v_num:
            v_num = "UNKNOWN / GENERAL"

        if v_num not in vehicles_dict:
            vehicles_dict[v_num] = {
                "Vehicle_Number": v_num,
                "Make_Model": inv["make_model"] or "Peugeot",
                "Customer_Name": inv["customer_name"] or "",
                "Customer_Phone": inv["customer_phone"] or "",
                "Total_Invoices_Count": 0,
                "Total_Lifetime_Spend_LKR": 0.0,
                "Earliest_Visit_Date": inv["invoice_date"] or "",
                "Latest_Visit_Date": inv["invoice_date"] or "",
                "Latest_Mileage_KM": inv["mileage"] or None,
                "Chassis_VIN": inv["chassis_no"] or "",
                "Services_History_Summary": []
            }

        v_entry = vehicles_dict[v_num]
        v_entry["Total_Invoices_Count"] += 1
        v_entry["Total_Lifetime_Spend_LKR"] += inv["total_amount"]

        if not v_entry["Make_Model"] and inv["make_model"]:
            v_entry["Make_Model"] = inv["make_model"]
        if not v_entry["Chassis_VIN"] and inv["chassis_no"]:
            v_entry["Chassis_VIN"] = inv["chassis_no"]

        if inv["mileage"]:
            if not v_entry["Latest_Mileage_KM"] or inv["mileage"] > v_entry["Latest_Mileage_KM"]:
                v_entry["Latest_Mileage_KM"] = inv["mileage"]

        if inv["invoice_date"]:
            v_entry["Latest_Visit_Date"] = inv["invoice_date"]

        # Collect summary of work done
        all_desc = inv["labour_desc"] + inv["parts_desc"]
        for d in all_desc[:3]:
            if d not in v_entry["Services_History_Summary"]:
                v_entry["Services_History_Summary"].append(d)

    # Format summaries
    vehicles_rows = []
    for v_num, data in vehicles_dict.items():
        vehicles_rows.append({
            "Vehicle_Number": data["Vehicle_Number"],
            "Make_Model": data["Make_Model"],
            "Customer_Name": data["Customer_Name"],
            "Customer_Phone": data["Customer_Phone"],
            "Total_Invoices_Count": data["Total_Invoices_Count"],
            "Total_Lifetime_Spend_LKR": round(data["Total_Lifetime_Spend_LKR"], 2),
            "Earliest_Visit_Date": data["Earliest_Visit_Date"],
            "Latest_Visit_Date": data["Latest_Visit_Date"],
            "Latest_Mileage_KM": data["Latest_Mileage_KM"],
            "Chassis_VIN": data["Chassis_VIN"],
            "Key_Services_Done": ", ".join(data["Services_History_Summary"][:5])
        })

    # Sort vehicles by Total Invoices Count desc
    vehicles_rows.sort(key=lambda x: x["Total_Invoices_Count"], reverse=True)

    # Invoices Sheet Rows
    invoices_rows = []
    for inv in invoices_data:
        invoices_rows.append({
            "Invoice_Number": inv["invoice_no"],
            "Document_Type": inv["doc_type"],
            "Invoice_Date": inv["invoice_date"],
            "Vehicle_Number": inv["vehicle_no"],
            "Make_Model": inv["make_model"],
            "Mileage_KM": inv["mileage"],
            "Replaced_Parts_Summary": ", ".join(inv["parts_desc"][:4]),
            "Labour_Services_Summary": ", ".join(inv["labour_desc"][:4]),
            "Total_Amount_LKR": round(inv["total_amount"], 2),
            "Month_Folder": inv["folder_name"],
            "File_Name": inv["file_name"]
        })

    # Create DataFrames
    df_vehicles = pd.DataFrame(vehicles_rows)
    df_invoices = pd.DataFrame(invoices_rows)
    df_items = pd.DataFrame(line_items_data)

    print(f"Generated {len(df_vehicles)} distinct customer vehicles!")
    print(f"Generated {len(df_invoices)} detailed invoice rows!")
    print(f"Generated {len(df_items)} itemized line items!")

    # Write to styled Excel file
    with pd.ExcelWriter(OUTPUT_EXCEL, engine='openpyxl') as writer:
        df_vehicles.to_excel(writer, sheet_name='Customer_Vehicles_Master', index=False)
        df_invoices.to_excel(writer, sheet_name='All_Invoices_History', index=False)
        df_items.to_excel(writer, sheet_name='Itemized_Line_Items', index=False)

    # Apply professional styling to Excel
    wb = openpyxl.load_workbook(OUTPUT_EXCEL)
    
    header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    cyan_font = Font(name="Calibri", size=11, bold=True, color="0087BC")
    currency_fmt = '#,##0.00'

    for ws in wb.worksheets:
        ws.views.sheetView[0].showGridLines = True
        
        # Style Header Row
        for col_idx in range(1, ws.max_column + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

        # Auto fit column widths
        for col in ws.columns:
            max_len = 0
            col_letter = get_column_letter(col[0].column)
            for cell in col:
                val_str = str(cell.value or '')
                if len(val_str) > max_len:
                    max_len = len(val_str)
            ws.column_dimensions[col_letter].width = min(max(max_len + 4, 12), 45)

        ws.row_dimensions[1].height = 28

    wb.save(OUTPUT_EXCEL)
    print(f"EXCEL MASTERFILE SAVED TO: {OUTPUT_EXCEL}")

if __name__ == "__main__":
    main()
