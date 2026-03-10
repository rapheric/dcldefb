import React, { useState, useEffect } from "react";
import { Button, Space, message } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import DocumentAccordion from "../../components/creator/DocumentAccordion";
import { useGetUsersQuery } from "../../api/userApi";
import { loanTypes, loanTypeDocuments } from "../docTypes";
import { useCreateCoCreatorChecklistMutation } from "../../api/checklistApi";
import ChecklistFormFields from "../../components/creator/ChecklistFormFields";
import DocumentInputSectionCoCreator from "../../components/creator/DocumentInputSection";
import { useAutoSaveDraft } from "../../hooks/useAutoSaveDraft";
import { saveDraft, getDrafts, deleteDraft } from "../../utils/draftsUtils";

const ChecklistsPage = ({ open, onClose, draftId: initialDraftId = null }) => {
  const [loanType, setLoanType] = useState("");
  const [assignedToRM, setAssignedToRM] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [ibpsNo, setIbpsNo] = useState("");
  const [selectedMultipleLoanTypes, setSelectedMultipleLoanTypes] = useState(
    [],
  );
  const [newDocName, setNewDocName] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [currentDraftId, setCurrentDraftId] = useState(null);

  const { data: users = [] } = useGetUsersQuery();
  const rms = users.filter((u) => u.role?.toLowerCase() === "rm");

  const [createChecklist] = useCreateCoCreatorChecklistMutation();

  // Form data for auto-save
  const formData = {
    loanType,
    assignedToRM,
    customerId,
    customerName,
    customerNumber,
    customerEmail,
    ibpsNo,
    selectedMultipleLoanTypes,
    documents,
  };

  // Auto-save hook - saves every 5 seconds when form has data
  const { draftId: autoSavedDraftId, lastSaved } = useAutoSaveDraft({
    type: "cocreator",
    formData,
    interval: 5000,
    draftId: currentDraftId,
    enabled: open && (loanType || assignedToRM || customerNumber), // Only enable when modal is open and has some data
  });

  // Update currentDraftId when auto-save provides one
  useEffect(() => {
    if (autoSavedDraftId && autoSavedDraftId !== currentDraftId) {
      setCurrentDraftId(autoSavedDraftId);
    }
  }, [autoSavedDraftId]);

  // Load draft data on mount if initialDraftId is provided
  useEffect(() => {
    if (initialDraftId) {
      loadDraft(initialDraftId);
    } else {
      resetForm();
    }
  }, [initialDraftId, open]);

  // Load draft from localStorage
  const loadDraft = (id) => {
    try {
      const drafts = getDrafts("cocreator");
      const draft = drafts.find((d) => d.id === id);
      if (draft && draft.data) {
        const data = draft.data;
        setLoanType(data.loanType || "");
        setAssignedToRM(data.assignedToRM || "");
        setCustomerId(data.customerId || "");
        setCustomerName(data.customerName || "");
        setCustomerNumber(data.customerNumber || "");
        setCustomerEmail(data.customerEmail || "");
        setIbpsNo(data.ibpsNo || "");
        setSelectedMultipleLoanTypes(data.selectedMultipleLoanTypes || []);

        // Handle different document structures
        let docsToLoad = data.documents || [];

        // If documents have a flat structure (from ReviewChecklistModal),
        // convert them to nested structure with docList
        if (
          docsToLoad.length > 0 &&
          docsToLoad[0].category &&
          !docsToLoad[0].docList
        ) {
          // Group by category
          const groupedDocs = {};
          docsToLoad.forEach((doc) => {
            const category = doc.category || "Uncategorized";
            if (!groupedDocs[category]) {
              groupedDocs[category] = [];
            }
            groupedDocs[category].push({
              name: doc.name,
              action: doc.action || doc.status || "pendingrm",
              status: doc.status || doc.action || "pendingrm",
              comment: doc.comment || "",
              fileUrl: doc.fileUrl,
            });
          });

          // Convert to nested structure
          docsToLoad = Object.keys(groupedDocs).map((category) => ({
            category,
            docList: groupedDocs[category],
          }));
        }

        setDocuments(docsToLoad);
        setCurrentDraftId(id);
        message.success("Draft restored successfully!");
      }
    } catch (error) {
      console.error("Error loading draft:", error);
      message.error("Failed to load draft");
    }
  };

  // Reset form
  const resetForm = () => {
    setLoanType("");
    setAssignedToRM("");
    setCustomerId("");
    setCustomerName("");
    setCustomerNumber("");
    setCustomerEmail("");
    setIbpsNo("");
    setSelectedMultipleLoanTypes([]);
    setDocuments([]);
    setNewDocName("");
    setSelectedCategoryName(null);
    setCurrentDraftId(null);
  };

  // Manual save draft handler
  const handleSaveDraft = () => {
    try {
      const saved = saveDraft("cocreator", formData, currentDraftId);
      if (saved) {
        setCurrentDraftId(saved.id);
        message.success("Draft saved successfully!");
      } else {
        message.error("Failed to save draft");
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      message.error("Failed to save draft");
    }
  };

  const handleLoanTypeChange = (value) => {
    setLoanType(value);
    setSelectedMultipleLoanTypes([]); // Reset multiple selection

    if (value !== "Multiple Loan Type") {
      const categories = loanTypeDocuments[value] || [];
      setDocuments(
        categories.map((cat) => ({
          category: cat.title,
          docList: cat.documents.map((d) => ({
            name: d,
            status: "pendingrm",
            action: "",
            comment: "",
          })),
        })),
      );
    } else {
      setDocuments([]); // Clear until actual types are selected
    }
  };

  // Logic to handle multiple loan types document population
  React.useEffect(() => {
    if (
      loanType === "Multiple Loan Type" &&
      selectedMultipleLoanTypes.length > 0
    ) {
      const mergedCategories = {};

      selectedMultipleLoanTypes.forEach((type) => {
        const categories = loanTypeDocuments[type] || [];
        categories.forEach((cat) => {
          if (!mergedCategories[cat.title]) {
            mergedCategories[cat.title] = new Set();
          }
          cat.documents.forEach((doc) => {
            mergedCategories[cat.title].add(doc);
          });
        });
      });

      const newDocs = Object.keys(mergedCategories).map((title) => ({
        category: title,
        docList: Array.from(mergedCategories[title]).map((docName) => ({
          name: docName,
          status: "pendingrm",
          action: "",
          comment: "",
        })),
      }));

      setDocuments(newDocs);
    }
  }, [selectedMultipleLoanTypes, loanType]);

  const handleAddNewDocument = () => {
    if (!newDocName.trim() || !selectedCategoryName) return;

    setDocuments((prevDocs) => {
      const updatedDocs = [...prevDocs];
      const categoryIdx = updatedDocs.findIndex(
        (cat) => cat.category === selectedCategoryName,
      );

      const newDoc = {
        name: newDocName.trim(),
        status: "pendingrm",
        action: "",
        comment: "",
      };

      if (categoryIdx > -1) {
        updatedDocs[categoryIdx].docList.push(newDoc);
      } else {
        updatedDocs.push({
          category: selectedCategoryName,
          docList: [newDoc],
        });
      }
      return updatedDocs;
    });

    setNewDocName("");
    setSelectedCategoryName(null);
  };

  const handleSubmit = async () => {
    // If Multiple Loan Type is selected, ensure at least one actual type is picked
    const actualLoanType =
      loanType === "Multiple Loan Type"
        ? selectedMultipleLoanTypes.join(", ")
        : loanType;

    if (
      !assignedToRM ||
      (loanType === "Multiple Loan Type"
        ? selectedMultipleLoanTypes.length === 0
        : !loanType) ||
      !ibpsNo
    ) {
      return alert("Please fill all required fields.");
    }

    const payload = {
      loanType: actualLoanType,
      assignedToRMId: assignedToRM,
      customerId,
      customerName,
      customerNumber,
      customerEmail,
      ibpsNo,
      documents: documents,
    };

    try {
      await createChecklist(payload).unwrap();
      message.success("Checklist created successfully!");
      // Delete draft after successful creation
      if (currentDraftId) {
        deleteDraft(currentDraftId);
        setCurrentDraftId(null);
      }
      onClose();
    } catch (err) {
      console.error(err);
      message.error("Error creating checklist.");
    }
  };

  // Check if all required fields are filled
  const isFormValid =
    assignedToRM &&
    (loanType === "Multiple Loan Type"
      ? selectedMultipleLoanTypes.length > 0
      : loanType) &&
    ibpsNo;

  return (
    <>
      <style>{`
        /* Create DCL Modal Overlay - full screen with proper z-index */
        .create-dcl-modal-overlay {
          position: fixed;
          top: 65px;
          left: var(--sidebar-width, 80px);
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          z-index: 990;
          overflow: auto;
          padding-top: 20px;
          padding-bottom: 20px;
          transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
          max-height: 100vh;
        }
        
        /* Create DCL Modal Container - centered */
        .create-dcl-modal-container {
          background: white;
          border-radius: 12px;
          overflow: visible;
          width: 1200px;
          max-width: calc(100vw - 310px);
          box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.15), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
          border: 1px solid #e5e7eb;
          margin: 0 16px 0 46px;
          position: relative;
          z-index: 1001;
        }
        
        .create-dcl-modal-header {
          background: #164679;
          padding: 18px 24px;
          border-radius: 12px 12px 0 0;
          margin-bottom: 0;
        }
        
        .create-dcl-modal-body {
          padding: 24px;
          max-height: calc(100vh - 250px);
          overflow-y: auto;
        }
        
        /* Responsive adjustments */
        @media (min-width: 768px) and (max-width: 1099px) {
          .create-dcl-modal-overlay {
            left: var(--sidebar-width, 40px);
            transition: left 0.2s cubic-bezier(0.2, 0, 0, 1);
          }
          .create-dcl-modal-container {
            width: calc(100vw - 120px) !important;
            max-width: calc(100vw - 120px) !important;
            margin: 0 16px 0 16px !important;
          }
        }
        
        @media (max-width: 767px) {
          .create-dcl-modal-overlay {
            left: 0;
            padding-left: 0;
            padding-right: 16px;
          }
          .create-dcl-modal-container {
            width: calc(100vw - 32px) !important;
            max-width: calc(100vw - 32px) !important;
            margin: 0 16px 0 0px !important;
          }
        }
      `}</style>

      {open && (
        <div
          className="create-dcl-modal-overlay"
          onClick={() => {
            resetForm();
            onClose();
          }}
        >
          <div
            className="create-dcl-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="create-dcl-modal-header">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <span
                    style={{ color: "#fff", fontSize: "15px", fontWeight: 600 }}
                  >
                    Create Document Checklist
                  </span>
                  {lastSaved && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#b5d334",
                        fontWeight: "normal",
                      }}
                    >
                      Auto-saved: {new Date(lastSaved).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  size="small"
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

            {/* Body */}
            <div className="create-dcl-modal-body">
              <Space
                direction="vertical"
                style={{ width: "100%" }}
                size="large"
              >
                <ChecklistFormFields
                  rms={rms}
                  assignedToRM={assignedToRM}
                  setAssignedToRM={setAssignedToRM}
                  customerId={customerId}
                  setCustomerId={setCustomerId}
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  customerNumber={customerNumber}
                  setCustomerNumber={setCustomerNumber}
                  customerEmail={customerEmail}
                  setCustomerEmail={setCustomerEmail}
                  loanType={loanType}
                  loanTypes={loanTypes}
                  handleLoanTypeChange={handleLoanTypeChange}
                  selectedMultipleLoanTypes={selectedMultipleLoanTypes}
                  setSelectedMultipleLoanTypes={setSelectedMultipleLoanTypes}
                />

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "500",
                    }}
                  >
                    IBPS NO *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter IBPS Number"
                    value={ibpsNo}
                    onChange={(e) => setIbpsNo(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #d9d9d9",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {loanType && (
                  <div style={{ marginBottom: "16px" }}>
                    <DocumentInputSectionCoCreator
                      loanType={
                        loanType === "Multiple Loan Type"
                          ? selectedMultipleLoanTypes.join(", ")
                          : loanType
                      }
                      newDocName={newDocName}
                      setNewDocName={setNewDocName}
                      selectedCategoryName={selectedCategoryName}
                      setSelectedCategoryName={setSelectedCategoryName}
                      handleAddNewDocument={handleAddNewDocument}
                    />
                    <div style={{ marginTop: 24 }}>
                      <DocumentAccordion
                        documents={documents}
                        setDocuments={setDocuments}
                      />
                    </div>
                  </div>
                )}

                <Button
                  block
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  style={{
                    color: !isFormValid ? "#bfbfbf" : "#164679",
                    backgroundColor: "#ffffff",
                    borderColor: !isFormValid ? "#d9d9d9" : "#d9d9d9",
                    cursor: !isFormValid ? "not-allowed" : undefined,
                    fontWeight: 600,
                  }}
                >
                  Create DCL
                </Button>

                <Button
                  block
                  onClick={handleSaveDraft}
                  disabled={!loanType && !assignedToRM && !customerNumber}
                  style={{
                    marginTop: "8px",
                    color:
                      !loanType && !assignedToRM && !customerNumber
                        ? "#bfbfbf"
                        : "#164679",
                    backgroundColor: "#ffffff",
                    borderColor: "#d9d9d9",
                    fontWeight: 600,
                  }}
                >
                  Save Draft
                </Button>

                {!isFormValid && (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#ff4d4f",
                      fontSize: "12px",
                      marginTop: "-8px",
                    }}
                  >
                    Please fill all required fields (Assigned RM, Loan Type,{" "}
                    {loanType === "Multiple Loan Type"
                      ? "Actual Loan Types, "
                      : ""}{" "}
                    and IBPS NO)
                  </div>
                )}
              </Space>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChecklistsPage;
