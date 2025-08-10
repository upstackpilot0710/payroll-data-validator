const fileInput = document.getElementById('fileInput');
const sheetSelect = document.getElementById('sheetSelect');
const loadSheetBtn = document.getElementById('loadSheetBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const exportBtn = document.getElementById('exportBtn');
const summaryEl = document.getElementById('summary');
const issuesEl = document.getElementById('issues');
const dataPreviewEl = document.getElementById('dataPreview');

let workbook;
let currentData = [];

function showSection(el, visible = true) {
  el.classList.toggle('hidden', !visible);
}

function renderSummary(result) {
  summaryEl.innerHTML = `
    <div class="summary">
      <p><strong>Total rows:</strong> ${result.total}</p>
      <p><strong>Valid rows:</strong> ${result.valid}</p>
      <p><strong>Invalid rows:</strong> ${result.invalid}</p>
      <p><strong>Rows with missing fields:</strong> ${result.missing}</p>
      <p><strong>Pass rate:</strong> ${((result.valid / result.total) * 100).toFixed(2)} %</p>
    </div>
  `;
  showSection(summaryEl, true);
}

function renderIssues(issues) {
  if (issues.length === 0) {
    issuesEl.innerHTML = '<div class="issue">No issues found. All rows passed validation.</div>';
  } else {
    issuesEl.innerHTML = issues.map(i => `
      <div class="issue">
        <strong>Row ${i.rowIndex + 2}</strong> - ${i.type}: ${i.message}
      </div>
    `).join('');
  }
  showSection(issuesEl, true);
}

function renderDataPreview(data) {
  if (!data.length) {
    dataPreviewEl.innerHTML = '<strong>No data loaded.</strong>';
    showSection(dataPreviewEl, true);
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.slice(0, 20);

  dataPreviewEl.innerHTML = `
    <h3>Preview (first ${rows.length} rows)</h3>
    <table>
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody>${rows.map(r => `<tr>${headers.map(h => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  `;
  showSection(dataPreviewEl, true);
}

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function verifyRows(data) {
  const required = ['Employee ID', 'Name', 'Pay Period', 'Gross Pay', 'Deductions', 'Net Pay'];
  const issues = [];
  let valid = 0, invalid = 0, missing = 0;

  data.forEach((row, idx) => {
    const missingFields = required.filter(key => row[key] === undefined || row[key] === null || `${row[key]}`.trim() === '');
    if (missingFields.length) {
      missing += 1;
      issues.push({ rowIndex: idx, type: 'Missing fields', message: missingFields.join(', ') });
      return;
    }

    const gross = parseNumber(row['Gross Pay']);
    const deductions = parseNumber(row['Deductions']);
    const net = parseNumber(row['Net Pay']);

    if ([gross, deductions, net].some(Number.isNaN)) {
      invalid += 1;
      issues.push({ rowIndex: idx, type: 'Invalid numeric data', message: 'Gross Pay/Deductions/Net Pay must be numbers.' });
      return;
    }

    const calcNet = gross - deductions;
    if (Math.abs(calcNet - net) > 0.01) {
      invalid += 1;
      issues.push({ rowIndex: idx, type: 'Net mismatch', message: `Expected ${calcNet.toFixed(2)} but found ${net.toFixed(2)}` });
      return;
    }

    valid += 1;
  });

  return {
    total: data.length,
    valid,
    invalid,
    missing,
    issues,
  };
}

function getSelectedSheetData() {
  const sheetName = sheetSelect.value;
  if (!sheetName || !workbook) return [];

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return data;
}

function doAnalysis() {
  if (!currentData.length) {
    alert('No sheet data loaded. Choose a sheet and load data first.');
    return;
  }

  const result = verifyRows(currentData);
  renderSummary(result);
  renderIssues(result.issues);
  renderDataPreview(currentData);
  exportBtn.disabled = result.total === 0;
}

function loadWorkbookData() {
  const data = getSelectedSheetData();
  currentData = data;
  renderDataPreview(currentData);
  analyzeBtn.disabled = currentData.length === 0;
  exportBtn.disabled = true;
  summaryEl.classList.add('hidden');
  issuesEl.classList.add('hidden');
}

function exportCsv() {
  if (!currentData.length) return;

  const rows = currentData;
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'payroll-verification-report.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

fileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    try {
      workbook = XLSX.read(data, { type: 'array' });
      sheetSelect.innerHTML = workbook.SheetNames.map(name => `<option value="${name}">${name}</option>`).join('');
      sheetSelect.disabled = false;
      loadSheetBtn.disabled = false;
      analyzeBtn.disabled = true;
      exportBtn.disabled = true;
      currentData = [];
      summaryEl.classList.add('hidden');
      issuesEl.classList.add('hidden');
      dataPreviewEl.classList.add('hidden');
    } catch (err) {
      alert('Unable to parse workbook. Verify that the file is .xlsx and the SheetJS library is loaded.');
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
});

loadSheetBtn.addEventListener('click', loadWorkbookData);
analyzeBtn.addEventListener('click', doAnalysis);
exportBtn.addEventListener('click', exportCsv);
