import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Side-effect import to register autoTable
import { format } from 'date-fns';

// Import logo - make sure this path is correct
import ncbaLogoPNG from '../assets/ncbabanklogo.png';

/**
 * Generate a professional checklist PDF with NCBA branding
 */
export const generateChecklistPDF = async ({
  checklist,
  documents = [],
  supportingDocs = [],
  creatorComment = '',
  comments = [],
  fileName: customFileName,
}) => {
  return new Promise((resolve, reject) => {
    try {
      // Normalize comments - handle both direct array and wrapped data property
      const rawComments = Array.isArray(comments)
        ? comments
        : (comments?.data && Array.isArray(comments.data))
        ? comments.data
        : [];
      
      // Filter out system-generated logs, keep only user comments
      // System logs contain:
      // - Keywords: Approved, Returned, submitted, updated, saved, created, changed, etc.
      // - File uploads: "Supporting Document uploaded", "Document uploaded", ".pdf", ".jpg", etc.
      // - Role-based actions: "by Co-Creator", "by RM", etc.
      const systemLogPatterns = [
        /^(Checklist|Draft|Document|Status|User|Extension|Email)\s/i,
        /\s(by|from|to)\s(Co-Creator|RM|Checker|Creator|Approver|System)\b/i,
        /(uploaded|submission|updated by|saved by|created by|deleted by|rejected by|approved by|submitted by)\b/i,
        /^(.*)\s(approved|submitted|saved|created|updated|deleted|rejected|sent|uploaded)\s(by|from)\s/i,
        /(Supporting Document|Document)\s(uploaded|added|removed|deleted|changed)/i,
        /\.(pdf|jpg|jpeg|png|doc|docx|xls|xlsx|txt)\b/i, // File extensions
        /DCL_|checklist_|document_/i, // System file naming
      ];
      
      const isSystemLog = (message) => {
        if (!message || typeof message !== 'string') return false;
        return systemLogPatterns.some(pattern => pattern.test(message));
      };
      
      const normalizedComments = rawComments.filter(comment => !isSystemLog(comment.message));
      
      console.log('📄 Starting PDF generation...');
      console.log('📝 Raw activity logs:', rawComments.length, 'total');
      console.log('📝 User-typed comments (filtered):', normalizedComments.length);
      if (normalizedComments.length > 0) {
        console.log('📝 First user comment:', normalizedComments[0]);
      }
      
      // Create PDF document with better quality settings
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true,
      });

      console.log('✅ PDF document created');

      // Set default font to courier (gothic century style)
      doc.setFont('courier', 'normal');

      // Define consistent margins for entire PDF
      const MARGIN_LEFT = 15;
      const MARGIN_RIGHT = 15;
      const PAGE_WIDTH = 210;
      const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 180mm
      const MARGIN_RIGHT_POS = PAGE_WIDTH - MARGIN_RIGHT;

      // Add NCBA logo - aligned to right margin
      try {
        // Check if logo exists and is a string
        if (ncbaLogoPNG) {
          // For Vite/Webpack, the imported image might be a URL path
          // We need to load it as an image first
          const logoImage = new Image();
          logoImage.src = ncbaLogoPNG;
          
          // Use setTimeout to ensure image is loaded
          // For simplicity, we'll try to add it directly
          // If it fails, we'll continue without logo
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
      doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
      doc.text('Document Checklist', 105, 18, { align: 'center' });

      // Document number and date
      doc.setFontSize(10);
      doc.setFont('courier', 'normal');
      doc.setTextColor(40, 40, 40); // Body text color - darker for visibility
      
      const dclNo = checklist?.dclNo || checklist?._id || 'N/A';
      const today = format(new Date(), 'dd/MM/yyyy');
      
      doc.text(`DCL No: ${dclNo}`, MARGIN_LEFT, 30);
      doc.text(`Generated: ${today}`, MARGIN_LEFT, 36);

      // Horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.line(MARGIN_LEFT, 40, MARGIN_RIGHT_POS, 40);

      // Checklist Information Section
      let yPos = 50;
      
      doc.setFontSize(14);
      doc.setFont('courier', 'bold');
      doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
      doc.text('Checklist Information', MARGIN_LEFT, yPos);
      
      yPos += 8;

      // Create info table with better styling
      if (typeof doc.autoTable === 'function') {
        console.log('Using autoTable for table generation');
        doc.autoTable({
          startY: yPos,
          head: [],
          body: [
            ['Customer Name', checklist?.customerName || 'N/A', 'Customer Number', checklist?.customerNumber || 'N/A'],
            ['Loan Type', checklist?.loanType || 'N/A', 'RM Name', checklist?.rmName || 'N/A'],
            ['Status', checklist?.status || 'N/A', 'Created Date', checklist?.createdAt ? format(new Date(checklist.createdAt), 'dd/MM/yyyy') : 'N/A'],
          ],
          theme: 'plain',
          styles: {
            fontSize: 10,
            cellPadding: 3,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            textColor: [40, 40, 40],
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
            // Make label cells (even columns) have light blue background
            if (data.column.index % 2 === 0 && data.section === 'body') {
              data.cell.styles.fillColor = [230, 240, 250]; // Light blue background
              data.cell.styles.textColor = [22, 70, 121]; // Blue text for labels
            }
          },
        });

        yPos = doc.lastAutoTable.finalY + 8;
      }

      // Document Summary Section
      doc.setFontSize(14);
      doc.setFont('courier', 'bold');
      doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
      doc.text('Document Summary', MARGIN_LEFT, yPos);
      yPos += 6;

      const totalDocs = documents.length || 0;
      const completedDocs = documents.filter(d => 
        ['submitted', 'sighted', 'waived', 'tbo'].includes((d.status || '').toLowerCase())
      ).length || 0;
      const progressPercent = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;
      
      doc.setFontSize(9);
      doc.setFont('courier', 'normal');
      doc.setTextColor(40, 40, 40); // Darker text for better visibility
      const progressText = `Total Documents: ${totalDocs} | Completed: ${completedDocs} | Progress: ${progressPercent}%`;
      doc.text(progressText, MARGIN_LEFT, yPos);
      yPos += 8;

      // Documents Section
      doc.setFontSize(14);
      doc.setFont('courier', 'bold');
      doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
      doc.text('Required Documents', MARGIN_LEFT, yPos);
      
      yPos += 8;

      // Prepare documents table with action as CO Status
      const docRows = documents.map((doc) => [
        doc.category || 'N/A',
        doc.name || 'N/A',
        doc.coStatus || doc.action || doc.status || 'N/A',
        doc.deferralNo || '-',
        doc.checkerStatus || 'N/A',
        doc.coComment || '-',
        doc.expiry || '-',
        doc.expiryStatus || 'N/A',
        doc.rmStatus || 'N/A',
      ]);

      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: yPos,
          head: [['Category', 'Document Name', 'CO Status', 'Deferral No', 'Checker Status', 'CO Comment', 'Expiry', 'Expiry Status', 'RM Status']],
          body: docRows,
          theme: 'grid',
          styles: {
            fontSize: 7,
            cellPadding: 2,
            lineColor: [22, 70, 121],
            textColor: [40, 40, 40], // Darker text for better visibility
            valign: 'top',
            overflow: 'linebreak',
            font: 'courier',
          },
          headStyles: {
            fillColor: [22, 70, 121], // PRIMARY_BLUE (#164679)
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7,
            font: 'courier',
            lineColor: [22, 70, 121],
          },
          columnStyles: {
            0: { cellWidth: 23 },
            1: { cellWidth: 27 },
            2: { cellWidth: 19 },
            3: { cellWidth: 16 },
            4: { cellWidth: 19 },
            5: { cellWidth: 23 },
            6: { cellWidth: 15 },
            7: { cellWidth: 19 },
            8: { cellWidth: 19 },
          },
          margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        });
        yPos = doc.lastAutoTable.finalY + 10;
      } else {
        yPos += 30;
      }

      // Supporting Documents Section (if any)
      if (supportingDocs && supportingDocs.length > 0) {
        doc.setFontSize(14);
        doc.setFont('courier', 'bold');
        doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
        doc.text('Supporting Documents', MARGIN_LEFT, yPos);
        
        yPos += 8;

        const supportingRows = supportingDocs.map((doc, index) => [
          (index + 1).toString(),
          doc.name || doc.fileName || 'N/A',
          doc.uploadedByRole || 'N/A',
          doc.uploadedAt ? format(new Date(doc.uploadedAt), 'dd/MM/yyyy') : 'N/A',
        ]);

        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            startY: yPos,
            head: [['#', 'Document Name', 'Uploaded By', 'Date Uploaded']],
            body: supportingRows,
            theme: 'grid',
            styles: {
              fontSize: 7,
              cellPadding: 2,
              lineColor: [22, 70, 121],
              textColor: [40, 40, 40], // Body text color - darker for visibility
              font: 'courier',
            },
            headStyles: {
              fillColor: [22, 70, 121], // PRIMARY_BLUE
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 7,
              font: 'courier',
            },
            columnStyles: {
              0: { cellWidth: 14 },
              1: { cellWidth: 62 },
              2: { cellWidth: 40 },
              3: { cellWidth: 48 },
            },
            margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
          });
          yPos = doc.lastAutoTable.finalY + 10;
        } else {
          yPos += 25;
        }
      }

      // Comments Section - Simplified with necessary info only
      if (normalizedComments && normalizedComments.length > 0) {
        console.log('✅ Rendering Comment Trail with', normalizedComments.length, 'comments');
        
        doc.setFontSize(14);
        doc.setFont('courier', 'bold');
        doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
        doc.text('Comment Trail', MARGIN_LEFT, yPos);
        
        yPos += 8;

        // Only include: Date, User, Comment (necessary info)
        const commentRows = normalizedComments.map((comment, idx) => {
          const dateStr = comment.createdAt ? format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A';
          const userName = comment.user?.name || comment.userName || 'N/A';
          const message = comment.message || comment.text || comment.comment || '-';
          
          console.log(`  📝 Comment ${idx + 1}: [${dateStr}] ${userName}: ${message?.substring(0, 30)}...`);
          
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
              lineColor: [22, 70, 121],
              textColor: [40, 40, 40], // Body text color - darker for visibility
            },
            headStyles: {
              fillColor: [22, 70, 121], // PRIMARY_BLUE
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
        } else {
          yPos += 30;
        }
      }

      // Creator Comment
      if (creatorComment) {
        doc.setFontSize(12);
        doc.setFont('courier', 'bold');
        doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
        doc.text('Creator Comment:', MARGIN_LEFT, yPos);
        
        yPos += 6;
        
        doc.setFontSize(9);
        doc.setFont('courier', 'normal');
        doc.setTextColor(40, 40, 40);
        
        const splitComment = doc.splitTextToSize(creatorComment, USABLE_WIDTH);
        doc.text(splitComment, MARGIN_LEFT, yPos);
        
        yPos += splitComment.length * 5 + 5;
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

      // Generate filename
      const fileName = customFileName || 
        `checklist_${checklist?.dclNo || checklist?._id || 'document'}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;

      // Save the PDF
      doc.save(fileName);

      console.log(`✅ PDF generated successfully: ${fileName}`);
      
      resolve({
        success: true,
        fileName,
        fileUrl: null, // No URL, just downloaded
      });
    } catch (error) {
      console.error('❌ Error in PDF generation:', error);
      reject(error);
    }
  });
};