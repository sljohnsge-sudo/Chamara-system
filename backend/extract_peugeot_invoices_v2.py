import os
import re
import glob
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import pypdf
import pymysql

BASE_DIR = r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New folder"
OUTPUT_EXCEL_1 = r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\Peugeot_Land_Customer_Invoices_Master.xlsx"
OUTPUT_EXCEL_2 = r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New folder\New folder\Peugeot_Land_Customer_Invoices_Master.xlsx"

MONTH_MAP = {
    'jan': '01', 'january': '01',
    'feb': '02', 'february': '02',
    'mar': '03', 'march': '03',
    'apr': '04', 'april': '04',
    'may': '05',
    'jun': '06', 'june': '06',
    'jul': '07', 'july': '07', 'jule': '07',
    'aug': '08', 'august': '08', 'augest': '08', 'auguest': '08',
    'sep': '09', 'september': '09',
    'oct': '10', 'october': '10',
    'nov': '11', 'november': '11',
    'dec': '12', 'december': '12'
}

def clean_vehicle_no(raw):
    if not raw:
        return ""
    v = raw.strip().upper()
    v = re.sub(r'PEUGEOT\s*LAND.*', '', v, flags=re.I)
    v = re.sub(r'CUSTOMER\s*DETAILS', '', v, flags=re.I)
    v = re.sub(r'[\r\n\t]', ' ', v)
    v = re.sub(r'\s+', ' ', v).strip()
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
    s = re.sub(r'[^0-9]', '', s)
    try:
        val = int(s)
        return val if val > 0 else None
    except:
        return None

def extract_date(txt, folder_name, fn):
    # Pattern 1: Explicit "Invoice Date : 19/02/2025" or "Date 1/21/2025"
    m = re.search(r'(?:Invoice\s*Date|Estimate\s*Date|Date)\s*[:\s#]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})', txt, re.I)
    if m:
        raw_d = m.group(1).strip()
        parts = re.split(r'[/-]', raw_d)
        if len(parts) == 3:
            p1, p2, p3 = int(parts[0]), int(parts[1]), int(parts[2])
            if p3 < 100: p3 += 2000
            if p1 > 12: day, month, year = p1, p2, p3
            elif p2 > 12: day, month, year = p2, p1, p3
            else: day, month, year = p1, p2, p3 # Default DD/MM/YYYY
            return f"{year:04d}-{month:02d}-{day:02d}"

    # Pattern 2: Any date pattern in text
    m2 = re.search(r'\b([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})\b', txt)
    if m2:
        parts = re.split(r'[/-]', m2.group(1).strip())
        if len(parts) == 3:
            p1, p2, p3 = int(parts[0]), int(parts[1]), int(parts[2])
            if p3 < 100: p3 += 2000
            if p1 > 12: day, month, year = p1, p2, p3
            elif p2 > 12: day, month, year = p2, p1, p3
            else: day, month, year = p1, p2, p3
            return f"{year:04d}-{month:02d}-{day:02d}"

    # Pattern 3: Fallback from folder name
    fol_lower = folder_name.lower()
    yr_m = re.search(r'20[2-3][0-9]', fol_lower)
    yr = yr_m.group(0) if yr_m else '2025'
    mo = '01'
    for k, v in MONTH_MAP.items():
        if k in fol_lower:
            mo = v
            break
    return f"{yr}-{mo}-01"

def extract_customer_name(txt, fn, veh_no, known_cust_map):
    # Check if vehicle exists in known customer map
    if veh_no in known_cust_map:
        return known_cust_map[veh_no].get("name", "")

    # Pattern A: Specific titles
    m_title = re.search(r'((?:Mr\.|Mrs\.|Ms\.|Dr\.|Capt\.|Prof\.|Hon\.)\s+[A-Za-z\s\.\-]+)', txt)
    if m_title:
        cand = m_title.group(1).strip()
        if len(cand) > 4 and 'PEUGEOT' not in cand.upper() and not cand.lower().endswith('.pdf'):
            return cand

    # Pattern B: Corporate names (Pvt Ltd, Holdings, etc.)
    m_corp = re.findall(r'([A-Za-z0-9\s\.\&]+(?:(?:Pvt|Private)\s*Ltd|Holdings|Logistics|Engineering|Enterprises|Motors|Investments))', txt, re.I)
    for comp in m_corp:
        comp_clean = comp.strip()
        if 'PEUGEOT' not in comp_clean.upper() and len(comp_clean) > 4 and not comp_clean.lower().endswith('.pdf'):
            return comp_clean

    # Pattern C: Under Customer Details if text is name rather than vehicle
    cust_m = re.search(r'Customer\s*Details\s*\n\s*([A-Za-z\s\.\(\)\&\'\-]+)', txt, re.I)
    if cust_m:
        cand = cust_m.group(1).strip()
        if not re.match(r'^[A-Z]{1,3}\s*[\-]?\s*[0-9]{3,4}$', cand) and len(cand) > 3 and 'PEUGEOT' not in cand.upper() and not cand.lower().endswith('.pdf'):
            return cand

    # Default clean fallback:
    return f"Customer ({veh_no})" if veh_no and veh_no != "UNKNOWN / GENERAL" else "Customer"

def parse_file(file_path, known_cust_map):
    ext = os.path.splitext(file_path)[1].lower()
    fn = os.path.basename(file_path)
    folder_name = os.path.basename(os.path.dirname(file_path))

    record = {
        "file_name": fn,
        "folder_name": folder_name,
        "file_path": file_path,
        "doc_type": "INVOICE",
        "invoice_no": "",
        "repaired_date": "",
        "vehicle_no": "",
        "make_model": "Peugeot",
        "mileage": None,
        "chassis_no": "",
        "customer_name": "",
        "customer_phone": "",
        "labour_summary": "",
        "parts_summary": "",
        "total_amount": 0.0
    }

    full_text = ""
    if ext == '.pdf':
        try:
            reader = pypdf.PdfReader(file_path)
            full_text = "\n".join([page.extract_text() or "" for page in reader.pages])
        except:
            return None
    elif ext in ['.docx', '.doc']:
        try:
            import docx
            doc = docx.Document(file_path)
            full_text = "\n".join([p.text for p in doc.paragraphs])
            for table in doc.tables:
                for row in table.rows:
                    full_text += "\n" + " ".join([cell.text for cell in row.cells])
        except:
            return None
    elif ext in ['.xlsx', '.xls']:
        fn_veh_m = re.search(r'([A-Z]{2,3}\s*[\-]?\s*[0-9]{3,4})', fn, re.I)
        record["vehicle_no"] = clean_vehicle_no(fn_veh_m.group(1)) if fn_veh_m else "UNKNOWN / GENERAL"
        record["invoice_no"] = os.path.splitext(fn)[0]
        record["repaired_date"] = extract_date("", folder_name, fn)
        record["customer_name"] = extract_customer_name("", fn, record["vehicle_no"], known_cust_map)
        return record

    if not full_text:
        return None

    # Doc Type
    if "ESTIMATE" in full_text.upper() or "Estimate No" in full_text:
        record["doc_type"] = "ESTIMATE"

    # Invoice Number
    inv_m = re.search(r'(?:Invoice\s*No|Invoice\s*#|Estimate\s*No|Estimate\s*#)\s*[:#]?\s*([A-Za-z0-9\-_]+)', full_text, re.I)
    if inv_m and inv_m.group(1).upper() not in ['DATE', 'TECHNICIAN', 'MILEAGE', 'DESCRIPTION']:
        record["invoice_no"] = inv_m.group(1).strip()
    else:
        fn_m = re.search(r'([0-9]{3,5})', fn)
        if fn_m:
            record["invoice_no"] = fn_m.group(1)
        else:
            record["invoice_no"] = os.path.splitext(fn)[0]

    # Repaired Done Date
    record["repaired_date"] = extract_date(full_text, folder_name, fn)

    # Vehicle Number
    veh_m = re.search(r'Vehicle\s*(?:No|Number)?\s*[:#]?\s*([A-Za-z0-9\s\-]+?)(?:Mile|Chassis|Date|\n|$)', full_text, re.I)
    if veh_m:
        record["vehicle_no"] = clean_vehicle_no(veh_m.group(1))
    
    if not record["vehicle_no"] or len(record["vehicle_no"]) < 3 or record["vehicle_no"] in ['PEUGEOT', 'DATE']:
        cust_m = re.search(r'Customer\s*Details\s*\n\s*([A-Za-z0-9\s\-]+)', full_text, re.I)
        if cust_m:
            record["vehicle_no"] = clean_vehicle_no(cust_m.group(1))

    if not record["vehicle_no"] or len(record["vehicle_no"]) < 3:
        fn_veh_m = re.search(r'([A-Z]{2,3}\s*[\-]?\s*[0-9]{3,4})', fn, re.I)
        if fn_veh_m:
            record["vehicle_no"] = clean_vehicle_no(fn_veh_m.group(1))
        else:
            record["vehicle_no"] = "UNKNOWN / GENERAL"

    # Customer Name & Phone
    record["customer_name"] = extract_customer_name(full_text, fn, record["vehicle_no"], known_cust_map)
    if record["vehicle_no"] in known_cust_map and known_cust_map[record["vehicle_no"]].get("phone"):
        record["customer_phone"] = known_cust_map[record["vehicle_no"]]["phone"]

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

    # Total Amount Extraction
    # Strategy 1: Explicit "Total : 236000.00" or "Total LKR 125,000.00"
    tot_matches = re.findall(r'(?:Total|LKR|Rs\.?)\s*[:#]?\s*(?:LKR|Rs\.?)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)', full_text, re.I)
    if tot_matches:
        cand_vals = [clean_number(m) for m in tot_matches if clean_number(m) > 100]
        if cand_vals:
            record["total_amount"] = cand_vals[-1]

    # Strategy 2: Preceding "Please draw all the cheques"
    if record["total_amount"] == 0.0:
        m_cheque = re.search(r'([0-9]{3,9}(?:\.[0-9]{2})?)\s*\n\s*(?:Please\s*draw|THANK\s*YOU|Approved\s*By)', full_text, re.I)
        if m_cheque:
            record["total_amount"] = clean_number(m_cheque.group(1))

    # Strategy 3: Find highest number in the invoice text
    if record["total_amount"] == 0.0:
        all_nums = [clean_number(n) for n in re.findall(r'\b([0-9]{3,8}(?:\.[0-9]{2})?)\b', full_text) if clean_number(n) > 500]
        # Avoid mileage looking numbers > 10,000 if not a price
        if all_nums:
            record["total_amount"] = all_nums[-1]

    # Extract Line descriptions
    lines = full_text.split('\n')
    labour_items = []
    part_items = []
    
    for l in lines:
        l_str = l.strip()
        if len(l_str) < 4 or any(skip in l_str.upper() for skip in ['PEUGEOT LAND', 'GORAKAPOLA', 'PANADURA', 'HOTLINE', 'EMAIL', 'THANK YOU', 'CHEQUE', 'COMPUTER GENERATED', 'SIGNATURE']):
            continue
        
        if any(w in l_str.upper() for w in ['LABOUR', 'CHARGE', 'REPAIR', 'REMOVE', 'SERVICE', 'SCANNER', 'OVERHAUL', 'TEST', 'FIT', 'CLEAN']):
            labour_items.append(l_str)
        elif any(w in l_str.upper() for w in ['OIL', 'FILTER', 'BELT', 'BUSH', 'PAD', 'PLUG', 'PUMP', 'SENSOR', 'VALVE', 'COOLANT', 'SEAL', 'HOSE', 'BATTERY', 'RACK', 'BEARING', 'SHOCK', 'ARM', 'GASKET']):
            part_items.append(l_str)

    record["labour_summary"] = " | ".join(labour_items[:4])
    record["parts_summary"] = " | ".join(part_items[:5])

    return record

def main():
    print("Loading known database customers...")
    known_cust_map = {}
    try:
        conn = pymysql.connect(host='localhost', user='root', password='', database='peugeot_land')
        with conn.cursor() as cur:
            cur.execute('SELECT v.vehicle_number, c.name, c.phone FROM vehicles v JOIN customers c ON v.customer_id = c.id')
            for v_num, c_name, c_phone in cur.fetchall():
                known_cust_map[clean_vehicle_no(v_num)] = {"name": c_name, "phone": c_phone}
    except Exception as e:
        print("Note: DB map not connected:", e)

    print("Collecting files from:", BASE_DIR)
    all_files = []
    for root, dirs, files in os.walk(BASE_DIR):
        for f in files:
            if not f.startswith('~$') and not f.endswith('.lnk') and not f.endswith('.tmp') and not f.endswith('.xlsx'):
                all_files.append(os.path.join(root, f))

    print(f"Total files to parse: {len(all_files)}")

    invoices_data = []
    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = {executor.submit(parse_file, f, known_cust_map): f for f in all_files}
        for future in as_completed(futures):
            res = future.result()
            if res:
                invoices_data.append(res)

    print(f"Successfully extracted {len(invoices_data)} invoice documents!")

    # ── AGGREGATE BY VEHICLE NUMBER (PRIMARY KEY) ──────────────────────────
    vehicles_dict = {}
    for inv in invoices_data:
        v_num = inv["vehicle_no"]
        if v_num not in vehicles_dict:
            vehicles_dict[v_num] = {
                "Vehicle_Number": v_num,
                "Customer_Name": inv["customer_name"] or f"Customer ({v_num})",
                "Customer_Phone": inv["customer_phone"] or "",
                "Make_Model": inv["make_model"] or "Peugeot",
                "Total_Invoices_Count": 0,
                "Total_Lifetime_Spend_LKR": 0.0,
                "First_Repaired_Date": inv["repaired_date"] or "",
                "Latest_Repaired_Date": inv["repaired_date"] or "",
                "Latest_Mileage_KM": inv["mileage"] or None,
                "Chassis_VIN": inv["chassis_no"] or "",
                "Services_History": []
            }

        v = vehicles_dict[v_num]
        v["Total_Invoices_Count"] += 1
        v["Total_Lifetime_Spend_LKR"] += inv["total_amount"]
        
        # Keep richest customer name
        if (not v["Customer_Name"] or v["Customer_Name"].startswith("Customer (")) and inv["customer_name"] and not inv["customer_name"].startswith("Customer ("):
            v["Customer_Name"] = inv["customer_name"]

        if not v["Customer_Phone"] and inv["customer_phone"]:
            v["Customer_Phone"] = inv["customer_phone"]

        if not v["Make_Model"] and inv["make_model"]:
            v["Make_Model"] = inv["make_model"]
        if not v["Chassis_VIN"] and inv["chassis_no"]:
            v["Chassis_VIN"] = inv["chassis_no"]
        
        if inv["mileage"]:
            if not v["Latest_Mileage_KM"] or inv["mileage"] > v["Latest_Mileage_KM"]:
                v["Latest_Mileage_KM"] = inv["mileage"]
        
        if inv["repaired_date"]:
            if not v["First_Repaired_Date"] or inv["repaired_date"] < v["First_Repaired_Date"]:
                v["First_Repaired_Date"] = inv["repaired_date"]
            if not v["Latest_Repaired_Date"] or inv["repaired_date"] > v["Latest_Repaired_Date"]:
                v["Latest_Repaired_Date"] = inv["repaired_date"]
        
        all_desc = ([inv["labour_summary"]] if inv["labour_summary"] else []) + ([inv["parts_summary"]] if inv["parts_summary"] else [])
        for d in all_desc:
            if d and d not in v["Services_History"]:
                v["Services_History"].append(d)

    vehicles_rows = []
    for v_num, d in vehicles_dict.items():
        vehicles_rows.append({
            "Vehicle_Number": d["Vehicle_Number"],
            "Customer_Name": d["Customer_Name"],
            "Customer_Phone": d["Customer_Phone"],
            "Make_Model": d["Make_Model"],
            "Total_Invoices_Count": d["Total_Invoices_Count"],
            "Total_Lifetime_Spend_LKR": round(d["Total_Lifetime_Spend_LKR"], 2),
            "First_Repaired_Date": d["First_Repaired_Date"],
            "Latest_Repaired_Date": d["Latest_Repaired_Date"],
            "Latest_Mileage_KM": d["Latest_Mileage_KM"],
            "Chassis_VIN": d["Chassis_VIN"],
            "Key_Services_Done": " | ".join(d["Services_History"][:3])
        })

    vehicles_rows.sort(key=lambda x: x["Total_Invoices_Count"], reverse=True)

    invoices_rows = []
    for inv in invoices_data:
        invoices_rows.append({
            "Invoice_Number": inv["invoice_no"],
            "Repaired_Done_Date": inv["repaired_date"],
            "Vehicle_Number": inv["vehicle_no"],
            "Customer_Name": inv["customer_name"],
            "Make_Model": inv["make_model"],
            "Mileage_KM": inv["mileage"],
            "Total_Amount_LKR": round(inv["total_amount"], 2),
            "Document_Type": inv["doc_type"],
            "Labour_Services_Done": inv["labour_summary"],
            "Replaced_Spare_Parts": inv["parts_summary"],
            "Month_Folder": inv["folder_name"],
            "Source_File_Name": inv["file_name"]
        })

    invoices_rows.sort(key=lambda x: str(x["Repaired_Done_Date"]), reverse=True)

    df_vehicles = pd.DataFrame(vehicles_rows)
    df_invoices = pd.DataFrame(invoices_rows)

    print(f"Writing Excel files with {len(df_vehicles)} unique customer vehicles and {len(df_invoices)} invoices...")

    target_paths = [
        r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New folder\New folder\Peugeot_Land_Customer_Invoices_Master.xlsx",
        r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\Peugeot_Land_Customer_Invoices_Master.xlsx",
        r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New folder\New folder\Peugeot_Land_Customer_Invoices_Master_Updated.xlsx",
        r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\Peugeot_Land_Customer_Invoices_Master_Updated.xlsx"
    ]

    saved_files = []
    for out_path in target_paths:
        try:
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with pd.ExcelWriter(out_path, engine='openpyxl') as writer:
                df_vehicles.to_excel(writer, sheet_name='Customer_Vehicles_Master', index=False)
                df_invoices.to_excel(writer, sheet_name='All_Invoices_History', index=False)

            # Style Excel
            wb = openpyxl.load_workbook(out_path)
            header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
            header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

            for ws in wb.worksheets:
                ws.views.sheetView[0].showGridLines = True
                for col_idx in range(1, ws.max_column + 1):
                    cell = ws.cell(row=1, column=col_idx)
                    cell.fill = header_fill
                    cell.font = header_font
                    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)

                for col in ws.columns:
                    max_len = 0
                    col_letter = get_column_letter(col[0].column)
                    for cell in col:
                        val_str = str(cell.value or '')
                        if len(val_str) > max_len:
                            max_len = len(val_str)
                    ws.column_dimensions[col_letter].width = min(max(max_len + 4, 14), 50)

                ws.row_dimensions[1].height = 28

            wb.save(out_path)
            print(f"SAVED: {out_path}")
            saved_files.append(out_path)
        except PermissionError:
            print(f"File locked by Excel (skipping): {out_path}")
        except Exception as e:
            print(f"Error saving {out_path}: {e}")

    print(f"ALL DONE! Saved to {len(saved_files)} locations:")
    for sf in saved_files:
        print("  ->", sf)

if __name__ == "__main__":
    main()
