# Offline Payroll Verification Tool

Standalone vanilla JavaScript payroll verification tool using SheetJS.

## 📦 Project Overview

- Uses `SheetJS (xlsx)` for offline Excel (.xlsx) parsing.
- Validates payroll rows for required fields and net pay accuracy (`(Base_Salary + Bonus) - (Tax_Deduction + Other_Deductions) === Net_Pay`).
- Shows summary, detailed issues, and row preview.
- Exports verification report as CSV.

## 🗂️ Project Structure

- `index.html` – UI and local SheetJS import
- `styles.css` – minimal styling
- `app.js` – offline validation logic
- `README.md` – this document
- `libs/xlsx.full.min.js` – SheetJS library (not in repo by default)

## ⛔ Offline setup (required)

1. Download `xlsx.full.min.js` from SheetJS:
   - https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js
2. Create `libs/` folder in project root.
3. Place the downloaded file as `libs/xlsx.full.min.js`.

## ▶️ Run the tool

1. Open `index.html` in browser (double-click or via local server).
2. Choose a `.xlsx` payroll file.
3. Select sheet and click `Load Data`.
4. Click `Verify Payroll`.
5. Optionally click `Export Report` to download CSV.

## 🧾 Expected column headers

- `Employee_ID`
- `Employee_Name`
- `Base_Salary`
- `Bonus`
- `Tax_Deduction`
- `Other_Deductions`
- `Net_Pay`

> Case exact headers matter. Header names must match exactly.

## 🧪 Validation logic

- Missing required columns / values are flagged as "Missing fields".
- Non-numeric values in numeric columns are flagged as "Invalid numeric data".
- Net pay mismatch is flagged if `abs((Base_Salary + Bonus) - (Tax_Deduction + Other_Deductions) - Net_Pay) > 0.01`.

## 🛠️ Optional local server

Mac/Linux: `python3 -m http.server 4000` then open `http://localhost:4000`.

## ✅ Notes

- This tool is fully offline except for initial SheetJS download.
- Pure vanilla JS (no frameworks).
- Code is easily extendable for additional checks (tax rate, hours worked, etc.).
