import React, { useState, useMemo } from "react";
import { Modal, Button, Space } from "antd";
// Import the new components
import ChecklistFormFields from "../../components/rm/ChecklistFormFields";
import DocumentInputSection from "../../components/rm/DocumentInputSection";
import DocumentAccordion from "../../components/rm/DocumentAccordion";

import { useGetUsersQuery } from "../../api/userApi";
import { loanTypes, loanTypeDocuments } from "../docTypes";
import { useCreateCoCreatorChecklistMutation } from "../../api/checklistApi";

const ChecklistsPage = ({ open, onClose }) => {
  // State remains centralized here
  const [loanType, setLoanType] = useState("");
  const [title, setTitle] = useState("");
  const [assignedToRM, setAssignedToRM] = useState("");
  const [customerId, setCustomerId] = useState("");

  // customerName and customerNumber states are REMOVED

  const [documents, setDocuments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newDocName, setNewDocName] = useState("");

  // API Hooks and Data Filtering
  const { data: users = [] } = useGetUsersQuery();
  //   const {
  //   data: users = [],
  //   isLoading,
  //   isFetching,
  //   isError,
  //   error
  // } = useGetUsersQuery();

  // console.log(users, "users");
  // console.log({ isLoading, isFetching, isError, error });
  const rms = users.filter((u) => u.role?.toLowerCase() === "rm");
  const customers = users.filter((u) => u.role?.toLowerCase() === "customer");
  const [createChecklist] = useCreateCoCreatorChecklistMutation();

  // FIX: Use useMemo to DERIVE customer info instead of using useEffect and setState
  const customerInfo = useMemo(() => {
    const selected = customers.find((c) => c._id === customerId);
    return {
      name: selected?.name || "",
      number: selected?.customerNumber || "",
    };
  }, [customerId, customers]); // Recalculates only when customerId or customers change

  const customerName = customerInfo.name;
  const customerNumber = customerInfo.number;

  // Logic: Handle loan type selection and load default documents
  const handleLoanTypeChange = (value) => {
    setLoanType(value);
    const categories = loanTypeDocuments[value] || [];

    setDocuments(
      categories.map((cat) => ({
        category: cat.title,
        docList: cat.documents.map((d) => ({
          name: d,
          status: "pending",
          action: "",
          comment: "",
        })),
      })),
    );
  };

  // Logic: Add custom document into selected category
  const handleAddNewDocument = () => {
    if (
      !newDocName.trim() ||
      selectedCategory === null ||
      selectedCategory >= documents.length
    )
      return;

    const updated = [...documents];
    updated[selectedCategory].docList.push({
      name: newDocName.trim(),
      status: "pending",
      action: "",
      comment: "",
    });

    setDocuments(updated);
    setNewDocName("");
  };

  // Logic: Submit checklist
  const handleSubmit = async () => {
    if (!assignedToRM || !loanType || !title) {
      alert("Please fill all required fields.");
      return;
    }

    // Payload construction logic remains here
    const payload = {
      title,
      loanType,
      assignedToRMId: assignedToRM,
      customerId,
      // Use the DERIVED values directly in the payload
      customerName: customerName,
      customerNumber: customerNumber,
      documents: documents.flatMap((cat) =>
        cat.docList.map((doc) => ({
          name: doc.name,
          category: cat.category,
          action: doc.action,
          status: doc.status,
          comment: doc.comment,
        })),
      ),
    };

    try {
      await createChecklist(payload).unwrap();
      alert("Checklist created successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error creating checklist.");
    }
  };

  return (
    <Modal
      title="Create DCL Checklist"
      open={open}
      onCancel={onClose}
      width={1100}
      footer={null}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        {/* Render Form Fields Component */}
        <ChecklistFormFields
          rms={rms}
          customers={customers}
          assignedToRM={assignedToRM}
          setAssignedToRM={setAssignedToRM}
          customerId={customerId}
          setCustomerId={setCustomerId}
          // Pass derived values as props
          customerName={customerName}
          customerNumber={customerNumber}
          title={title}
          setTitle={setTitle}
          loanType={loanType}
          loanTypes={loanTypes}
          handleLoanTypeChange={handleLoanTypeChange}
        />

        {/* Document Section */}
        {loanType && (
          <>
            {/* Render Document Input Section Component */}
            <DocumentInputSection
              documents={documents}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              newDocName={newDocName}
              setNewDocName={setNewDocName}
              handleAddNewDocument={handleAddNewDocument}
            />

            {/* Render Document Accordion Component */}
            <DocumentAccordion
              documents={documents}
              setDocuments={setDocuments}
            />
          </>
        )}

        {/* Submit */}
        <Button type="primary" block onClick={handleSubmit}>
          Submit Checklist
        </Button>
      </Space>
    </Modal>
  );
};

export default ChecklistsPage;
