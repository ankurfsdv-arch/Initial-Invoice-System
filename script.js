// Global state: LocalStorage se data load karein ya empty array lein
let allInvoices = JSON.parse(localStorage.getItem('jagdamba_invoices')) || [];

// 1. Initial Setup on Page Load
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('invoiceDate').valueAsDate = new Date();
    document.getElementById('supplyDate').valueAsDate = new Date();
    
    // Auto-suggest Next Invoice Number
    suggestNextInvoiceNo();
    
    // Initial row setup
    document.querySelectorAll('#itemsTableBody tr').forEach(row => {
        attachCalculationListeners(row);
    });
});

// 2. Auto-suggest Invoice Number based on last entry
function suggestNextInvoiceNo() {
    if (allInvoices.length > 0) {
        const lastNo = allInvoices[allInvoices.length - 1].invoiceNo;
        const nextNo = parseInt(lastNo.replace(/[^0-9]/g, "")) + 1;
        if (!isNaN(nextNo)) {
            document.getElementById('invoiceNo').value = "INV-" + nextNo;
        }
    }
}

// 3. Add New Row Logic
function addRow() {
    const tbody = document.getElementById('itemsTableBody');
    const rowCount = tbody.rows.length + 1;
    const newRow = tbody.insertRow();
    
    newRow.innerHTML = `
        <td>${rowCount}</td>
        <td><input type="text" class="item-desc" placeholder="Product name"></td>
        <td><input type="text" class="item-hsn" placeholder="HSN"></td>
        <td><input type="number" class="item-weight" step="0.01" value="0"></td>
        <td><input type="number" class="item-rate" step="0.01" value="0"></td>
        <td><input type="number" class="item-amount" step="0.01" value="0.00" readonly></td>
    `;
    attachCalculationListeners(newRow);
}

// 4. Real-time Calculation Listeners
function attachCalculationListeners(row) {
    const inputs = row.querySelectorAll('.item-weight, .item-rate');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const weight = parseFloat(row.querySelector('.item-weight').value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            row.querySelector('.item-amount').value = (weight * rate).toFixed(2);
            calculateTotals();
        });
    });
}

// 5. Advanced Tax & Total Calculation
function calculateTotals() {
    let subtotal = 0;
    document.querySelectorAll('.item-amount').forEach(el => subtotal += parseFloat(el.value) || 0);
    
    const cgstRate = parseFloat(document.getElementById('cgstPercent').value) || 0;
    const sgstRate = parseFloat(document.getElementById('sgstPercent').value) || 0;
    
    const cgstAmt = (subtotal * cgstRate) / 100;
    const sgstAmt = (subtotal * sgstRate) / 100;
    const totalTax = cgstAmt + sgstAmt;
    const grandTotal = subtotal + totalTax;

    document.getElementById('totalBeforeTax').value = subtotal.toFixed(2);
    document.getElementById('cgstAmount').value = cgstAmt.toFixed(2);
    document.getElementById('sgstAmount').value = sgstAmt.toFixed(2);
    document.getElementById('totalWithGst').value = totalTax.toFixed(2);
    document.getElementById('totalAfterTax').value = Math.round(grandTotal).toFixed(2); // Rounding for client
}

// 6. Save Data to Browser (Client Level Safety)
function saveToExcel() {
    const data = collectInvoiceData();
    
    // Validations
    if (!data.invoiceNo) return alert("Error: Invoice Number missing!");
    if (!data.customer) return alert("Error: Customer Name missing!");
    if (data.items.length === 0) return alert("Error: Kam se kam ek item add karein!");

    allInvoices.push(data);
    localStorage.setItem('jagdamba_invoices', JSON.stringify(allInvoices));
    
    alert(`Success: Invoice ${data.invoiceNo} saved locally! Total saved: ${allInvoices.length}`);
    suggestNextInvoiceNo();
}

// 7. Professional Excel Export
function downloadExcel() {
    const storageData = JSON.parse(localStorage.getItem('jagdamba_invoices')) || [];
    if (storageData.length === 0) return alert("Download ke liye koi data nahi hai!");

    // Data formatting for Excel
    const excelRows = storageData.map(inv => ({
        "Date": inv.date,
        "Invoice No": inv.invoiceNo,
        "Customer Name": inv.customer,
        "Items Count": inv.items.length,
        "Total Amount (INR)": inv.total
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DailySales");
    
    const fileName = `Jagdamba_Report_${new Date().toLocaleDateString()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

// 8. Helper: Collect Form Data
function collectInvoiceData() {
    const items = [];
    document.querySelectorAll('#itemsTableBody tr').forEach(row => {
        const desc = row.querySelector('.item-desc').value;
        if (desc) {
            items.push({
                desc: desc,
                weight: row.querySelector('.item-weight').value,
                rate: row.querySelector('.item-rate').value,
                amount: row.querySelector('.item-amount').value
            });
        }
    });

    return {
        invoiceNo: document.getElementById('invoiceNo').value,
        customer: document.getElementById('customerName').value,
        date: document.getElementById('invoiceDate').value,
        total: document.getElementById('totalAfterTax').value,
        items: items
    };
}

function printInvoice() {
    window.print();
}

function clearForm() {
    if (confirm("Kya aap poora data clear karna chahte hain? Isse saved list bhi delete ho jayegi.")) {
        localStorage.removeItem('jagdamba_invoices');
        location.reload();
    }
}