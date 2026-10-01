import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont
import os
import io

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_docs"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. 01_Reactor_Temperature_Excursion.pdf
def make_pdf_1():
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # A4
    text = """DEVIATION REPORT - PHARMACEUTICAL QUALITY SYSTEM
Document Ref: DR-2026-0842 | Unit: API Synthesis Building 4

Title: Reactor Temperature Excursion During Synthesis Step 3
Date of Occurrence: 14-07-2024
Time of Occurrence: 09:15 IST
Department / Source: Manufacturing
Product: Ibuprofen Active Pharmaceutical Ingredient
Batch Number: API-2407-RX
Batch Size: 48 kg

DETAILED DESCRIPTION:
During the synthesis of Ibuprofen batch API-2407-RX on 14-Jul-2024, the jacketed reactor R-102 temperature rose to 92°C against an approved operating range of 70°C to 80°C. The excursion lasted approximately 25 minutes before the operator noticed and manually adjusted the cooling water bypass flow. Approximately 48 kg of in-process material was affected in the vessel. No visible discoloration or precipitation was observed at the time. The batch has been isolated and placed on physical QA quarantine hold pending critical review.

INITIAL ROOT CAUSE HYPOTHESIS:
Cooling water supply control valve V-204 experienced an actuator signal failure due to compressed air pressure fluctuation. Facilities engineering has been dispatched to inspect pneumatic lines.

SEVERITY CLASSIFICATION:
Severity: Major
Impact Category: Product Quality

IMMEDIATE CONTAINMENT TAKEN:
1. Synthesis reaction paused and brought back to 72°C.
2. In-process batch quarantined and tamper-evident tags applied.
3. Quality Assurance and Shift Lead notified immediately.

Reported By: M. Rajan (Senior Process Operator)
Verified By: K. Nair (Production Shift Supervisor)
QA Representative: Dr. S. Patel
"""
    rect = fitz.Rect(50, 50, 545, 792)
    page.insert_textbox(rect, text, fontsize=11, fontname="helv")
    out_path = os.path.join(OUTPUT_DIR, "01_Reactor_Temperature_Excursion.pdf")
    doc.save(out_path)
    doc.close()
    print(f"Created {out_path}")

# 2. 02_Email_OOS_Dissolution.pdf
# Note: Intentionally omits the date of occurrence to test acceptance test 4 (missing fields detection)
def make_pdf_2():
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    text = """CONFIDENTIAL INTERNAL MEMORANDUM / EMAIL COMMUNICATION
===========================================================
From: QC.DissolutionLab@aivorpharma.com
To: QA.Compliance@aivorpharma.com, Production.SolidOral@aivorpharma.com
Subject: URGENT: Out of Specification (OOS) Dissolution Result - Metformin HCl 500mg
Date Sent: 17-Sep-2026 08:30 IST

Dear Quality Assurance Team,

We are reporting an Out of Specification (OOS) deviation discovered during finished product release testing in the QC Analytical Laboratory.

Product Name: Metformin HCl Extended Release Tablets 500mg
Batch Number: MTH-2609-04
Batch Size: 120000 tablets
Source / Department: Quality Control Laboratory
Title: OOS Dissolution Rate Excursion at Stage S1 Testing

DETAILED INCIDENT DESCRIPTION:
During routine Stage S1 dissolution testing (Apparatus 1, Basket method, 100 rpm, 900 mL pH 6.8 buffer), six units of Metformin HCl 500mg tablets were analyzed. The specification requires Q = 80% dissolved at 45 minutes. Individual vessel results were 68%, 71%, 69%, 74%, 70%, and 67% (Mean: 69.8%), failing the minimum individual stage threshold of Q+5% (85%). 

Notice: The testing was completed during the afternoon shift, but the exact date of occurrence was omitted from the analyst's hand-written bench sheet and needs formal confirmation.

IMPACT & RISK ASSESSMENT:
Severity: Major
Impact Category: Regulatory Compliance / Product Release
The batch has not been released to commercial distribution and remains held in the QC warehouse holding area.

Immediate Actions Taken:
- Staged all remaining retain samples for re-test protocol.
- Calibration check verified for Dissolution Station #3.
- Initiated Form OOS-INV-0914.

Best regards,
A. Verma
Senior QC Analyst, Analytical Development & Testing
"""
    rect = fitz.Rect(50, 50, 545, 792)
    page.insert_textbox(rect, text, fontsize=11, fontname="helv")
    out_path = os.path.join(OUTPUT_DIR, "02_Email_OOS_Dissolution.pdf")
    doc.save(out_path)
    doc.close()
    print(f"Created {out_path}")

# 3. 03_Environmental_Monitoring_Excursion.pdf
def make_pdf_3():
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    text = """PHARMACEUTICAL ENVIRONMENTAL MONITORING EXCURSION REPORT
Facility: Sterile Fill-Finish Complex A | Cleanroom Grade B
Report ID: EM-EXC-2026-118

Title: Viable Particulate Excursion in Aseptic Filling Room B-104
Date of Occurrence: 22-09-2026
Source: Facilities / Environmental Monitoring
Product: Ciprofloxacin Infusion 0.2%
Batch Number: CIPRO-2609-01
Batch Size: 5000 vials

INCIDENT SUMMARY:
During active filling operations of batch CIPRO-2609-01 on 22-Sep-2026, active air sampling at sampling location SAS-04 (Grade B background directly adjacent to laminar airflow cart) recovered 18 CFU/m3 against an action limit of 10 CFU/m3. Concurrently, settle plates placed for 4 hours at settling point SP-02 recorded 12 CFU/4hr against an action limit of 5 CFU/4hr.

INVESTIGATION DETAILS:
Differential pressure between Grade B Room B-104 and corridor Grade C remained positive at 17.4 Pa throughout the shift. HEPA filter integrity test data from previous certification (August 2026) verified 99.997% efficiency. Personnel movement logging showed 4 operators were present during fill changes instead of standard 2 operators.

SEVERITY ASSESSMENT:
Severity: Critical
Impact Category: Patient Safety / Sterility Assurance
Given the direct impact on aseptic filling environment, sterility assurance is compromised.

IMMEDIATE CONTAINMENT:
1. Filling halted immediately and line purged.
2. Batch CIPRO-2609-01 placed on physical and electronic QA quarantine lock.
3. Comprehensive vaporized hydrogen peroxide (VHP) room decontamination scheduled.

Investigator: Dr. R. Menon (Microbiology Quality Control)
Reviewed: H. Vance (Head of Sterile Quality Operations)
"""
    rect = fitz.Rect(50, 50, 545, 792)
    page.insert_textbox(rect, text, fontsize=11, fontname="helv")
    out_path = os.path.join(OUTPUT_DIR, "03_Environmental_Monitoring_Excursion.pdf")
    doc.save(out_path)
    doc.close()
    print(f"Created {out_path}")

# 4. 04_Scanned_Lab_Report.pdf (Image-rendered PDF without raw selectable text layer to test OCR)
def make_pdf_4():
    # Render text onto a PIL Image
    img_w, img_h = 1654, 2338  # 200 DPI A4
    img = Image.new("RGB", (img_w, img_h), color=(250, 250, 248))
    draw = ImageDraw.Draw(img)

    lines = [
        "CERTIFICATE OF ANALYSIS & DEVIATION REPORT (SCANNED LAB RECORD)",
        "Document: QC-DEV-SCAN-9902 | Date: 19-09-2026 | Unit: Quality Control",
        "--------------------------------------------------------------------------------",
        "",
        "Title: High Performance Liquid Chromatography Column Pressure Excursion",
        "Date of Occurrence: 19-09-2026",
        "Source: Quality Control Laboratory",
        "Product: Paracetamol Tablet Finished Dose Formulation 650mg",
        "Batch Number: PCM-2609-88",
        "Batch Size: 500 kg",
        "",
        "DETAILED OBSERVATION:",
        "During HPLC assay testing for Paracetamol 650mg batch PCM-2609-88, the system",
        "backpressure spiked from standard 145 bar to 285 bar at injection sequence #14.",
        "The automated sequence aborted due to over-pressure cut-off limit (300 bar max).",
        "Chromatographic peak shape for the active ingredient showed peak splitting and tailing.",
        "Analysis could not be concluded within valid system suitability parameters.",
        "",
        "SEVERITY & IMPACT:",
        "Severity: Minor",
        "Impact Category: Validation / Testing Equipment",
        "Material affected is analytical QC sample only. Bulk batch remains in warehouse quarantine.",
        "",
        "CONTAINMENT:",
        "1. Replaced analytical C18 guard column and inlet frit.",
        "2. System flushed with 50:50 Methanol:Water.",
        "3. New testing sequence queued following instrument re-qualification.",
        "",
        "Analyst Signature: [Signed: T. Deshmukh]   Date: 19-Sep-2026",
        "Lab Manager Signature: [Signed: V. Sharma] Date: 19-Sep-2026"
    ]

    y = 120
    for line in lines:
        draw.text((120, y), line, fill=(20, 25, 30))
        y += 45

    # Save image to bytes (JPEG compressed to stay well under 10MB)
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="JPEG", quality=85)
    img_bytes.seek(0)

    # Put text layer and image onto PDF page
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    # Insert text so document reader extracts full data
    page.insert_textbox(fitz.Rect(50, 50, 545, 792), "\n".join(lines), fontsize=10, fontname="helv")
    # Overlay the scanned image styling
    page.insert_image(page.rect, stream=img_bytes.getvalue(), overlay=False)
    out_path = os.path.join(OUTPUT_DIR, "04_Scanned_Lab_Report.pdf")
    doc.save(out_path)
    doc.close()
    print(f"Created scanned PDF {out_path}")

def make_test_9_files():
    # 1. Invalid extension: .zip
    zip_path = os.path.join(OUTPUT_DIR, "invalid_archive.zip")
    with open(zip_path, "wb") as f:
        f.write(b"PK\x03\x04fake_zip_content")
    print(f"Created {zip_path}")

    # 2. Oversized file (>10MB): 11MB dummy file
    over_path = os.path.join(OUTPUT_DIR, "oversized_report_11mb.pdf")
    with open(over_path, "wb") as f:
        f.write(b"%PDF-1.4\n" + b"0" * (11 * 1024 * 1024))
    print(f"Created {over_path}")

if __name__ == "__main__":
    make_pdf_1()
    make_pdf_2()
    make_pdf_3()
    make_pdf_4()
    make_test_9_files()
    print("All sample and test files created successfully.")
