import os
import re
import glob
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import pdfplumber
import pypdf
import docx

BASE_DIR = r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New folder"
OUTPUT_EXCEL_FORMAT = r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New format\Peugeot_Invoices_Formatted.xlsx"
OUTPUT_EXCEL_TEMPLATE = r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New format\New Microsoft Excel Worksheet.xlsx"

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

def clean_num_str(raw):
    if not raw:
        return ""
    s = str(raw).replace('LKR', '').replace('Rs', '').replace('rs', '').replace('=', '').replace(' ', '').replace(',', '').strip()
    try:
        f = float(s)
        return f if f > 0 else ""
    except:
        return ""

def clean_mileage(raw):
    if not raw:
        return ""
    s = str(raw).upper().replace('KM', '').replace('Km', '').replace('km', '').replace(' ', '').replace(',', '').strip()
    s = re.sub(r'[^0-9]', '', s)
    return s if s else ""

def extract_date(txt, folder_name, fn):
    m = re.search(r'(?:Invoice\s*Date|Estimate\s*Date|Date)\s*[:\s#]*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})', txt, re.I)
    if m:
        raw_d = m.group(1).strip()
        parts = re.split(r'[/-]', raw_d)
        if len(parts) == 3:
            p1, p2, p3 = int(parts[0]), int(parts[1]), int(parts[2])
            if p3 < 100: p3 += 2000
            if p1 > 12: day, month, year = p1, p2, p3
            elif p2 > 12: day, month, year = p2, p1, p3
            else: day, month, year = p1, p2, p3
            return f"{year:04d}-{month:02d}-{day:02d}"

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

    fol_lower = folder_name.lower()
    yr_m = re.search(r'20[2-3][0-9]', fol_lower)
    yr = yr_m.group(0) if yr_m else '2025'
    mo = '01'
    for k, v in MONTH_MAP.items():
        if k in fol_lower:
            mo = v
            break
    return f"{yr}-{mo}-01"

def parse_single_file(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    fn = os.path.basename(file_path)
    folder_name = os.path.basename(os.path.dirname(file_path))

    header = {
        "invoice_no": "",
        "invoice_date": "",
        "make_model": "",
        "vehicle_no": "",
        "chassis_no": "",
        "mileage": "",
        "grand_total": 0.0
    }

    full_text = ""
    all_tables = []

    if ext == '.pdf':
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    full_text += "\n" + (page.extract_text() or "")
                    all_tables.extend(page.extract_tables() or [])
        except:
            try:
                reader = pypdf.PdfReader(file_path)
                full_text = "\n".join([page.extract_text() or "" for page in reader.pages])
            except:
                return []
    elif ext in ['.docx', '.doc']:
        try:
            doc = docx.Document(file_path)
            full_text = "\n".join([p.text for p in doc.paragraphs])
            for table in doc.tables:
                t_rows = []
                for row in table.rows:
                    t_rows.append([cell.text for cell in row.cells])
                all_tables.append(t_rows)
        except:
            return []
    elif ext in ['.xlsx', '.xls']:
        fn_veh = re.search(r'([A-Z]{2,3}\s*[\-]?\s*[0-9]{3,4})', fn, re.I)
        header["vehicle_no"] = clean_vehicle_no(fn_veh.group(1)) if fn_veh else "UNKNOWN"
        header["invoice_no"] = os.path.splitext(fn)[0]
        header["invoice_date"] = extract_date("", folder_name, fn)
        header["make_model"] = "Peugeot"
        return [{
            "Invoice_No": header["invoice_no"],
            "Invoice_Date": header["invoice_date"],
            "Make_Model": header["make_model"],
            "Vehicle_No": header["vehicle_no"],
            "Chassis_No": "",
            "Mileage": "",
            "Description": "General Maintenance / Spare Parts Invoice",
            "Qt": "1",
            "Unit": "",
            "Total_Rs": "",
            "Total": 0.0
        }]

    if not full_text:
        return []

    # 1. Invoice Number
    inv_m = re.search(r'(?:Invoice\s*No|Invoice\s*#|Estimate\s*No|Estimate\s*#)\s*[:#]?\s*([A-Za-z0-9\-_]+)', full_text, re.I)
    if inv_m and inv_m.group(1).upper() not in ['DATE', 'TECHNICIAN', 'MILEAGE', 'DESCRIPTION']:
        header["invoice_no"] = inv_m.group(1).strip()
    else:
        fn_m = re.search(r'([0-9]{3,5})', fn)
        header["invoice_no"] = fn_m.group(1) if fn_m else os.path.splitext(fn)[0]

    # 2. Invoice Date
    header["invoice_date"] = extract_date(full_text, folder_name, fn)

    # 3. Vehicle Number
    veh_m = re.search(r'Vehicle\s*(?:No|Number)?\s*[:#]?\s*([A-Za-z0-9\s\-]+?)(?:Mile|Chassis|Date|\n|$)', full_text, re.I)
    if veh_m:
        header["vehicle_no"] = clean_vehicle_no(veh_m.group(1))
    if not header["vehicle_no"] or len(header["vehicle_no"]) < 3 or header["vehicle_no"] in ['PEUGEOT', 'DATE']:
        cust_m = re.search(r'Customer\s*Details\s*\n\s*([A-Za-z0-9\s\-]+)', full_text, re.I)
        if cust_m:
            header["vehicle_no"] = clean_vehicle_no(cust_m.group(1))
    if not header["vehicle_no"] or len(header["vehicle_no"]) < 3:
        fn_veh = re.search(r'([A-Z]{2,3}\s*[\-]?\s*[0-9]{3,4})', fn, re.I)
        header["vehicle_no"] = clean_vehicle_no(fn_veh.group(1)) if fn_veh else "UNKNOWN"

    # 4. Make / Model
    model_m = re.search(r'Make\s*/?\s*Model\s*[:#]?\s*([A-Za-z0-9\s\-]+?)(?:Chassis|Vehicle|Mile|Date|\n|$)', full_text, re.I)
    if model_m:
        m_str = model_m.group(1).strip()
        if m_str and len(m_str) < 35 and not m_str.upper().startswith('CHASSIS'):
            header["make_model"] = f"Peugeot {m_str}" if "PEUGEOT" not in m_str.upper() else m_str
    if not header["make_model"]:
        header["make_model"] = "Peugeot"

    # 5. Mileage
    mile_m = re.search(r'Mile\s*age\s*[:;#]?\s*([0-9\s,]+)\s*(?:KM|Km)?', full_text, re.I)
    if mile_m:
        header["mileage"] = clean_mileage(mile_m.group(1))

    # 6. Chassis / VIN
    chassis_m = re.search(r'Chassis\s*(?:no|No)?\s*[:#]?\s*([A-Za-z0-9\s\-]+?)(?:Vehicle|Mile|Date|\n|$)', full_text, re.I)
    if chassis_m:
        c_str = chassis_m.group(1).strip()
        if len(c_str) >= 5:
            header["chassis_no"] = c_str

    # 7. Extract Grand Total
    # Priority: Table Total cell -> Regex -> Word pattern
    for table in all_tables:
        if not table: continue
        for row in table:
            if not row: continue
            row_str = " ".join([str(c) for c in row if c])
            if "TOTAL" in row_str.upper():
                nums = [clean_num_str(c) for c in row if c and clean_num_str(c)]
                if nums:
                    header["grand_total"] = max(nums)

    if header["grand_total"] == 0.0:
        tot_matches = re.findall(r'(?:Total|LKR|Rs\.?)\s*[:#]?\s*(?:LKR|Rs\.?)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)', full_text, re.I)
        if tot_matches:
            cand_vals = [clean_num_str(m) for m in tot_matches if clean_num_str(m) and clean_num_str(m) > 100]
            if cand_vals:
                header["grand_total"] = cand_vals[-1]

    if header["grand_total"] == 0.0:
        m_cheque = re.search(r'([0-9]{3,9}(?:\.[0-9]{2})?)\s*\n\s*(?:Please\s*draw|THANK\s*YOU|Approved\s*By)', full_text, re.I)
        if m_cheque:
            header["grand_total"] = clean_num_str(m_cheque.group(1)) or 0.0

    # 8. Parse Table Line Items
    line_rows = []
    seen_items = set()

    for table in all_tables:
        if not table: continue
        # Detect column positions from header row if present
        header_row = table[0] if table else []
        desc_idx = 1
        qty_idx = 2
        unit_idx = 3
        tot_idx = 4

        for r_i, row in enumerate(table):
            if not row or len(row) < 2: continue
            row_str = " ".join([str(c) for c in row if c])
            if any(h in row_str.upper() for h in ['DESCRIPTION', 'TOTAL(RS)', 'ITEM CODE', 'PRICE EACH', 'QUANTITY']):
                continue
            if "TOTAL" in row_str.upper():
                continue

            desc = ""
            qt = ""
            unit = ""
            tot_rs = ""

            # Check if standard 5-column layout [No, Description, Qty, Unit Price, Total]
            if len(row) >= 5:
                desc = str(row[1] or '').replace('\n', ' ').strip()
                qt = str(row[2] or '').strip()
                unit = clean_num_str(row[3])
                tot_rs = clean_num_str(row[4])
            elif len(row) == 4: # [No, Description, Qty, Total]
                desc = str(row[1] or '').replace('\n', ' ').strip()
                qt = str(row[2] or '').strip()
                tot_rs = clean_num_str(row[3])
            elif len(row) >= 2:
                # Flexible scan
                strs = [str(c).strip() for c in row if c and str(c).strip()]
                for s in strs:
                    if len(s) > 2 and not re.match(r'^[0-9\s,\.\-LKRrs%]+$', s) and s.upper() not in ['TOTAL', 'NO', 'ITEM CODE', 'APPROVED BY', 'CLIENT']:
                        desc = s.replace('\n', ' ').strip()
                        break
                nums = [clean_num_str(c) for c in strs if clean_num_str(c)]
                if nums:
                    tot_rs = nums[-1]
                    unit = nums[-2] if len(nums) >= 2 else ""

            if desc and desc.upper() not in ['TOTAL', 'NO', 'ITEM CODE', 'DESCRIPTION', '']:
                # Deduplicate
                item_key = (desc.lower(), str(tot_rs))
                if item_key in seen_items:
                    continue
                seen_items.add(item_key)

                if not qt: qt = "1"

                line_rows.append({
                    "Invoice_No": header["invoice_no"],
                    "Invoice_Date": header["invoice_date"],
                    "Make_Model": header["make_model"],
                    "Vehicle_No": header["vehicle_no"],
                    "Chassis_No": header["chassis_no"],
                    "Mileage": header["mileage"],
                    "Description": desc,
                    "Qt": qt,
                    "Unit": unit,
                    "Total_Rs": tot_rs,
                    "Total": header["grand_total"]
                })

    # Fallback to text parsing if no table lines
    if not line_rows:
        lines = full_text.split('\n')
        for l in lines:
            l_str = l.strip()
            if len(l_str) < 4 or any(skip in l_str.upper() for skip in ['PEUGEOT LAND', 'GORAKAPOLA', 'PANADURA', 'HOTLINE', 'EMAIL', 'THANK YOU', 'CHEQUE', 'COMPUTER GENERATED', 'SIGNATURE', 'APPROVED BY']):
                continue
            
            if any(w in l_str.upper() for w in ['LABOUR', 'CHARGE', 'REPAIR', 'REMOVE', 'SERVICE', 'SCANNER', 'OIL', 'FILTER', 'BELT', 'BUSH', 'PAD', 'PLUG', 'PUMP', 'SENSOR', 'VALVE', 'COOLANT', 'SEAL', 'RACK', 'BATTERY', 'HOSE', 'SHOCK', 'ARM', 'GASKET']):
                num_m = re.findall(r'([0-9]{3,8}(?:\.[0-9]{2})?)', l_str)
                l_tot = clean_num_str(num_m[-1]) if num_m else ""
                
                line_rows.append({
                    "Invoice_No": header["invoice_no"],
                    "Invoice_Date": header["invoice_date"],
                    "Make_Model": header["make_model"],
                    "Vehicle_No": header["vehicle_no"],
                    "Chassis_No": header["chassis_no"],
                    "Mileage": header["mileage"],
                    "Description": l_str,
                    "Qt": "1",
                    "Unit": l_tot,
                    "Total_Rs": l_tot,
                    "Total": header["grand_total"]
                })

    if not line_rows:
        line_rows.append({
            "Invoice_No": header["invoice_no"],
            "Invoice_Date": header["invoice_date"],
            "Make_Model": header["make_model"],
            "Vehicle_No": header["vehicle_no"],
            "Chassis_No": header["chassis_no"],
            "Mileage": header["mileage"],
            "Description": "General Vehicle Service & Maintenance",
            "Qt": "1",
            "Unit": header["grand_total"] if header["grand_total"] > 0 else "",
            "Total_Rs": header["grand_total"] if header["grand_total"] > 0 else "",
            "Total": header["grand_total"]
        })

    return line_rows

def main():
    print(f"Traversing: {BASE_DIR}")
    all_files = []
    for root, dirs, files in os.walk(BASE_DIR):
        for f in files:
            if not f.startswith('~$') and not f.endswith('.lnk') and not f.endswith('.tmp') and not f.endswith('.xlsx'):
                all_files.append(os.path.join(root, f))

    print(f"Total files to parse: {len(all_files)}")

    all_rows = []
    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = {executor.submit(parse_single_file, f): f for f in all_files}
        for future in as_completed(futures):
            res = future.result()
            if res:
                all_rows.extend(res)

    print(f"Total raw line items extracted: {len(all_rows)}")

    # Deduplicate rows by (Invoice_No, Invoice_Date, Vehicle_No, Description, Qt, Total_Rs)
    unique_rows = []
    seen_keys = set()
    for row in all_rows:
        key = (
            str(row["Invoice_No"]).strip(),
            str(row["Invoice_Date"]).strip(),
            str(row["Vehicle_No"]).strip(),
            str(row["Description"]).strip().lower(),
            str(row["Qt"]).strip(),
            str(row["Total_Rs"]).strip()
        )
        if key not in seen_keys:
            seen_keys.add(key)
            unique_rows.append(row)

    print(f"Total unique itemized rows after deduplication: {len(unique_rows)}")

    # Sort rows by Invoice Date desc, then Invoice No
    unique_rows.sort(key=lambda x: (str(x["Invoice_Date"]), str(x["Invoice_No"])), reverse=True)

    # ── CREATE WORKBOOK ACCORDING TO THE REQUESTED NEW FORMAT ──────────────
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sheet1"

    # Row 2: Title
    ws.cell(row=2, column=2, value="Invoice format ")
    ws.cell(row=2, column=2).font = Font(name="Calibri", size=13, bold=True, color="0F172A")

    # Row 3: Headers (exact columns as requested in template)
    headers = [
        "Invoice No",
        "Invoice Date",
        "Make/Model",
        "Vehicle No",
        "Chassis no",
        "Mile age",
        "Description Type of repair ",
        "Qt",
        "Unit",
        "Total(Rs)",
        "Total"
    ]

    header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    border_thin = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='thin', color='CBD5E1')
    )

    for i, h in enumerate(headers, start=2):
        cell = ws.cell(row=3, column=i, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = border_thin

    ws.row_dimensions[2].height = 24
    ws.row_dimensions[3].height = 28

    # Populate Data starting from Row 4
    for r_idx, row in enumerate(unique_rows, start=4):
        ws.cell(row=r_idx, column=2, value=row["Invoice_No"]).alignment = Alignment(horizontal="center")
        ws.cell(row=r_idx, column=3, value=row["Invoice_Date"]).alignment = Alignment(horizontal="center")
        ws.cell(row=r_idx, column=4, value=row["Make_Model"]).alignment = Alignment(horizontal="left")
        ws.cell(row=r_idx, column=5, value=row["Vehicle_No"]).alignment = Alignment(horizontal="center")
        ws.cell(row=r_idx, column=6, value=row["Chassis_No"]).alignment = Alignment(horizontal="center")
        ws.cell(row=r_idx, column=7, value=row["Mileage"]).alignment = Alignment(horizontal="center")
        ws.cell(row=r_idx, column=8, value=row["Description"]).alignment = Alignment(horizontal="left")
        ws.cell(row=r_idx, column=9, value=row["Qt"]).alignment = Alignment(horizontal="center")
        
        # Unit
        c_unit = ws.cell(row=r_idx, column=10, value=row["Unit"])
        if isinstance(row["Unit"], (int, float)) and row["Unit"] > 0:
            c_unit.number_format = '#,##0.00'
        c_unit.alignment = Alignment(horizontal="right")

        # Total(Rs)
        c_tot_rs = ws.cell(row=r_idx, column=11, value=row["Total_Rs"])
        if isinstance(row["Total_Rs"], (int, float)) and row["Total_Rs"] > 0:
            c_tot_rs.number_format = '#,##0.00'
        c_tot_rs.alignment = Alignment(horizontal="right")

        # Total (Grand Total)
        c_tot = ws.cell(row=r_idx, column=12, value=row["Total"] if row["Total"] > 0 else "")
        if isinstance(row["Total"], (int, float)) and row["Total"] > 0:
            c_tot.number_format = '#,##0.00'
        c_tot.alignment = Alignment(horizontal="right")

        # Apply borders & font
        for c_idx in range(2, 13):
            cell = ws.cell(row=r_idx, column=c_idx)
            cell.font = Font(name="Calibri", size=10)
            cell.border = border_thin

    # Set Column widths
    col_widths = {
        'A': 4,
        'B': 14, # Invoice No
        'C': 15, # Invoice Date
        'D': 18, # Make/Model
        'E': 16, # Vehicle No
        'F': 16, # Chassis no
        'G': 14, # Mile age
        'H': 42, # Description
        'I': 8,  # Qt
        'J': 14, # Unit
        'K': 15, # Total(Rs)
        'L': 16  # Total
    }
    for col_letter, width in col_widths.items():
        ws.column_dimensions[col_letter].width = width

    ws.views.sheetView[0].showGridLines = True

    # Save to target paths
    for target in [OUTPUT_EXCEL_FORMAT, OUTPUT_EXCEL_TEMPLATE]:
        try:
            os.makedirs(os.path.dirname(target), exist_ok=True)
            wb.save(target)
            print(f"SAVED FORMATTED EXCEL TO: {target}")
        except PermissionError:
            alt_path = target.replace('.xlsx', '_Updated.xlsx')
            wb.save(alt_path)
            print(f"Original locked, SAVED TO: {alt_path}")
        except Exception as e:
            print(f"Error saving to {target}: {e}")

    print("ALL DONE!")

if __name__ == "__main__":
    main()
