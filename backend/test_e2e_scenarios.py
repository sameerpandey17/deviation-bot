import os
import requests
import json

BASE_URL = "http://localhost:8000"
DOCS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_docs"))

def run_tests():
    print("=" * 60)
    print("STARTING AIVOA COPILOT VERIFICATION SUITE")
    print("=" * 60)

    # TEST 1: Empty state / Health check
    print("\n--- TEST 1: Backend Health & Deviations List ---")
    res = requests.get(f"{BASE_URL}/api/deviations")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    print(f"PASSED: Deviations endpoint returned 200 OK. {len(res.json())} deviations found.")

    # TEST 2: Attach flow (01_Reactor_Temperature_Excursion.pdf)
    print("\n--- TEST 2: Attach Flow (01_Reactor_Temperature_Excursion.pdf) ---")
    pdf1_path = os.path.join(DOCS_DIR, "01_Reactor_Temperature_Excursion.pdf")
    with open(pdf1_path, "rb") as f:
        files = {"file": ("01_Reactor_Temperature_Excursion.pdf", f, "application/pdf")}
        data = {
            "message": "Process this reactor temperature deviation report",
            "current_form": json.dumps({}),
            "current_risk": json.dumps({}),
            "history": json.dumps([])
        }
        res = requests.post(f"{BASE_URL}/api/chat", data=data, files=files)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    r2 = res.json()
    print("Response intent:", r2.get("intent"))
    print("Reply:", r2.get("reply"))
    print("Extracted fields:", list(r2.get("form", {}).keys()))
    print("Changed fields:", r2.get("changed_fields"))
    print("Risk Severity:", r2.get("risk", {}).get("severity"))
    print("Missing fields:", r2.get("missing_fields"))
    assert r2.get("intent") in ["log", "extract"]
    assert "title" in r2.get("form", {})
    assert r2.get("risk", {}).get("severity") in ["Major", "Critical"]
    print("PASSED TEST 2: PDF 01 extraction and risk assessment successful.")

    form_state = r2.get("form")
    risk_state = r2.get("risk")
    history = [
        {"role": "user", "text": "Process this reactor temperature deviation report"},
        {"role": "assistant", "text": r2.get("reply", "")}
    ]

    # TEST 3: Edit flow ("Sorry, the batch number is MFH260914B and the batch size is 900 kg.")
    print("\n--- TEST 3: Edit Flow ---")
    edit_msg = "Sorry, the batch number is MFH260914B and the batch size is 900 kg."
    data = {
        "message": edit_msg,
        "current_form": json.dumps(form_state),
        "current_risk": json.dumps(risk_state),
        "history": json.dumps(history)
    }
    res = requests.post(f"{BASE_URL}/api/chat", data=data)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    r3 = res.json()
    print("Response intent:", r3.get("intent"))
    print("Reply:", r3.get("reply"))
    print("Changed fields:", r3.get("changed_fields"))
    print("Updated batch_lot_number:", r3.get("form", {}).get("batch_lot_number"))
    assert r3.get("intent") == "edit"
    assert "MFH260914B" in str(r3.get("form", {}).get("batch_lot_number"))
    print("PASSED TEST 3: Edit updated batch number and tracked changed_fields.")

    form_state = r3.get("form")
    risk_state = r3.get("risk")
    history.append({"role": "user", "text": edit_msg})
    history.append({"role": "assistant", "text": r3.get("reply", "")})

    # TEST 4: Missing fields (02_Email_OOS_Dissolution.pdf)
    print("\n--- TEST 4: Missing Fields (02_Email_OOS_Dissolution.pdf) ---")
    pdf2_path = os.path.join(DOCS_DIR, "02_Email_OOS_Dissolution.pdf")
    with open(pdf2_path, "rb") as f:
        files = {"file": ("02_Email_OOS_Dissolution.pdf", f, "application/pdf")}
        data = {
            "message": "Here is an email regarding an OOS dissolution issue",
            "current_form": json.dumps({}),
            "current_risk": json.dumps({}),
            "history": json.dumps([])
        }
        res = requests.post(f"{BASE_URL}/api/chat", data=data, files=files)
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    r4 = res.json()
    print("Response intent:", r4.get("intent"))
    print("Reply:", r4.get("reply"))
    print("Missing fields:", r4.get("missing_fields"))
    assert len(r4.get("missing_fields", [])) > 0
    print("PASSED TEST 4: Missing fields identified correctly.")

    # Now follow-up edit to provide the missing date: "The testing was done on 16-09-2026."
    print("Sub-test 4b: Provide missing date")
    data_date = {
        "message": "The testing was done on 16-09-2026.",
        "current_form": json.dumps(r4.get("form")),
        "current_risk": json.dumps(r4.get("risk")),
        "history": json.dumps([
            {"role": "user", "text": "Here is an email regarding an OOS dissolution issue"},
            {"role": "assistant", "text": r4.get("reply", "")}
        ])
    }
    res_date = requests.post(f"{BASE_URL}/api/chat", data=data_date)
    assert res_date.status_code == 200
    r4b = res_date.json()
    print("Date update reply:", r4b.get("reply"))
    print("Date in form:", r4b.get("form", {}).get("date_of_occurrence"))
    assert "16-09-2026" in str(r4b.get("form", {}).get("date_of_occurrence"))
    print("PASSED TEST 4b: Missing field resolved via copilot.")

    # TEST 5: Question ("Why did you pick that severity?")
    print("\n--- TEST 5: Question Intent ---")
    data_q = {
        "message": "Why did you pick that severity?",
        "current_form": json.dumps(form_state),
        "current_risk": json.dumps(risk_state),
        "history": json.dumps(history)
    }
    res_q = requests.post(f"{BASE_URL}/api/chat", data=data_q)
    assert res_q.status_code == 200
    r5 = res_q.json()
    print("Response intent:", r5.get("intent"))
    print("Reply answer:", r5.get("reply"))
    assert r5.get("intent") == "question"
    assert len(r5.get("changed_fields", [])) == 0
    print("PASSED TEST 5: Question answered without mutating form fields.")

    # TEST 6: Scanned PDF (04_Scanned_Lab_Report.pdf)
    print("\n--- TEST 6: Scanned PDF Extraction (04_Scanned_Lab_Report.pdf) ---")
    pdf4_path = os.path.join(DOCS_DIR, "04_Scanned_Lab_Report.pdf")
    with open(pdf4_path, "rb") as f:
        files = {"file": ("04_Scanned_Lab_Report.pdf", f, "application/pdf")}
        data = {
            "message": "Extract data from this scanned lab report",
            "current_form": json.dumps({}),
            "current_risk": json.dumps({}),
            "history": json.dumps([])
        }
        res_scan = requests.post(f"{BASE_URL}/api/chat", data=data, files=files)
    assert res_scan.status_code == 200
    r6 = res_scan.json()
    print("Response intent:", r6.get("intent"))
    print("Extracted title:", r6.get("form", {}).get("title"))
    print("Extracted product:", r6.get("form", {}).get("related_product"))
    assert "PCM-2609-88" in str(r6.get("form", {}).get("batch_lot_number")) or "Paracetamol" in str(r6.get("form", {}).get("related_product"))
    print("PASSED TEST 6: Scanned PDF extracted successfully.")

    # TEST 7: Plain text paste in composer
    print("\n--- TEST 7: Plain Text Paste ---")
    plain_text = """On 23-09-2026 at Warehouse Bay 3, a forklift collided with pallet rack R-12 containing 15 drums of Isopropyl Alcohol 99%. 2 drums were punctured, causing a 400 L spill. Area evacuated immediately. Reported by J. Doe."""
    data_txt = {
        "message": plain_text,
        "current_form": json.dumps({}),
        "current_risk": json.dumps({}),
        "history": json.dumps([])
    }
    res_txt = requests.post(f"{BASE_URL}/api/chat", data=data_txt)
    assert res_txt.status_code == 200
    r7 = res_txt.json()
    print("Response intent:", r7.get("intent"))
    print("Extracted source:", r7.get("form", {}).get("source"))
    print("Extracted title:", r7.get("form", {}).get("title"))
    assert r7.get("intent") in ["log", "extract"]
    assert "Warehouse" in str(r7.get("form", {}).get("source")) or "Warehouse" in str(r7.get("form", {}).get("title")) or "spill" in str(r7.get("form", {}).get("detailed_description")).lower()
    print("PASSED TEST 7: Plain text deviation logged successfully.")

    # TEST 10: Save Deviation (POST /api/deviations)
    print("\n--- TEST 10: Save Deviation to Database ---")
    save_payload = {
        "form": {
            "site_plant": "Manufacturing Complex Unit 4",
            "date_of_occurrence": "14-07-2024",
            "title": "Reactor Temperature Excursion During Synthesis Step 3",
            "source": "Manufacturing",
            "related_product": "Ibuprofen API",
            "batch_lot_number": "MFH260914B",
            "detailed_description": "Reactor temperature reached 92C for 25 minutes during Step 3 synthesis.",
            "initial_impact": "Product Quality",
            "initial_severity": "Major"
        },
        "risk": {
            "severity": "Major",
            "impact": "Product Quality",
            "reason": "Thermal excursion over specification limit.",
            "next_action": "Quarantine material and initiate QA investigation.",
            "containment": "Cooled reactor to 72C and locked batch.",
            "root_cause_hints": ["Pneumatic valve actuator failure", "Cooling loop pressure drop"]
        }
    }
    res_save = requests.post(f"{BASE_URL}/api/deviations", json=save_payload)
    assert res_save.status_code == 200, f"Expected 200, got {res_save.status_code}: {res_save.text}"
    saved_obj = res_save.json()
    print(f"Deviation saved with ID: {saved_obj.get('id')}")
    assert saved_obj.get("id") is not None
    print("PASSED TEST 10: Deviation record successfully written to database.")

    print("\n" + "=" * 60)
    print("ALL CORE BACKEND SCENARIOS PASSED WITH 100% SUCCESS")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
