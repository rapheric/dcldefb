import React, { useMemo, useState } from "react";
import {
  Button,
  Divider,
  Table,
  Tag,
  Spin,
  Empty,
  Card,
  Row,
  Col,
  Input,
  Badge,
  Typography,
  message,
} from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  useGetChecklistsByCreatorQuery,
  useReviveChecklistMutation,
  useUpdateChecklistStatusMutation,
  useUpdateCoCreatorChecklistMutation,
  useReviveChecklistWithCreatorMutation,
} from "../../api/checklistApi";
import CheckerReviewChecklistModal from "../../components/modals/CheckerReviewChecklistModalComponents/CheckerReviewChecklistModal";
import dayjs from "dayjs";
import { formatDate } from "../../utils/checklistUtils";
// import ReviewChecklistModal from "../../components/modals/ReviewChecklistModal";
// import CreatorCompletedChecklistModal from "../../components/modals/CreatorCompletedChecklistModal";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CreatorCompletedChecklistModal from "../../components/modals/CreatorCompletedChecklistModal/CreatorCompletedChecklistModal";
/* ---------------- THEME COLORS ---------------- */
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";
const SUCCESS_GREEN = "#52c41a";

const { Text } = Typography;

const Completed = () => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [searchText, setSearchText] = useState("");

  const navigate = useNavigate();

  /* ---------------- FETCH DATA ---------------- */
  // const {
  //   data: allChecklists = [],
  //   isLoading,
  //   refetch,
  // } = useGetChecklistsByCreatorQuery();

  const { user } = useSelector((state) => state.auth);

  const creatorId = user?.id || user?._id;

  const {
    data: allChecklists = [],
    isLoading,
    refetch,
  } = useGetChecklistsByCreatorQuery(creatorId, {
    skip: !creatorId,
  });

  const [reviveChecklist, { isLoading: isReviving }] =
    useReviveChecklistMutation();
  const [updateChecklistStatusMutation] = useUpdateChecklistStatusMutation();
  const [updateCoCreatorChecklistMutation] =
    useUpdateCoCreatorChecklistMutation();
  const [reviveChecklistWithCreatorMutation] =
    useReviveChecklistWithCreatorMutation();

  console.log("Creator ID:", creatorId);
  console.log("Redux user:", user);
  console.log("Creator ID:", user?._id);
  console.log("User token:", user?.token);
  console.log("Is authenticated:", !!user?.token);
  console.log("All Checklists in MyQueue:", allChecklists);

  // Helper function to generate the next copy DCL number
  const getNextCopyDCLNumber = (originalDCL) => {
    // Check if DCL already has a copy suffix
    const copyRegex = /Copy\s(\d+)$/;
    const match = originalDCL?.match(copyRegex);

    if (match) {
      // Already has a copy number, increment it
      const currentCopy = parseInt(match[1], 10);
      return originalDCL.replace(copyRegex, `Copy ${currentCopy + 1}`);
    } else {
      // First copy
      return `${originalDCL} Copy 1`;
    }
  };

  // Helper function to update the DCL number on a revived checklist
  const updateRevivedDCLNumber = async (
    checklistId,
    originalDCL,
    existingChecklists,
  ) => {
    try {
      // Find the highest copy number for this original DCL
      const copiedDCLs = existingChecklists.filter((c) =>
        c.dclNo?.startsWith(originalDCL),
      );

      let copyNumber = 1;
      if (copiedDCLs.length > 0) {
        const copyNumbers = copiedDCLs.map((c) => {
          const match = c.dclNo?.match(/Copy\s(\d+)$/);
          return match ? parseInt(match[1], 10) : 0;
        });
        copyNumber = Math.max(...copyNumbers) + 1;
      }

      const newDCLNumber = `${originalDCL} Copy ${copyNumber}`;

      console.log("📝 [Completed.jsx] Updating DCL number to:", newDCLNumber);
      await updateCoCreatorChecklistMutation({
        id: checklistId,
        data: { dclNo: newDCLNumber },
      }).unwrap();
      console.log("✅ [Completed.jsx] DCL number updated successfully");

      return newDCLNumber;
    } catch (error) {
      console.error("⚠️ [Completed.jsx] Failed to update DCL number:", error);
      throw error;
    }
  };

  /* ---------------- FILTER APPROVED ---------------- */
  const filteredData = useMemo(() => {
    let filtered = allChecklists.filter((c) => {
      const statusLower = c.status?.toLowerCase() || "";
      // Show completed/approved checklists
      // Exclude revived copies (co_creator_review status) as those go to CoChecklistPage
      const isCompletedOrApproved =
        statusLower === "approved" || statusLower === "completed";
      const isNotRevived = statusLower !== "co_creator_review";

      return isCompletedOrApproved && isNotRevived;
    });

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q) ||
          c.approvedBy?.name?.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [allChecklists, searchText]);

  // Handle revive checklist function
  const handleReviveChecklist = async (checklistId) => {
    console.log(
      "🚀 [Completed.jsx] handleReviveChecklist called with ID:",
      checklistId,
    );
    console.log("👤 Current user ID:", creatorId);

    try {
      message.loading({
        content: "Creating new checklist from template...",
        key: "revive",
        duration: 0,
      });

      console.log("📤 [Completed.jsx] Making API call to revive endpoint...");

      const response = await reviveChecklist(checklistId).unwrap();

      console.log("✅ [Completed.jsx] API Response:", response);
      console.log("✅ [Completed.jsx] Full response data:", JSON.stringify(response, null, 2));

      // Get the newly created checklist ID from the response - handle various response formats
      const newChecklistId = 
        response.newChecklistId ||
        response.checklist?.id || 
        response.checklist?._id ||
        response.data?.newChecklistId ||
        response.data?.id;
      
      const newDCLNumber = 
        response.newDCLNumber ||
        response.checklist?.dclNo ||
        response.data?.newDCL ||
        response.dclNo;

      if (!newChecklistId) {
        console.error("❌ New checklist ID not found. Response structure:", Object.keys(response));
        throw new Error("New checklist ID not found in response");
      }

      console.log("✅ [Completed.jsx] New checklist ID:", newChecklistId);
      console.log("✅ [Completed.jsx] New DCL Number:", newDCLNumber);

      message.success({
        content: response?.message || `Checklist revived successfully as ${newDCLNumber}!`,
        key: "revive",
        duration: 3,
      });

      // Refetch and redirect after short delay
      setTimeout(() => {
        refetch();
        // Navigate to creator home to see the revived checklist in Created Checklists For Review
        console.log(
          "🚀 [Completed.jsx] Navigating to creator home to see revived copy...",
        );
        navigate("/cocreator");
      }, 800);

      return response;
    } catch (error) {
      console.error("❌ [Completed.jsx] Error reviving checklist:", error);
      console.error("❌ Full error object:", JSON.stringify(error, null, 2));
      console.error("❌ Error status:", error?.status);
      console.error("❌ Error data:", error?.data);
      console.error("❌ Error message:", error?.message);

      let errorMessage = "Failed to revive checklist. Please try again.";

      if (error?.status === 403 || error?.status === 401) {
        errorMessage = "You don't have permission to revive this checklist.";
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.data?.error) {
        errorMessage = error.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      message.error({
        content: errorMessage,
        key: "revive",
        duration: 4,
      });

      console.error("❌ [Completed.jsx] Final error message:", errorMessage);
      throw error;
    }
  };

  // ✅ Helper function to get assigned checker info
const getCheckerInfo = (record) => {
  // Priority: assignedToCoChecker → assignedChecker → checkerAssigned → coChecker
  return (
    record.assignedToCoChecker ||
    record.assignedChecker ||
    record.checkerAssigned ||
    record.coChecker ||
    null
  );
};

  /* ---------------- TABLE COLUMNS ---------------- */
  const columns = [
    {
      title: "DCL Number",
      dataIndex: "dclNo",
      width: 140,
      fixed: "left",
      render: (text) => (
        <div
          style={{
            fontWeight: "bold",
            color: PRIMARY_BLUE,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: "Customer No",
      dataIndex: "customerNumber",
      width: 110,
      render: (text) => (
        <div style={{ color: SECONDARY_PURPLE, fontWeight: 500, fontSize: 13 }}>
          {text || "—"}
        </div>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 160,
      render: (text) => (
        <div
          style={{
            fontWeight: 600,
            color: PRIMARY_BLUE,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <UserOutlined style={{ color: PRIMARY_BLUE, fontSize: 12 }} />
          {text}
        </div>
      ),
    },
    {
      title: "IBPS No", // ✅ New IBPS NO column
      dataIndex: "ibpsNo",
      width: 140,
      render: (text) => (
        <span
          style={{
            color: PRIMARY_BLUE,
            fontWeight: 500,
            fontFamily: "monospace",
            backgroundColor: text ? "rgba(181, 211, 52, 0.1)" : "transparent",
            padding: "2px 6px",
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {text || "Not set"}
        </span>
      ),
    },
    {
      title: "Loan Type",
      dataIndex: "loanType",
      width: 120,
      render: (text) => (
        <div style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>
          {text}
        </div>
      ),
    },
     {
         title: "Checker/Approver",
         dataIndex: "assignedToCoChecker", // primary field to check for checker info
         width: 160,
         render: (checkerValue, record) => {
           // 🔍 Debug: Log what we're getting
           console.log("🔍 Checker Column Debug:", {
             checkerValue,
             record_assignedToCoChecker: record?.assignedToCoChecker,
             record_assignedChecker: record?.assignedChecker,
             record_approvedBy: record?.approvedBy,
             record_checkerAssigned: record?.checkerAssigned,
             record_checker: record?.checker,
             allKeys: Object.keys(record || {}),
           });
           
           // ✅ Use helper to get assigned checker info from various field names
           const approver = getCheckerInfo(record);
           
           // ✅ Handle different possible name field variations
           const checkerName = 
             approver?.name || 
             approver?.checkerName || 
             approver?.fullName || 
             approver?.userName ||
             "Not Assigned";
           
           return (
             <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
               <UserOutlined style={{ color: PRIMARY_BLUE, fontSize: 12 }} />
               <div
                 style={{
                   color: PRIMARY_BLUE,
                   fontWeight: 600,
                   fontSize: 13,
                 }}
               >
                 {checkerName}
               </div>
             </div>
           );
         },
       },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 70,
      align: "center",
      render: (docs = []) => {
        const totalDocs =
          docs.reduce(
            (total, category) => total + (category.docList?.length || 0),
            0,
          ) || 0;

        return (
          <Tag
            color={LIGHT_YELLOW}
            style={{
              fontSize: 11,
              borderRadius: 999,
              fontWeight: "bold",
              color: PRIMARY_BLUE,
              border: `1px solid ${HIGHLIGHT_GOLD}`,
              minWidth: 28,
              textAlign: "center",
            }}
          >
            {totalDocs}
          </Tag>
        );
      },
    },
    {
      title: "Completed Date",
      dataIndex: "updatedAt",
      width: 120,
      render: (date) => (
        <div style={{ fontSize: 12, fontWeight: 500 }}>
          {date ? formatDate(date) : "—"}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      fixed: "right",
      render: () => (
        <Tag
          color="success"
          style={{ fontWeight: "bold", fontSize: 11 }}
          icon={<CheckCircleOutlined />}
        >
          Approved
        </Tag>
      ),
    },
  ];

  /* ---------------- TABLE STYLES ---------------- */
  const customTableStyles = `
    .creator-completed-table .ant-table-wrapper {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
      border: 1px solid #e0e0e0;
    }
    .creator-completed-table .ant-table-thead > tr > th {
      background-color: #f7f7f7 !important;
      color: ${PRIMARY_BLUE} !important;
      font-weight: 700;
      font-size: 15px;
      padding: 16px 16px !important;
      border-bottom: 3px solid #b5d334 !important;
      border-right: none !important;
    }
    .creator-completed-table .ant-table-tbody > tr > td {
      border-bottom: 1px solid #f0f0f0 !important;
      border-right: none !important;
      padding: 14px 16px !important;
      font-size: 14px;
      color: #374151;
    }
    .creator-completed-table .ant-table-tbody > tr.ant-table-row:hover > td {
      background-color: rgba(181, 211, 52, 0.1) !important;
      cursor: pointer;
    }
    .creator-completed-table .ant-pagination .ant-pagination-item-active {
      background-color: #b5d334 !important;
      border-color: #b5d334 !important;
    }
    .creator-completed-table .ant-pagination .ant-pagination-item-active a {
      color: ${PRIMARY_BLUE} !important;
      font-weight: 600;
    }
  `;

  // Responsive padding
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 375;
  const padding = isMobile ? "8px 2px" : "24px";
  const cardMargin = isMobile ? 8 : 12;

  return (
    <div style={{ padding, boxSizing: "border-box" }}>
      <style>{customTableStyles}</style>
      {/* ---------------- FILTER ---------------- */}
      <Card
        size="small"
        style={{
          marginBottom: cardMargin,
          background: "#fafafa",
          borderRadius: 8,
        }}
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by DCL, Customer, Loan Type or Checker"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      <Divider>
        <Text strong>Approved Checklists ({filteredData.length})</Text>
      </Divider>

      {/* ---------------- TABLE ---------------- */}
      {isLoading ? (
        <Spin style={{ display: "block", margin: "40px auto" }} />
      ) : filteredData.length === 0 ? (
        <Empty description="No approved checklists found" />
      ) : (
        <div className="creator-completed-table">
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1000 }}
            onRow={(record) => ({
              onClick: () => {
                console.log(
                  "📋 Row clicked, setting selected checklist:",
                  record._id,
                );
                setSelectedChecklist(record);
              },
            })}
          />
        </div>
      )}

      {/* ---------------- MODAL ---------------- */}
      {selectedChecklist && (
        <>
          {console.log(
            "🔍 [Completed.jsx] Opening modal for checklist:",
            selectedChecklist._id,
          )}
          {console.log("🔍 [Completed.jsx] Modal should be visible now")}
          <CreatorCompletedChecklistModal
            checklist={selectedChecklist}
            open={!!selectedChecklist}
            onClose={() => {
              console.log("❌ Modal closed");
              setSelectedChecklist(null);
            }}
            onRevive={handleReviveChecklist}
            onRefreshData={refetch}
          />
        </>
      )}
    </div>
  );
};

export default Completed;
