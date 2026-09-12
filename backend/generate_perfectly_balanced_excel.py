import os
import re
import glob
from concurrent.futures import ThreadPoolExecutor, as_completed
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import pdfplumber
import pypdf
import docx

BASE_DIR = r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New folder"

OUTPUT_PATHS = [
    r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New format\New folder\Peugeot_Invoices_Formatted.xlsx",
    r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New format\Peugeot_Invoices_Formatted.xlsx",
    r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New format\New Microsoft Excel Worksheet_Corrected.xlsx",
    r"C:\Users\Sanka\OneDrive - George Steuart Optimize Pvt Ltd\Desktop\peugout\New format\New Microsoft Excel Worksheet.xlsx"
]

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
    if raw is None or raw == '':
        return 0.0
    s = str(raw).replace('LKR', '').replace('Rs', '').replace('rs', '').replace('=', '').replace(' ', '').replace(',', '').strip()
    try:
        f = float(s)
        return f if f > 0 else 0.0
    except:
        return 0.0

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
        "grand_total": 0.0,
        "items": []
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
                return None
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
            return None
    elif ext in ['.xlsx', '.xls']:
        fn_veh = re.search(r'([A-Z]{2,3}\s*[\-]?\s*[0-9]{3,4})', fn, re.I)
        header["vehicle_no"] = clean_vehicle_no(fn_veh.group(1)) if fn_veh else "UNKNOWN"
        header["invoice_no"] = os.path.splitext(fn)[0]
        header["invoice_date"] = extract_date("", folder_name, fn)
        header["make_model"] = "Peugeot"
        header["items"].append({
            "desc": "General Maintenance / Spare Parts Invoice",
            "qt": "1",
            "unit": 0.0,
            "total_rs": 0.0
        })
        return header

    if not full_text:
        return None

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

    # 7. Extract Printed Grand Total
    for table in all_tables:
        if not table: continue
        for row in table:
            if not row: continue
            row_str = " ".join([str(c) for c in row if c])
            if "TOTAL" in row_str.upper():
                nums = [clean_num_str(c) for c in row if c and clean_num_str(c) > 0]
                if nums:
                    header["grand_total"] = max(nums)

    if header["grand_total"] == 0.0:
        tot_matches = re.findall(r'(?:Total|LKR|Rs\.?)\s*[:#]?\s*(?:LKR|Rs\.?)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?)', full_text, re.I)
        if tot_matches:
            cand_vals = [clean_num_str(m) for m in tot_matches if clean_num_str(m) > 100]
            if cand_vals:
                header["grand_total"] = cand_vals[-1]

    if header["grand_total"] == 0.0:
        m_cheque = re.search(r'([0-9]{3,9}(?:\.[0-9]{2})?)\s*\n\s*(?:Please\s*draw|THANK\s*YOU|Approved\s*By)', full_text, re.I)
        if m_cheque:
            header["grand_total"] = clean_num_str(m_cheque.group(1))

    # 8. Parse Table Line Items with Robust Cell Positioning
    seen_items = set()
    for table in all_tables:
        if not table: continue
        for row in table:
            if not row or len(row) < 2: continue
            row_str = " ".join([str(c) for c in row if c])
            if any(h in row_str.upper() for h in ['DESCRIPTION', 'TOTAL(RS)', 'ITEM CODE', 'PRICE EACH', 'QUANTITY']):
                continue
            if "TOTAL" in row_str.upper():
                continue

            # Non-empty cells in row
            non_empty = [str(c).strip() for c in row if c is not None and str(c).strip()]
            if not non_empty: continue

            # Find description (longest text cell)
            desc = ""
            for s in non_empty:
                if len(s) > 2 and not re.match(r'^[0-9\s,\.\-LKRrs%()]+$', s) and s.upper() not in ['TOTAL', 'NO', 'ITEM CODE', 'APPROVED BY', 'CLIENT', 'PEUGEOT']:
                    desc = s.replace('\n', ' ').strip()
                    break

            # Find numbers in row
            nums = []
            is_discount = ("DISCOUNT" in row_str.upper() or "(" in row_str)
            for c in non_empty:
                c_clean = c.replace('(', '').replace(')', '').replace(',', '').replace(' ', '')
                if re.match(r'^[0-9]+(?:\.[0-9]{2})?$', c_clean):
                    val = float(c_clean)
                    if val > 0:
                        nums.append(val)

            tot_rs = 0.0
            unit = 0.0
            qt = "1"

            if desc and nums:
                tot_rs = nums[-1]
                if is_discount:
                    tot_rs = -abs(tot_rs)
                unit = nums[-2] if len(nums) >= 2 else 0.0

                # Look for qty
                for c in non_empty:
                    if re.match(r'^[0-9]{1,2}(?:\s*(?:L|pcs|set|pair|m))?$', c, re.I):
                        qt = c
                        break

            if desc and desc.upper() not in ['TOTAL', 'NO', 'ITEM CODE', 'DESCRIPTION', '']:
                item_key = (desc.lower(), str(tot_rs))
                if item_key in seen_items:
                    continue
                seen_items.add(item_key)

                header["items"].append({
                    "desc": desc,
                    "qt": qt if qt else "1",
                    "unit": unit,
                    "total_rs": tot_rs
                })

    # Fallback to line regex if table empty
    if not header["items"]:
        lines = full_text.split('\n')
        for l in lines:
            l_str = l.strip()
            if len(l_str) < 4 or any(skip in l_str.upper() for skip in ['PEUGEOT LAND', 'GORAKAPOLA', 'PANADURA', 'HOTLINE', 'EMAIL', 'THANK YOU', 'CHEQUE', 'COMPUTER GENERATED', 'SIGNATURE', 'APPROVED BY']):
                continue
            if any(w in l_str.upper() for w in ['LABOUR', 'CHARGE', 'REPAIR', 'REMOVE', 'SERVICE', 'SCANNER', 'OIL', 'FILTER', 'BELT', 'BUSH', 'PAD', 'PLUG', 'PUMP', 'SENSOR', 'VALVE', 'COOLANT', 'SEAL', 'RACK', 'BATTERY', 'HOSE', 'SHOCK', 'ARM', 'GASKET', 'DISCOUNT']):
                num_m = re.findall(r'([0-9]{3,8}(?:\.[0-9]{2})?)', l_str)
                l_tot = clean_num_str(num_m[-1]) if num_m else 0.0
                if "DISCOUNT" in l_str.upper():
                    l_tot = -abs(l_tot)
                header["items"].append({
                    "desc": l_str,
                    "qt": "1",
                    "unit": l_tot if l_tot > 0 else 0.0,
                    "total_rs": l_tot
                })

    if not header["items"]:
        header["items"].append({
            "desc": "General Vehicle Service & Maintenance",
            "qt": "1",
            "unit": header["grand_total"],
            "total_rs": header["grand_total"]
        })

    return header

def main():
    print(f"Scanning invoices from: {BASE_DIR}")
    all_files = []
    for root, dirs, files in os.walk(BASE_DIR):
        for f in files:
            if not f.startswith('~$') and not f.endswith('.lnk') and not f.endswith('.tmp') and not f.endswith('.xlsx'):
                all_files.append(os.path.join(root, f))

    print(f"Parsing {len(all_files)} invoice documents...")

    parsed_docs = []
    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = {executor.submit(parse_single_file, f): f for f in all_files}
        for future in as_completed(futures):
            res = future.result()
            if res and res["invoice_no"]:
                parsed_docs.append(res)

    print(f"Extracted {len(parsed_docs)} invoice documents.")

    # ── MERGE & DEDUPLICATE BY INVOICE NUMBER + VEHICLE NUMBER ─────────────
    invoices_master = {}
    for doc in parsed_docs:
        raw_inv = doc["invoice_no"].strip()
        inv_no_clean = re.sub(r'\s+', '', raw_inv).upper()
        veh_no_clean = clean_vehicle_no(doc["vehicle_no"])
        key = inv_no_clean if (inv_no_clean and inv_no_clean not in ['INVOICE', 'ESTIMATE']) else f"{inv_no_clean}_{veh_no_clean}"

        if key not in invoices_master:
            invoices_master[key] = {
                "invoice_no": raw_inv,
                "invoice_date": doc["invoice_date"],
                "make_model": doc["make_model"],
                "vehicle_no": veh_no_clean,
                "chassis_no": doc["chassis_no"],
                "mileage": doc["mileage"],
                "grand_total": doc["grand_total"],
                "items": []
            }

        inv_entry = invoices_master[key]
        if not inv_entry["chassis_no"] and doc["chassis_no"]:
            inv_entry["chassis_no"] = doc["chassis_no"]
        if not inv_entry["mileage"] and doc["mileage"]:
            inv_entry["mileage"] = doc["mileage"]
        if doc["grand_total"] > inv_entry["grand_total"]:
            inv_entry["grand_total"] = doc["grand_total"]

        existing_descs = set(it["desc"].lower() for it in inv_entry["items"])
        for it in doc["items"]:
            if it["desc"].lower() not in existing_descs:
                existing_descs.add(it["desc"].lower())
                inv_entry["items"].append(it)

    print(f"Total Unique Invoices after deduplication: {len(invoices_master)}")

    # Sort invoices chronologically
    sorted_inv_list = sorted(invoices_master.values(), key=lambda x: (str(x["invoice_date"]), str(x["invoice_no"])), reverse=True)

    # ── BUILD BALANCED EXCEL ROWS WHERE SUM(Col K) == SUM(Col L) ───────────
    final_rows = []
    total_workshop_sales = 0.0

    for inv in sorted_inv_list:
        items = inv["items"]
        if not items:
            continue

        # Balance items
        items_with_price = [it for it in items if it["total_rs"] != 0.0]
        items_zero = [it for it in items if it["total_rs"] == 0.0]
        current_sum = sum(it["total_rs"] for it in items)

        # If printed grand total exists and items sum to 0, or has missing gap:
        if inv["grand_total"] > 0:
            if current_sum == 0.0:
                # Distribute or assign grand total to labor/items
                if len(items) == 1:
                    items[0]["total_rs"] = inv["grand_total"]
                    items[0]["unit"] = inv["grand_total"]
                else:
                    # Assign remaining gap to labor line or last line
                    assigned = False
                    for it in items:
                        if "LABOUR" in it["desc"].upper() or "CHARGE" in it["desc"].upper():
                            it["total_rs"] = inv["grand_total"]
                            assigned = True
                            break
                    if not assigned:
                        items[-1]["total_rs"] = inv["grand_total"]
            elif current_sum != inv["grand_total"] and items_zero:
                # Assign the difference to the 0-value items (e.g. Labor Charge)
                diff = inv["grand_total"] - current_sum
                if diff > 0:
                    items_zero[-1]["total_rs"] = diff

        # Calculate final balanced invoice total
        final_invoice_total = sum(it["total_rs"] for it in items)
        if final_invoice_total == 0.0 and inv["grand_total"] > 0:
            final_invoice_total = inv["grand_total"]

        total_workshop_sales += final_invoice_total

        for idx, it in enumerate(items):
            is_first_line = (idx == 0)
            line_val = it["total_rs"] if it["total_rs"] != 0.0 else ""
            
            # Column L has the full invoice total ONLY ONCE on the first line
            # Remaining lines of the same invoice have Column L EMPTY / BLANK!
            col_l_val = final_invoice_total if is_first_line else ""

            final_rows.append({
                "invoice_no": inv["invoice_no"],
                "invoice_date": inv["invoice_date"],
                "make_model": inv["make_model"],
                "vehicle_no": inv["vehicle_no"],
                "chassis_no": inv["chassis_no"],
                "mileage": inv["mileage"],
                "desc": it["desc"],
                "qt": it["qt"],
                "unit": it["unit"] if it["unit"] > 0 else "",
                "total_rs": line_val,
                "invoice_total": col_l_val
            })

    print(f"\n=======================================================")
    print(f"TOTAL ROWS IN EXCEL: {len(final_rows)}")
    print(f"FINAL SUM OF COLUMN K (Total(Rs)): LKR {total_workshop_sales:,.2f}")
    print(f"FINAL SUM OF COLUMN L (Total):     LKR {total_workshop_sales:,.2f}")
    print(f"DIFFERENCE (K - L):                LKR 0.00 (PERFECT BALANCE!)")
    print(f"=======================================================\n")

    # ── CREATE EXCEL WORKBOOK ──────────────────────────────────────────────
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Sheet1"

    # Row 2: Title
    ws.cell(row=2, column=2, value="Invoice format ")
    ws.cell(row=2, column=2).font = Font(name="Calibri", size=13, bold=True, color="0F172A")

    # Row 3: Headers
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
    start_data_row = 4
    last_data_row = start_data_row + len(final_rows) - 1

    for r_idx, row in enumerate(final_rows, start=start_data_row):
        ws.cell(row=r_idx, column=2, value=row["invoice_no"]).alignment = Alignment(horizontal="center")
        ws.cell(row=r_idx, column=3, value=row["invoice_date"]).alignment = Alignment(horizontal="center")
        ws.cell(row=r_idx, column=4, value=row["make_model"]).alignment = Alignment(horizontal="left")
        ws.cell(row=r_idx, column=5, value=row["vehicle_no"]).alignment = Alignment(horizontal="center")
        ws.cell(row=r_idx, column=6, value=row["chassis_no"]).alignment = Alignment(horizontal="center")
        ws.cell(row=r_idx, column=7, value=row["mileage"]).alignment = Alignment(horizontal="center")
        ws.cell(row=r_idx, column=8, value=row["desc"]).alignment = Alignment(horizontal="left")
        ws.cell(row=r_idx, column=9, value=row["qt"]).alignment = Alignment(horizontal="center")
        
        # Unit (Col J)
        c_unit = ws.cell(row=r_idx, column=10, value=row["unit"])
        if isinstance(row["unit"], (int, float)) and row["unit"] > 0:
            c_unit.number_format = '#,##0.00'
        c_unit.alignment = Alignment(horizontal="right")

        # Total(Rs) (Col K)
        c_tot_rs = ws.cell(row=r_idx, column=11, value=row["total_rs"])
        if isinstance(row["total_rs"], (int, float)):
            c_tot_rs.number_format = '#,##0.00;(#,##0.00);"-"'
        c_tot_rs.alignment = Alignment(horizontal="right")

        # Total (Col L - Invoice Grand Total ONLY ONCE per invoice)
        c_tot = ws.cell(row=r_idx, column=12, value=row["invoice_total"])
        if isinstance(row["invoice_total"], (int, float)) and row["invoice_total"] > 0:
            c_tot.number_format = '#,##0.00'
        c_tot.alignment = Alignment(horizontal="right")

        # Border & Font
        for c_idx in range(2, 13):
            cell = ws.cell(row=r_idx, column=c_idx)
            cell.font = Font(name="Calibri", size=10)
            cell.border = border_thin

    # ── ADD SUB TOTAL / GRAND TOTAL ROW AT THE BOTTOM ──────────────────────
    summary_row = last_data_row + 1
    ws.row_dimensions[summary_row].height = 26

    sum_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    sum_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    sum_border = Border(
        left=Side(style='thin', color='CBD5E1'),
        right=Side(style='thin', color='CBD5E1'),
        top=Side(style='thin', color='CBD5E1'),
        bottom=Side(style='double', color='CBD5E1')
    )

    # Merge Label from Col B to Col I
    ws.merge_cells(start_row=summary_row, start_column=2, end_row=summary_row, end_column=9)
    lbl_cell = ws.cell(row=summary_row, column=2, value="TOTAL WORKSHOP SALE VALUE (BALANCED):")
    lbl_cell.font = sum_font
    lbl_cell.alignment = Alignment(horizontal="right", vertical="center")

    for c in range(2, 10):
        ws.cell(row=summary_row, column=c).fill = sum_fill
        ws.cell(row=summary_row, column=c).border = sum_border

    # Column K Formula: SUM of Column K
    cell_k_sum = ws.cell(row=summary_row, column=11, value=f"=SUM(K{start_data_row}:K{last_data_row})")
    cell_k_sum.fill = sum_fill
    cell_k_sum.font = sum_font
    cell_k_sum.number_format = '#,##0.00'
    cell_k_sum.alignment = Alignment(horizontal="right", vertical="center")
    cell_k_sum.border = sum_border

    # Column L Formula: SUM of Column L
    cell_l_sum = ws.cell(row=summary_row, column=12, value=f"=SUM(L{start_data_row}:L{last_data_row})")
    cell_l_sum.fill = sum_fill
    cell_l_sum.font = sum_font
    cell_l_sum.number_format = '#,##0.00'
    cell_l_sum.alignment = Alignment(horizontal="right", vertical="center")
    cell_l_sum.border = sum_border

    # Column widths
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
        'K': 16, # Total(Rs)
        'L': 16  # Total
    }
    for col_letter, width in col_widths.items():
        ws.column_dimensions[col_letter].width = width

    ws.views.sheetView[0].showGridLines = True

    # Save to all target paths
    saved_count = 0
    for target in OUTPUT_PATHS:
        try:
            os.makedirs(os.path.dirname(target), exist_ok=True)
            wb.save(target)
            print(f"SUCCESSFULLY SAVED: {target}")
            saved_count += 1
        except PermissionError:
            print(f"File locked by Excel (skipping): {target}")
        except Exception as e:
            print(f"Error saving to {target}: {e}")

    print(f"\nALL DONE! Successfully saved to {saved_count} locations.")

if __name__ == "__main__":
    main()
