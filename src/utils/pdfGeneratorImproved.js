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
      console.log('📄 Starting PDF generation...');
      
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

      // Add NCBA logo
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
            doc.addImage(ncbaLogoPNG, 'PNG', 15, 10, 40, 15);
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
      doc.setTextColor(100, 100, 100);
      
      const dclNo = checklist?.dclNo || checklist?._id || 'N/A';
      const today = format(new Date(), 'dd/MM/yyyy');
      
      doc.text(`DCL No: ${dclNo}`, 15, 30);
      doc.text(`Generated: ${today}`, 15, 36);

      // Horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 40, 195, 40);

      // Checklist Information Section
      let yPos = 50;
      
      doc.setFontSize(14);
      doc.setFont('courier', 'bold');
      doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
      doc.text('Checklist Information', 15, yPos);
      
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
            cellPadding: 4,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
          },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 55 },
          2: { fontStyle: 'bold', cellWidth: 40 },
          3: { cellWidth: 55 },
        },
        margin: { left: 15, right: 15 },
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
      } else {
        console.warn('autoTable not available, skipping info table');
        yPos += 30;
      }

      // Progress/Summary Section
      doc.setFontSize(12);
      doc.setFont('courier', 'bold');
      doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
      doc.text('Document Summary', 15, yPos);
      yPos += 6;

      const totalDocs = documents.length || 0;
      const completedDocs = documents.filter(d => 
        ['submitted', 'sighted', 'waived', 'tbo'].includes((d.status || '').toLowerCase())
      ).length || 0;
      const progressPercent = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;
      
      doc.setFontSize(9);
      doc.setFont('courier', 'normal');
      doc.setTextColor(50, 50, 50);
      const progressText = `Total Documents: ${totalDocs} | Completed: ${completedDocs} | Progress: ${progressPercent}%`;
      doc.text(progressText, 15, yPos);
      yPos += 8;

      // Documents Section
      doc.setFontSize(14);
      doc.setFont('courier', 'bold');
      doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
      doc.text('Required Documents', 15, yPos);
      
      yPos += 8;

      // Prepare documents table with action as CO Status
      const docRows = documents.map((doc) => [
        doc.category || 'N/A',
        doc.name || 'N/A',
        doc.action || 'N/A',
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
            cellPadding: 1.5,
            lineColor: [22, 70, 121], // PRIMARY_BLUE grid lines
            textColor: [50, 50, 50],
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
            0: { cellWidth: 22 },
            1: { cellWidth: 26 },
            2: { cellWidth: 18 },
            3: { cellWidth: 15 },
            4: { cellWidth: 18 },
            5: { cellWidth: 22 },
            6: { cellWidth: 14 },
            7: { cellWidth: 18 },
            8: { cellWidth: 18 },
          },
          margin: { left: 15, right: 15 },
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
        doc.text('Supporting Documents', 15, yPos);
        
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
              cellPadding: 1.5,
              lineColor: [22, 70, 121],
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
              0: { cellWidth: 12 },
              1: { cellWidth: 50 },
              2: { cellWidth: 30 },
              3: { cellWidth: 30 },
            },
            margin: { left: 15, right: 15 },
          });
          yPos = doc.lastAutoTable.finalY + 10;
        } else {
          yPos += 25;
        }
      }

      // Comments Section - Simplified with necessary info only
      if (comments && comments.length > 0) {
        doc.setFontSize(14);
        doc.setFont('courier', 'bold');
        doc.setTextColor(22, 70, 121); // PRIMARY_BLUE
        doc.text('Comment Trail', 15, yPos);
        
        yPos += 8;

        // Only include: Date, User, Comment (necessary info)
        const commentRows = comments.map((comment) => [
          comment.createdAt ? format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A',
          comment.user?.name || comment.userName || 'N/A',
          comment.text || comment.comment || '-',
        ]);

        if (typeof doc.autoTable === 'function') {
          doc.autoTable({
            startY: yPos,
            head: [['Date', 'User', 'Comment']],
            body: commentRows,
            theme: 'grid',
            styles: {
              fontSize: 7,
              cellPadding: 1.5,
              overflow: 'linebreak',
              font: 'courier',
              lineColor: [22, 70, 121],
            },
            headStyles: {
              fillColor: [22, 70, 121], // PRIMARY_BLUE
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 7,
              font: 'courier',
            },
            columnStyles: {
              0: { cellWidth: 35 },
              1: { cellWidth: 30 },
              2: { cellWidth: 80 },
            },
            margin: { left: 15, right: 15 },
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
        doc.text('Creator Comment:', 15, yPos);
        
        yPos += 6;
        
        doc.setFontSize(9);
        doc.setFont('courier', 'normal');
        doc.setTextColor(50, 50, 50);
        
        const splitComment = doc.splitTextToSize(creatorComment, 170);
        doc.text(splitComment, 15, yPos);
        
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
          doc.internal.pageSize.width / 2,
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