import React from "react";
import { Card, Descriptions, Tag } from "antd";
import { PRIMARY_BLUE } from "../../../utils/constants";

const ChecklistInfoCard = ({ checklist }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

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
          <span>{checklist.dclNo || "N/A"}</span>
        </Descriptions.Item>
        <Descriptions.Item label="IBPS No">
          {checklist.ibpsNo || "Not provided"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {formatDate(checklist.createdAt)}
        </Descriptions.Item>
        <Descriptions.Item label="Loan Type">
          <Tag>{checklist.loanType || "N/A"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Created By">
          <span>
            {checklist.createdBy?.name || checklist.createdBy || "N/A"}
          </span>
        </Descriptions.Item>
        <Descriptions.Item label="RM">
          <span>{checklist.assignedToRM?.name || "N/A"}</span>
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
        <Descriptions.Item label="Co-Checker">
          {checklist.assignedToCoChecker?.name ? (
            <Tag>{checklist.assignedToCoChecker.name}</Tag>
          ) : (
            <Tag>Pending Assignment</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Customer Number">
          <span>{checklist.customerNumber || "N/A"}</span>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default ChecklistInfoCard;
