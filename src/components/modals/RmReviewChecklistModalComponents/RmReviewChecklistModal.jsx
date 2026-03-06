// // export default RmReviewChecklistModal;
// import React, { useState, useEffect, useMemo } from "react";
// import { useSelector } from "react-redux";
// import { Modal, Button, message, Upload, Space, Tag } from "antd";
// import {
//   UploadOutlined,
//   DownloadOutlined,
//   RightOutlined,
//   LeftOutlined,
// } from "@ant-design/icons";
// import DocumentSidebar from "./DocumentSidebar";
// import ChecklistInfoCard from "./ChecklistInfoCard";
// import SupportingDocsSection from "./SupportingDocsSection";
// import CommentSection from "./CommentSection";
// import ProgressSummary from "./ProgressSummary";
// import SaveDraftButton from "./SaveDraftButton";
// import PDFGenerator from "./PDFGenerator";
// import DocumentTable from "./DocumentTable";
// import { PRIMARY_BLUE } from "../../../utils/colors";
// import { calculateDocumentStats } from "../../../utils/documentStats";
// import { useRmSubmitChecklistToCoCreatorMutation } from "../../../api/checklistApi";
// import { uploadFileToBackend } from "../../../utils/uploadUtils";
// import CommentHistory from "../../common/CommentHistory"; // Add this import
// import { useGetChecklistCommentsQuery } from "../../../api/checklistApi"; // Add this import

// const RmReviewChecklistModal = ({
//   checklist,
//   open,
//   onClose,
//   refetch,
//   readOnly = false,
//   onChecklistUpdate = null, // Callback to update parent with fresh checklist data
// }) => {
//   const auth = useSelector((state) => state.auth);
//   const token = auth?.token || localStorage.getItem("token");

//   const [docs, setDocs] = useState([]);
//   const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
//   const [rmGeneralComment, setRmGeneralComment] = useState("");
//   const [supportingDocs, setSupportingDocs] = useState([]);
//   const [uploadingSupportingDoc, setUploadingSupportingDoc] = useState(false);
//   const [uploadingDocs, setUploadingDocs] = useState({});
//   const [localChecklist, setLocalChecklist] = useState(checklist);

//   const [submitRmChecklistToCoCreator, { isLoading }] =
//     useRmSubmitChecklistToCoCreatorMutation();

//   // Add this query for comments
//   const { data: comments, isLoading: commentsLoading } =
//     useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
//       skip: !checklist?.id && !checklist?._id,
//     });

//   // DEBUG: Log comment fetching
//   React.useEffect(() => {
//     const checklistId = checklist?.id || checklist?._id;
//     console.log("🔶 RmReviewChecklistModal - Checklist ID for comments:", checklistId);
//     console.log("🔶 Comments Loading:", commentsLoading);
//     console.log("🔶 Comments Data:", comments);
//     if (comments && Array.isArray(comments)) {
//       console.log(`🔶 Total comments fetched: ${comments.length}`);
//     }
//   }, [checklist?.id, checklist?._id, comments, commentsLoading]);

//   const handleChecklistUpdate = (updatedChecklist) => {
//     // Update local state
//     setLocalChecklist(updatedChecklist);
//     // Call parent callback if provided
//     if (onChecklistUpdate) {
//       onChecklistUpdate(updatedChecklist);
//     }
//   };

//   useEffect(() => {
//     if (!checklist || !checklist.documents) return;

//     const flattenedDocs = checklist.documents.reduce((acc, categoryObj) => {
//       const filteredDocs = (categoryObj.docList || [])
//         .filter((doc) => doc.name?.trim() !== "")
//         .map((doc) => ({
//           ...doc,
//           category: categoryObj.category || "Missing Category",
//         }));
//       return acc.concat(filteredDocs);
//     }, []);

//     const preparedDocs = flattenedDocs.map((doc, idx) => ({
//       ...doc,
//       docIdx: idx,
//       status: doc.status || "pendingrm",
//       comment: doc.comment || "",
//       action: doc.status || "pendingrm",
//       fileUrl: doc.fileUrl || null,
//       deferralReason: doc.deferralReason || "",
//       deferralNumber: doc.deferralNumber || doc.deferralNo || "",
//       deferralNo: doc.deferralNo || doc.deferralNumber || "",
//       rmStatus: getInitialRmStatus(doc),
//       rmTouched: doc.rmStatus != null,
//       uploadData: doc.uploadData || null,
//     }));

//     setDocs(preparedDocs);

//     // Initialize supporting docs if they exist
//     if (checklist.supportingDocs && Array.isArray(checklist.supportingDocs)) {
//       setSupportingDocs(checklist.supportingDocs);
//     } else {
//       setSupportingDocs([]);
//     }
//   }, [checklist]);

//   const API_BASE_URL =
//     import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

//   const getInitialRmStatus = (doc) => {
//     if (doc.rmStatus !== undefined && doc.rmStatus !== null) {
//       return doc.rmStatus;
//     }
//     return doc.status || "pendingrm";
//   };

//   // Allow actions ONLY when checklist status is "rmreview", otherwise read-only
//   const isActionAllowed =
//     !readOnly && checklist?.status?.toLowerCase() === "rmreview";

//   // Calculate stats based on ONLY CoCreator status, not RM status
//   const documentStats = useMemo(() => {
//     const total = docs.length;

//     const submitted = docs.filter(
//       (d) =>
//         d.status?.toLowerCase() === "submitted" ||
//         d.action?.toLowerCase() === "submitted",
//     ).length;

//     const pendingFromRM = docs.filter(
//       (d) => d.status?.toLowerCase() === "pendingrm",
//     ).length;

//     const pendingFromCo = docs.filter(
//       (d) => d.status?.toLowerCase() === "pendingco",
//     ).length;

//     const deferred = docs.filter(
//       (d) => d.status?.toLowerCase() === "deferred",
//     ).length;

//     const sighted = docs.filter(
//       (d) => d.status?.toLowerCase() === "sighted",
//     ).length;

//     const waived = docs.filter(
//       (d) => d.status?.toLowerCase() === "waived",
//     ).length;

//     const tbo = docs.filter((d) => d.status?.toLowerCase() === "tbo").length;

//     const progressPercent =
//       total === 0
//         ? 0
//         : Math.round(
//             ((submitted + deferred + sighted + waived + tbo) / total) * 100,
//           );

//     return {
//       total,
//       submitted,
//       pendingFromRM,
//       pendingFromCo,
//       deferred,
//       sighted,
//       waived,
//       tbo,
//       progressPercent,
//     };
//   }, [docs]);

//   const handleUploadSupportingDoc = async (file) => {
//     try {
//       setUploadingSupportingDoc(true);

//       const checklistId = checklist?.id || checklist?._id;
//       if (!checklistId) {
//         throw new Error("Checklist ID missing");
//       }

//       const formData = new FormData();
//       formData.append("files", file);

//       const response = await fetch(
//         `${API_BASE_URL}/api/cocreatorChecklist/${checklistId}/upload`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//           body: formData,
//         },
//       );

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Upload failed: ${response.status} ${errorText}`);
//       }

//       const result = await response.json();

//       if (!result.supportingDocs || result.supportingDocs.length === 0) {
//         throw new Error(result.message || "Upload failed");
//       }

//       const uploadedDoc = result.supportingDocs[0];
//       const newSupportingDoc = {
//         id: uploadedDoc.id,
//         fileName: uploadedDoc.fileName,
//         fileUrl: uploadedDoc.fileUrl,
//         fileSize: uploadedDoc.fileSize,
//         fileType: uploadedDoc.fileType,
//         uploadedBy: uploadedDoc.uploadedBy,
//         uploadedById: uploadedDoc.uploadedById,
//         uploadedByRole: uploadedDoc.uploadedByRole,
//         uploadedAt: uploadedDoc.uploadedAt,
//       };

//       // Add new supporting doc to the state
//       setSupportingDocs((prev) => [...prev, newSupportingDoc]);

//       message.success(`"${file.name}" uploaded successfully!`);
//     } catch (error) {
//       console.error("Supporting doc upload failed", error);
//       message.error(error.message || "Upload failed");
//     } finally {
//       setUploadingSupportingDoc(false);
//     }
//   };

//   const handleDeleteSupportingDoc = async (docId, docName) => {
//     const confirm = window.confirm(`Delete "${docName}"?`);
//     if (!confirm) return;

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/uploads/${docId}`, {
//         method: "DELETE",
//       });

//       const result = await response.json();

//       if (result.success) {
//         setSupportingDocs((prev) => prev.filter((doc) => doc.id !== docId));
//         message.success("Document deleted!");
//       } else {
//         message.error(result.error || "Delete failed");
//       }
//     } catch (error) {
//       message.error("Delete error: " + error.message);
//     }
//   };

//   const handleFileUpload = async (docIdx, file) => {
//     const document = docs[docIdx];

//     const allowedTypes = [
//       "image/jpeg",
//       "image/png",
//       "image/gif",
//       "application/pdf",
//       "application/msword",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       "application/vnd.ms-excel",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     ];

//     if (!allowedTypes.includes(file.type)) {
//       message.error("Please upload only images, PDFs, Word, or Excel files");
//       return false;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       message.error("File size exceeds 10MB limit");
//       return false;
//     }

//     setUploadingDocs((prev) => ({ ...prev, [docIdx]: true }));

//     try {
//       const uploadResult = await uploadFileToBackend(
//         file,
//         checklist._id,
//         document._id,
//         document.name,
//         document.category,
//         token,
//       );

//       setDocs((prev) =>
//         prev.map((d, idx) =>
//           idx === docIdx
//             ? {
//                 ...d,
//                 uploadData: uploadResult,
//                 fileUrl: `${API_BASE_URL}${uploadResult.fileUrl}`,
//                 isUploading: false,
//               }
//             : d,
//         ),
//       );

//       message.success(`"${file.name}" uploaded successfully!`);
//     } catch (error) {
//       console.error("Upload error:", error);
//     } finally {
//       setUploadingDocs((prev) => ({ ...prev, [docIdx]: false }));
//     }

//     return false;
//   };

//   const submitRM = async () => {
//     try {
//       const checklistId = checklist?._id || checklist?.id;
//       if (!checklistId) throw new Error("Checklist ID missing");

//       const missingDeferral = docs.find(
//         (doc) =>
//           doc.rmStatus === "defferal_requested" && !doc.deferralNumber?.trim(),
//       );

//       if (missingDeferral) {
//         Modal.warning({
//           title: "Deferral Number Required",
//           content:
//             "Please enter a deferral number for all documents marked as Deferral Requested.",
//           okText: "OK",
//           centered: true,
//         });
//         return;
//       }

//       const payload = {
//         checklistId: checklistId,
//         documents: docs.map((doc) => ({
//           _id: doc._id,
//           id: doc.id,
//           category: doc.category,
//           status: doc.status,
//           action: doc.action,
//           comment: doc.comment || "",
//           fileUrl: doc.uploadData?.fileUrl || null,
//           deferralReason: doc.deferralReason || "",
//           rmStatus: doc.rmStatus || null,
//           deferralNumber: doc.deferralNumber || "",
//         })),
//         supportingDocs: supportingDocs.map((doc) => ({
//           id: doc.id,
//           name: doc.name,
//           fileUrl: doc.fileUrl,
//         })),
//         rmGeneralComment: rmGeneralComment || "",
//       };

//       await submitRmChecklistToCoCreator(payload).unwrap();
//       if (refetch) refetch();

//       // Call callback with updated checklist status signal
//       handleChecklistUpdate({ ...localChecklist, status: "CoCreatorReview" });

//       message.success("Checklist submitted to CO-Checker!");
//       onClose();
//     } catch (err) {
//       console.error(err);
//       message.error(err?.data?.error || "Failed to submit checklist");
//     }
//   };

//   const getFullUrl = (url) => {
//     if (!url) return null;
//     if (url.startsWith("http://") || url.startsWith("https://")) {
//       return url;
//     }
//     return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
//   };

//   return (
//     <Modal
//       title={
//         <div
//           style={{
//             backgroundColor: PRIMARY_BLUE,
//             color: "white",
//             padding: "18px 24px",
//             margin: "-24px -24px 0 -24px",
//             borderRadius: "8px 8px 0 0",
//             fontWeight: 600,
//             fontSize: "1.15rem",
//             letterSpacing: "0.5px",
//             display: "flex",
//             justifyContent: "space-between",
//             alignItems: "center",
//           }}
//         >
//           <span>Review Checklist — {checklist?.customerNumber || ""}</span>
//           {!isActionAllowed && (
//             <span
//               style={{
//                 fontSize: "0.85rem",
//                 fontWeight: 400,
//                 backgroundColor: "rgba(255,255,255,0.2)",
//                 padding: "4px 12px",
//                 borderRadius: "4px",
//               }}
//             >
//               Read-Only
//             </span>
//           )}
//         </div>
//       }
//       open={open}
//       onCancel={onClose}
//       width={1100}
//       closeIcon={
//         <span style={{ color: "white", fontSize: "24px", fontWeight: "bold" }}>
//           ×
//         </span>
//       }
//       footer={[
//         <PDFGenerator
//           key="download"
//           checklist={{
//             ...checklist,
//             dclNo: checklist?.dclNo || checklist?._id,
//           }}
//           docs={docs}
//           supportingDocs={supportingDocs || []}
//           creatorComment=""
//           rmGeneralComment={rmGeneralComment || ""}
//           comments={comments || []}
//           buttonText="Download PDF"
//           variant="primary"
//         />,

//         !readOnly && (
//           <SaveDraftButton
//             key="save-draft"
//             checklist={checklist}
//             docs={docs}
//             rmGeneralComment={rmGeneralComment}
//             supportingDocs={supportingDocs}
//             isActionAllowed={isActionAllowed}
//           />
//         ),

//         !readOnly && (
//           <Upload
//             key="upload-support"
//             showUploadList={false}
//             beforeUpload={(file) => {
//               handleUploadSupportingDoc(file);
//               return false;
//             }}
//             disabled={!isActionAllowed || uploadingSupportingDoc}
//             accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
//           >
//             <Button
//               icon={<UploadOutlined />}
//               loading={uploadingSupportingDoc}
//               style={{ borderRadius: "6px" }}
//             >
//               Upload Supporting Doc
//             </Button>
//           </Upload>
//         ),

//         <Button key="cancel" onClick={onClose} style={{ borderRadius: "6px" }}>
//           Close
//         </Button>,

//         !readOnly && (
//           <Button
//             key="submit"
//             type="primary"
//             loading={isLoading}
//             onClick={submitRM}
//             disabled={!isActionAllowed}
//             style={{
//               backgroundColor: PRIMARY_BLUE,
//               borderRadius: "6px",
//               fontWeight: 600,
//             }}
//           >
//             Submit to CO
//           </Button>
//         ),
//       ]}
//     >
//       {/* View Documents Button */}
//       <div style={{ position: "absolute", top: 16, right: 90, zIndex: 10 }}>
//         <Button
//           icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
//           onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
//         >
//           View Documents
//           {docs.filter((d) => d.fileUrl).length > 0 && (
//             <Tag color="green" style={{ marginLeft: 6 }}>
//               {docs.filter((d) => d.fileUrl).length}
//             </Tag>
//           )}
//         </Button>
//       </div>

//       {/* Document Sidebar */}
//       <DocumentSidebar
//         documents={docs}
//         supportingDocs={supportingDocs}
//         open={showDocumentSidebar}
//         onClose={() => setShowDocumentSidebar(false)}
//         getFullUrl={getFullUrl}
//       />

//       {checklist && (
//         <>
//           <ChecklistInfoCard checklist={checklist} />

//           <ProgressSummary documentStats={documentStats} />

//           <h3 style={{ color: PRIMARY_BLUE, fontWeight: "bold" }}>
//             Required Documents
//           </h3>

//           <DocumentTable
//             docs={docs}
//             setDocs={setDocs}
//             checklist={checklist}
//             isActionAllowed={isActionAllowed}
//             handleFileUpload={handleFileUpload}
//             uploadingDocs={uploadingDocs}
//             getFullUrl={getFullUrl}
//             readOnly={!isActionAllowed}
//             checklistStatus={checklist?.status}
//           />

//           <CommentSection
//             checklist={checklist}
//             rmGeneralComment={rmGeneralComment}
//             setRmGeneralComment={setRmGeneralComment}
//             isActionAllowed={isActionAllowed}
//             comments={comments}
//             commentsLoading={commentsLoading}
//           />

//           {/* Supporting Documents - RM can upload and delete */}
//           <SupportingDocsSection
//             supportingDocs={supportingDocs}
//             handleDeleteSupportingDoc={handleDeleteSupportingDoc}
//             getFullUrl={getFullUrl}
//             isActionAllowed={isActionAllowed}
//             readOnly={readOnly}
//           />
//         </>
//       )}
//     </Modal>
//   );
// };

// export default RmReviewChecklistModal;

import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { Modal, Button, message, Upload, Tag, Space } from "antd";
import {
  UploadOutlined,
  RightOutlined,
  LeftOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import DocumentSidebar from "../CheckerReviewChecklistModalComponents/DocumentSidebar";
import ChecklistInfoCard from "./ChecklistInfoCard";
import ProgressSummary from "./ProgressSummary";
import DocumentTable from "./DocumentTable";
import CommentSection from "./CommentSection";
import PDFGenerator from "./PDFGenerator.jsx";
import SaveDraftButton from "./SaveDraftButton";
import { useRmSubmitChecklistToCoCreatorMutation } from "../../../api/checklistApi";
import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
import { uploadFileToBackend } from "../../../utils/uploadUtils";

const PRIMARY_BLUE = "#0033a0";

const RmReviewChecklistModal = ({
  checklist,
  open,
  onClose,
  refetch,
  readOnly = false,
  onChecklistUpdate = null,
}) => {
  const auth = useSelector((state) => state.auth);
  const token = auth?.token || localStorage.getItem("token");

  const [docs, setDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [rmGeneralComment, setRmGeneralComment] = useState("");
  const [uploadingSupportingDoc, setUploadingSupportingDoc] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [localChecklist, setLocalChecklist] = useState(checklist);

  const [submitRmChecklistToCoCreator, { isLoading }] =
    useRmSubmitChecklistToCoCreatorMutation();

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?.id || checklist?._id, {
      skip: !checklist?.id && !checklist?._id,
    });

  const API_BASE_URL =
    import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

  const handleChecklistUpdate = (updatedChecklist) => {
    // Merge the updated checklist with existing localChecklist to preserve fields not returned by submission
    const mergedChecklist = {
      ...localChecklist,
      ...checklist,
      ...updatedChecklist,
      // Ensure supportingDocs from backend response is preserved
      supportingDocs:
        updatedChecklist?.supportingDocs ||
        checklist?.supportingDocs ||
        localChecklist?.supportingDocs ||
        [],
    };

    console.log("🔄 RM handleChecklistUpdate called:");
    console.log(
      "   Updated checklist supportingDocs:",
      updatedChecklist?.supportingDocs?.length || 0,
    );
    console.log(
      "   Merged checklist supportingDocs:",
      mergedChecklist.supportingDocs?.length || 0,
    );

    setLocalChecklist(mergedChecklist);
    if (onChecklistUpdate) {
      onChecklistUpdate(mergedChecklist);
    }
  };

  const getInitialRmStatus = (doc) => {
    if (doc.rmStatus !== undefined && doc.rmStatus !== null) {
      return doc.rmStatus;
    }
    return doc.status || "pendingrm";
  };

  useEffect(() => {
    if (!checklist) return;

    // Handle both flat format (from draft restoration) and nested format (from backend)
    let docsToProcess = [];

    if (!checklist.documents) {
      setDocs([]);
      return;
    }

    // Check if documents are in flat format (from draft) or nested format (from backend)
    const firstDoc = checklist.documents[0];
    const isFlatFormat =
      firstDoc &&
      (firstDoc._id || firstDoc.id || firstDoc.name) &&
      !firstDoc.docList;

    if (isFlatFormat) {
      // Flat format from draft - use directly
      docsToProcess = checklist.documents;
      console.log(
        "📋 RM Modal - Processing flat document format from draft:",
        docsToProcess.length,
        "docs",
      );
    } else {
      // Nested format from backend - flatten it
      let docIdxCounter = 0;
      docsToProcess = checklist.documents.reduce((acc, categoryObj) => {
        const filteredDocs = (categoryObj.docList || [])
          .filter((doc) => doc.name?.trim() !== "")
          .map((doc) => ({
            ...doc,
            category: categoryObj.category || "Missing Category",
            docIdx: docIdxCounter++,
          }));
        return [...acc, ...filteredDocs];
      }, []);
      console.log(
        "📋 RM Modal - Processing nested document format from backend:",
        docsToProcess.length,
        "docs",
      );
    }

    // Process all documents
    const processedDocs = docsToProcess.map((doc, idx) => ({
      ...doc,
      category: doc.category || "Missing Category",
      rmStatus: getInitialRmStatus(doc),
      rmTouched: doc.rmStatus != null,
      uploadData: doc.uploadData || null,
      docIdx: doc.docIdx !== undefined ? doc.docIdx : idx,
    }));

    // Store supporting docs separately - they should NOT appear in DocumentTable
    const supportingDocsData = checklist.supportingDocs || [];
    console.log(
      "📎 RM Modal - Supporting docs from backend:",
      supportingDocsData.length,
    );

    // Set main docs WITHOUT supporting docs
    setDocs(processedDocs);
    console.log(
      "📋 RM Modal - Main documents (no supporting docs):",
      processedDocs.length,
    );

    // Set supporting docs separately for DocumentSidebar
    setSupportingDocs(supportingDocsData);
  }, [checklist]);

  // Wrapper for uploading supporting docs - uploads to backend and adds to main docs array
  const handleUploadSupportingDoc = async (file) => {
    try {
      setUploadingSupportingDoc(true);
      console.log("📤 RM Modal - Uploading supporting document:", file.name);

      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      // Upload to backend using the document upload endpoint
      const formData = new FormData();
      formData.append("file", file);
      formData.append("checklistId", checklistId);
      formData.append("documentName", file.name);
      formData.append("category", "Supporting Documents");

      const response = await fetch(`${API_BASE_URL}/api/uploads`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ RM Modal - Upload response:", result);

      if (!result.success || !result.data) {
        throw new Error("Invalid upload response");
      }

      const uploadedDoc = result.data;

      // Create document object for the uploaded supporting doc
      const newSupportingDoc = {
        id: uploadedDoc.id || uploadedDoc._id,
        _id: uploadedDoc._id || uploadedDoc.id,
        name: uploadedDoc.name || uploadedDoc.fileName || file.name,
        fileName: uploadedDoc.fileName || file.name,
        category: "Supporting Documents",
        status: "submitted",
        action: "submitted",
        comment: "",
        fileUrl: uploadedDoc.fileUrl,
        fileSize: uploadedDoc.fileSize,
        fileType: uploadedDoc.fileType,
        uploadedBy: uploadedDoc.uploadedBy,
        uploadedByRole: uploadedDoc.uploadedByRole || auth?.user?.role || "RM",
        uploadedAt: uploadedDoc.createdAt || new Date().toISOString(),
        isSupporting: true,
        uploadData: {
          fileName: uploadedDoc.fileName || file.name,
          fileUrl: uploadedDoc.fileUrl,
          createdAt: uploadedDoc.createdAt || new Date().toISOString(),
          fileSize: uploadedDoc.fileSize,
          fileType: uploadedDoc.fileType,
          uploadedBy: uploadedDoc.uploadedBy || auth?.user?.name || "RM",
        },
      };

      console.log(
        "✅ RM Modal - Adding supporting doc to supportingDocs state (NOT to docs array):",
        newSupportingDoc,
      );

      // Add to supportingDocs state (separate from main docs - won't appear in DocumentTable)
      setSupportingDocs((prevDocs) => [...prevDocs, newSupportingDoc]);

      message.success(`"${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error("❌ RM Modal - Error uploading supporting doc:", error);
      message.error(error.message || "Failed to upload supporting document");
      throw error;
    } finally {
      setUploadingSupportingDoc(false);
    }
  };

  const isActionAllowed =
    !readOnly && checklist?.status?.toLowerCase() === "rmreview";

  const documentStats = useMemo(() => {
    const total = docs.length;

    const submitted = docs.filter(
      (d) =>
        d.status?.toLowerCase() === "submitted" ||
        d.action?.toLowerCase() === "submitted",
    ).length;

    const pendingFromRM = docs.filter(
      (d) => d.status?.toLowerCase() === "pendingrm",
    ).length;

    const pendingFromCo = docs.filter(
      (d) => d.status?.toLowerCase() === "pendingco",
    ).length;

    const deferred = docs.filter(
      (d) => d.status?.toLowerCase() === "deferred",
    ).length;

    const sighted = docs.filter(
      (d) => d.status?.toLowerCase() === "sighted",
    ).length;

    const waived = docs.filter(
      (d) => d.status?.toLowerCase() === "waived",
    ).length;

    const tbo = docs.filter((d) => d.status?.toLowerCase() === "tbo").length;

    const progressPercent =
      total === 0
        ? 0
        : Math.round(
            ((submitted + deferred + sighted + waived + tbo) / total) * 100,
          );

    return {
      total,
      submitted,
      pendingFromRM,
      pendingFromCo,
      deferred,
      sighted,
      waived,
      tbo,
      progressPercent,
    };
  }, [docs]);

  const handleFileUpload = async (docIdx, file) => {
    const document = docs[docIdx];

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error("Please upload only images, PDFs, Word, or Excel files");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error("File size exceeds 10MB limit");
      return false;
    }

    setUploadingDocs((prev) => ({ ...prev, [docIdx]: true }));

    try {
      const uploadResult = await uploadFileToBackend(
        file,
        checklist._id,
        document._id,
        document.name,
        document.category,
        token,
      );

      setDocs((prev) =>
        prev.map((d, idx) =>
          idx === docIdx
            ? {
                ...d,
                uploadData: uploadResult,
                fileUrl: `${API_BASE_URL}${uploadResult.fileUrl}`,
                isUploading: false,
              }
            : d,
        ),
      );

      message.success(`"${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploadingDocs((prev) => ({ ...prev, [docIdx]: false }));
    }

    return false;
  };

  const submitRM = async () => {
    try {
      const checklistId = checklist?._id || checklist?.id;
      if (!checklistId) throw new Error("Checklist ID missing");

      const missingDeferral = docs.find(
        (doc) =>
          doc.rmStatus === "defferal_requested" && !doc.deferralNumber?.trim(),
      );

      if (missingDeferral) {
        Modal.warning({
          title: "Deferral Number Required",
          content:
            "Please enter a deferral number for all documents marked as Deferral Requested.",
          okText: "OK",
          centered: true,
        });
        return;
      }

      const payload = {
        checklistId: checklistId,
        documents: docs
          .filter((doc) => !doc.isNew) // Filter out new/temporary documents
          .map((doc) => ({
            _id: doc._id,
            id: doc.id,
            category: doc.category,
            status: doc.status,
            action: doc.action,
            comment: doc.comment || "",
            fileUrl: doc.uploadData?.fileUrl || null,
            deferralReason: doc.deferralReason || "",
            rmStatus: doc.rmStatus || null,
            deferralNumber: doc.deferralNumber || "",
          })),
        supportingDocs: supportingDocs
          .filter((doc) => !doc.isNew) // Filter out new/temporary supporting docs
          .map((doc) => ({
            id: doc.id || doc._id,
            name: doc.fileName || doc.name,
            fileUrl: doc.fileUrl,
            uploadedByRole: doc.uploadedByRole,
          })),
        rmGeneralComment: rmGeneralComment || "",
      };

      console.log("📤 RM SUBMISSION TO CO-CREATOR:");
      console.log("   Total docs in state:", docs.length);
      console.log("   Supporting docs:", payload.supportingDocs.length);
      console.log("   Main docs being submitted:", payload.documents.length);

      await submitRmChecklistToCoCreator(payload).unwrap();
      if (refetch) refetch();

      handleChecklistUpdate({ ...localChecklist, status: "CoCreatorReview" });

      message.success("Checklist submitted to CO-Checker!");
      onClose();
    } catch (err) {
      console.error(err);
      message.error(err?.data?.error || "Failed to submit checklist");
    }
  };

  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <span style={{ color: "#fff", fontSize: "15px", fontWeight: 600 }}>
            {`Review Checklist  ${checklist?.customerNumber || ""}`}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button
              icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
              onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
              size="small"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "#164679",
                borderColor: "#164679",
                color: "#fff",
                padding: "4px 12px",
                height: "32px",
              }}
            >
              View Documents
              {docs.filter((d) => d.fileUrl).length + supportingDocs.length >
                0 && (
                <Tag color="green" style={{ marginLeft: 6, marginBottom: 0 }}>
                  {docs.filter((d) => d.fileUrl).length + supportingDocs.length}
                </Tag>
              )}
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={onClose}
              size="small"
              type="default"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.2)",
                borderColor: "rgba(255, 255, 255, 0.4)",
                color: "#fff",
                width: "32px",
                height: "32px",
                padding: 0,
              }}
            />
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1200}
      centered={true}
      wrapperClassName="modal-centered-in-content"
      closeIcon={null}
      styles={{
        body: { padding: "0 8px 24px" },
        header: {
          background: "#164679",
          padding: "18px 24px",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        },
        mask: { backgroundColor: "rgba(0, 0, 0, 0.45)" },
      }}
      wrapperStyle={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingLeft: "120px",
        paddingTop: "80px",
      }}
      footer={
        <Space
          size="middle"
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
            gap: "12px",
          }}
        >
          <PDFGenerator
            key="download"
            checklist={{
              ...checklist,
              dclNo: checklist?.dclNo || checklist?._id,
            }}
            docs={docs}
            supportingDocs={supportingDocs || []}
            creatorComment=""
            rmGeneralComment={rmGeneralComment || ""}
            comments={comments || []}
            buttonText="Download PDF"
            variant="primary"
          />
          {!readOnly && (
            <SaveDraftButton
              key="save-draft"
              checklist={checklist}
              docs={docs}
              rmGeneralComment={rmGeneralComment}
              supportingDocs={supportingDocs}
              isActionAllowed={isActionAllowed}
            />
          )}
          {!readOnly && (
            <Upload
              key="upload-support"
              showUploadList={false}
              beforeUpload={(file) => {
                handleUploadSupportingDoc(file);
                return false;
              }}
              disabled={!isActionAllowed || uploadingSupportingDoc}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            >
              <Button
                icon={<UploadOutlined />}
                loading={uploadingSupportingDoc}
                style={{
                  color: "white !important",
                  backgroundColor:
                    !isActionAllowed || uploadingSupportingDoc
                      ? "#CCCCCC !important"
                      : "#164679 !important",
                  borderColor:
                    !isActionAllowed || uploadingSupportingDoc
                      ? "#CCCCCC !important"
                      : "#164679 !important",
                  borderRadius: "6px",
                }}
              >
                Upload Supporting Doc
              </Button>
            </Upload>
          )}
          <Button
            key="cancel"
            onClick={onClose}
            style={{
              color: "white !important",
              backgroundColor: "#164679 !important",
              borderColor: "#164679 !important",
              borderRadius: "6px",
            }}
          >
            Close
          </Button>
          {!readOnly && (
            <Button
              key="submit"
              type="primary"
              loading={isLoading}
              onClick={submitRM}
              disabled={!isActionAllowed}
              style={{
                color: "white !important",
                backgroundColor: !isActionAllowed
                  ? "#CCCCCC !important"
                  : "#164679 !important",
                borderColor: !isActionAllowed
                  ? "#CCCCCC !important"
                  : "#164679 !important",
                borderRadius: "6px",
                fontWeight: 600,
              }}
            >
              Submit to CO
            </Button>
          )}
        </Space>
      }
    >
      {console.log(
        "🔍 RM Modal - Rendering DocumentSidebar with docs:",
        docs.length,
        docs,
      )}
      <DocumentSidebar
        documents={docs}
        supportingDocs={supportingDocs}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
      />

      {checklist && (
        <>
          <ChecklistInfoCard checklist={checklist} />

          <ProgressSummary documentStats={documentStats} />

          <h3 style={{ color: PRIMARY_BLUE, fontWeight: "bold" }}>
            Required Documents
          </h3>

          <div>
            <DocumentTable
              docs={docs}
              setDocs={setDocs}
              checklist={checklist}
              isActionAllowed={isActionAllowed}
              handleFileUpload={handleFileUpload}
              uploadingDocs={uploadingDocs}
              getFullUrl={getFullUrl}
              readOnly={!isActionAllowed}
              checklistStatus={checklist?.status}
            />
          </div>

          <CommentSection
            checklist={checklist}
            rmGeneralComment={rmGeneralComment}
            setRmGeneralComment={setRmGeneralComment}
            isActionAllowed={isActionAllowed}
            comments={comments}
            commentsLoading={commentsLoading}
          />
        </>
      )}
    </Modal>
  );
};

export default RmReviewChecklistModal;
