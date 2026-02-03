// import React, { useState, useEffect } from "react";
// import { Modal, Button, Tag, Input } from "antd";
// import { FilePdfOutlined, LeftOutlined } from "@ant-design/icons";
// import ActionButtons from "./ActionButtons";
// import DocumentSidebar from "./DocumentSidebar";
// import ChecklistHeader from "./ChecklistHeader";
// import SupportingDocsSection from "./SupportingDocsSection";
// import { useDocumentHandlers } from "../../../hooks/useDocumentHandlers";
// // import { useDocumentStats } from "../../../hooks/useDocumentStats";
// import { useChecklistOperations } from "../../../hooks/useChecklistOperations";
// import { PRIMARY_BLUE } from "../../../utils/constants";
// import CommentHistory from "../../common/CommentHistory";
// import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
// // import { API_BASE_URL } from "../../../utils/checklistUtils";
// // import { customStyles } from "../../../styles/theme";
// import { RightOutlined } from "@ant-design/icons";
// // import { LeftOutlined } from "@ant-design/icons";
// import ProgressStats from "./ProgressStats";
// import DocumentTable from "./DocumentTable";
// import { customStyles } from "../../styles/Theme";
// import { useDocumentStats } from "../../../hooks/useDocumentStats";

// const ReviewChecklistModal = ({ checklist, open, onClose, readOnly = false }) => {
//   // State
//   const [docs, setDocs] = useState([]);
//   const [supportingDocs, _] = useState([]);
//   const [creatorComment, setCreatorComment] = useState("");
//   const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);

//   // Hooks
//   const documentStats = useDocumentStats(docs);

//   const { data: comments, isLoading: commentsLoading } =
//     useGetChecklistCommentsQuery(checklist?._id, { skip: !checklist?._id });

//   const isActionDisabled = readOnly || !["pending", "co_creator_review"].includes(
//     checklist?.status?.toLowerCase(),
//   );

//   const {
//     handleActionChange,
//     handleCommentChange,
//     handleDeferralNoChange,
//     handleDelete,
//     handleExpiryDateChange,
//     handleDeleteSupportingDoc,
//   } = useDocumentHandlers(docs, setDocs, isActionDisabled);

//   const {
//     isSubmittingToRM,
//     isCheckerSubmitting,
//     isSavingDraft,
//     uploadSupportingDoc,
//     submitToRM,
//     submitToCheckers,
//     saveDraft,
//   } = useChecklistOperations(checklist, docs, supportingDocs, creatorComment);

//   //   const isActionDisabled = readOnly || !["pending", "co_creator_review"].includes(
//   //     checklist?.status?.toLowerCase(),
//   //   );

//   useEffect(() => {
//     if (!checklist || !checklist.documents) return;

//     const flatDocs = checklist.documents.reduce((acc, item) => {
//       if (item.docList && Array.isArray(item.docList) && item.docList.length) {
//         const nestedDocs = item.docList.map((doc) => ({
//           ...doc,
//           category: item.category,
//           checkerStatus: doc.checkerStatus || item.checkerStatus,
//         }));
//         return acc.concat(nestedDocs);
//       }
//       if (item.category) return acc.concat(item);
//       return acc;
//     }, []);

//     const preparedDocs = flatDocs.map((doc, idx) => ({
//       ...doc,
//       docIdx: idx,
//       status: doc.status || "pendingrm",
//       action: doc.status || "pendingrm",
//       comment: doc.comment || "",
//       fileUrl: doc.fileUrl || null,
//       expiryDate: doc.expiryDate || null,
//       finalCheckerStatus:
//         doc.checkerStatus || doc.finalCheckerStatus || "pending",
//     }));

//     setDocs(preparedDocs);
//   }, [checklist]);

//   return (
//     <>
//       <style>{customStyles}</style>
//       <Modal
//         title={`Review Checklist  ${checklist?.title || ""}`}
//         open={open}
//         onCancel={onClose}
//         width={1150}
//         styles={{ body: { padding: "0 24px 24px" } }}
//         footer={
//           <ActionButtons
//             readOnly={readOnly}
//             isActionDisabled={isActionDisabled}
//             isSubmittingToRM={isSubmittingToRM}
//             isCheckerSubmitting={isCheckerSubmitting}
//             isSavingDraft={isSavingDraft}
//             checklist={checklist}
//             docs={docs}
//             supportingDocs={supportingDocs}
//             creatorComment={creatorComment}
//             onSaveDraft={saveDraft}
//             onSubmitToRM={submitToRM}
//             onSubmitToCheckers={submitToCheckers}
//             onUploadSupportingDoc={uploadSupportingDoc}
//             onClose={onClose}
//             comments={comments}
//           />
//         }
//       >
//         {/* Document Sidebar Toggle */}
//         <div className="doc-sidebar-toggle">
//           <Button
//             icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
//             onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
//           >
//             View Documents
//             {docs.filter((d) => d.fileUrl).length + supportingDocs.length > 0 && (
//               <Tag color="green" style={{ marginLeft: 6 }}>
//                 {docs.filter((d) => d.fileUrl).length + supportingDocs.length}
//               </Tag>
//             )}
//           </Button>
//         </div>

//         {/* Document Sidebar */}
//         <DocumentSidebar
//           documents={docs}
//           supportingDocs={supportingDocs}
//           open={showDocumentSidebar}
//           onClose={() => setShowDocumentSidebar(false)}
//         />

//         {checklist && (
//           <>
//             {/* Checklist Header */}
//             <ChecklistHeader checklist={checklist} />

//             {/* Progress Stats */}
//             <ProgressStats docs={docs} />

//             {/* Document Table */}
//             <DocumentTable
//               docs={docs}
//               onActionChange={handleActionChange}
//               onCommentChange={handleCommentChange}
//               onDeferralNoChange={handleDeferralNoChange}
//               onDelete={handleDelete}
//               onExpiryDateChange={handleExpiryDateChange}
//               //   onViewFile={handleViewFile} // ✅ Make sure this is passed
//               isActionDisabled={isActionDisabled}
//             />

//             {/* Supporting Documents */}
//             <SupportingDocsSection
//               supportingDocs={supportingDocs}
//               readOnly={readOnly}
//               isActionDisabled={isActionDisabled}
//               onDeleteSupportingDoc={handleDeleteSupportingDoc}
//             />

//             {/* Creator Comment */}
//             <div style={{ marginTop: 24 }}>
//               <h4 style={{ color: PRIMARY_BLUE, fontWeight: 700, marginBottom: 8 }}>
//                 Creator Comment
//               </h4>
//               <Input.TextArea
//                 rows={2}
//                 value={creatorComment}
//                 onChange={(e) => setCreatorComment(e.target.value)}
//                 disabled={isActionDisabled}
//                 placeholder="Add a comment for RM / Co-Checker"
//                 style={{ borderRadius: 8 }}
//               />
//             </div>

//             {/* Comment History */}
//             <div style={{ marginTop: 24 }}>
//               <h4 style={{ color: PRIMARY_BLUE, fontWeight: 700, marginBottom: 12 }}>
//                 Comment Trail & History
//               </h4>
//               <CommentHistory comments={comments} isLoading={commentsLoading} />
//             </div>
//           </>
//         )}
//       </Modal>
//     </>
//   );
// };

// export default ReviewChecklistModal;
import React, { useState, useEffect } from "react";
import { Modal, Button, Tag, Input } from "antd";
import { FilePdfOutlined, LeftOutlined } from "@ant-design/icons";
import ActionButtons from "./ActionButtons";
import DocumentSidebar from "./DocumentSidebar";
import ChecklistHeader from "./ChecklistHeader";
import SupportingDocsSection from "./SupportingDocsSection";
import { useDocumentHandlers } from "../../../hooks/useDocumentHandlers";
// import { useDocumentStats } from "../../../hooks/useDocumentStats";
import { useChecklistOperations } from "../../../hooks/useChecklistOperations";
import { PRIMARY_BLUE } from "../../../utils/constants";
import CommentHistory from "../../common/CommentHistory";
import { useGetChecklistCommentsQuery } from "../../../api/checklistApi";
// import { API_BASE_URL } from "../../../utils/checklistUtils";
// import { customStyles } from "../../../styles/theme";
import { RightOutlined } from "@ant-design/icons";
// import { LeftOutlined } from "@ant-design/icons";
import ProgressStats from "./ProgressStats";
import DocumentTable from "./DocumentTable";
import { customStyles } from "../../styles/Theme";
import { useDocumentStats } from "../../../hooks/useDocumentStats";

const ReviewChecklistModal = ({
  checklist,
  open,
  onClose,
  readOnly = false,
}) => {
  // State
  const [docs, setDocs] = useState([]);
  const [supportingDocs, setSupportingDocs] = useState([]);
  const [creatorComment, setCreatorComment] = useState("");
  const [showDocumentSidebar, setShowDocumentSidebar] = useState(false);

  // Hooks
  const documentStats = useDocumentStats(docs);

  const { data: comments, isLoading: commentsLoading } =
    useGetChecklistCommentsQuery(checklist?._id, { skip: !checklist?._id });

  const isActionDisabled =
    readOnly ||
    !["pending", "co_creator_review"].includes(
      checklist?.status?.toLowerCase(),
    );

  const {
    handleActionChange,
    handleCommentChange,
    handleDeferralNoChange,
    handleDelete,
    handleExpiryDateChange,
    handleDeleteSupportingDoc,
  } = useDocumentHandlers(docs, setDocs, isActionDisabled);

  const {
    isSubmittingToRM,
    isCheckerSubmitting,
    isSavingDraft,
    uploadSupportingDoc,
    submitToRM,
    submitToCheckers,
    saveDraft,
  } = useChecklistOperations(checklist, docs, supportingDocs, creatorComment);

  //   const isActionDisabled = readOnly || !["pending", "co_creator_review"].includes(
  //     checklist?.status?.toLowerCase(),
  //   );

  useEffect(() => {
    if (!checklist || !checklist.documents) return;

    const flatDocs = checklist.documents.reduce((acc, item) => {
      if (item.docList && Array.isArray(item.docList) && item.docList.length) {
        const nestedDocs = item.docList.map((doc) => ({
          ...doc,
          category: item.category,
          checkerStatus: doc.checkerStatus || item.checkerStatus,
        }));
        return acc.concat(nestedDocs);
      }
      if (item.category) return acc.concat(item);
      return acc;
    }, []);

    const preparedDocs = flatDocs.map((doc, idx) => ({
      ...doc,
      docIdx: idx,
      status: doc.status || "pendingrm",
      action: doc.status || "pendingrm",
      comment: doc.comment || "",
      fileUrl: doc.fileUrl || null,
      expiryDate: doc.expiryDate || null,
      finalCheckerStatus:
        doc.checkerStatus || doc.finalCheckerStatus || "pending",
    }));

    setDocs(preparedDocs);
  }, [checklist]);

  // Update supporting docs whenever checklist changes
  useEffect(() => {
    if (checklist?.supportingDocs) {
      setSupportingDocs(checklist.supportingDocs);
    }
  }, [checklist?.supportingDocs]);

  return (
    <>
      <style>{customStyles}</style>
      <Modal
        title={`Review Checklist  ${checklist?.title || ""}`}
        open={open}
        onCancel={onClose}
        width={1150}
        styles={{ body: { padding: "0 24px 24px" } }}
        footer={
          <ActionButtons
            readOnly={readOnly}
            isActionDisabled={isActionDisabled}
            isSubmittingToRM={isSubmittingToRM}
            isCheckerSubmitting={isCheckerSubmitting}
            isSavingDraft={isSavingDraft}
            checklist={checklist}
            docs={docs}
            supportingDocs={supportingDocs}
            creatorComment={creatorComment}
            onSaveDraft={saveDraft}
            onSubmitToRM={submitToRM}
            onSubmitToCheckers={submitToCheckers}
            onUploadSupportingDoc={uploadSupportingDoc}
            onClose={onClose}
            comments={comments}
          />
        }
      >
        {/* Document Sidebar Toggle */}
        <div className="doc-sidebar-toggle">
          <Button
            icon={showDocumentSidebar ? <LeftOutlined /> : <RightOutlined />}
            onClick={() => setShowDocumentSidebar(!showDocumentSidebar)}
          >
            View Documents
            {docs.filter((d) => d.fileUrl).length + supportingDocs.length >
              0 && (
              <Tag color="green" style={{ marginLeft: 6 }}>
                {docs.filter((d) => d.fileUrl).length + supportingDocs.length}
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
        />

        {checklist && (
          <>
            {/* Checklist Header */}
            <ChecklistHeader checklist={checklist} />

            {/* Progress Stats */}
            <ProgressStats docs={docs} />

            {/* Document Table */}
            <DocumentTable
              docs={docs}
              onActionChange={handleActionChange}
              onCommentChange={handleCommentChange}
              onDeferralNoChange={handleDeferralNoChange}
              onDelete={handleDelete}
              onExpiryDateChange={handleExpiryDateChange}
              //   onViewFile={handleViewFile} // ✅ Make sure this is passed
              isActionDisabled={isActionDisabled}
            />

            {/* Supporting Documents - Hidden as they now appear in View Documents sidebar */}
            {/* <SupportingDocsSection
              supportingDocs={supportingDocs}
              readOnly={readOnly}
              isActionDisabled={isActionDisabled}
              onDeleteSupportingDoc={handleDeleteSupportingDoc}
            /> */}

            {/* Creator Comment */}
            <div style={{ marginTop: 24 }}>
              <h4
                style={{
                  color: PRIMARY_BLUE,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Creator Comment
              </h4>
              <Input.TextArea
                rows={2}
                value={creatorComment}
                onChange={(e) => setCreatorComment(e.target.value)}
                disabled={isActionDisabled}
                placeholder="Add a comment for RM / Co-Checker"
                style={{ borderRadius: 8 }}
              />
            </div>

            {/* Comment History */}
            <div style={{ marginTop: 24 }}>
              <h4
                style={{
                  color: PRIMARY_BLUE,
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                Comment Trail & History
              </h4>
              <CommentHistory comments={comments} isLoading={commentsLoading} />
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

export default ReviewChecklistModal;
