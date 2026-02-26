// src/components/completedChecklistModal/components/ChecklistInfoCard.jsx
import React from "react";
import { Card, Descriptions, Tag } from "antd";
import { formatDateTime } from "../../../utils/checklistUtils";
// import { PRIMARY_BLUE } from "../utils/checklistConstants";

const ChecklistInfoCard = ({ checklist }) => {
  return (
    <Card
      className="checklist-info-card"
      size="small"
      title="Checklist Details"
      style={{ marginBottom: 18, marginTop: 0, borderRadius: 10, border: `1px solid #e0e0e0` }}
    >
      <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
        <Descriptions.Item label="DCL No">
          {checklist.dclNo}
        </Descriptions.Item>
        <Descriptions.Item label="IBPS No">
          {checklist.ibpsNo || "Not provided"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {checklist.createdAt ? formatDateTime(checklist.createdAt) : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Loan Type">
          {checklist.loanType}
        </Descriptions.Item>
        <Descriptions.Item label="Created By">
          {checklist.createdBy?.name}
        </Descriptions.Item>
        <Descriptions.Item label="RM">
          {checklist.assignedToRM?.name}
        </Descriptions.Item>
        <Descriptions.Item label="Co-Checker">
          {checklist.assignedToCoChecker?.name || "Pending"}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag
            style={{
              backgroundColor: checklist.status === "completed" || checklist.status === "approved" ? "#f6ffed" :
                               checklist.status === "rejected" ? "#ffebe6" :
                               checklist.status === "pending" ? "#fffbe6" : "#f0f0f0",
              color: checklist.status === "completed" || checklist.status === "approved" ? "#52c41a" :
                     checklist.status === "rejected" ? "#ff4d4f" :
                     checklist.status === "pending" ? "#faad14" : "#666",
              borderColor: checklist.status === "completed" || checklist.status === "approved" ? "#52c41a" :
                          checklist.status === "rejected" ? "#ff4d4f" :
                          checklist.status === "pending" ? "#faad14" : "#d9d9d9",
              fontWeight: "600",
              textTransform: "uppercase",
            }}
          >
            {checklist.status || "N/A"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Completed At">
          {checklist.completedAt ? formatDateTime(checklist.completedAt) : checklist.updatedAt ? formatDateTime(checklist.updatedAt) : "N/A"}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default ChecklistInfoCard;