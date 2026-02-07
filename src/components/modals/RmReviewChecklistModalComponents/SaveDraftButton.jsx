import React from "react";
import { Button } from "antd";
// import { useSaveChecklistDraftMutation } from "../../api/checklistApi";
import { message } from "antd";
// import { PRIMARY_BLUE, ACCENT_LIME } from "../constants/colors";
import { useSaveChecklistDraftMutation } from "../../../api/checklistApi";
import { ACCENT_LIME, PRIMARY_BLUE } from "../../../utils/colors";

const SaveDraftButton = ({
  checklist,
  docs,
  rmGeneralComment,
  supportingDocs,
  isActionAllowed,
}) => {
  const [saveDraft, { isLoading: isSavingDraft }] =
    useSaveChecklistDraftMutation();

  const handleSaveDraft = async () => {
    try {
      message.loading({ content: "Saving draft...", key: "saveDraft" });
      await saveDraft({
        checklistId: checklist.id || checklist._id,
        draftData: {
          documents: docs.map((doc) => ({
            _id: doc._id,
            name: doc.name,
            category: doc.category,
            status: doc.status,
            action: doc.action,
            rmStatus: doc.rmStatus,
            comment: doc.comment,
            fileUrl: doc.fileUrl,
            expiryDate: doc.expiryDate,
            deferralNo: doc.deferralNo || doc.deferralNumber,
          })),
          creatorComment: rmGeneralComment,
          supportingDocs: supportingDocs,
        },
      }).unwrap();
      message.success({
        content: "Draft saved successfully!",
        key: "saveDraft",
        duration: 3,
      });
    } catch (error) {
      console.error("Save draft error:", error);
      message.error({ content: "Failed to save draft", key: "saveDraft" });
    }
  };

  return (
    <Button
      key="save-draft"
      onClick={handleSaveDraft}
      loading={isSavingDraft}
      disabled={!isActionAllowed}
      style={{
        borderColor: ACCENT_LIME,
        color: PRIMARY_BLUE,
        borderRadius: "6px",
        fontWeight: 600,
        marginRight: "auto",
      }}
    >
      Save Draft
    </Button>
  );
};

export default SaveDraftButton;
