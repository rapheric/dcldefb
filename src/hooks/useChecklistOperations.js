import { useState } from "react";
import { useSelector } from "react-redux";
import { message } from "antd";
import {
  useSubmitChecklistToRMMutation,
  useUpdateChecklistStatusMutation,
  useSaveChecklistDraftMutation,
} from "../../src/api/checklistApi";
import { API_BASE_URL } from "../utils/constants";

export const useChecklistOperations = (
  checklist,
  docs,
  supportingDocs,
  creatorComment,
  currentUser,
  onChecklistUpdate = null, // Callback to update parent component with fresh checklist data
  onRefetchNeeded = null, // Callback to trigger parent refetch after submission
) => {
  const auth = useSelector((state) => state.auth);
  const token = auth?.token || localStorage.getItem("token");
  const [submitRmChecklist, { isLoading: isSubmittingToRM }] =
    useSubmitChecklistToRMMutation();
  const [updateChecklistStatus, { isLoading: isCheckerSubmitting }] =
    useUpdateChecklistStatusMutation();
  const [saveDraft, { isLoading: isSavingDraft }] =
    useSaveChecklistDraftMutation();
  const [uploadingSupportingDoc, setUploadingSupportingDoc] = useState(false);

  const submitToRM = async () => {
    try {
      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      // Build document structure matching backend DocumentCategoryDto
      const nestedDocuments = docs.reduce((acc, doc) => {
        let categoryGroup = acc.find((c) => c.category === doc.category);
        if (!categoryGroup) {
          categoryGroup = { category: doc.category, docList: [] };
          acc.push(categoryGroup);
        }
        categoryGroup.docList.push({
          id: doc._id || doc.id,
          _id: doc._id || doc.id,
          name: doc.name,
          status: doc.status || doc.action, // Use action as fallback
          creatorStatus: doc.creatorStatus, // PRESERVE creator status
          checkerStatus: doc.checkerStatus, // PRESERVE checker status
          comment: doc.comment,
          fileUrl: doc.fileUrl,
          deferralNumber: doc.deferralNo,
          deferralReason: doc.deferralReason,
        });

        return acc;
      }, []);

      // Send document updates to backend BEFORE submitting to RM
      const payload = {
        documents: nestedDocuments,
      };

      const result = await submitRmChecklist({
        id: checklistId,
        body: payload,
      }).unwrap();

      message.success("Checklist submitted to RM successfully!");

      // Trigger parent callback with updated checklist data from server
      if (onChecklistUpdate) {
        onChecklistUpdate(
          result?.checklist || {
            id: checklistId,
            status: "RMReview",
            message: "Checklist submitted to RM",
          },
        );
      }

      // ✅ NEW: Trigger refetch to ensure frontend has latest data from backend
      if (onRefetchNeeded) {
        console.log("🔄 Triggering refetch after successful RM submission");
        onRefetchNeeded();
      }

      return result;
    } catch (err) {
      console.error("Submit to RM error:", err);
      message.error(
        err?.data?.error || err?.message || "Failed to submit checklist to RM",
      );
      throw err;
    }
  };

  const submitToCheckers = async () => {
    if (!checklist?.dclNo) {
      throw new Error("DCL No missing.");
    }

    try {
      message.loading({
        content: "Submitting checklist to Co-Checker...",
        key: "checkerSubmit",
      });

      // ✅ CRITICAL FIX: Send documents as a FLAT list matching CoCreatorDocumentDto
      // NOT as nested categories with docList!
      // Backend expects: { id, category, name, status, creatorStatus, ... }
      // NOT: { category, docList: [...] }
      const flatDocuments = [];
      docs.forEach((doc) => {
        flatDocuments.push({
          id: doc._id || doc.id,
          _id: doc._id || doc.id,
          category: doc.category,
          name: doc.name,
          status: doc.action || doc.status,
          creatorStatus: doc.creatorStatus, // PRESERVE creator status
          checkerStatus: doc.checkerStatus, // PRESERVE checker status
          comment: doc.comment || "",
          fileUrl: doc.fileUrl || null,
          expiryDate: doc.expiryDate || null,
          deferralNo: doc.deferralNo || null,
          deferralReason: doc.deferralReason || null,
        });
      });

      const payload = {
        dclNo: checklist.dclNo,
        status: "co_checker_review",
        documents: flatDocuments, // FLAT list, not nested!
        supportingDocs,
      };

      console.log("📤 BEFORE SUBMISSION:");
      console.log("   Payload:", JSON.stringify(payload, null, 2));
      console.log("   Documents count:", docs.length);
      console.log("   Flat documents count:", flatDocuments.length);

      const result = await updateChecklistStatus(payload).unwrap();

      console.log("📥 AFTER SUBMISSION RESPONSE:");
      console.log("   Response:", JSON.stringify(result, null, 2));
      console.log("   Returned documents:", result?.checklist?.documents?.length);
      
      if (result?.checklist?.documents) {
        result.checklist.documents.forEach((cat) => {
          console.log(`   Category: ${cat.category}, Docs: ${cat.docList?.length}`);
        });
      }

      message.success({
        content: "Checklist submitted to Co-Checker!",
        key: "checkerSubmit",
        duration: 3,
      });

      // Trigger parent callback with updated checklist data from server
      if (onChecklistUpdate) {
        const updatedChecklistData = result?.checklist ||  {
          id: checklist.id || checklist._id,
          dclNo: checklist.dclNo,
          status: "CoCheckerReview",
          documents: flatDocuments,
          message: "Checklist submitted to Co-Checker",
        };
        
        console.log("🔄 Calling onChecklistUpdate with:", updatedChecklistData);
        onChecklistUpdate(updatedChecklistData);
      }

      // ✅ NEW: Trigger refetch to ensure frontend has latest data from backend
      if (onRefetchNeeded) {
        console.log("🔄 Triggering refetch after successful submission");
        onRefetchNeeded();
      }

      return result;
    } catch (err) {
      console.error("Submit Error Details:", err);
      message.error({
        content:
          err?.data?.message ||
          err?.data?.error ||
          err?.message ||
          "Failed to submit checklist.",
        key: "checkerSubmit",
      });
      throw err;
    }
  };

  const saveDraftHandler = async () => {
    try {
      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      message.loading({
        content: "Saving draft...",
        key: "saveDraft",
      });

      const payload = {
        checklistId: checklistId,
        draftData: {
          documents: docs.map((doc) => ({
            _id: doc._id || doc.id,
            name: doc.name,
            category: doc.category,
            status: doc.status || doc.action,
            action: doc.action,
            comment: doc.comment,
            fileUrl: doc.fileUrl,
            expiryDate: doc.expiryDate,
            deferralNo: doc.deferralNo,
          })),
          creatorComment,
          supportingDocs,
        },
      };

      await saveDraft(payload).unwrap();

      message.success({
        content: "Draft saved successfully!",
        key: "saveDraft",
        duration: 3,
      });
    } catch (error) {
      console.error("Save draft error:", error);
      message.error({
        content: error?.data?.message || "Failed to save draft",
        key: "saveDraft",
      });
      throw error;
    }
  };

  const uploadSupportingDoc = async (file) => {
    try {
      setUploadingSupportingDoc(true);

      const checklistId = checklist?.id || checklist?._id;
      if (!checklistId) {
        throw new Error("Checklist ID missing");
      }

      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch(
        `${API_BASE_URL}/api/cocreatorChecklist/${checklistId}/upload`,
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

      if (!result.supportingDocs || result.supportingDocs.length === 0) {
        throw new Error(result.message || "Upload failed");
      }

      const uploadedDoc = result.supportingDocs[0];
      const newSupportingDoc = {
        id: uploadedDoc.id,
        fileName: uploadedDoc.fileName,
        fileUrl: uploadedDoc.fileUrl,
        fileSize: uploadedDoc.fileSize,
        fileType: uploadedDoc.fileType,
        uploadedBy: uploadedDoc.uploadedBy,
        uploadedById: uploadedDoc.uploadedById,
        uploadedByRole: uploadedDoc.uploadedByRole,
        uploadedAt: uploadedDoc.uploadedAt,
      };

      return newSupportingDoc;
    } catch (error) {
      console.error("Upload error:", error);
      message.error(`Upload failed: ${error.message}`);
      throw error;
    } finally {
      setUploadingSupportingDoc(false);
    }
  };

  return {
    isSubmittingToRM,
    isCheckerSubmitting,
    isSavingDraft,
    uploadingSupportingDoc,
    submitToRM,
    submitToCheckers,
    saveDraft: saveDraftHandler,
    uploadSupportingDoc,
  };
};
