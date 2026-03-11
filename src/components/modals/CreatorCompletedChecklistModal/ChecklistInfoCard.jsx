import React from "react";
import { Card, Descriptions, Tag } from "antd";
import { getStatusColor } from "../../../utils/statusColors";
import { formatStatusText } from "../../../utils/statusColors";
import { PRIMARY_BLUE } from "../../../utils/constants";

const ChecklistInfoCard = ({ checklist }) => {
  if (!checklist) return null;

  const statusColorConfig = getStatusColor(checklist.status);

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
        <Descriptions.Item label="Co-Checker">
          {checklist.assignedToCoChecker?.name ? (
            <Tag>{checklist.assignedToCoChecker.name}</Tag>
          ) : (
            <Tag>Pending Assignment</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag
            style={{
              borderColor: statusColorConfig.borderColor,
              fontWeight: 600,
              fontSize: "12px",
              padding: "2px 5px",
              lineHeight: "18px",
              borderRadius: "4px",
              textTransform: "capitalize",
            }}
          >
            {formatStatusText(checklist.status) || "N/A"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Completed At">
          {formatDate(checklist.completedAt || checklist.updatedAt)}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default ChecklistInfoCard;
