/**
 * Improved PDF Generator for DCL Checklists
 * Uses jsPDF with AutoTable for high-quality, professional PDFs
 * Text is selectable, searchable, and prints clearly
 */

import dayjs from 'dayjs';

const PRIMARY_BLUE = '#164679';
const ACCENT_LIME = '#b5d334';
const SECONDARY_PURPLE = '#7e6496';

/**
 * Get status color for PDF
 */
const getStatusColor = (status) => {
  const statusLower = (status || '').toLowerCase().replace(/\s+/g, '');

  const colorMap = {
    'submitted': [52, 194, 26], // #34CA1A - Green
    'approved': [52, 194, 26],
    'completed': [52, 194, 26],
    'pending': [255, 77, 79], // #FF4D4F - Red
    'pendingrm': [255, 77, 79],
    'pending_from_customer': [255, 77, 79],
    'pendingco': [250, 173, 20], // #FAAD14 - Orange
    'waived': [250, 173, 20],
    'sighted': [59, 130, 246], // #3B82F6 - Blue
    'deferred': [139, 92, 246], // #8B5CF6 - Purple
    'deferral_requested': [139, 92, 246],
    'tbo': [6, 182, 212], // #06B6D4 - Cyan
  };

  return colorMap[statusLower] || [107, 114, 128]; // Default gray
};

/**
 * Format status for display
 */
const formatStatusText = (status) => {
  if (!status) return 'N/A';
  return status.toUpperCase().replace(/_/g, ' ');
};

/**
 * Generate professional PDF for checklist
 */
export const generateChecklistPDF = async ({
  checklist,
  documents = [],
  supportingDocs = [],
  creatorComment = '',
  comments = [],
  documentStats = null,
}) => {
  try {
    // Dynamically import jsPDF and AutoTable
    const { default: jsPDF } = await import('jspdf');
    const { default: AutoTable } = await import('jspdf-autotable');

    // Create PDF instance (A4, portrait)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    let yPos = margin;

    // ========== HEADER SECTION ==========
    // Bank Name and Title
    doc.setFillColor(22, 70, 121); // PRIMARY_BLUE
    doc.rect(0, 0, pageWidth, 45, 'F');

    // White text for header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(checklist?.bankName || 'NCBA BANK KENYA PLC', margin, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('GO FOR IT • DOCUMENT CHECKLIST REVIEW', margin, 22);

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CO-CREATOR CHECKLIST REVIEW', margin, 32);

    // Info badges on the right
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const rightX = pageWidth - margin;
    doc.text(`DCL: ${checklist?.dclNo || 'N/A'}`, rightX, 15, { align: 'right' });
    doc.text(`IBPS: ${checklist?.ibpsNo || 'N/A'}`, rightX, 21, { align: 'right' });
    doc.text(`Generated: ${dayjs().format('DD MMM YYYY, HH:mm')}`, rightX, 27, { align: 'right' });
    doc.text(`Status: ${(checklist?.status || 'UNKNOWN').toUpperCase().replace(/_/g, ' ')}`, rightX, 33, { align: 'right' });

    yPos = 55;

    // ========== CHECKLIST INFO SECTION ==========
    doc.setFillColor(248, 249, 250); // Light gray background
    doc.roundedRect(margin, yPos, contentWidth, 25, 1, 1, 'F');

    doc.setTextColor(22, 70, 121);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CHECKLIST INFORMATION', margin + 3, yPos + 6);

    // Info grid (2 columns, 2 rows)
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const infoData = [
      { label: 'Customer Number', value: checklist?.customerNumber || 'N/A' },
      { label: 'DCL Number', value: checklist?.dclNo || 'N/A' },
      { label: 'IBPS Number', value: checklist?.ibpsNo || 'N/A' },
      { label: 'Loan Type', value: checklist?.loanType || 'N/A' },
      { label: 'Created By', value: checklist?.createdBy?.name || 'N/A' },
      { label: 'Created Date', value: checklist?.createdAt ? dayjs(checklist.createdAt).format('DD MMM YYYY') : 'N/A' },
      { label: 'Relationship Manager', value: checklist?.assignedToRM?.name || 'N/A' },
      { label: 'Co-Checker', value: checklist?.assignedToCoChecker?.name || 'Pending' },
    ];

    const colWidth = contentWidth / 4;
    const rowHeight = 8;

    infoData.forEach((item, index) => {
      const row = Math.floor(index / 4);
      const col = index % 4;
      const x = margin + 3 + (col * colWidth);
      const y = yPos + 13 + (row * rowHeight);

      doc.setTextColor(107, 114, 128);
      doc.setFontSize(7);
      doc.text(item.label + ':', x, y);

      doc.setTextColor(22, 70, 121);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, x, y + 4);
      doc.setFont('helvetica', 'normal');
    });

    yPos += 35;

    // ========== DOCUMENT STATS SECTION ==========
    // Calculate stats if not provided
    const stats = documentStats || {
      total: documents.length,
      submitted: documents.filter(d => ['submitted', 'sighted', 'waived', 'tbo'].includes((d.status || '').toLowerCase())).length,
      pendingFromRM: documents.filter(d => (d.status || '').toLowerCase() === 'pendingrm').length,
      pendingFromCo: documents.filter(d => (d.status || '').toLowerCase() === 'pendingco').length,
      deferred: documents.filter(d => (d.status || '').toLowerCase() === 'deferred').length,
      sighted: documents.filter(d => (d.status || '').toLowerCase() === 'sighted').length,
      waived: documents.filter(d => (d.status || '').toLowerCase() === 'waived').length,
      tbo: documents.filter(d => (d.status || '').toLowerCase() === 'tbo').length,
      progressPercent: documents.length > 0 ? Math.round((documents.filter(d => ['submitted', 'sighted', 'waived', 'tbo'].includes((d.status || '').toLowerCase())).length / documents.length) * 100) : 0,
    };

    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, yPos, contentWidth, 20, 1, 1, 'F');

    doc.setTextColor(22, 70, 121);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DOCUMENT SUMMARY', margin + 3, yPos + 6);

    // Stats badges (8 in a row)
    const statWidth = (contentWidth - 12) / 8;
    const statsData = [
      { label: 'Total', value: stats.total, color: [22, 70, 121] },
      { label: 'Submitted', value: stats.submitted, color: [52, 194, 26] },
      { label: 'Pending RM', value: stats.pendingFromRM, color: [255, 77, 79] },
      { label: 'Pending Co', value: stats.pendingFromCo, color: [139, 92, 246] },
      { label: 'Deferred', value: stats.deferred, color: [255, 77, 79] },
      { label: 'Sighted', value: stats.sighted, color: [59, 130, 246] },
      { label: 'Waived', value: stats.waived, color: [250, 173, 20] },
      { label: 'TBO', value: stats.tbo, color: [6, 182, 212] },
    ];

    statsData.forEach((stat, index) => {
      const x = margin + 6 + (index * statWidth);
      const centerX = x + (statWidth / 2);

      // Stat value
      doc.setTextColor(...stat.color);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(String(stat.value), centerX, yPos + 13, { align: 'center' });

      // Stat label
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.text(stat.label.toUpperCase(), centerX, yPos + 17, { align: 'center' });
    });

    yPos += 30;

    // ========== DOCUMENT TABLE SECTION ==========
    doc.setTextColor(22, 70, 121);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`DOCUMENT DETAILS (${documents.length} documents)`, margin, yPos);
    yPos += 5;

    // Prepare table data
    const tableData = documents.map(doc => {
      const statusColor = getStatusColor(doc.status);
      const checkerStatusColor = getStatusColor(doc.checkerStatus || doc.finalCheckerStatus);

      return [
        doc.category || 'N/A',
        doc.name || 'N/A',
        (doc.action || doc.status || 'N/A').toUpperCase(),
        formatStatusText(doc.status),
        formatStatusText(doc.checkerStatus || doc.finalCheckerStatus || 'N/A'),
        doc.comment || '—',
        doc.expiryDate ? dayjs(doc.expiryDate).format('DD/MM/YYYY') : '—',
        doc.expiryDate && dayjs(doc.expiryDate).isBefore(dayjs(), 'day') ? 'EXPIRED' : (doc.expiryDate ? 'CURRENT' : '—'),
        doc.fileUrl || doc.uploadData?.fileUrl ? '✓' : '—',
      ];
    });

    // Add auto table
    AutoTable(doc, {
      startY: yPos,
      head: [['Category', 'Document', 'Action', 'CO Status', 'Checker Status', 'Comment', 'Expiry', 'Validity', 'File']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 3,
        font: 'helvetica',
        lineColor: [226, 232, 240],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [22, 70, 121],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 22 }, // Category
        1: { cellWidth: 35 }, // Document
        2: { cellWidth: 18 }, // Action
        3: { cellWidth: 18 }, // CO Status
        4: { cellWidth: 22 }, // Checker Status
        5: { cellWidth: 30 }, // Comment
        6: { cellWidth: 18 }, // Expiry
        7: { cellWidth: 15 }, // Validity
        8: { cellWidth: 10, halign: 'center' }, // File
      },
      didParseCell: (data) => {
        // Color status cells
        if (data.section === 'body') {
          if (data.column.index === 3 || data.column.index === 4) { // Status columns
            const cellText = data.cell.raw;
            const color = getStatusColor(cellText);
            data.cell.styles.textColor = color;
            data.cell.styles.fontStyle = 'bold';
          }
          if (data.column.index === 7) { // Validity column
            const cellText = data.cell.raw;
            if (cellText === 'EXPIRED') {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fillColor = [254, 226, 226];
            } else if (cellText === 'CURRENT') {
              data.cell.styles.textColor = [6, 95, 70];
              data.cell.styles.fillColor = [209, 250, 229];
            }
          }
          if (data.column.index === 8) { // File column
            const cellText = data.cell.raw;
            if (cellText === '✓') {
              data.cell.styles.textColor = [52, 194, 26];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      },
      pageBreak: 'auto',
      margin: { top: margin, left: margin, right: margin, bottom: margin },
    });

    // ========== CREATOR COMMENT SECTION ==========
    yPos = doc.lastAutoTable.finalY + 15;

    if (creatorComment && creatorComment.trim()) {
      // Check if we need a new page
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
      }

      doc.setTextColor(22, 70, 121);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CREATOR COMMENT', margin, yPos);
      yPos += 8;

      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margin, yPos, contentWidth, 20, 1, 1, 'F');

      doc.setTextColor(55, 65, 81);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      const splitComment = doc.splitTextToSize(creatorComment, contentWidth - 10);
      doc.text(splitComment, margin + 5, yPos + 8);

      yPos += 28;
    }

    // ========== COMMENTS SECTION ==========
    if (comments && comments.length > 0) {
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = margin;
      }

      doc.setTextColor(22, 70, 121);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`COMMENT TRAIL & HISTORY (${comments.length} comments)`, margin, yPos);
      yPos += 8;

      comments.forEach((comment) => {
        // Check if we need a new page
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }

        const userName = comment.userId?.name || comment.user?.name || comment.createdBy?.name || 'System User';
        const commentDate = comment.createdAt || comment.timestamp;
        const commentText = comment.message || comment.content || comment.comment || '';

        // Role badge
        let role = 'USER';
        let roleColor = [59, 130, 246];

        if (comment.role) {
          const roleLower = comment.role.toLowerCase();
          if (roleLower.includes('rm')) {
            role = 'RM';
            roleColor = [139, 92, 246];
          } else if (roleLower.includes('creator') || roleLower.includes('co')) {
            role = 'CREATOR';
            roleColor = [52, 194, 26];
          } else if (roleLower.includes('checker')) {
            role = 'CHECKER';
            roleColor = [250, 173, 20];
          }
        }

        // Draw comment box
        const boxHeight = 25;

        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margin, yPos, contentWidth, boxHeight, 1, 1, 'F');

        // Role badge
        doc.setFillColor(...roleColor);
        doc.roundedRect(margin + 3, yPos + 3, 18, 5, 1, 1, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(role, margin + 12, yPos + 6, { align: 'center' });

        // User name and date
        doc.setTextColor(22, 70, 121);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(userName, margin + 25, yPos + 6);

        doc.setTextColor(107, 114, 128);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(dayjs(commentDate).format('DD MMM YYYY, HH:mm'), pageWidth - margin - 3, yPos + 6, { align: 'right' });

        // Comment text
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(8);
        const splitText = doc.splitTextToSize(commentText, contentWidth - 10);
        doc.text(splitText, margin + 5, yPos + 14);

        yPos += boxHeight + 5;
      });
    }

    // ========== FOOTER SECTION ==========
    const totalPages = doc.internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 15;

      // Footer line
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      // Footer text
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${checklist?.bankName || 'NCBA BANK KENYA PLC'} • Document Checklist Review System • Generated: ${dayjs().format('DD MMM YYYY, HH:mm:ss')}`,
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );

      // Page number
      doc.setFontSize(6);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });

      // Disclaimer
      doc.setFontSize(6);
      doc.setTextColor(156, 163, 175);
      doc.text(
        'This is a system-generated document. For official purposes only.',
        pageWidth / 2,
        footerY + 5,
        { align: 'center' }
      );
    }

    // Save PDF
    const fileName = `DCL_Checklist_${checklist?.dclNo || checklist?.customerNumber || 'export'}_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};
