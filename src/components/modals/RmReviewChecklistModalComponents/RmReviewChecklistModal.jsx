// import React, { useState, useEffect, useMemo } from "react";
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
// }) => {
//   const [docs, setDocs] = useState([]);
//   const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
//   const [rmGeneralComment, setRmGeneralComment] = useState("");
//   const [supportingDocs, setSupportingDocs] = useState([]);
//   const [uploadingSupportingDoc, setUploadingSupportingDoc] = useState(false);
//   const [uploadingDocs, setUploadingDocs] = useState({});

//   const [submitRmChecklistToCoCreator, { isLoading }] =
//     useRmSubmitChecklistToCoCreatorMutation();

//   // Add this query for comments
//   const { data: comments, isLoading: commentsLoading } =
//     useGetChecklistCommentsQuery(checklist?._id, { skip: !checklist?._id });

//   useEffect(() => {
//     if (!checklist || !checklist.documents) return;

//     const flattenedDocs = checklist.documents.reduce((acc, categoryObj) => {
//       const filteredDocs = categoryObj.docList
//         .filter((doc) => doc.name?.trim() !== "")
//         .map((doc) => ({
//           ...doc,
//           category: categoryObj.category,
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

//   const getInitialRmStatus = (doc) => {
//     if (doc.rmStatus !== undefined && doc.rmStatus !== null) {
//       return doc.rmStatus;
//     }
//     return doc.status || "pendingrm";
//   };

//   const isActionAllowed = !readOnly && checklist?.status === "rm_review";

//   const documentStats = useMemo(() => {
//     return calculateDocumentStats(docs);
//   }, [docs]);

//   const handleUploadSupportingDoc = async (file) => {
//     try {
//       setUploadingSupportingDoc(true);

//       const docId = `support_${Date.now()}`;
//       const result = await uploadFileToBackend(
//         file,
//         checklist._id,
//         docId,
//         file.name,
//         "Supporting"
//       );

//       if (result) {
//         const newSupportingDoc = {
//           id: result._id || docId,
//           name: file.name,
//           fileUrl: `${API_BASE_URL}${result.fileUrl}`,
//           uploadData: result,
//           uploadedAt: new Date().toISOString(),
//         };

//         setSupportingDocs((prev) => [...prev, newSupportingDoc]);
//         message.success(`"${file.name}" uploaded successfully!`);
//       }
//     } catch (error) {
//       // Error is handled in uploadUtils but we can catch extra here if needed
//       console.error("Supporting doc upload failed", error);
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
//       );

//       setDocs((prev) =>
//         prev.map((d, idx) =>
//           idx === docIdx
//             ? {
//               ...d,
//               uploadData: uploadResult,
//               fileUrl: `${API_BASE_URL}${uploadResult.fileUrl}`,
//               isUploading: false,
//             }
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
//       if (!checklist?._id) throw new Error("Checklist ID missing");

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
//         checklistId: checklist._id,
//         documents: docs.map((doc) => ({
//           _id: doc._id,
//           name: doc.name,
//           category: doc.category,
//           status: doc.status,
//           action: doc.action,
//           comment: doc.comment,
//           fileUrl: doc.uploadData?.fileUrl || null,
//           uploadData: doc.uploadData || null,
//           deferralReason: doc.deferralReason,
//           rmStatus: doc.rmStatus,
//           deferralNumber: doc.deferralNumber,
//           deferralNo: doc.deferralNumber || doc.deferralNo,
//         })),
//         rmGeneralComment,
//         supportingDocs,
//       };

//       await submitRmChecklistToCoCreator(payload).unwrap();
//       if (refetch) refetch();

//       message.success("Checklist submitted to CO-Checker!");
//       onClose();
//     } catch (err) {
//       console.error(err);
//       message.error(err?.data?.error || "Failed to submit checklist");
//     }
//   };

//   const API_BASE_URL =
//     import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

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
//           }}
//         >
//           Review Checklist — {checklist?.customerNumber || ""}
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
//           checklist={{ ...checklist, dclNo: checklist?.dclNo || checklist?._id }}
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
//             readOnly={readOnly}
//           />

//           <CommentSection
//             checklist={checklist}
//             rmGeneralComment={rmGeneralComment}
//             setRmGeneralComment={setRmGeneralComment}
//             isActionAllowed={isActionAllowed}
//           />

//           {/* Add Comment History Section - Place this before or after CommentSection based on your preference */}
//           <div style={{ marginTop: 24, marginBottom: 24 }}>
//             <h4
//               style={{ color: PRIMARY_BLUE, fontWeight: 700, marginBottom: 12 }}
//             >
//               Comment Trail & History
//             </h4>
//             <CommentHistory comments={comments} isLoading={commentsLoading} />
//           </div>

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
import { Modal, Button, message, Upload, Space, Tag } from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  RightOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import DocumentSidebar from "./DocumentSidebar";
import ChecklistInfoCard from "./ChecklistInfoCard";
import SupportingDocsSection from "./SupportingDocsSection";
import CommentSection from "./CommentSection";
import ProgressSummary from "./ProgressSummary";
import SaveDraftButton from "./SaveDraftButton";
import PDFGenerator from "./PDFGenerator";
import DocumentTable from "./DocumentTable";
import { PRIMARY_BLUE } from "../../../utils/colors";
import { calculateDocumentStats } from "../../../utils/documentStats";
import { useRmSubmitChecklistToCoCreatorMutation } from "../../../api/checklistApi";
import { uploadFileToBackend } from "../../../utils/uploadUtils";
import CommentHistory from "../../common/CommentHistory"; // Add this import
import { useGetChecklistCommentsQuery } from "../../../api/checklistApi"; // Add this import

const RmReviewChecklistModal = ({
  checklist,
  open,
  onClose,
  refetch,
  readOnly = false,
}) => {
  const [docs, setDocs] = useState([]);
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);
  const [rmGeneralComment, setRmGeneralComment] = useState("");
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [uploadingSupportingDoc, setUploadingSupportingDoc] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState({});

  const [submitRmChecklistToCoCreator, { isLoading }] =
    useRmSubmitChecklistToCoCreatorMutation();

  // Add this query for comments
  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?._id, { skip: !checklist?._id });

  useEffect(() => {
    if (!checklist || !checklist.documents) return;

    const flattenedDocs = checklist.documents.reduce((acc, categoryObj) => {
      const filteredDocs = categoryObj.docList
        .filter((doc) => doc.name?.trim() !== "")
        .map((doc) => ({
          ...doc,
          category: categoryObj.category,
        }));
      return acc.concat(filteredDocs);
    }, []);

    const preparedDocs = flattenedDocs.map((doc, idx) => ({
      ...doc,
      docIdx: idx,
      status: doc.status || "pendingrm",
      comment: doc.comment || "",
      action: doc.status || "pendingrm",
      fileUrl: doc.fileUrl || null,
      deferralReason: doc.deferralReason || "",
      deferralNumber: doc.deferralNumber || doc.deferralNo || "",
      deferralNo: doc.deferralNo || doc.deferralNumber || "",
      rmStatus: getInitialRmStatus(doc),
      rmTouched: doc.rmStatus != null,
      uploadData: doc.uploadData || null,
    }));

    setDocs(preparedDocs);

    // Initialize supporting docs if they exist
    if (checklist.supportingDocs && Array.isArray(checklist.supportingDocs)) {
      setSupportingDocs(checklist.supportingDocs);
    } else {
      setSupportingDocs([]);
    }
  }, [checklist]);

  const API_BASE_URL =
    import.meta.env?.VITE_APP_API_URL || "http://localhost:5000";

  const getInitialRmStatus = (doc) => {
    if (doc.rmStatus !== undefined && doc.rmStatus !== null) {
      return doc.rmStatus;
    }
    return doc.status || "pendingrm";
  };

  const isActionAllowed = !readOnly && checklist?.status === "rm_review";

  const documentStats = useMemo(() => {
    return calculateDocumentStats(docs);
  }, [docs]);

  const handleUploadSupportingDoc = async (file) => {
    try {
      setUploadingSupportingDoc(true);

      const formData = new FormData();
      formData.append("files", file);

      const token =
        localStorage.getItem("authToken") ||
        JSON.parse(localStorage.getItem("user") || "{}")?.token;

      const response = await fetch(
        `${API_BASE_URL}/api/checklist/${checklist._id}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const result = await response.json();

      // Update supportingDocs from the response
      if (result.checklist?.supportingDocs) {
        setSupportingDocs(result.checklist.supportingDocs);
      }

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
      });

      const result = await response.json();

      if (result.success) {
        setSupportingDocs((prev) => prev.filter((doc) => doc.id !== docId));
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
      if (!checklist?._id) throw new Error("Checklist ID missing");

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
        checklistId: checklist._id,
        documents: docs.map((doc) => ({
          _id: doc._id,
          name: doc.name,
          category: doc.category,
          status: doc.status,
          action: doc.action,
          comment: doc.comment,
          fileUrl: doc.uploadData?.fileUrl || null,
          uploadData: doc.uploadData || null,
          deferralReason: doc.deferralReason,
          rmStatus: doc.rmStatus,
          deferralNumber: doc.deferralNumber,
          deferralNo: doc.deferralNumber || doc.deferralNo,
        })),
        rmGeneralComment,
        supportingDocs,
      };

      await submitRmChecklistToCoCreator(payload).unwrap();
      if (refetch) refetch();

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
      {/* View Documents Button */}
      <div style={{ position: "absolute", top: 16, right: 90, zIndex: 10 }}>
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

      {/* Document Sidebar */}
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
            readOnly={readOnly}
          />

          <CommentSection
            checklist={checklist}
            rmGeneralComment={rmGeneralComment}
            setRmGeneralComment={setRmGeneralComment}
            isActionAllowed={isActionAllowed}
          />

          {/* Add Comment History Section - Place this before or after CommentSection based on your preference */}
          <div style={{ marginTop: 24, marginBottom: 24 }}>
            <h4
              style={{ color: PRIMARY_BLUE, fontWeight: 700, marginBottom: 12 }}
            >
              Comment Trail & History
            </h4>
            <CommentHistory comments={comments} isLoading={commentsLoading} />
          </div>

          {/* Supporting Documents - RM can upload and delete */}
          <SupportingDocsSection
            supportingDocs={supportingDocs}
            handleDeleteSupportingDoc={handleDeleteSupportingDoc}
            getFullUrl={getFullUrl}
            isActionAllowed={isActionAllowed}
            readOnly={readOnly}
          />
        </>
      )}
    </Modal>
  );
};

export default RmReviewChecklistModal;
