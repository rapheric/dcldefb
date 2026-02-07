// // src/components/completedChecklistModal/CompletedChecklistModal.jsx
// import React, { useState } from "react";
// import { Button, Modal, Tag, message } from "antd";
// import {
//   FilePdfOutlined,
//   RightOutlined,
//   LeftOutlined,
// } from "@ant-design/icons";
// // import { useGetChecklistCommentsQuery } from "../../api/checklistApi";
// // import { useChecklistDocuments } from "./hooks/useChecklistDocuments";
// // import { PRIMARY_BLUE } from "./utils/checklistConstants";
// // import { downloadChecklistAsPDF } from "./components/PDFGenerator";

// // Import components
// // import ChecklistHeader from "./components/ChecklistHeader";
// // import ChecklistInfoCard from "./components/ChecklistInfoCard";
// // import DocumentSummary from "./components/DocumentSummary";
// // import DocumentsTable from "./components/DocumentsTable";
// // import CommentHistorySection from "./components/CommentHistorySection";
// // import DocumentSidebarComponent from "./components/DocumentSidebarComponent";
// import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
// import { useChecklistDocuments } from "../../../hooks/useChecklistDocuments";
// import { PRIMARY_BLUE } from "../../../utils/checklistConstants";
// import { downloadChecklistAsPDF } from "../../../utils/pdfExport";
// import ChecklistHeader from "./ChecklistHeader";
// import ChecklistInfoCard from "./ChecklistInfoCard";
// import DocumentSummary from "./DocumentSummary";
// import DocumentsTable from "./DocumentsTable";
// import CommentHistorySection from "./CommentHistorySection";
// import DocumentSidebarComponent from "./DocumentSidebarComponent";

// const CompletedChecklistModal = ({
//   checklist,
//   open,
//   onClose,
//   readOnly = false,
// }) => {
//   const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
//   const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
//   const [supportingDocs] = useState([]);

//   const { data: comments, isLoading: commentsLoading } =
//     useGetChecklistCommentsQuery(checklist?._id, { skip: !checklist?._id });

//   const { docs, documentCounts } = useChecklistDocuments(checklist);

//  // In your CompletedChecklistModal.jsx
// const handleDownloadPDF = async () => {
//   setIsGeneratingPDF(true);
//   try {
//     // Pass ALL required parameters including documentCounts
//     await downloadChecklistAsPDF(
//       checklist,
//       docs,
//       documentCounts, // Make sure this is passed
//       comments
//     );
//     message.success("Checklist PDF generated successfully!");
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     message.error("Failed to generate PDF. Please try again.");
//   } finally {
//     setIsGeneratingPDF(false);
//   }
// };

//   const docsCount = docs.filter(
//     (d) => d.fileUrl || d.uploadData?.fileUrl,
//   ).length;
//   const supportingDocsCount = supportingDocs.filter(
//     (d) => d.fileUrl || d.uploadData?.fileUrl || d.url,
//   ).length;

//   return (
//     <Modal
//       title={<ChecklistHeader title={checklist?.title || ""} />}
//       open={open}
//       onCancel={onClose}
//       width={1100}
//       styles={{
//         header: {
//           background: PRIMARY_BLUE,
//           borderBottom: `1px solid ${PRIMARY_BLUE}`,
//         },
//       }}
//       footer={[
//         <Button
//           key="download"
//           icon={<FilePdfOutlined />}
//           loading={isGeneratingPDF}
//           onClick={handleDownloadPDF}
//           type="primary"
//           style={{
//             backgroundColor: PRIMARY_BLUE,
//             borderColor: PRIMARY_BLUE,
//             marginRight: "auto",
//           }}
//         >
//           Download as PDF
//         </Button>,
//         <Button key="close" onClick={onClose}>
//           Close
//         </Button>,
//       ]}
//     >
//       {/* Document Sidebar Toggle */}
//       <div className="doc-sidebar-toggle" style={{ marginBottom: 16 }}>
//         <Button
//           icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
//           onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
//         >
//           View Documents
//           <Tag color="green" style={{ marginLeft: 6 }}>
//             Docs: {docsCount}
//           </Tag>
//           {supportingDocsCount > 0 && (
//             <Tag color="blue" style={{ marginLeft: 6 }}>
//               Supporting: {supportingDocsCount}
//             </Tag>
//           )}
//         </Button>
//       </div>

//       {/* Document Sidebar */}
//       <DocumentSidebarComponent
//         documents={docs}
//         supportingDocs={supportingDocs}
//         open={showDocumentSidebar}
//         onClose={() => setShowDocumentSidebar(false)}
//       />

//       {checklist && (
//         <>
//           <ChecklistInfoCard checklist={checklist} />
//           <DocumentSummary documentCounts={documentCounts} />
//           <DocumentsTable docs={docs} checklist={checklist} />
//           <CommentHistorySection
//             comments={comments}
//             commentsLoading={commentsLoading}
//           />
//         </>
//       )}
//     </Modal>
//   );
// };

// export default CompletedChecklistModal;

// src/components/completedChecklistModal/CompletedChecklistModal.jsx
import React, { useState } from "react";
import { Button, Modal, Tag, message } from "antd";
import {
  FilePdfOutlined,
  RightOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
import { useChecklistDocuments } from "../../../hooks/useChecklistDocuments";
import { PRIMARY_BLUE } from "../../../utils/checklistConstants";
import usePDFGenerator from "../../../hooks/usePDFGenerator"; // Import the hook

// Import components
import ChecklistHeader from "./ChecklistHeader";
import ChecklistInfoCard from "./ChecklistInfoCard";
import DocumentSummary from "./DocumentSummary";
import DocumentsTable from "./DocumentsTable";
import CommentHistorySection from "./CommentHistorySection";
import DocumentSidebarComponent from "./DocumentSidebarComponent";

const CompletedChecklistModal = ({
  checklist,
  open,
  onClose,
  readOnly = false,
}) => {
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [supportingDocs] = useState([]);

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
      skip: !checklist?.id && !checklist?._id,
    });

  const { docs, documentCounts } = useChecklistDocuments(checklist);

  // Use the PDF generator hook
  const { isGenerating, progress, generatePDF } = usePDFGenerator();

  const handleDownloadPDF = async () => {
    try {
      // Prepare documents for PDF generation
      const preparedDocs = docs.map((doc, index) => ({
        ...doc,
        name: doc.name || doc.documentName || `Document ${index + 1}`,
        category: doc.category || "Other",
        status: doc.status || doc.action || "pending",
        action: doc.action || doc.status || "pending",
        comment: doc.comment || "",
        expiryDate: doc.expiryDate || null,
        fileUrl: doc.fileUrl || null,
        checkerStatus:
          doc.checkerStatus || doc.finalCheckerStatus || "approved",
        finalCheckerStatus:
          doc.finalCheckerStatus || doc.checkerStatus || "approved",
        // Add other fields that your hook might expect
        rmStatus: doc.rmStatus || "completed",
        deferralNumber: doc.deferralNumber || doc.deferralNo || null,
      }));

      // Generate PDF using the hook
      await generatePDF({
        checklist: {
          ...checklist,
          // Ensure all required fields are present
          bankName: checklist?.bankName || "NCBA BANK KENYA PLC",
          bankInitials: checklist?.bankInitials || "NCBA",
          dclNo: checklist?.dclNo || "N/A",
          ibpsNo: checklist?.ibpsNo || "Not provided",
          loanType: checklist?.loanType || "N/A",
          customerNumber: checklist?.customerNumber || "N/A",
          customerName:
            checklist?.customerName || checklist?.customerNumber || "N/A",
          createdBy: checklist?.createdBy || { name: "N/A" },
          assignedToRM: checklist?.assignedToRM || { name: "N/A" },
          assignedToCoChecker: checklist?.assignedToCoChecker || {
            name: "Pending",
          },
          status: checklist?.status || "completed",
          createdAt: checklist?.createdAt || new Date().toISOString(),
          completedAt:
            checklist?.completedAt ||
            checklist?.updatedAt ||
            new Date().toISOString(),
          segment: checklist?.segment || "Corporate",
          branch: checklist?.branch || "Head Office",
        },
        documents: preparedDocs,
        supportingDocs: supportingDocs || [],
        creatorComment: checklist?.creatorComment || "",
        comments: comments || [],
        onProgress: (percent) => {
          console.log(`PDF Generation Progress: ${percent}%`);
        },
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("Failed to generate PDF. Please try again.");
    }
  };

  const docsCount = docs.filter(
    (d) => d.fileUrl || d.uploadData?.fileUrl,
  ).length;
  const supportingDocsCount = supportingDocs.filter(
    (d) => d.fileUrl || d.uploadData?.fileUrl || d.url,
  ).length;

  // Determine button text based on progress
  const getPDFButtonText = () => {
    if (isGenerating) {
      return progress > 0
        ? `Generating PDF (${progress}%)`
        : "Generating PDF...";
    }
    return "Download as PDF";
  };

  return (
    <Modal
      title={<ChecklistHeader title={checklist?.title || ""} />}
      open={open}
      onCancel={onClose}
      width={1100}
      styles={{
        header: {
          background: PRIMARY_BLUE,
          borderBottom: `1px solid ${PRIMARY_BLUE}`,
        },
      }}
      footer={[
        <Button
          key="download"
          icon={<FilePdfOutlined />}
          loading={isGenerating}
          onClick={handleDownloadPDF}
          type="primary"
          style={{
            backgroundColor: PRIMARY_BLUE,
            borderColor: PRIMARY_BLUE,
            marginRight: "auto",
          }}
        >
          {getPDFButtonText()}
        </Button>,
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      {/* Document Sidebar Toggle */}
      <div className="doc-sidebar-toggle" style={{ marginBottom: 16 }}>
        <Button
          icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
          onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
        >
          View Documents
          <Tag color="green" style={{ marginLeft: 6 }}>
            Docs: {docsCount}
          </Tag>
          {supportingDocsCount > 0 && (
            <Tag color="blue" style={{ marginLeft: 6 }}>
              Supporting: {supportingDocsCount}
            </Tag>
          )}
        </Button>
      </div>

      {/* Document Sidebar */}
      <DocumentSidebarComponent
        documents={docs}
        supportingDocs={supportingDocs}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
      />

      {checklist && (
        <>
          <ChecklistInfoCard checklist={checklist} />
          <DocumentSummary documentCounts={documentCounts} />
          <DocumentsTable docs={docs} checklist={checklist} />
          <CommentHistorySection
            comments={comments}
            commentsLoading={commentsLoading}
          />
        </>
      )}
    </Modal>
  );
};

export default CompletedChecklistModal;
