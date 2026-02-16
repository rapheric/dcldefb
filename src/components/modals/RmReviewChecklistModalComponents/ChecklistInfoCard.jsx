import React from "react";
import { Card, Descriptions } from "antd";
import { formatDateTime } from "../../../utils/checklistUtils";
// import { SECONDARY_PURPLE } from "../constants/colors";

const ChecklistInfoCard = ({ checklist }) => {
  return (
    <Card
      className="checklist-info-card"
      size="small"
      title="Checklist Details"
      style={{ marginBottom: 18, marginTop: 24 }}
    >
      <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
        <Descriptions.Item label="Customer Number">
          {checklist.customerNumber}
        </Descriptions.Item>
        <Descriptions.Item label="Loan Type">
          {checklist.loanType}
        </Descriptions.Item>
        <Descriptions.Item label="DCL NO">
          {checklist.dclNo}
        </Descriptions.Item>
        <Descriptions.Item label="IBPS No">
          {checklist.ibpsNo || "Not provided"}
        </Descriptions.Item>
        <Descriptions.Item label="Created By">
          {checklist.createdBy?.name}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {checklist.createdAt ? formatDateTime(checklist.createdAt) : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="RM">
          {checklist.assignedToRM?.name}
        </Descriptions.Item>
        <Descriptions.Item label="Co-Checker">
          {checklist.assignedToCoChecker?.name || "Pending"}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default ChecklistInfoCard;