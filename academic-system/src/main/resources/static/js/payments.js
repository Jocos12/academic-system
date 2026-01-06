// ========================================
// PAYMENTS MODULE - COMPLETE IMPLEMENTATION
// ========================================

let paymentsData = [];
let currentEditPaymentId = null;
let paymentsStatusChart = null;
let paymentsMethodChart = null;

// ========================================
// LOAD PAYMENTS DATA
// ========================================

async function loadPaymentsData() {
  try {
    const response = await fetch(`${API_BASE_URL}/payments`);
    if (response.ok) {
      paymentsData = await response.json();
    } else {
      paymentsData = [];
      console.error('Failed to fetch payments');
    }
  } catch (error) {
    console.error('Error fetching payments:', error);
    paymentsData = [];
  }

  await loadStudentsForDropdown();
  updatePaymentsStats();
  displayPaymentsTable(paymentsData);
  createPaymentsCharts();
}

// ========================================
// LOAD STUDENTS FOR DROPDOWN
// ========================================

async function loadStudentsForDropdown() {
  try {
    const response = await fetch(`${API_BASE_URL}/students`);
    if (response.ok) {
      const students = await response.json();
      const select = document.getElementById('paymentStudent');
      select.innerHTML = '<option value="">Select Student</option>';
      students.forEach((student) => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.firstName} ${student.lastName} (${student.studentId})`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

// ========================================
// UPDATE STATS
// ========================================

function updatePaymentsStats() {
  const totalPayments = paymentsData.length;
  const completedPayments = paymentsData.filter(
    (p) => p.status === 'COMPLETED'
  ).length;
  const pendingPayments = paymentsData.filter(
    (p) => p.status === 'PENDING'
  ).length;
  const totalRevenue = paymentsData
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  animateCounter('totalPayments', totalPayments);
  animateCounter('completedPayments', completedPayments);
  animateCounter('pendingPayments', pendingPayments);

  const revenueElement = document.getElementById('totalRevenue');
  if (revenueElement) {
    revenueElement.textContent = `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

// ========================================
// DISPLAY TABLE
// ========================================

function displayPaymentsTable(payments) {
  const tbody = document.getElementById('paymentsTableBody');

  if (payments.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="10" class="loading">No payments found</td></tr>';
    return;
  }

  const html = payments
    .map(
      (payment) => `
        <tr>
            <td>${payment.id}</td>
            <td>${payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'N/A'}</td>
            <td>$${(payment.amount || 0).toFixed(2)}</td>
            <td>${payment.academicYear || 'N/A'}</td>
            <td>${payment.semester || 'N/A'}</td>
            <td>${formatPaymentMethod(payment.method)}</td>
            <td>${payment.transactionReference || 'N/A'}</td>
            <td>
                <span class="status-badge status-${payment.status.toLowerCase()}">
                    ${formatPaymentStatus(payment.status)}
                </span>
            </td>
            <td>${formatDate(payment.paymentDate)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editPayment(${payment.id})" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    ${
                      payment.status === 'PENDING'
                        ? `
                    <button class="btn-icon" onclick="approvePayment(${payment.id})" title="Approve" style="color: #10b981;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </button>
                    `
                        : ''
                    }
                </div>
            </td>
        </tr>
    `
    )
    .join('');

  tbody.innerHTML = html;
}

// ========================================
// CHARTS
// ========================================

function createPaymentsCharts() {
  createStatusChart();
  createMethodChart();
}

function createStatusChart() {
  const ctx = document.getElementById('paymentsStatusChart');
  if (!ctx) return;

  if (paymentsStatusChart) {
    paymentsStatusChart.destroy();
  }

  const statusCounts = {
    PENDING: paymentsData.filter((p) => p.status === 'PENDING').length,
    COMPLETED: paymentsData.filter((p) => p.status === 'COMPLETED').length,
    FAILED: paymentsData.filter((p) => p.status === 'FAILED').length,
    REFUNDED: paymentsData.filter((p) => p.status === 'REFUNDED').length,
  };

  const isDark = document.body.classList.contains('dark-mode');

  paymentsStatusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'Completed', 'Failed', 'Refunded'],
      datasets: [
        {
          data: [
            statusCounts.PENDING,
            statusCounts.COMPLETED,
            statusCounts.FAILED,
            statusCounts.REFUNDED,
          ],
          backgroundColor: ['#f59e0b', '#10b981', '#ef4444', '#6366f1'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: isDark ? '#f1f5f9' : '#1e293b',
            padding: 16,
            font: { size: 13, weight: '600' },
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

function createMethodChart() {
  const ctx = document.getElementById('paymentsMethodChart');
  if (!ctx) return;

  if (paymentsMethodChart) {
    paymentsMethodChart.destroy();
  }

  const methodCounts = {};
  paymentsData.forEach((payment) => {
    methodCounts[payment.method] = (methodCounts[payment.method] || 0) + 1;
  });

  const isDark = document.body.classList.contains('dark-mode');

  paymentsMethodChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(methodCounts).map((m) => formatPaymentMethod(m)),
      datasets: [
        {
          label: 'Number of Payments',
          data: Object.values(methodCounts),
          backgroundColor: 'rgba(59, 130, 246, 0.85)',
          borderColor: '#3b82f6',
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: isDark ? '#cbd5e1' : '#64748b',
            stepSize: 1,
          },
          grid: {
            color: isDark ? '#334155' : '#e2e8f0',
          },
        },
        x: {
          ticks: {
            color: isDark ? '#cbd5e1' : '#64748b',
          },
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

// ========================================
// FILTER PAYMENTS
// ========================================

function filterPayments() {
  const searchTerm = document
    .getElementById('searchPayment')
    .value.toLowerCase();
  const statusFilter = document.getElementById('paymentStatusFilter').value;
  const methodFilter = document.getElementById('paymentMethodFilter').value;

  const filtered = paymentsData.filter((payment) => {
    const matchesSearch =
      !searchTerm ||
      (payment.student &&
        `${payment.student.firstName} ${payment.student.lastName}`
          .toLowerCase()
          .includes(searchTerm)) ||
      (payment.transactionReference &&
        payment.transactionReference.toLowerCase().includes(searchTerm)) ||
      payment.id.toString().includes(searchTerm);

    const matchesStatus = !statusFilter || payment.status === statusFilter;
    const matchesMethod = !methodFilter || payment.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  displayPaymentsTable(filtered);
}

// ========================================
// MODAL FUNCTIONS
// ========================================

function openAddPaymentModal() {
  document.getElementById('paymentModalTitle').textContent = 'Add Payment';
  document.getElementById('paymentForm').reset();
  document.getElementById('paymentId').value = '';
  currentEditPaymentId = null;
  document.getElementById('paymentModal').classList.add('active');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('active');
  document.getElementById('paymentForm').reset();
  currentEditPaymentId = null;
}

async function editPayment(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`);
    if (response.ok) {
      const payment = await response.json();

      document.getElementById('paymentModalTitle').textContent = 'Edit Payment';
      document.getElementById('paymentId').value = payment.id;
      document.getElementById('paymentStudent').value =
        payment.student?.id || '';
      document.getElementById('paymentAmount').value = payment.amount;
      document.getElementById('paymentAcademicYear').value =
        payment.academicYear;
      document.getElementById('paymentSemester').value = payment.semester;
      document.getElementById('paymentMethod').value = payment.method;
      document.getElementById('paymentStatus').value = payment.status;
      document.getElementById('paymentReference').value =
        payment.transactionReference || '';
      document.getElementById('paymentNotes').value = payment.notes || '';

      currentEditPaymentId = id;
      document.getElementById('paymentModal').classList.add('active');
    }
  } catch (error) {
    console.error('Error loading payment:', error);
    showNotification('Error loading payment', 'error');
  }
}

async function handlePaymentFormSubmit(e) {
  e.preventDefault();

  const formData = {
    student: { id: parseInt(document.getElementById('paymentStudent').value) },
    amount: parseFloat(document.getElementById('paymentAmount').value),
    academicYear: document.getElementById('paymentAcademicYear').value,
    semester: parseInt(document.getElementById('paymentSemester').value),
    method: document.getElementById('paymentMethod').value,
    status: document.getElementById('paymentStatus').value,
    transactionReference:
      document.getElementById('paymentReference').value || null,
    notes: document.getElementById('paymentNotes').value || null,
  };

  try {
    let response;
    if (currentEditPaymentId) {
      response = await fetch(
        `${API_BASE_URL}/payments/${currentEditPaymentId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );
    } else {
      response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    if (response.ok) {
      showNotification(
        currentEditPaymentId
          ? 'Payment updated successfully'
          : 'Payment added successfully',
        'success'
      );
      closePaymentModal();
      loadPaymentsData();
    } else {
      const error = await response.text();
      showNotification(error || 'Error saving payment', 'error');
    }
  } catch (error) {
    console.error('Error saving payment:', error);
    showNotification('Error saving payment', 'error');
  }
}

async function approvePayment(id) {
  if (!confirm('Are you sure you want to approve this payment?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/payments/${id}/approve`, {
      method: 'PUT',
    });

    if (response.ok) {
      showNotification('Payment approved successfully', 'success');
      loadPaymentsData();
    } else {
      showNotification('Error approving payment', 'error');
    }
  } catch (error) {
    console.error('Error approving payment:', error);
    showNotification('Error approving payment', 'error');
  }
}

// ========================================
// EXPORT FUNCTIONS
// ========================================

function exportPaymentsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('Payments Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  const totalRevenue = paymentsData
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Overview', 14, 40);
  doc.setFontSize(10);
  doc.text(`Total Payments: ${paymentsData.length}`, 14, 48);
  doc.text(
    `Completed: ${paymentsData.filter((p) => p.status === 'COMPLETED').length}`,
    14,
    55
  );
  doc.text(
    `Pending: ${paymentsData.filter((p) => p.status === 'PENDING').length}`,
    14,
    62
  );
  doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 14, 69);

  const tableData = paymentsData.map((p) => [
    p.id,
    p.student ? `${p.student.firstName} ${p.student.lastName}` : 'N/A',
    `$${(p.amount || 0).toFixed(2)}`,
    p.academicYear,
    p.semester,
    formatPaymentMethod(p.method),
    formatPaymentStatus(p.status),
  ]);

  doc.autoTable({
    startY: 80,
    head: [['ID', 'Student', 'Amount', 'Year', 'Sem', 'Method', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138] },
  });

  doc.save('payments-report.pdf');
}

function exportPaymentsExcel() {
  const data = paymentsData.map((p) => ({
    ID: p.id,
    Student: p.student ? `${p.student.firstName} ${p.student.lastName}` : 'N/A',
    Amount: p.amount,
    'Academic Year': p.academicYear,
    Semester: p.semester,
    Method: p.method,
    Reference: p.transactionReference || 'N/A',
    Status: p.status,
    Date: formatDate(p.paymentDate),
    Notes: p.notes || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Payments');
  XLSX.writeFile(wb, 'payments-report.xlsx');
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatPaymentMethod(method) {
  const methods = {
    CASH: 'Cash',
    BANK_TRANSFER: 'Bank Transfer',
    MOBILE_MONEY: 'Mobile Money',
    CREDIT_CARD: 'Credit Card',
    CHEQUE: 'Cheque',
  };
  return methods[method] || method;
}

function formatPaymentStatus(status) {
  const statuses = {
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  };
  return statuses[status] || status;
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener('DOMContentLoaded', function () {
  const addBtn = document.getElementById('addPaymentBtn');
  const closeBtn = document.getElementById('closePaymentModal');
  const cancelBtn = document.getElementById('paymentCancelBtn');
  const form = document.getElementById('paymentForm');
  const searchInput = document.getElementById('searchPayment');
  const statusFilter = document.getElementById('paymentStatusFilter');
  const methodFilter = document.getElementById('paymentMethodFilter');
  const exportPdfBtn = document.getElementById('exportPaymentsPdfBtn');
  const exportExcelBtn = document.getElementById('exportPaymentsExcelBtn');

  if (addBtn) addBtn.addEventListener('click', openAddPaymentModal);
  if (closeBtn) closeBtn.addEventListener('click', closePaymentModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closePaymentModal);
  if (form) form.addEventListener('submit', handlePaymentFormSubmit);
  if (searchInput) searchInput.addEventListener('input', filterPayments);
  if (statusFilter) statusFilter.addEventListener('change', filterPayments);
  if (methodFilter) methodFilter.addEventListener('change', filterPayments);
  if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportPaymentsPDF);
  if (exportExcelBtn)
    exportExcelBtn.addEventListener('click', exportPaymentsExcel);

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('paymentModal');
    if (e.target === modal) {
      closePaymentModal();
    }
  });
});

// ========================================
// GLOBAL EXPOSURE
// ========================================

window.loadPaymentsData = loadPaymentsData;
window.editPayment = editPayment;
window.approvePayment = approvePayment;
