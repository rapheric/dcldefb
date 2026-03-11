import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { getStatusColor, hexToRGB } from "./statusColors";
import ncbaLogoPNG from '../assets/ncbabanklogo.png';

// ============================================
// PROFESSIONAL COLOR PALETTE
// ============================================
const COLORS = {
  primary: [15, 32, 66],      // Deep navy blue
  secondary: [0, 102, 153],    // Professional teal
  accent: [255, 107, 53],      // Vibrant orange
  light: [240, 244, 248],      // Light gray
  border: [200, 210, 220],     // Subtle border
  text: [30, 40, 50],          // Dark text
  textLight: [100, 110, 120],  // Light text
  white: [255, 255, 255],      // White
};

// ============================================
// HELPER: Add Professional Header
// ============================================
const addProfessionalHeader = (doc, title, subtitle = "") => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Gradient-like header background
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  // Accent line
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 38, pageWidth, 2, "F");
  
  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont(undefined, "bold");
  doc.text(title, 15, 20);
  
  // Subtitle if provided
  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.setTextColor(200, 210, 220);
    doc.text(subtitle, 15, 30);
  }
};

// ============================================
// HELPER: Add Professional Footer
// ============================================
const addProfessionalFooter = (doc) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const totalPages = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(10, pageHeight - 15, pageWidth - 10, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textLight);
    doc.setFont(undefined, "normal");
    
    doc.text(
      `Generated: ${dayjs().format("DD MMM YYYY HH:mm")}`,
      15,
      pageHeight - 9
    );
    
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 25,
      pageHeight - 9
    );
    
    // Company info
    doc.setTextColor(150, 160, 170);
    doc.setFontSize(7);
    doc.text("NCBA Bank | Confidential", 15, pageHeight - 4);
  }
};

// ============================================
// PDF EXPORT - ENHANCED
// ============================================
export const generatePDFReport = (data, reportType, filters = {}) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 50;

  const title = reportType === "deferrals" ? "Deferrals Report" : "DCL Status Report";
  const subtitle = `Prepared: ${dayjs().format("DD MMM YYYY")}`;
  
  addProfessionalHeader(doc, title, subtitle);

  // Report Summary Section
  doc.setFontSize(11);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...COLORS.primary);
  doc.text("Report Summary", margin, yPosition);
  
  yPosition += 8;
  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...COLORS.text);
  
  const summaryItems = [
    [`Total Records`, `${data?.length || 0}`],
    [`Report Type`, reportType === "deferrals" ? "Deferrals" : "All DCLs"],
    ...(filters.dateRange && filters.dateRange[0]
      ? [[`Date Range`, `${dayjs(filters.dateRange[0]).format("DD MMM")} - ${dayjs(filters.dateRange[1]).format("DD MMM YYYY")}`]]
      : []),
  ];

  doc.setFillColor(...COLORS.light);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 2, "F");

  summaryItems.forEach(([label, value], idx) => {
    if (idx % 2 === 0 && idx > 0) yPosition += 6;
    if (idx % 2 === 0) {
      doc.text(label + ":", margin, yPosition);
      doc.setFont(undefined, "bold");
      doc.text(value, margin + 50, yPosition);
      doc.setFont(undefined, "normal");
    } else {
      doc.text(label + ":", pageWidth / 2, yPosition);
      doc.setFont(undefined, "bold");
      doc.text(value, pageWidth / 2 + 50, yPosition);
      doc.setFont(undefined, "normal");
    }
  });

  // Data Table
  yPosition += 12;
  const tableData = formatDataForPDFTable(data, reportType);
  const columns = getTableColumnsForPDF(reportType);

  autoTable(doc, {
    head: [columns],
    body: tableData,
    startY: yPosition,
    margin: margin,
    didDrawPage: () => addProfessionalFooter(doc),
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 4,
      overflow: "linebreak",
      textColor: COLORS.text,
    },
    headStyles: {
      fillColor: COLORS.secondary,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 9,
      pady: 5,
    },
    alternateRowStyles: {
      fillColor: COLORS.light,
    },
    bodyStyles: {
      lineColor: COLORS.border,
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { cellWidth: 25 },
    },
  });

  // Download
  const filename = `${reportType}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
  doc.save(filename);
};

// ============================================
// EXCEL EXPORT
// ============================================
export const generateExcelReport = (data, reportType, filters = {}) => {
  const workbook = XLSX.utils.book_new();

  // Data Sheet
  const excelData = formatDataForExcel(data, reportType);
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Column widths
  const columnWidths = getExcelColumnWidths(reportType);
  worksheet["!cols"] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");

  // Summary Sheet
  const summaryData = generateSummary(data, reportType);
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  // Download
  const filename = `${reportType}_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

// ============================================
// CHART DATA GENERATION
// ============================================
export const generateChartData = (data, reportType) => {
  if (reportType === "deferrals") {
    return generateDeferralCharts(data);
  } else {
    return generateDCLCharts(data);
  }
};

const generateDeferralCharts = (data) => {
  if (!data || !Array.isArray(data)) return {};

  // Status Distribution
  const statusDistribution = {};
  data.forEach((item) => {
    const status = item.status || "unknown";
    statusDistribution[status] = (statusDistribution[status] || 0) + 1;
  });

  const statusChart = Object.entries(statusDistribution).map(([status, count]) => ({
    name: capitalizeWords(status),
    value: count,
  }));

  // Priority Distribution
  const priorityDistribution = {};
  data.forEach((item) => {
    const priority = item.priority || "unknown";
    priorityDistribution[priority] = (priorityDistribution[priority] || 0) + 1;
  });

  const priorityChart = Object.entries(priorityDistribution).map(([priority, count]) => ({
    name: capitalizeWords(priority),
    value: count,
  }));

  // Approval Status
  const approvalStatus = {
    approved: data.filter((d) => d.deferralApprovalStatus === "approved").length,
    pending: data.filter((d) => d.deferralApprovalStatus === "pending").length,
    rejected: data.filter((d) => d.deferralApprovalStatus === "rejected").length,
  };

  const approvalChart = Object.entries(approvalStatus)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: capitalizeWords(status),
      value: count,
    }));

  // Days Remaining Distribution
  const daysRemainingChartData = data
    .filter((d) => d.daysRemaining !== undefined)
    .map((d) => ({
      name: d.deferralNumber || `DEF-${d._id?.slice(-4)}`,
      daysRemaining: d.daysRemaining,
    }))
    .slice(0, 15); // Limit to 15 for chart clarity

  // RM Distribution
  const rmDistribution = {};
  data.forEach((item) => {
    const rmName = item.assignedRM?.name || "Unassigned";
    rmDistribution[rmName] = (rmDistribution[rmName] || 0) + 1;
  });

  const rmChart = Object.entries(rmDistribution)
    .map(([rm, count]) => ({
      name: rm,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    statusChart,
    priorityChart,
    approvalChart,
    daysRemainingChartData,
    rmChart,
  };
};

const generateDCLCharts = (data) => {
  if (!data || !Array.isArray(data)) return {};

  // Status Distribution
  const statusDistribution = {};
  data.forEach((item) => {
    const status = item.status || "unknown";
    statusDistribution[status] = (statusDistribution[status] || 0) + 1;
  });

  const statusChart = Object.entries(statusDistribution).map(([status, count]) => ({
    name: capitalizeWords(status),
    value: count,
  }));

  // Loan Type Distribution
  const loanTypeDistribution = {};
  data.forEach((item) => {
    const loanType = item.loanType || "unknown";
    loanTypeDistribution[loanType] = (loanTypeDistribution[loanType] || 0) + 1;
  });

  const loanTypeChart = Object.entries(loanTypeDistribution)
    .map(([type, count]) => ({
      name: type,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Documents Count Distribution
  const docCountChartData = data
    .map((d) => {
      const totalDocs = d.documents?.reduce(
        (total, cat) => total + (cat.docList?.length || 0),
        0
      ) || 0;
      return {
        name: d.dclNo || `DCL-${d._id?.slice(-4)}`,
        documents: totalDocs,
      };
    })
    .sort((a, b) => b.documents - a.documents)
    .slice(0, 15);

  // RM Assignment
  const rmDistribution = {};
  data.forEach((item) => {
    const rmName = item.assignedToRM?.name || "Unassigned";
    rmDistribution[rmName] = (rmDistribution[rmName] || 0) + 1;
  });

  const rmChart = Object.entries(rmDistribution)
    .map(([rm, count]) => ({
      name: rm,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Creator Distribution
  const creatorDistribution = {};
  data.forEach((item) => {
    const creatorName = item.createdBy?.name || "Unknown";
    creatorDistribution[creatorName] = (creatorDistribution[creatorName] || 0) + 1;
  });

  const creatorChart = Object.entries(creatorDistribution)
    .map(([creator, count]) => ({
      name: creator,
      value: count,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    statusChart,
    loanTypeChart,
    docCountChartData,
    rmChart,
    creatorChart,
  };
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDataForPDFTable = (data, reportType) => {
  if (!data) return [];

  if (reportType === "deferrals") {
    return data.map((item) => [
      item.deferralNumber || "N/A",
      item.customerNumber || "N/A",
      item.customerName || "N/A",
      item.documentName || "N/A",
      item.priority || "N/A",
      item.status || "N/A",
      item.daysRemaining ?? "N/A",
      item.assignedRM?.name || "N/A",
    ]);
  } else {
    return data.map((item) => [
      item.dclNo || "N/A",
      item.customerNumber || "N/A",
      item.customerName || "N/A",
      item.loanType || "N/A",
      item.status || "N/A",
      item.createdBy?.name || "N/A",
      item.assignedToRM?.name || "N/A",
      item.documents?.reduce((total, cat) => total + (cat.docList?.length || 0), 0) || 0,
    ]);
  }
};

const formatDataForExcel = (data, reportType) => {
  if (!data) return [];

  if (reportType === "deferrals") {
    return data.map((item) => ({
      "Deferral Number": item.deferralNumber || "N/A",
      "Customer Number": item.customerNumber || "N/A",
      "Customer Name": item.customerName || "N/A",
      "Document Name": item.documentName || "N/A",
      "Loan Type": item.loanType || "N/A",
      Priority: item.priority || "N/A",
      Status: item.status || "N/A",
      "Days Remaining": item.daysRemaining ?? "N/A",
      "Days Overdue": item.daysOverdue ?? 0,
      "Assigned RM": item.assignedRM?.name || "N/A",
      "Created At": dayjs(item.createdAt).format("DD MMM YYYY HH:mm"),
      "Expiry Date": dayjs(item.slaExpiry).format("DD MMM YYYY"),
    }));
  } else {
    return data.map((item) => ({
      "DCL Number": item.dclNo || "N/A",
      "Customer Number": item.customerNumber || "N/A",
      "Customer Name": item.customerName || "N/A",
      "IBPS Number": item.ibpsNo || "N/A",
      "Loan Type": item.loanType || "N/A",
      Status: item.status || "N/A",
      "Created By": item.createdBy?.name || "N/A",
      "Assigned RM": item.assignedToRM?.name || "N/A",
      "Total Documents": item.documents?.reduce(
        (total, cat) => total + (cat.docList?.length || 0),
        0
      ) || 0,
      "Created At": dayjs(item.createdAt).format("DD MMM YYYY HH:mm"),
      "Updated At": dayjs(item.updatedAt).format("DD MMM YYYY HH:mm"),
    }));
  }
};

const getTableColumnsForPDF = (reportType) => {
  if (reportType === "deferrals") {
    return [
      "Deferral #",
      "Customer #",
      "Customer Name",
      "Document",
      "Priority",
      "Status",
      "Days Left",
      "RM",
    ];
  } else {
    return ["DCL #", "Cust #", "Customer", "Loan Type", "Status", "Creator", "RM", "Docs"];
  }
};

const getExcelColumnWidths = (reportType) => {
  if (reportType === "deferrals") {
    return [
      { wch: 15 }, // Deferral Number
      { wch: 15 }, // Customer Number
      { wch: 20 }, // Customer Name
      { wch: 20 }, // Document
      { wch: 12 }, // Loan Type
      { wch: 12 }, // Priority
      { wch: 12 }, // Status
      { wch: 12 }, // Days Left
      { wch: 12 }, // Days Overdue
      { wch: 15 }, // RM
      { wch: 18 }, // Created At
      { wch: 15 }, // Expiry
    ];
  } else {
    return [
      { wch: 15 }, // DCL Number
      { wch: 15 }, // Customer Number
      { wch: 20 }, // Customer Name
      { wch: 15 }, // IBPS
      { wch: 15 }, // Loan Type
      { wch: 12 }, // Status
      { wch: 15 }, // Creator
      { wch: 15 }, // RM
      { wch: 12 }, // Docs
      { wch: 18 }, // Created
      { wch: 18 }, // Updated
    ];
  }
};

const generateSummary = (data, reportType) => {
  if (!data || !Array.isArray(data)) return [];

  const summary = {
    "Total Records": data.length,
    "Generated On": dayjs().format("DD MMM YYYY HH:mm"),
  };

  if (reportType === "deferrals") {
    summary["Approved"] = data.filter(
      (d) => d.deferralApprovalStatus === "approved"
    ).length;
    summary["Pending"] = data.filter(
      (d) => d.deferralApprovalStatus === "pending"
    ).length;
    summary["Rejected"] = data.filter(
      (d) => d.deferralApprovalStatus === "rejected"
    ).length;
    summary["High Priority"] = data.filter((d) => d.priority === "high").length;
    summary["Average Days Remaining"] = (
      data.reduce((sum, d) => sum + (d.daysRemaining || 0), 0) / data.length
    ).toFixed(1);
  } else {
    summary["Approved"] = data.filter((d) => d.status === "approved").length;
    summary["Active"] = data.filter((d) => d.status === "active").length;
    summary["Completed"] = data.filter((d) => d.status === "completed").length;
    summary["Average Documents"] = (
      data.reduce(
        (sum, d) =>
          sum +
          (d.documents?.reduce(
            (total, cat) => total + (cat.docList?.length || 0),
            0
          ) || 0),
        0
      ) / data.length
    ).toFixed(1);
  }

  return Object.entries(summary).map(([key, value]) => ({
    Metric: key,
    Value: value,
  }));
};

const capitalizeWords = (str) => {
  if (!str) return "";
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// ============================================
// MODAL PDF EXPORTS - UNIFIED APPROACH
// ============================================

/**
 * Generate Checklist PDF with consistent professional formatting
 */
export const generateChecklistPDF = (
  checklist,
  docs = [],
  documentStats = {},
  comments = [],
  options = { save: true }
) => {
  const doc = new jsPDF("p", "mm", "a4");
  const PAGE_WIDTH = doc.internal.pageSize.getWidth();
  const PRIMARY_BLUE = [22, 70, 121];
  const MARGIN_LEFT = 15;
  const MARGIN_RIGHT = 15;
  const MARGIN_RIGHT_POS = PAGE_WIDTH - MARGIN_RIGHT;
  const USABLE_WIDTH = 180;
  
  let yPos = 15;

  // Add NCBA logo - aligned to right margin
  try {
    if (ncbaLogoPNG) {
      try {
        doc.addImage(ncbaLogoPNG, 'PNG', MARGIN_RIGHT_POS - 40, 10, 40, 15);
        console.log('✅ Logo added successfully');
      } catch (imgError) {
        console.warn('⚠️ Could not add logo directly, continuing without it:', imgError);
      }
    } else {
      console.warn('⚠️ No logo found, continuing without it');
    }
  } catch (logoError) {
    console.warn('⚠️ Could not add logo, continuing without it:', logoError);
  }

  // Header with title and date
  doc.setFontSize(20);
  doc.setFont('courier', 'bold');
  doc.setTextColor(...PRIMARY_BLUE);
  doc.text('Document Checklist', PAGE_WIDTH / 2, 18, { align: 'center' });

  // Document number and date
  doc.setFontSize(10);
  doc.setFont('courier', 'normal');
  doc.setTextColor(40, 40, 40);
  
  const dclNo = checklist?.dclNo || checklist?._id || 'N/A';
  const today = dayjs().format('DD/MM/YYYY');
  
  doc.text(`DCL No: ${dclNo}`, MARGIN_LEFT, 30);
  doc.text(`Generated: ${today}`, MARGIN_LEFT, 36);

  // Horizontal line
  doc.setDrawColor(...PRIMARY_BLUE);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, 38, MARGIN_RIGHT_POS, 38);
  
  yPos = 45;

  // Checklist Information Table
  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      startY: yPos,
      head: [],
      body: [
        ['Customer Name', checklist?.customerName || 'N/A', 'Customer Number', checklist?.customerNumber || 'N/A'],
        ['Loan Type', checklist?.loanType || 'N/A', 'RM Name', checklist?.rmName || checklist?.assignedToRM?.name || 'N/A'],
        ['Status', checklist?.status || 'N/A', 'Created Date', dayjs(checklist?.createdAt).format("DD/MM/YYYY") || 'N/A'],
      ],
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
        textColor: [40, 40, 40],
        font: 'courier',
      },
      bodyStyles: {
        textColor: [40, 40, 40],
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 44, fontStyle: 'bold', textColor: [40, 40, 40] },
        1: { cellWidth: 46, textColor: [40, 40, 40] },
        2: { cellWidth: 44, fontStyle: 'bold', textColor: [40, 40, 40] },
        3: { cellWidth: 46, textColor: [40, 40, 40] },
      },
      margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      didDrawCell: (data) => {
        if (data.column.index % 2 === 0 && data.section === 'body') {
          data.cell.styles.fillColor = [230, 240, 250];
          data.cell.styles.textColor = PRIMARY_BLUE;
        }
      },
    });

    yPos = doc.lastAutoTable.finalY + 8;
  }

  // Document Summary Section
  doc.setFontSize(14);
  doc.setFont('courier', 'bold');
  doc.setTextColor(...PRIMARY_BLUE);
  doc.text('Document Summary', MARGIN_LEFT, yPos);
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont('courier', 'normal');
  doc.setTextColor(40, 40, 40);

  const totalDocs = docs.length || 0;
  const completedDocs = docs.filter(d => 
    ['submitted', 'sighted', 'waived', 'tbo'].includes((d.status || '').toLowerCase())
  ).length || 0;
  const progressPercent = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;
  
  const summaryText = `Total Documents: ${totalDocs} | Completed: ${completedDocs} | Progress: ${progressPercent}%`;
  doc.text(summaryText, MARGIN_LEFT, yPos);
  yPos += 6;

  // Required Documents Table
  if (docs && docs.length > 0) {
    yPos += 2;
    doc.setFontSize(11);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...PRIMARY_BLUE);
    doc.text('Required Documents', MARGIN_LEFT, yPos);
    yPos += 6;

    // Debug: Log document structure
    if (docs && docs.length > 0) {
      console.log('📋 [PDF] First document object:', docs[0]);
      console.log('📋 [PDF] Total documents:', docs.length);
    }

    const documentRows = docs.map((doc_item) => [
      doc_item.documentName || doc_item.name || 'N/A',
      doc_item.category || 'N/A',
      doc_item.status || doc_item.coStatus || doc_item.action || 'N/A',
      doc_item.deferralNo || doc_item.deferralNumber || '-',
      doc_item.checkerStatus || doc_item.finalCheckerStatus || 'N/A',
      doc_item.comment || doc_item.remarks || doc_item.coComment || '-',
    ]);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPos,
        head: [['Document Name', 'Category', 'Status', 'Deferral No', 'Checker Status', 'CO Comment']],
        body: documentRows,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          font: 'courier',
          lineColor: PRIMARY_BLUE,
          textColor: [40, 40, 40],
        },
        headStyles: {
          fillColor: PRIMARY_BLUE,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          font: 'courier',
        },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 22 },
          2: { cellWidth: 18 },
          3: { cellWidth: 16 },
          4: { cellWidth: 20 },
          5: { cellWidth: 72 },
        },
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        didDrawCell: (data) => {
          // Color code Status column (index 2) and Checker Status column (index 4)
          if ((data.column.index === 2 || data.column.index === 4) && data.row.section === 'body') {
            const status = data.cell.text[0] || '';
            const statusColor = getStatusColor(status);
            if (statusColor) {
              const bgRGB = hexToRGB(statusColor.bgColor);
              const textRGB = hexToRGB(statusColor.textColor);
              data.cell.styles.fillColor = bgRGB;
              data.cell.styles.textColor = textRGB;
            }
          }
        },
      });
      yPos = doc.lastAutoTable.finalY + 8;
    }
  }

  // Comments Section
  const allComments = Array.isArray(comments) ? comments : (comments?.data ? comments.data : []);
  if (allComments && allComments.length > 0) {
    if (yPos > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      yPos = 15;
    }

    yPos += 3;
    doc.setFontSize(11);
    doc.setFont('courier', 'bold');
    doc.setTextColor(...PRIMARY_BLUE);
    doc.text('Comment Trail', MARGIN_LEFT, yPos);
    yPos += 6;

    // Debug: Log comment structure
    if (allComments && allComments.length > 0) {
      console.log('💬 [PDF] First comment object:', allComments[0]);
      console.log('💬 [PDF] Total comments:', allComments.length);
    }

    // Helper to clean message text by removing role prefix labels
    const cleanMessageText = (message) => {
      if (!message || typeof message !== 'string') return message;
      // Remove common role prefixes like "RM Comment:", "Co-Creator Comment:", "Checker Comment:", etc.
      return message.replace(/^(RM|Co-Creator|Checker|Creator|Approver|System)\s+(Comment|Message|Note):\s*/i, '').trim();
    };

    const commentRows = allComments.map((comment, idx) => {
      const dateStr = comment.createdAt ? dayjs(comment.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A';
      const userName = comment.author?.name || comment.createdBy?.name || comment.user?.name || comment.userName || comment.name || 'N/A';
      const message = cleanMessageText(comment.content || comment.text || comment.comment || comment.message || '');
      
      return [dateStr, userName, message];
    });

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: yPos,
        head: [['Date', 'User', 'Comment']],
        body: commentRows,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          font: 'courier',
          lineColor: PRIMARY_BLUE,
          textColor: [40, 40, 40],
        },
        headStyles: {
          fillColor: PRIMARY_BLUE,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          font: 'courier',
        },
        columnStyles: {
          0: { cellWidth: 42 },
          1: { cellWidth: 40 },
          2: { cellWidth: 98 },
        },
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }
  }

  // Footer with page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} • NCBA Bank • Confidential`,
      PAGE_WIDTH / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Download
  const filename = `Checklist_${checklist?.dclNo || "export"}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
  const blob = doc.output("blob");
  if (options.save !== false) {
    doc.save(filename);
  }
  return blob;
};

// Convenience: return a Blob instead of triggering a download
export const generateChecklistPDFBlob = async (checklist, docs = [], documentStats = {}, comments = []) => {
  return generateChecklistPDF(checklist, docs, documentStats, comments, { save: false });
};

/**
 * Generate Deferral PDF with consistent formatting
 */
export const generateDeferralPDF = (deferral, selectedApprovers = []) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = 50;

  addProfessionalHeader(doc, "Deferral Request", deferral?.deferralNumber || "DEF");
  doc.setTextColor(...COLORS.text);

  // Deferral Details
  yPosition = 50;
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("Deferral Information", margin, yPosition);
  yPosition += 7;

  doc.setFont(undefined, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  const deferralInfo = [
    ["Deferral Number:", deferral?.deferralNumber || "N/A"],
    ["Customer Number:", deferral?.customerNumber || "N/A"],
    ["Customer Name:", deferral?.customerName || "N/A"],
    ["Document Name:", deferral?.documentName || "N/A"],
    ["Priority:", deferral?.priority || "N/A"],
    ["Status:", deferral?.status || "N/A"],
    ["Deferral Reason:", deferral?.reason || "N/A"],
    ["Assigned RM:", deferral?.assignedRM?.name || "N/A"],
    ["Days Remaining:", deferral?.daysRemaining ?? "N/A"],
    ["Expiry Date:", dayjs(deferral?.slaExpiry).format("DD MMM YYYY") || "N/A"],
    ["Created Date:", dayjs(deferral?.createdAt).format("DD MMM YYYY HH:mm") || "N/A"],
  ];

  deferralInfo.forEach(([label, value]) => {
    doc.setFont(undefined, "bold");
    doc.text(label, margin, yPosition);
    doc.setFont(undefined, "normal");
    doc.text(String(value), 60, yPosition);
    yPosition += 5;
  });

  // Approvers Table
  if (selectedApprovers && selectedApprovers.length > 0) {
    yPosition += 5;
    const approverData = selectedApprovers.map((approver) => [
      approver.name || "N/A",
      approver.email || "N/A",
      approver.approvalStatus || "Pending",
      approver.approvedAt ? dayjs(approver.approvedAt).format("DD MMM YYYY HH:mm") : "-",
    ]);

    autoTable(doc, {
      head: [["Approver Name", "Email", "Status", "Approval Date"]],
      body: approverData,
      startY: yPosition,
      margin: margin,
      didDrawPage: () => addProfessionalFooter(doc),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        textColor: COLORS.text,
      },
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      bodyStyles: {
        lineColor: COLORS.border,
        lineWidth: 0.3,
      },
    });
  }

  addProfessionalFooter(doc);

  // Download
  const filename = `Deferral_${deferral?.deferralNumber || "export"}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
  doc.save(filename);
};

/**
 * Generate Audit Logs PDF
 */
export const generateAuditPDF = (logs = [], title = "Audit Log Report") => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = 50;

  addProfessionalHeader(doc, title, `Total: ${logs?.length || 0} records`);
  doc.setTextColor(...COLORS.text);

  // Logs Table
  if (logs && logs.length > 0) {
    const logData = logs.slice(0, 100).map((log) => [
      dayjs(log.timestamp || log.createdAt).format("DD MMM HH:mm"),
      log.userName || log.user?.name || "N/A",
      log.action || "N/A",
      log.description || "N/A",
      log.status || "N/A",
    ]);

    autoTable(doc, {
      head: [["Date/Time", "User", "Action", "Description", "Status"]],
      body: logData,
      startY: yPosition,
      margin: margin,
      didDrawPage: () => addProfessionalFooter(doc),
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        textColor: COLORS.text,
      },
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      bodyStyles: {
        lineColor: COLORS.border,
        lineWidth: 0.3,
      },
    });
  }

  addProfessionalFooter(doc);

  // Download
  const filename = `${title.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
  doc.save(filename);
};

/**
 * Generate Statistics/Dashboard PDF
 */
export const generateStatsPDF = (statsData = {}, title = "Statistics Report") => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPosition = 50;

  addProfessionalHeader(doc, title, dayjs().format("DD MMM YYYY"));
  doc.setTextColor(...COLORS.text);
  // Stats Table
  const statsEntries = Object.entries(statsData).map(([key, value]) => [
    key,
    String(value),
  ]);

  if (statsEntries.length > 0) {
    autoTable(doc, {
      head: [["Metric", "Value"]],
      body: statsEntries,
      startY: yPosition,
      margin: margin,
      didDrawPage: () => addProfessionalFooter(doc),
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 4,
        overflow: "linebreak",
        textColor: COLORS.text,
      },
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 10,
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      bodyStyles: {
        lineColor: COLORS.border,
        lineWidth: 0.3,
      },
    });
  }

  addProfessionalFooter(doc);

  // Download
  const filename = `${title.replace(/\s+/g, "_")}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
  doc.save(filename);
};