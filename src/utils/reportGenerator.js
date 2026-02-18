import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import { getStatusColor, hexToRGB } from "./statusColors";

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
export const generateChecklistPDF = (checklist, docs = [], documentStats = {}, comments = []) => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const colWidth = (pageWidth - 3 * margin) / 2;
  let yPosition = 50;

  addProfessionalHeader(doc, "Checklist Document", checklist?.dclNo || "DCL");
  doc.setTextColor(...COLORS.text);

  // Two-Column Layout: Checklist Information (Left) and Document Statistics (Right)
  const leftColX = margin;
  const rightColX = margin + colWidth + margin;
  let leftY = 50;
  let rightY = 50;

  // === LEFT COLUMN: Checklist Information ===
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("Checklist Information", leftColX, leftY);
  leftY += 7;

  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);

  const checklistInfo = [
    ["Checklist No:", checklist?.dclNo || "N/A"],
    ["Customer Number:", checklist?.customerNumber || "N/A"],
    ["Customer Name:", checklist?.customerName || "N/A"],
    ["Loan Type:", checklist?.loanType || "N/A"],
    ["IBPS Number:", checklist?.ibpsNo || "N/A"],
    ["Status:", checklist?.status || "N/A"],
    ["Created By:", checklist?.createdBy?.name || "N/A"],
    ["Assigned RM:", checklist?.assignedToRM?.name || "N/A"],
    ["Created At:", dayjs(checklist?.createdAt).format("DD MMM YYYY HH:mm")],
  ];

  checklistInfo.forEach(([label, value]) => {
    if (leftY > pageWidth) {
      // Page break handling
      doc.addPage();
      leftY = 20;
    }
    doc.setFont(undefined, "bold");
    doc.text(label, leftColX, leftY);
    doc.setFont(undefined, "normal");
    const labelWidth = 35;
    doc.text(String(value).substring(0, 25), leftColX + labelWidth, leftY, { maxWidth: colWidth - labelWidth - 2 });
    leftY += 5;
  });

  // === RIGHT COLUMN: Document Statistics ===
  doc.setFont(undefined, "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text("Document Statistics", rightColX, rightY);
  rightY += 7;

  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.text);

  const stats = [
    ["Total Documents:", documentStats?.total || 0],
    ["Submitted:", documentStats?.submitted || 0],
    ["Pending (RM):", documentStats?.pendingFromRM || 0],
    ["Pending (Co):", documentStats?.pendingFromCo || 0],
    ["Sighted:", documentStats?.sighted || 0],
    ["Deferred:", documentStats?.deferred || 0],
    ["Waived:", documentStats?.waived || 0],
    ["TBO:", documentStats?.tbo || 0],
    ["Completion:", `${documentStats?.progressPercent || 0}%`],
  ];

  stats.forEach(([label, value]) => {
    if (rightY > pageWidth) {
      doc.addPage();
      rightY = 20;
    }
    doc.setFont(undefined, "bold");
    doc.text(label, rightColX, rightY);
    doc.setFont(undefined, "normal");
    doc.text(String(value), rightColX + 35, rightY);
    rightY += 5;
  });

  // Move to next section after both columns
  yPosition = Math.max(leftY, rightY) + 8;

  // Documents Table
  if (docs && docs.length > 0) {
    yPosition += 5;
    const documentData = docs.map((doc_item) => [
      (doc_item.documentName || "N/A").substring(0, 30),
      doc_item.category || "N/A",
      doc_item.status || "N/A",
      doc_item.submittedBy?.name || doc_item.submittedBy || "N/A",
      doc_item.expiryDate ? dayjs(doc_item.expiryDate).format("DD MMM YYYY") : (doc_item.submittedAt ? dayjs(doc_item.submittedAt).format("DD MMM YYYY") : "N/A"),
      doc_item.comment || doc_item.remarks || "",
    ]);

    autoTable(doc, {
      head: [["Document Name", "Category", "Status", "Submitted By", "Date", "Comments"]],
      body: documentData,
      startY: yPosition,
      margin: margin,
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        overflow: "linebreak",
        textColor: COLORS.text,
      },
      headStyles: {
        fillColor: COLORS.secondary,
        textColor: COLORS.white,
        fontStyle: "bold",
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: COLORS.light,
      },
      bodyStyles: {
        lineColor: COLORS.border,
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 18 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 40 },
      },
      didDrawCell: (data) => {
        // Apply status colors to status column (column index 2)
        if (data.column.index === 2 && data.row.section === "body") {
          const status = data.cell.text[0];
          const statusColor = getStatusColor(status);
          const bgRGB = hexToRGB(statusColor.bgColor);
          const textRGB = hexToRGB(statusColor.textColor);
          
          // Apply background color
          doc.setFillColor(...bgRGB);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
          
          // Apply text color
          doc.setTextColor(...textRGB);
          
          // Redraw text with colored background
          doc.setFont(undefined, "normal");
          doc.text(status, data.cell.x + 2, data.cell.y + data.cell.height / 2 + 1.5, {
            maxWidth: data.cell.width - 4,
            align: "left",
            baseline: "middle",
          });
        }
      },
    });
    yPosition = doc.lastAutoTable.finalY + 5;
  }

  // Comments Section
  const allComments = Array.isArray(comments) ? comments : (comments?.data ? comments.data : []);
  if (allComments && allComments.length > 0) {
    // Check if we need a new page
    if (yPosition > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 3;
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.primary);
    doc.text(`Comments Trail (${allComments.length} comments)`, margin, yPosition);
    yPosition += 5;

    doc.setFont(undefined, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.text);
    
    allComments.forEach((comment, idx) => {
      if (yPosition > doc.internal.pageSize.getHeight() - 10) {
        doc.addPage();
        yPosition = 20;
      }

      const author = comment.author?.name || comment.createdBy?.name || comment.userName || "Unknown";
      const date = dayjs(comment.createdAt || comment.timestamp).format("DD MMM HH:mm");
      const content = (comment.content || comment.text || comment.comment || comment.message || "").substring(0, 100);
      
      // Single line comment with truncation
      const commentLine = `${idx + 1}. ${author} (${date}): ${content}`;
      
      doc.setTextColor(...COLORS.text);
      doc.text(commentLine, margin + 1, yPosition, { 
        maxWidth: pageWidth - 2 * margin - 2,
        overflow: "linebreak"
      });
      
      yPosition += 3;
    });
  }

  addProfessionalFooter(doc);

  // Download
  const filename = `Checklist_${checklist?.dclNo || "export"}_${dayjs().format("YYYYMMDD_HHmmss")}.pdf`;
  doc.save(filename);
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
