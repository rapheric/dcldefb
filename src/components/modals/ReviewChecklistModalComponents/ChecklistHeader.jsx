import React from "react";
import { Card, Descriptions, Tag } from "antd";
import { PRIMARY_BLUE } from "../../../utils/constants";
// import { PRIMARY_BLUE, ACCENT_LIME, SECONDARY_PURPLE } from '../../../utils/';

const ChecklistHeader = ({ checklist }) => {
  return (
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
        marginTop: 24,
        borderRadius: 10,
        border: `1px solid #e0e0e0`,
      }}
    >
      <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
        <Descriptions.Item label="DCL No">
          <strong>{checklist.dclNo}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="IBPS No">
          {checklist.ibpsNo || "Not provided"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {new Date(checklist.createdAt).toLocaleDateString()}
        </Descriptions.Item>
        <Descriptions.Item label="Loan Type">
          <Tag>{checklist.loanType}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Created By">
          <span style={{ fontWeight: 600 }}>{checklist.createdBy?.name}</span>
        </Descriptions.Item>
        <Descriptions.Item label="RM">
          <span style={{ fontWeight: 600 }}>
            {checklist.assignedToRM?.name}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="Co-Checker">
          {checklist.assignedToCoChecker?.name ? (
            <Tag>{checklist.assignedToCoChecker.name}</Tag>
          ) : (
            <Tag>Pending Assignment</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Current Status">
          <Tag
            color={
              checklist.status === "co_creator_review"
                ? "processing"
                : checklist.status === "pending"
                  ? "warning"
                  : "default"
            }
          >
            {checklist.status?.replace(/_/g, " ").toUpperCase()}
          </Tag>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default ChecklistHeader;
