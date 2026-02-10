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

      const payload = {
        dclNo: checklist.dclNo,
        status: "co_checker_review",
        documents: docs.map((doc) => ({
          _id: doc._id,
          name: doc.name,
          category: doc.category,
          status: doc.action || doc.status,
          comment: doc.comment || "",
          fileUrl: doc.fileUrl || null,
          expiryDate: doc.expiryDate || null,
          deferralNo: doc.deferralNo || null,
        })),
        supportingDocs,
      };

      const result = await updateChecklistStatus(payload).unwrap();

      message.success({
        content: "Checklist submitted to Co-Checker!",
        key: "checkerSubmit",
        duration: 3,
      });

      // Trigger parent callback with updated checklist data from server
      if (onChecklistUpdate) {
        onChecklistUpdate(
          result?.checklist || {
            id: checklist.id || checklist._id,
            status: "CoCheckerReview",
            message: "Checklist submitted to Co-Checker",
          },
        );
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

      const userName =
        currentUser?.name || currentUser?.username || "Current User";
      const userId = currentUser?._id || currentUser?.id;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("checklistId", checklistId);
      formData.append("documentId", `support_${Date.now()}`);
      formData.append("documentName", file.name);
      formData.append("category", "Supporting Documents");
      formData.append("uploadedBy", userName);
      formData.append("uploadedById", userId);

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

      if (!result.success) {
        throw new Error(result.message || "Upload failed");
      }

      const newSupportingDoc = {
        id: result.data._id || Date.now().toString(),
        name: file.name,
        fileUrl: result.data.fileUrl.startsWith("http")
          ? result.data.fileUrl
          : `${API_BASE_URL}${result.data.fileUrl}`,
        uploadData: {
          ...result.data,
          uploadedBy: result.data.uploadedBy || userName,
          uploadedById: result.data.uploadedById || userId,
          uploadedAt: result.data.createdAt || new Date().toISOString(),
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          status: "supporting",
        },
        uploadedAt: new Date().toISOString(),
        category: "Supporting Documents",
        isSupporting: true,
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
