// src/components/completedChecklistModal/components/ChecklistInfoCard.jsx
import React from "react";
import { Card, Descriptions, Tag } from "antd";
import { PRIMARY_BLUE } from "../../../utils/checklistConstants";
import { formatDateTime } from "../../../utils/checklistUtils";
// import { PRIMARY_BLUE } from "../utils/checklistConstants";

const ChecklistInfoCard = ({ checklist }) => (
  <Card
    className="checklist-info-card"
    size="small"
    title={
      <span style={{ color: PRIMARY_BLUE, fontSize: 14 }}>
        Checklist Details
      </span>
    }
    style={{
      marginBottom: 18,
      borderRadius: 10,
      border: `1px solid #e0e0e0`,
    }}
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
        <Tag color="green">{checklist.status}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Completed At">
        {checklist.completedAt ? formatDateTime(checklist.completedAt) : checklist.updatedAt ? formatDateTime(checklist.updatedAt) : "N/A"}
      </Descriptions.Item>
    </Descriptions>
  </Card>
);

export default ChecklistInfoCard;