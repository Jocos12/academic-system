// ========================================
// PARENTS MANAGEMENT - FIXED CHILDREN COUNT
// ========================================

let currentEditParentId = null;
let parentsRelationshipChart = null;
let parentsOccupationChart = null;

// ✅ NEW: Store students data to calculate children count
let studentsDataForParents = [];

// ========================================
// LOAD PARENTS DATA WITH CHILDREN COUNT
// ========================================
async function loadParentsData() {
  try {
    console.log('👨‍👩‍👧 Loading parents data...');

    // ✅ Load both parents and students
    const [parentsResponse, studentsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/parents`),
      fetch(`${API_BASE_URL}/students`)
    ]);

    if (parentsResponse.ok) {
      parentsData = await parentsResponse.json();
      console.log('✅ Loaded parents:', parentsData.length);
    } else {
      parentsData = [];
      console.error('❌ Failed to fetch parents');
    }

    if (studentsResponse.ok) {
      studentsDataForParents = await studentsResponse.json();
      console.log('✅ Loaded students:', studentsDataForParents.length);
    } else {
      studentsDataForParents = [];
      console.error('❌ Failed to fetch students');
    }

    // ✅ Calculate children count for each parent
    parentsData = enrichParentsWithChildrenCount(parentsData);

    updateParentsStats();
    displayParentsTable(parentsData);
    createParentsCharts();
  } catch (error) {
    console.error('❌ Error fetching parents:', error);
    parentsData = [];
  }
}

// ========================================
// ENRICH PARENTS WITH CHILDREN COUNT
// ========================================
function enrichParentsWithChildrenCount(parents) {
  console.log('🔍 Calculating children count for each parent...');

  return parents.map(parent => {
    // Count students where parent.id matches
    const childrenCount = studentsDataForParents.filter(student => {
      const hasParent = student.parent && student.parent.id === parent.id;
      return hasParent;
    }).length;

    console.log(`Parent ${parent.id} (${parent.firstName} ${parent.lastName}):`, {
      childrenCount,
      students: studentsDataForParents
        .filter(s => s.parent && s.parent.id === parent.id)
        .map(s => s.studentId)
    });

    return {
      ...parent,
      childrenCount: childrenCount
    };
  });
}

// ========================================
// UPDATE STATS
// ========================================
function updateParentsStats() {
  const totalParents = parentsData.length;
  const fathers = parentsData.filter((p) => p.relationship === 'Father').length;
  const mothers = parentsData.filter((p) => p.relationship === 'Mother').length;
  const guardians = parentsData.filter(
    (p) => p.relationship === 'Guardian' || p.relationship === 'Sponsor'
  ).length;

  console.log('📊 Parents Statistics:', {
    total: totalParents,
    fathers,
    mothers,
    guardians
  });

  animateCounter('totalParents', totalParents);
  animateCounter('totalFathers', fathers);
  animateCounter('totalMothers', mothers);
  animateCounter('totalGuardians', guardians);
}

// ========================================
// DISPLAY PARENTS TABLE WITH CHILDREN COUNT
// ========================================
function displayParentsTable(parents) {
  const tbody = document.getElementById('parentsTableBody');

  if (parents.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="loading">No parents found</td></tr>';
    return;
  }

  console.log('📋 Displaying parents table...');

  const html = parents
    .map((parent) => {
      // ✅ Use calculated childrenCount
      const childrenCount = parent.childrenCount || 0;

      console.log(`Rendering parent ${parent.id}:`, {
        name: `${parent.firstName} ${parent.lastName}`,
        childrenCount
      });

      return `
        <tr>
            <td>${parent.id}</td>
            <td>${parent.firstName} ${parent.lastName}</td>
            <td>${parent.email}</td>
            <td>${parent.phoneNumber || 'N/A'}</td>
            <td><span class="status-badge status-${parent.relationship.toLowerCase()}">${parent.relationship}</span></td>
            <td>${parent.occupation || 'N/A'}</td>
            <td>
                <span class="credits-badge" style="display: inline-flex; align-items: center; padding: 0.25rem 0.625rem; border-radius: 5px; font-size: 0.75rem; font-weight: 600; ${
                  childrenCount > 0
                    ? 'background: rgba(16, 185, 129, 0.12); color: #059669; border: 1px solid rgba(16, 185, 129, 0.2);'
                    : 'background: rgba(239, 68, 68, 0.12); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.2);'
                }">
                    ${childrenCount} ${childrenCount === 1 ? 'Child' : 'Children'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editParent(${parent.id})" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteParent(${parent.id})" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
      `;
    })
    .join('');

  tbody.innerHTML = html;
  console.log('✅ Parents table rendered');
}

// ========================================
// CREATE CHARTS
// ========================================
function createParentsCharts() {
  createRelationshipChart();
  createOccupationChart();
}

function createRelationshipChart() {
  const ctx = document.getElementById('parentsRelationshipChart');
  if (!ctx) return;

  if (parentsRelationshipChart) {
    parentsRelationshipChart.destroy();
  }

  const relationshipCounts = {};
  parentsData.forEach((parent) => {
    relationshipCounts[parent.relationship] =
      (relationshipCounts[parent.relationship] || 0) + 1;
  });

  const labels = Object.keys(relationshipCounts);
  const data = Object.values(relationshipCounts);
  const isDark = document.body.classList.contains('dark-mode');

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  parentsRelationshipChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 0,
          borderRadius: 6,
          spacing: 2,
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
            font: {
              size: 13,
              weight: '600',
              family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
            },
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 8,
            boxHeight: 8,
          },
        },
        tooltip: {
          backgroundColor: isDark
            ? 'rgba(30, 41, 59, 0.95)'
            : 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          displayColors: true,
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}

function createOccupationChart() {
  const ctx = document.getElementById('parentsOccupationChart');
  if (!ctx) return;

  if (parentsOccupationChart) {
    parentsOccupationChart.destroy();
  }

  const occupationCounts = {};
  parentsData.forEach((parent) => {
    const occupation = parent.occupation || 'Not Specified';
    occupationCounts[occupation] = (occupationCounts[occupation] || 0) + 1;
  });

  // Get top 10 occupations
  const sorted = Object.entries(occupationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = sorted.map(([occupation]) => occupation);
  const data = sorted.map(([, count]) => count);
  const isDark = document.body.classList.contains('dark-mode');

  parentsOccupationChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Parents Count',
          data: data,
          backgroundColor: 'rgba(59, 130, 246, 0.85)',
          borderColor: '#3b82f6',
          borderWidth: 2,
          borderRadius: 8,
          barThickness: 45,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            color: isDark ? '#cbd5e1' : '#64748b',
            stepSize: 1,
            font: { size: 12, weight: '500' },
          },
          grid: {
            color: isDark ? '#334155' : '#e2e8f0',
            drawBorder: false,
          },
          border: { display: false },
        },
        y: {
          ticks: {
            color: isDark ? '#cbd5e1' : '#64748b',
            font: { size: 12, weight: '500' },
          },
          grid: { display: false },
          border: { display: false },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark
            ? 'rgba(30, 41, 59, 0.95)'
            : 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            title: function (context) {
              return context[0].label;
            },
            label: function (context) {
              return `${context.parsed.x} Parent${context.parsed.x !== 1 ? 's' : ''}`;
            },
          },
        },
      },
    },
  });
}

// ========================================
// FILTER PARENTS
// ========================================
function filterParents() {
  const searchTerm = document
    .getElementById('searchParent')
    .value.toLowerCase();
  const relationshipFilter = document.getElementById(
    'parentRelationshipFilter'
  ).value;

  console.log('🔍 Filtering parents:', { searchTerm, relationshipFilter });

  const filtered = parentsData.filter((parent) => {
    const matchesSearch =
      !searchTerm ||
      parent.firstName.toLowerCase().includes(searchTerm) ||
      parent.lastName.toLowerCase().includes(searchTerm) ||
      parent.email.toLowerCase().includes(searchTerm) ||
      (parent.occupation &&
        parent.occupation.toLowerCase().includes(searchTerm));

    const matchesRelationship =
      !relationshipFilter || parent.relationship === relationshipFilter;

    return matchesSearch && matchesRelationship;
  });

  console.log(`✅ Found ${filtered.length} matching parents`);
  displayParentsTable(filtered);
}

// ========================================
// MODAL FUNCTIONS
// ========================================
function openAddParentModal() {
  console.log('➕ Opening Add Parent modal');
  document.getElementById('parentModalTitle').textContent = 'Add Parent';
  document.getElementById('parentForm').reset();
  document.getElementById('parentId').value = '';
  document.getElementById('parentPasswordGroup').style.display = 'block';
  document.getElementById('parentPassword').required = true;
  currentEditParentId = null;
  document.getElementById('parentModal').classList.add('active');
}

function closeParentModal() {
  console.log('❌ Closing Parent modal');
  document.getElementById('parentModal').classList.remove('active');
  document.getElementById('parentForm').reset();
  currentEditParentId = null;
}

function editParent(id) {
  console.log(`📝 Editing parent ID: ${id}`);
  const parent = parentsData.find((p) => p.id === id);

  if (!parent) {
    console.error(`❌ Parent not found with ID: ${id}`);
    return;
  }

  console.log('Parent data:', parent);

  document.getElementById('parentModalTitle').textContent = 'Edit Parent';
  document.getElementById('parentId').value = parent.id;
  document.getElementById('parentFirstName').value = parent.firstName;
  document.getElementById('parentLastName').value = parent.lastName;
  document.getElementById('parentEmail').value = parent.email;
  document.getElementById('parentPhone').value = parent.phoneNumber || '';
  document.getElementById('parentRelationship').value = parent.relationship;
  document.getElementById('parentOccupation').value = parent.occupation || '';
  document.getElementById('parentAddress').value = parent.address || '';
  document.getElementById('parentPasswordGroup').style.display = 'none';
  document.getElementById('parentPassword').required = false;

  currentEditParentId = id;
  document.getElementById('parentModal').classList.add('active');
}

async function deleteParent(id) {
  console.log(`🗑️ Attempting to delete parent ID: ${id}`);

  if (!confirm('Are you sure you want to delete this parent?')) {
    console.log('❌ Delete cancelled by user');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/parents/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log('✅ Parent deleted successfully');
      showNotification('Parent deleted successfully', 'success');
      await loadParentsData();
    } else {
      console.error('❌ Failed to delete parent');
      showNotification('Failed to delete parent', 'error');
    }
  } catch (error) {
    console.error('❌ Error deleting parent:', error);
    showNotification('Error deleting parent', 'error');
  }
}

// ========================================
// FORM SUBMIT
// ========================================
async function handleParentFormSubmit(e) {
  e.preventDefault();

  const formData = {
    firstName: document.getElementById('parentFirstName').value,
    lastName: document.getElementById('parentLastName').value,
    email: document.getElementById('parentEmail').value,
    phoneNumber: document.getElementById('parentPhone').value,
    relationship: document.getElementById('parentRelationship').value,
    occupation: document.getElementById('parentOccupation').value,
    address: document.getElementById('parentAddress').value,
    role: 'PARENT',
  };

  if (!currentEditParentId) {
    formData.password = document.getElementById('parentPassword').value;
  }

  console.log('📤 Submitting parent form:', formData);

  try {
    let response;
    if (currentEditParentId) {
      console.log(`🔄 Updating parent ID: ${currentEditParentId}`);
      response = await fetch(`${API_BASE_URL}/parents/${currentEditParentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } else {
      console.log('➕ Creating new parent');
      response = await fetch(`${API_BASE_URL}/parents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    }

    console.log('📥 Response status:', response.status);

    if (response.ok) {
      const savedParent = await response.json();
      console.log('✅ Parent saved successfully:', savedParent);

      showNotification(
        currentEditParentId
          ? 'Parent updated successfully'
          : 'Parent added successfully',
        'success'
      );
      closeParentModal();
      await loadParentsData();
    } else {
      const errorText = await response.text();
      console.error('❌ Server error:', errorText);
      showNotification(errorText || 'Failed to save parent', 'error');
    }
  } catch (error) {
    console.error('❌ Error saving parent:', error);
    showNotification('Error saving parent', 'error');
  }
}

// ========================================
// EXPORT FUNCTIONS
// ========================================
function exportParentsPDF() {
  console.log('📄 Exporting parents to PDF');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138);
  doc.text('Parents Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Overview', 14, 40);

  const stats = [
    `Total Parents: ${parentsData.length}`,
    `Fathers: ${parentsData.filter((p) => p.relationship === 'Father').length}`,
    `Mothers: ${parentsData.filter((p) => p.relationship === 'Mother').length}`,
    `Guardians: ${parentsData.filter((p) => p.relationship === 'Guardian' || p.relationship === 'Sponsor').length}`,
  ];

  stats.forEach((stat, index) => {
    doc.text(stat, 14, 50 + index * 8);
  });

  const tableData = parentsData.map((parent) => [
    parent.id,
    `${parent.firstName} ${parent.lastName}`,
    parent.email,
    parent.phoneNumber || 'N/A',
    parent.relationship,
    parent.occupation || 'N/A',
    parent.childrenCount || 0
  ]);

  doc.autoTable({
    startY: 85,
    head: [['ID', 'Name', 'Email', 'Phone', 'Relationship', 'Occupation', 'Children']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { top: 10 },
  });

  doc.save('parents-report.pdf');
  console.log('✅ PDF exported successfully');
  showNotification('Parents report exported successfully', 'success');
}

function exportParentsExcel() {
  console.log('📊 Exporting parents to Excel');

  const data = parentsData.map((parent) => ({
    ID: parent.id,
    'First Name': parent.firstName,
    'Last Name': parent.lastName,
    Email: parent.email,
    Phone: parent.phoneNumber || 'N/A',
    Relationship: parent.relationship,
    Occupation: parent.occupation || 'N/A',
    Address: parent.address || 'N/A',
    'Children Count': parent.childrenCount || 0,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Parents');

  const colWidths = [
    { wch: 5 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 30 },
    { wch: 12 },
  ];
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, 'parents-report.xlsx');
  console.log('✅ Excel exported successfully');
  showNotification('Parents report exported successfully', 'success');
}

// ========================================
// EVENT LISTENERS
// ========================================
document.addEventListener('DOMContentLoaded', function () {
  const addParentBtn = document.getElementById('addParentBtn');
  if (addParentBtn) {
    addParentBtn.addEventListener('click', openAddParentModal);
  }

  const closeParentModalBtn = document.getElementById('closeParentModal');
  if (closeParentModalBtn) {
    closeParentModalBtn.addEventListener('click', closeParentModal);
  }

  const parentCancelBtn = document.getElementById('parentCancelBtn');
  if (parentCancelBtn) {
    parentCancelBtn.addEventListener('click', closeParentModal);
  }

  const parentForm = document.getElementById('parentForm');
  if (parentForm) {
    parentForm.addEventListener('submit', handleParentFormSubmit);
  }

  const searchParent = document.getElementById('searchParent');
  if (searchParent) {
    searchParent.addEventListener('input', filterParents);
  }

  const parentRelationshipFilter = document.getElementById(
    'parentRelationshipFilter'
  );
  if (parentRelationshipFilter) {
    parentRelationshipFilter.addEventListener('change', filterParents);
  }

  const exportParentsPdfBtn = document.getElementById('exportParentsPdfBtn');
  if (exportParentsPdfBtn) {
    exportParentsPdfBtn.addEventListener('click', exportParentsPDF);
  }

  const exportParentsExcelBtn = document.getElementById(
    'exportParentsExcelBtn'
  );
  if (exportParentsExcelBtn) {
    exportParentsExcelBtn.addEventListener('click', exportParentsExcel);
  }

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('parentModal');
    if (e.target === modal) {
      closeParentModal();
    }
  });
});

// ========================================
// EXPOSE FUNCTIONS GLOBALLY
// ========================================
window.loadParentsData = loadParentsData;
window.editParent = editParent;
window.deleteParent = deleteParent;