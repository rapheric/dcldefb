import React from "react";
import { Table, Select, Input, Button, Collapse, Tag, Typography } from "antd";
import { STATUS_COLORS } from "../../utils/constants";

const { Panel } = Collapse;
const { Option } = Select;

// Status mapping
const actionToStatus = {
  submitted: "submitted",
  pendingrm: "pendingrm",
  pendingco: "pendingco",
  tbo: "tbo",
  sighted: "sighted",
  waived: "waived",
  deferred: "deferred",
};

// Status color mapping - using consistent colors from constants
const getStatusColor = (status) => {
  const statusLower = (status || "").toLowerCase();
  const colorObj = STATUS_COLORS[statusLower] || STATUS_COLORS.default;
  return {
    bg: colorObj.bg,
    text: colorObj.color,
  };
};

// Template for a new document
const createEmptyDoc = () => ({
  name: "",
  action: "",
  status: "",
  comment: "",
});

const DocumentAccordion = ({ documents, setDocuments }) => {
  // Ensure documents is always an array and has proper structure
  const safeDocuments = Array.isArray(documents) ? documents : [];

  // Add new document inside a category
  const handleAddDocument = (catIdx) => {
    const updated = [...safeDocuments];
    if (!updated[catIdx].docList) {
      updated[catIdx].docList = [];
    }
    updated[catIdx].docList.push(createEmptyDoc());
    setDocuments(updated);
  };

  // Remove document
  const handleRemoveDocument = (catIdx, docIdx) => {
    const updated = [...safeDocuments];
    if (updated[catIdx].docList) {
      updated[catIdx].docList.splice(docIdx, 1);
    }
    setDocuments(updated);
  };

  // Handle edit/change inside a document
  const handleDocumentChange = (catIdx, docIdx, field, value) => {
    const updated = [...safeDocuments];

    // Ensure category has docList
    if (!updated[catIdx]) {
      updated[catIdx] = { category: "", docList: [] };
    }
    if (!updated[catIdx].docList) {
      updated[catIdx].docList = [];
    }

    // Ensure document exists
    if (!updated[catIdx].docList[docIdx]) {
      updated[catIdx].docList[docIdx] = createEmptyDoc();
    }

    const doc = updated[catIdx].docList[docIdx];
    doc[field] = value;

    // Auto update status when action changes
    if (field === "action") {
      doc.status = actionToStatus[value] || "";
    }

    setDocuments(updated);
  };

  // Table columns
  const getColumns = (catIdx) => [
    {
      title: "Document",
      dataIndex: "name",
      render: (_, record) => (
        <Input
          value={record.name}
          placeholder="Document Name"
          onChange={(e) =>
            handleDocumentChange(catIdx, record.docIdx, "name", e.target.value)
          }
        />
      ),
    },

    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <Select
          value={record.action}
          style={{ width: 150 }}
          placeholder="Select Action"
          onChange={(val) =>
            handleDocumentChange(catIdx, record.docIdx, "action", val)
          }
        >
          <Option value="submitted">Submitted</Option>
          <Option value="pendingrm">Pending from Rm</Option>
          <Option value="pendingco">Pending from Co</Option>
          <Option value="tbo">TBO</Option>
          <Option value="sighted">Sighted</Option>
          <Option value="waived">Waived</Option>
          <Option value="deferred">Deferred</Option>
        </Select>
      ),
    },

    {
      title: "Status From Co",
      dataIndex: "status",
      render: (s) => {
        if (!s) return <span style={{ color: "#999" }}>—</span>;
        const colors = getStatusColor(s);
        return (
          <Tag
            style={{
              backgroundColor: colors.bg,
              color: colors.text,
              border: "none",
              padding: "4px 8px",
              borderRadius: "4px",
              fontWeight: 600,
            }}
          >
            {s}
          </Tag>
        );
      },
    },

    {
      title: "Comment from Co",
      dataIndex: "comment",
      render: (_, record) => (
        <Input
          value={record.comment}
          placeholder="Enter comment"
          onChange={(e) =>
            handleDocumentChange(
              catIdx,
              record.docIdx,
              "comment",
              e.target.value,
            )
          }
        />
      ),
    },

    {
      title: "Remove",
      render: (_, record) => (
        <Button
          onClick={() => handleRemoveDocument(catIdx, record.docIdx)}
          style={{
            color: "white !important",
            backgroundColor: "#ff4d4f !important",
            borderColor: "#ff4d4f !important",
            fontWeight: 600,
          }}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Collapse accordion>
      {safeDocuments.map((cat, catIdx) => {
        const safeDocList = Array.isArray(cat.docList) ? cat.docList : [];
        return (
          <Panel header={cat.category || `Category ${catIdx + 1}`} key={catIdx}>
            <div
              style={{
                marginBottom: "16px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#1a1a1a",
              }}
            >
              Add More Documents
            </div>
            <div
              onClick={() => handleAddDocument(catIdx)}
              style={{
                marginBottom: 15,
                backgroundColor: "#ffffff",
                color: "#164679",
                fontWeight: 700,
                fontSize: 13,
                padding: "10px 16px",
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "center",
                border: "1px solid #d9d9d9",
              }}
            >
              + Add Document
            </div>

            <Table
              pagination={false}
              columns={getColumns(catIdx)}
              dataSource={safeDocList.map((doc, docIdx) => ({
                ...doc,
                key: `${catIdx}-${docIdx}`,
                docIdx,
              }))}
            />
          </Panel>
        );
      })}
    </Collapse>
  );
};

export default DocumentAccordion;
