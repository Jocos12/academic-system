(function () {
  const API_BASE_URL = 'http://localhost:8080/api';

  let contentData = [];
  let coursesData = [];
  let lecturersData = [];
  let currentEditId = null;
  let contentTypeChart = null;
  let contentStatusChart = null;

  document.addEventListener('DOMContentLoaded', function () {
    setupContentEventListeners();
  });

  function setupContentEventListeners() {
    const addContentBtn = document.getElementById('addContentBtn');
    const closeContentModal = document.getElementById('closeContentModal');
    const contentCancelBtn = document.getElementById('contentCancelBtn');
    const contentForm = document.getElementById('contentForm');

    if (addContentBtn)
      addContentBtn.addEventListener('click', openAddContentModal);
    if (closeContentModal)
      closeContentModal.addEventListener('click', closeContentModalHandler);
    if (contentCancelBtn)
      contentCancelBtn.addEventListener('click', closeContentModalHandler);
    if (contentForm)
      contentForm.addEventListener('submit', handleContentFormSubmit);

    const searchContent = document.getElementById('searchContent');
    const contentTypeFilter = document.getElementById('contentTypeFilter');
    const contentStatusFilter = document.getElementById('contentStatusFilter');
    const contentCourseFilter = document.getElementById('contentCourseFilter');

    if (searchContent) searchContent.addEventListener('input', filterContent);
    if (contentTypeFilter)
      contentTypeFilter.addEventListener('change', filterContent);
    if (contentStatusFilter)
      contentStatusFilter.addEventListener('change', filterContent);
    if (contentCourseFilter)
      contentCourseFilter.addEventListener('change', filterContent);

    const exportContentPdfBtn = document.getElementById('exportContentPdfBtn');
    const exportContentExcelBtn = document.getElementById(
      'exportContentExcelBtn'
    );

    if (exportContentPdfBtn)
      exportContentPdfBtn.addEventListener('click', exportContentToPDF);
    if (exportContentExcelBtn)
      exportContentExcelBtn.addEventListener('click', exportContentToExcel);

    window.addEventListener('click', (e) => {
      const modal = document.getElementById('contentModal');
      if (e.target === modal) {
        closeContentModalHandler();
      }
    });
  }

  window.loadCourseContentData = async function () {
    try {
      await Promise.all([
        loadAllContent(),
        loadCoursesForFilter(),
        loadLecturersForFilter(),
      ]);
      updateContentStats();
      populateContentCourseFilter();
      displayContentTable(contentData);
      createContentCharts();
    } catch (error) {
      console.error('Error loading course content:', error);
      showNotification('Error loading course content', 'error');
    }
  };

  async function loadAllContent() {
    try {
      const response = await fetch(`${API_BASE_URL}/course-content`);
      if (response.ok) {
        contentData = await response.json();
      } else {
        contentData = [];
        console.log('No content available from API');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      contentData = [];
    }
  }

  async function loadCoursesForFilter() {
    try {
      const response = await fetch(`${API_BASE_URL}/courses`);
      if (response.ok) {
        coursesData = await response.json();
      } else {
        coursesData = [];
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      coursesData = [];
    }
  }

  async function loadLecturersForFilter() {
    try {
      const response = await fetch(`${API_BASE_URL}/lecturers`);
      if (response.ok) {
        lecturersData = await response.json();
      } else {
        lecturersData = [];
      }
    } catch (error) {
      console.error('Error fetching lecturers:', error);
      lecturersData = [];
    }
  }

  function updateContentStats() {
    const totalContent = contentData.length;
    const approvedContent = contentData.filter(
      (c) => c.approvalStatus === 'APPROVED'
    ).length;
    const pendingContent = contentData.filter(
      (c) => c.approvalStatus === 'PENDING'
    ).length;
    const totalSize =
      contentData.reduce((sum, c) => sum + (c.fileSize || 0), 0) /
      (1024 * 1024);

    animateCounter('totalContent', totalContent);
    animateCounter('approvedContent', approvedContent);
    animateCounter('pendingContent', pendingContent);
    animateCounter('totalSize', Math.round(totalSize));
  }

  function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const duration = 1000;
    const steps = 30;
    const increment = targetValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        element.textContent = targetValue;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, duration / steps);
  }

  function populateContentCourseFilter() {
    const select = document.getElementById('contentCourseFilter');
    if (!select) return;

    select.innerHTML = '<option value="">All Courses</option>';
    coursesData.forEach((course) => {
      const option = document.createElement('option');
      option.value = course.id;
      option.textContent = `${course.courseCode} - ${course.courseName}`;
      select.appendChild(option);
    });
  }

  function filterContent() {
    const searchTerm =
      document.getElementById('searchContent')?.value.toLowerCase() || '';
    const typeFilter =
      document.getElementById('contentTypeFilter')?.value || '';
    const statusFilter =
      document.getElementById('contentStatusFilter')?.value || '';
    const courseFilter =
      document.getElementById('contentCourseFilter')?.value || '';

    const filtered = contentData.filter((content) => {
      const matchesSearch =
        !searchTerm ||
        content.title.toLowerCase().includes(searchTerm) ||
        content.fileName.toLowerCase().includes(searchTerm) ||
        content.course?.courseName.toLowerCase().includes(searchTerm) ||
        content.lecturer?.firstName.toLowerCase().includes(searchTerm) ||
        content.lecturer?.lastName.toLowerCase().includes(searchTerm);

      const matchesType = !typeFilter || content.contentType === typeFilter;
      const matchesStatus =
        !statusFilter || content.approvalStatus === statusFilter;
      const matchesCourse = !courseFilter || content.course?.id == courseFilter;

      return matchesSearch && matchesType && matchesStatus && matchesCourse;
    });

    displayContentTable(filtered);
  }

  function displayContentTable(content) {
    const tbody = document.getElementById('contentTableBody');
    if (!tbody) return;

    if (content.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="10" class="loading">No content found</td></tr>';
      return;
    }

    const html = content
      .map(
        (item) => `
            <tr>
                <td>${item.id}</td>
                <td style="font-weight: 600;">${item.title}</td>
                <td>${item.course?.courseCode || 'N/A'} - ${item.course?.courseName || 'N/A'}</td>
                <td>${item.lecturer?.firstName || ''} ${item.lecturer?.lastName || ''}</td>
                <td><span class="status-badge-table status-${item.contentType.toLowerCase()}">${formatContentType(item.contentType)}</span></td>
                <td style="font-family: 'Courier New', monospace; font-size: 0.8125rem;">${item.fileName}</td>
                <td style="font-weight: 600; color: var(--text-secondary);">${formatFileSize(item.fileSize)}</td>
                <td>
                    <span class="status-badge-table ${getStatusClass(item.approvalStatus)}">
                        ${item.approvalStatus}
                    </span>
                </td>
                <td>${formatDate(item.uploadedAt)}</td>
                <td>
                    <div class="action-buttons">
                        ${
                          item.approvalStatus === 'PENDING'
                            ? `
                            <button class="btn-icon" style="color: #10b981;" onclick="approveContent(${item.id})" title="Approve">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </button>
                            <button class="btn-icon" style="color: #ef4444;" onclick="rejectContent(${item.id})" title="Reject">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        `
                            : ''
                        }
                        <button class="btn-icon" onclick="downloadContent(${item.id})" title="Download">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                        <button class="btn-icon edit" onclick="editContent(${item.id})" title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon delete" onclick="deleteContent(${item.id})" title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `
      )
      .join('');

    tbody.innerHTML = html;
  }

  function formatContentType(type) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  function getStatusClass(status) {
    switch (status) {
      case 'APPROVED':
        return 'active';
      case 'PENDING':
        return 'pending';
      case 'REJECTED':
        return 'inactive';
      default:
        return '';
    }
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

  function createContentCharts() {
    createContentTypeChart();
    createContentStatusChart();
  }

  function createContentTypeChart() {
    const ctx = document.getElementById('contentTypeChart');
    if (!ctx) return;

    if (contentTypeChart) {
      contentTypeChart.destroy();
    }

    const typeCounts = {};
    contentData.forEach((content) => {
      typeCounts[content.contentType] =
        (typeCounts[content.contentType] || 0) + 1;
    });

    const labels = Object.keys(typeCounts).map((type) =>
      formatContentType(type)
    );
    const data = Object.values(typeCounts);

    const isDark = document.body.classList.contains('dark-mode');

    contentTypeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              '#3b82f6', // Blue
              '#10b981', // Green
              '#f59e0b', // Orange
              '#ef4444', // Red
              '#8b5cf6', // Purple
            ],
            borderWidth: 0,
            borderRadius: 6,
            spacing: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '70%',
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
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
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

  function createContentStatusChart() {
    const ctx = document.getElementById('contentStatusChart');
    if (!ctx) return;

    if (contentStatusChart) {
      contentStatusChart.destroy();
    }

    const statusCounts = {
      APPROVED: contentData.filter((c) => c.approvalStatus === 'APPROVED')
        .length,
      PENDING: contentData.filter((c) => c.approvalStatus === 'PENDING').length,
      REJECTED: contentData.filter((c) => c.approvalStatus === 'REJECTED')
        .length,
    };

    const isDark = document.body.classList.contains('dark-mode');

    contentStatusChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [
          {
            label: 'Content by Status',
            data: [
              statusCounts.APPROVED,
              statusCounts.PENDING,
              statusCounts.REJECTED,
            ],
            backgroundColor: [
              'rgba(16, 185, 129, 0.85)', // Green for Approved
              'rgba(251, 146, 60, 0.85)', // Orange for Pending
              'rgba(239, 68, 68, 0.85)', // Red for Rejected
            ],
            borderColor: ['#10b981', '#fb923c', '#ef4444'],
            borderWidth: 2,
            borderRadius: 8,
            barThickness: 45,
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
              font: {
                size: 12,
                weight: '500',
              },
            },
            grid: {
              color: isDark ? '#334155' : '#e2e8f0',
              drawBorder: false,
            },
            border: {
              display: false,
            },
          },
          x: {
            ticks: {
              color: isDark ? '#cbd5e1' : '#64748b',
              font: {
                size: 12,
                weight: '500',
              },
            },
            grid: {
              display: false,
            },
            border: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: isDark
              ? 'rgba(30, 41, 59, 0.95)'
              : 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
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
                return `${context.parsed.y} Item${context.parsed.y !== 1 ? 's' : ''}`;
              },
            },
          },
        },
      },
    });
  }

  function openAddContentModal() {
    document.getElementById('contentModalTitle').textContent =
      'Add Course Content';
    document.getElementById('contentForm').reset();
    document.getElementById('contentId').value = '';
    document.getElementById('contentFile').required = true;
    currentEditId = null;

    populateCoursesDropdown();
    populateLecturersDropdown();

    document.getElementById('contentModal').classList.add('active');
  }

  function populateCoursesDropdown() {
    const select = document.getElementById('contentCourse');
    if (!select) return;

    select.innerHTML = '<option value="">Select Course</option>';
    coursesData.forEach((course) => {
      const option = document.createElement('option');
      option.value = course.id;
      option.textContent = `${course.courseCode} - ${course.courseName}`;
      select.appendChild(option);
    });
  }

  function populateLecturersDropdown() {
    const select = document.getElementById('contentLecturer');
    if (!select) return;

    select.innerHTML = '<option value="">Select Lecturer</option>';
    lecturersData.forEach((lecturer) => {
      const option = document.createElement('option');
      option.value = lecturer.id;
      option.textContent = `${lecturer.firstName} ${lecturer.lastName}`;
      select.appendChild(option);
    });
  }

  window.editContent = function (id) {
    const content = contentData.find((c) => c.id === id);
    if (!content) return;

    document.getElementById('contentModalTitle').textContent =
      'Edit Course Content';
    document.getElementById('contentId').value = content.id;
    document.getElementById('contentTitle').value = content.title;
    document.getElementById('contentDescription').value =
      content.description || '';
    document.getElementById('contentType').value = content.contentType;
    document.getElementById('contentFile').required = false;

    populateCoursesDropdown();
    populateLecturersDropdown();

    if (content.course) {
      document.getElementById('contentCourse').value = content.course.id;
    }
    if (content.lecturer) {
      document.getElementById('contentLecturer').value = content.lecturer.id;
    }

    currentEditId = id;
    document.getElementById('contentModal').classList.add('active');
  };

  function closeContentModalHandler() {
    document.getElementById('contentModal').classList.remove('active');
    document.getElementById('contentForm').reset();
    currentEditId = null;
  }

  async function handleContentFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    const fileInput = document.getElementById('contentFile');

    const contentObj = {
      course: { id: parseInt(document.getElementById('contentCourse').value) },
      lecturer: {
        id: parseInt(document.getElementById('contentLecturer').value),
      },
      title: document.getElementById('contentTitle').value,
      description: document.getElementById('contentDescription').value,
      contentType: document.getElementById('contentType').value,
    };

    // Change this line - send as plain string, not Blob
    formData.append('content', JSON.stringify(contentObj));

    if (fileInput.files.length > 0) {
      formData.append('file', fileInput.files[0]);
    }

    try {
      let response;
      if (currentEditId) {
        response = await fetch(
          `${API_BASE_URL}/course-content/${currentEditId}`,
          {
            method: 'PUT',
            body: formData,
          }
        );
      } else {
        response = await fetch(`${API_BASE_URL}/course-content/upload`, {
          method: 'POST',
          body: formData,
        });
      }

      if (response.ok) {
        showNotification(
          currentEditId
            ? 'Content updated successfully'
            : 'Content uploaded successfully',
          'success'
        );
        closeContentModalHandler();
        await loadCourseContentData();
      } else {
        const errorText = await response.text();
        showNotification(`Error: ${errorText}`, 'error');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      showNotification('Error saving content. Please try again.', 'error');
    }
  }

  window.approveContent = async function (id) {
    if (!confirm('Are you sure you want to approve this content?')) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/course-content/${id}/approve/1`,
        {
          method: 'PUT',
        }
      );

      if (response.ok) {
        showNotification('Content approved successfully', 'success');
        await loadCourseContentData();
      } else {
        showNotification('Error approving content', 'error');
      }
    } catch (error) {
      console.error('Error approving content:', error);
      showNotification('Error approving content', 'error');
    }
  };

  window.rejectContent = async function (id) {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/course-content/${id}/reject/1?reason=${encodeURIComponent(reason)}`,
        {
          method: 'PUT',
        }
      );

      if (response.ok) {
        showNotification('Content rejected successfully', 'success');
        await loadCourseContentData();
      } else {
        showNotification('Error rejecting content', 'error');
      }
    } catch (error) {
      console.error('Error rejecting content:', error);
      showNotification('Error rejecting content', 'error');
    }
  };

  window.downloadContent = async function (id) {
    const content = contentData.find((c) => c.id === id);
    if (!content) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/course-content/${id}/download`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = content.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showNotification('Download started', 'success');
      } else {
        showNotification('Error downloading file', 'error');
      }
    } catch (error) {
      console.error('Error downloading content:', error);
      showNotification('Error downloading file', 'error');
    }
  };

  window.deleteContent = async function (id) {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/course-content/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showNotification('Content deleted successfully', 'success');
        await loadCourseContentData();
      } else {
        showNotification('Error deleting content', 'error');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      showNotification('Error deleting content', 'error');
    }
  };

  function exportContentToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text('Course Content Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    const stats = [
      `Total Content: ${contentData.length}`,
      `Approved: ${contentData.filter((c) => c.approvalStatus === 'APPROVED').length}`,
      `Pending: ${contentData.filter((c) => c.approvalStatus === 'PENDING').length}`,
      `Rejected: ${contentData.filter((c) => c.approvalStatus === 'REJECTED').length}`,
    ];

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    stats.forEach((stat, index) => {
      doc.text(stat, 14, 40 + index * 8);
    });

    const tableData = contentData.map((content) => [
      content.id,
      content.title,
      content.course?.courseCode || 'N/A',
      `${content.lecturer?.firstName || ''} ${content.lecturer?.lastName || ''}`,
      formatContentType(content.contentType),
      content.approvalStatus,
      formatDate(content.uploadedAt),
    ]);

    doc.autoTable({
      startY: 75,
      head: [
        ['ID', 'Title', 'Course', 'Lecturer', 'Type', 'Status', 'Uploaded'],
      ],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] },
    });

    doc.save('course-content-report.pdf');
    showNotification('PDF exported successfully', 'success');
  }

  function exportContentToExcel() {
    const data = contentData.map((content) => ({
      ID: content.id,
      Title: content.title,
      'Course Code': content.course?.courseCode || 'N/A',
      'Course Name': content.course?.courseName || 'N/A',
      Lecturer: `${content.lecturer?.firstName || ''} ${content.lecturer?.lastName || ''}`,
      Type: formatContentType(content.contentType),
      'File Name': content.fileName,
      'File Size': formatFileSize(content.fileSize),
      Status: content.approvalStatus,
      Uploaded: formatDate(content.uploadedAt),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Course Content');

    const colWidths = [
      { wch: 5 },
      { wch: 30 },
      { wch: 12 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'course-content-report.xlsx');
    showNotification('Excel exported successfully', 'success');
  }

  function showNotification(message, type) {
    console.log(`${type.toUpperCase()}: ${message}`);
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      alert(message);
    }
  }
})();
