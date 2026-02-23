

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
import { Modal, Button, message, Upload, Tag } from "antd";
import {
  UploadOutlined,
  RightOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import DocumentSidebar from "./DocumentSidebar";
import ChecklistInfoCard from "./ChecklistInfoCard";
import ProgressSummary from "./ProgressSummary";
import DocumentTable from "./DocumentTable";
import CommentSection from "./CommentSection";
import SupportingDocsSection from "./SupportingDocsSection";
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
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [rmGeneralComment, setRmGeneralComment] = useState("");
  const [supportingDocs, setSupportingDocs] = useState([]);
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
    setLocalChecklist(updatedChecklist);
    if (onChecklistUpdate) {
      onChecklistUpdate(updatedChecklist);
    }
  };

  const getInitialRmStatus = (doc) => {
    if (doc.rmStatus !== undefined && doc.rmStatus !== null) {
      return doc.rmStatus;
    }
    return doc.status || "pendingrm";
  };

  useEffect(() => {
    if (!checklist || !checklist.documents) return;

    let docIdxCounter = 0;
    const flattenedDocs = checklist.documents.reduce((acc, categoryObj) => {
      const filteredDocs = (categoryObj.docList || [])
        .filter((doc) => doc.name?.trim() !== "")
        .map((doc) => ({
          ...doc,
          category: categoryObj.category || "Missing Category",
          rmStatus: getInitialRmStatus(doc),
          rmTouched: doc.rmStatus != null,
          uploadData: doc.uploadData || null,
          docIdx: docIdxCounter++
        }));
      return [...acc, ...filteredDocs];
    }, []);

    setDocs(flattenedDocs);
  }, [checklist]);

  // Fetch supporting docs from backend when modal opens or checklist changes
  useEffect(() => {
    const checklistId = checklist?.id || checklist?._id;
    
    if (!checklistId || !open) return;

    const fetchSupportingDocs = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/uploads/checklist/${checklistId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log("📄 Supporting docs API response:", result);
          if (result.data && Array.isArray(result.data) && result.data.length > 0) {
            // Transform to include role information and category for grouping
            const transformedDocs = result.data.map(doc => ({
              ...doc,
              id: doc.id || doc._id,
              category: 'Supporting Documents',
              isSupporting: true,
              uploadedByRole: doc.uploadedByRole || 'UNKNOWN'
            }));
            setSupportingDocs(transformedDocs);
            console.log("📄 Supporting docs fetched successfully (", transformedDocs.length, " docs)");
          } else {
            console.log("✓ API returned ok but no supporting docs for checklist", checklistId);
            setSupportingDocs([]);
          }
        } else {
          console.warn(`⚠️ API returned ${response.status} for checklist ${checklistId}:`, await response.text());
          // Don't clear existing docs on error - keep what we have
        }
      } catch (error) {
        console.error("❌ Error fetching supporting docs:", error.message);
        // Don't clear existing docs on error - supporting docs are optional
      }
    };

    // Always fetch from API
    fetchSupportingDocs();
  }, [checklist?.id, checklist?._id, open, token]);

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

  // 🔹 FILTER SUPPORTING DOCS BY UPLOADER ROLE
  const rmSupportingDocs = useMemo(() => {
    return (supportingDocs || []).filter(doc => {
      // Check multiple possible locations for the role
      const uploadedByRole =
        doc.uploadedByRole ||
        doc.uploadedBy?.role ||
        doc.uploadData?.uploadedByRole;
      return uploadedByRole?.toLowerCase() === 'rm';
    });
  }, [supportingDocs]);

  const creatorSupportingDocs = useMemo(() => {
    return (supportingDocs || []).filter(doc => {
      const uploadedByRole =
        doc.uploadedByRole ||
        doc.uploadedBy?.role ||
        doc.uploadData?.uploadedByRole;
      return !uploadedByRole || uploadedByRole?.toLowerCase() !== 'rm';
    });
  }, [supportingDocs]);

  const handleUploadSupportingDoc = async (file) => {
    try {
      setUploadingSupportingDoc(true);

      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      const formData = new FormData();
      formData.append("files", file);

      // Use RM-specific endpoint for supporting docs upload
      const response = await fetch(
        `${API_BASE_URL}/api/rmChecklist/${checklistId}/supporting-docs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();

      // Handle RM endpoint response format (returns 'files' array)
      const uploadedFiles = result.files || result.supportingDocs || [];
      if (uploadedFiles.length === 0) {
        throw new Error(result.message || "Upload failed");
      }

      const uploadedDoc = uploadedFiles[0];
      const newSupportingDoc = {
        id: uploadedDoc.id || uploadedDoc._id,
        _id: uploadedDoc.id || uploadedDoc._id,
        fileName: uploadedDoc.fileName,
        name: uploadedDoc.fileName,
        fileUrl: uploadedDoc.fileUrl,
        fileSize: uploadedDoc.fileSize,
        fileType: uploadedDoc.fileType,
        uploadedBy: uploadedDoc.uploadedBy || { name: 'RM User', role: 'rm' },
        uploadedById: uploadedDoc.uploadedById,
        uploadedByRole: 'rm', // Set by RM endpoint
        uploadedAt: uploadedDoc.uploadedAt,
      };

      setSupportingDocs((prev) => [...prev, newSupportingDoc]);
      message.success(`"${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error("Supporting doc upload failed", error);
      message.error(error.message || "Upload failed");
    } finally {
      setUploadingSupportingDoc(false);
    }
  };

  const handleDeleteSupportingDoc = async (docId, docName) => {
    const confirm = window.confirm(`Delete "${docName}"?`);
    if (!confirm) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/uploads/${docId}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      const result = await response.json();

      if (result.success) {
        setSupportingDocs((prev) => prev.filter((doc) => doc.id !== docId && doc._id !== docId));
        message.success("Document deleted!");
      } else {
        message.error(result.error || "Delete failed");
      }
    } catch (error) {
      message.error("Delete error: " + error.message);
    }
  };

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
        documents: docs.map((doc) => ({
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
        supportingDocs: supportingDocs.map((doc) => ({
          id: doc.id || doc._id,
          name: doc.fileName || doc.name,
          fileUrl: doc.fileUrl,
          uploadedByRole: doc.uploadedByRole,
        })),
        rmGeneralComment: rmGeneralComment || "",
      };

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
            backgroundColor: PRIMARY_BLUE,
            color: "white",
            padding: "18px 24px",
            margin: "-24px -24px 0 -24px",
            borderRadius: "8px 8px 0 0",
            fontWeight: 600,
            fontSize: "1.15rem",
            letterSpacing: "0.5px",
          }}
        >
          Review Checklist — {checklist?.customerNumber || ""}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1100}
      centered={true}
      style={{ marginLeft: '160px' }}
      modalRender={(node) => (
        <div style={{
          display: 'flex',
          justifyContent: 'center'
        }}>
          {node}
        </div>
      )}
      closeIcon={
        <span style={{ color: "white", fontSize: "24px", fontWeight: "bold" }}>
          ×
        </span>
      }
      footer={[
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
        />,
        !readOnly && (
          <SaveDraftButton
            key="save-draft"
            checklist={checklist}
            docs={docs}
            rmGeneralComment={rmGeneralComment}
            supportingDocs={supportingDocs}
            isActionAllowed={isActionAllowed}
          />
        ),
        !readOnly && (
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
              style={{ borderRadius: "6px" }}
            >
              Upload Supporting Doc
            </Button>
          </Upload>
        ),
        <Button key="cancel" onClick={onClose} style={{ borderRadius: "6px" }}>
          Close
        </Button>,
        !readOnly && (
          <Button
            key="submit"
            type="primary"
            loading={isLoading}
            onClick={submitRM}
            disabled={!isActionAllowed}
            style={{
              backgroundColor: PRIMARY_BLUE,
              borderRadius: "6px",
              fontWeight: 600,
            }}
          >
            Submit to CO
          </Button>
        ),
      ]}
    >
      <div style={{ position: "absolute", top: 16, right: 60, zIndex: 10 }}>
        <Button
          icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
          onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
        >
          View Documents
          {docs.filter((d) => d.fileUrl).length > 0 && (
            <Tag color="green" style={{ marginLeft: 6 }}>
              {docs.filter((d) => d.fileUrl).length}
            </Tag>
          )}
        </Button>
      </div>

      <DocumentSidebar
        documents={docs}
        supportingDocs={supportingDocs}
        open={showDocumentSidebar}
        onClose={() => setShowDocumentSidebar(false)}
        getFullUrl={getFullUrl}
      />

      {checklist && (
        <>
          <ChecklistInfoCard checklist={checklist} />

          <ProgressSummary documentStats={documentStats} />

          <h3 style={{ color: PRIMARY_BLUE, fontWeight: "bold" }}>
            Required Documents
          </h3>

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

          <CommentSection
            checklist={checklist}
            rmGeneralComment={rmGeneralComment}
            setRmGeneralComment={setRmGeneralComment}
            isActionAllowed={isActionAllowed}
            comments={comments}
            commentsLoading={commentsLoading}
          />

          {/* 🔹 UPDATED: Only show RM uploaded supporting docs */}
          <SupportingDocsSection
            supportingDocs={rmSupportingDocs}
            handleDeleteSupportingDoc={handleDeleteSupportingDoc}
            getFullUrl={getFullUrl}
            isActionAllowed={isActionAllowed}
            readOnly={readOnly}
            title="RM Uploaded Supporting Documents"
            showCreatorCount={creatorSupportingDocs.length > 0}
            creatorCount={creatorSupportingDocs.length}
          />
        </>
      )}
    </Modal>
  );
};

export default RmReviewChecklistModal;