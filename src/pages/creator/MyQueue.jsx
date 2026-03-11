// export default Myqueue;
import { useMemo, useState, useEffect } from "react";
import { Table, Tag, Spin, Empty, Tabs, Card, Row, Col, Input } from "antd";
import {
  SearchOutlined,
  FileTextOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  useGetChecklistsByCreatorQuery,
  useGetAllChecklistsQuery,
  useLockDclMutation,
} from "../../api/checklistApi";
import dayjs from "dayjs";
import ReviewChecklistModal from "../../components/modals/ReviewChecklistModalComponents/ReviewChecklistModal";
import { useSelector } from "react-redux";
import { LockOutlined, UnlockOutlined } from "@ant-design/icons";
import { getStatusColor } from "../../utils/statusColors";

/* ---------------- THEME COLORS ---------------- */
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const HIGHLIGHT_GOLD = "#fcb116";
const LIGHT_YELLOW = "#fcd716";
const SECONDARY_PURPLE = "#7e6496";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";

const { TabPane } = Tabs;

const Myqueue = ({ draftToRestore = null, setDraftToRestore = null }) => {
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [activeTab, setActiveTab] = useState("co_creator_review"); // Default to CO Creator Review tab
  const [searchText, setSearchText] = useState("");

  const { user } = useSelector((state) => state.auth);

  // Handle both camelCase (id) and old format (_id) for backwards compatibility
  const creatorId = user?.id || user?._id;

  // Fetch creator's checklists (with polling to keep lock status fresh)
  const {
    data: allChecklists = [],
    isLoading: isLoadingCreator,
    refetch: refetchCreatorChecklists,
  } = useGetChecklistsByCreatorQuery(creatorId, {
    skip: !creatorId,
    // Poll every 10 seconds to get latest lock status
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  });

  // Fetch ALL DCLs in the system (for Active DCLs tab)
  const {
    data: allSystemDcls = [],
    isLoading: isLoadingUnassigned,
    refetch: refetchSystemDcls,
  } = useGetAllChecklistsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    // Poll every 10 seconds to get latest lock status
    pollingInterval: 10000,
    refetchOnFocus: true,
  });

  console.log("Fetched all system DCLs:", allSystemDcls);

  // Lock DCL mutation
  const [lockDcl] = useLockDclMutation();

  // Handle draft restoration - open modal with draft data
  useEffect(() => {
    if (draftToRestore && draftToRestore.data) {
      // Reconstruct checklist object from draft data
      const draftChecklist = {
        id: draftToRestore.data.checklistId || draftToRestore.id,
        _id: draftToRestore.data.checklistId || draftToRestore.id,
        dclNo: draftToRestore.data.dclNo,
        title: draftToRestore.data.title,
        customerName: draftToRestore.data.customerName,
        customerNumber: draftToRestore.data.customerNumber,
        loanType: draftToRestore.data.loanType,
        status: draftToRestore.data.status,
        // Documents are in flat format, ReviewChecklistModal will handle them
        documents: draftToRestore.data.documents || [],
      };

      // Use setTimeout to defer state update and avoid cascading renders
      setTimeout(() => {
        setSelectedChecklist(draftChecklist);
      }, 0);

      // Clear the draft restore after opening
      if (setDraftToRestore) {
        setDraftToRestore(null);
      }
    }
  }, [draftToRestore, setDraftToRestore]);

  // Function to handle DCL selection with locking
  const handleSelectChecklist = async (checklist) => {
    // Lock DCL for both active/unassigned and co-creator review tabs
    if (activeTab === "unassigned" || activeTab === "co_creator_review") {
      try {
        await lockDcl(checklist.id || checklist._id).unwrap();
        console.log("DCL locked:", checklist.dclNo);

        // Refetch data to update lock status across all tabs
        refetchCreatorChecklists();
        refetchSystemDcls();
      } catch (error) {
        console.error("Failed to lock DCL:", error);
        // Still allow opening even if lock fails
      }
    }
    setSelectedChecklist(checklist);
  };

  /* ---------------- UNASSIGNED DCLS QUEUE (NEW TAB) ---------------- */
  const unassignedQueue = useMemo(() => {
    let filtered = allSystemDcls.filter((c) => {
      const status = (c.status || "").toLowerCase();
      return status === "cocreatorreview";
    });

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [allSystemDcls, searchText]);

  /* ---------------- CO_CREATOR_REVIEW QUEUE ---------------- */
  const coCreatorReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "cocreatorreview",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first (using updatedAt or createdAt)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA; // Descending order (most recent first)
    });
  }, [allChecklists, searchText]);

  /* ---------------- RM_REVIEW QUEUE ---------------- */
  const rmReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "rmreview",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first (using updatedAt or createdAt)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA; // Descending order (most recent first)
    });
  }, [allChecklists, searchText]);

  /* ---------------- CO_CHECKER_REVIEW QUEUE ---------------- */
  const coCheckerReviewQueue = useMemo(() => {
    let filtered = allChecklists.filter(
      (c) => (c.status || "").toLowerCase() === "cocheckerreview",
    );

    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.dclNo?.toLowerCase().includes(q) ||
          c.customerNumber?.toLowerCase().includes(q) ||
          c.customerName?.toLowerCase().includes(q) ||
          c.loanType?.toLowerCase().includes(q),
      );
    }

    // Sort by most recent first (using updatedAt or createdAt)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA; // Descending order (most recent first)
    });
  }, [allChecklists, searchText]);

  /* ---------------- TABLE COLUMNS ---------------- */
  const getColumns = () => [
    {
      title: "DCL Number",
      dataIndex: "dclNo",
      width: 140,
      render: (text) => (
        <div style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>{text}</div>
      ),
    },
    {
      title: "Customer No",
      dataIndex: "customerNumber",
      width: 120,
      render: (text) => (
        <span style={{ color: SECONDARY_PURPLE }}>{text || "—"}</span>
      ),
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      width: 180,
      render: (text) => (
        <span style={{ fontWeight: 600, color: PRIMARY_BLUE }}>
          <UserOutlined style={{ marginRight: 6 }} />
          {text}
        </span>
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
      width: 130,
    },
    {
      title: "RM",
      dataIndex: "assignedToRM",
      width: 140,
      render: (rm) => (
        <span>
          <UserOutlined style={{ marginRight: 6 }} />
          {rm?.name || "N/A"}
        </span>
      ),
    },
    {
      title: "Docs",
      dataIndex: "documents",
      width: 80,
      align: "center",
      render: (docs = []) => {
        const total =
          docs.reduce((sum, d) => sum + (d.docList?.length || 0), 0) || 0;
        return (
          <span style={{ fontWeight: "bold", color: PRIMARY_BLUE }}>
            {total}
          </span>
        );
      },
    },
    {
      title: "SLA",
      dataIndex: "slaExpiry",
      width: 90,
      render: (date) => {
        const daysLeft = dayjs(date).diff(dayjs(), "days");
        return (
          <Tag
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #d9d9d9",
              color: "#333",
            }}
          >
            {daysLeft > 0 ? `${daysLeft}d` : "Expired"}
          </Tag>
        );
      },
    },
    {
      title: "Locked By",
      dataIndex: "lockedBy",
      width: 140,
      render: (lockedBy, record) => {
        if (lockedBy && lockedBy.name) {
          return (
            <Tag
              icon={<LockOutlined />}
              color="warning"
              style={{ fontWeight: 600 }}
            >
              {lockedBy.name}
            </Tag>
          );
        }
        // Show locked by current user if this DCL is being worked on
        if (record.lockedByUserId === creatorId) {
          return (
            <Tag
              icon={<LockOutlined />}
              color="success"
              style={{ fontWeight: 600 }}
            >
              You
            </Tag>
          );
        }
        return (
          <Tag
            icon={<UnlockOutlined />}
            color="default"
            style={{ fontWeight: 600 }}
          >
            Available
          </Tag>
        );
      },
    },
    {
      title: "Status",
      width: 120,
      render: (_, record) => {
        const statusConfig = getStatusColor(record.status);

        return (
          <Tag
            style={{
              fontWeight: "bold",
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              border: `1.5px solid ${statusConfig.borderColor}`,
              color: statusConfig.textColor,
              backgroundColor: statusConfig.bgColor,
              minWidth: 65,
              textAlign: "center",
            }}
          >
            {record.status || "Unknown"}
          </Tag>
        );
      },
    },
  ];

  /* ---------------- TABLE STYLES ---------------- */
  const customTableStyles = `
    .myqueue-table .ant-table-wrapper {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(22, 70, 121, 0.08);
      border: 1px solid #e0e0e0;
    }
    .myqueue-table .ant-table-thead > tr > th {
      background-color: #f7f7f7 !important;
      color: ${PRIMARY_BLUE} !important;
      font-weight: 700;
      border-bottom: 3px solid ${ACCENT_LIME} !important;
    }
    .myqueue-table .ant-table-tbody > tr:hover > td {
      background-color: rgba(181, 211, 52, 0.1) !important;
      cursor: pointer;
    }
  `;

  /* ---------------- RENDER ---------------- */
  // Responsive padding
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 375;
  const padding = isMobile ? "8px 2px" : "24px";
  const cardMargin = isMobile ? 8 : 16;

  return (
    <div style={{ padding, boxSizing: "border-box" }}>
      <style>{customTableStyles}</style>
      {/* FILTER */}
      <Card size="small" style={{ marginBottom: cardMargin }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={12}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search DCL / Customer / Loan"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>
      </Card>

      {/* TABS */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        {/* NEW TAB: Unassigned DCLs */}

        <TabPane tab="CO Creator Review" key="co_creator_review">
          {isLoadingCreator ? (
            <Spin style={{ display: "block", margin: 40 }} />
          ) : coCreatorReviewQueue.length === 0 ? (
            <Empty description="No pending items" />
          ) : (
            <div className="myqueue-table">
              <Table
                rowKey="id"
                columns={getColumns()}
                dataSource={coCreatorReviewQueue}
                pagination={{ pageSize: 10 }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                })}
              />
            </div>
          )}
        </TabPane>

        <TabPane tab="RM Review" key="rm_review">
          {isLoadingCreator ? (
            <Spin style={{ display: "block", margin: 40 }} />
          ) : rmReviewQueue.length === 0 ? (
            <Empty description="No RM review items" />
          ) : (
            <div className="myqueue-table">
              <Table
                rowKey="id"
                columns={getColumns()}
                dataSource={rmReviewQueue}
                pagination={{ pageSize: 10 }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                })}
              />
            </div>
          )}
        </TabPane>

        <TabPane tab="CO Checker Review" key="co_checker_review">
          {isLoadingCreator ? (
            <Spin style={{ display: "block", margin: 40 }} />
          ) : coCheckerReviewQueue.length === 0 ? (
            <Empty description="No approved items" />
          ) : (
            <div className="myqueue-table">
              <Table
                rowKey="id"
                columns={getColumns()}
                dataSource={coCheckerReviewQueue}
                pagination={{ pageSize: 10 }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                })}
              />
            </div>
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              Active DCLs
              {unassignedQueue.length > 0 && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {unassignedQueue.length}
                </Tag>
              )}
            </span>
          }
          key="unassigned"
        >
          {isLoadingUnassigned ? (
            <Spin style={{ display: "block", margin: 40 }} />
          ) : unassignedQueue.length === 0 ? (
            <Empty description="No unassigned DCLs available" />
          ) : (
            <div className="myqueue-table">
              <Table
                rowKey="id"
                columns={getColumns()}
                dataSource={unassignedQueue}
                pagination={{ pageSize: 10 }}
                onRow={(r) => ({
                  onClick: () => handleSelectChecklist(r),
                })}
              />
            </div>
          )}
        </TabPane>
      </Tabs>

      {/* MODAL */}
      {selectedChecklist && (
        <ReviewChecklistModal
          checklist={selectedChecklist}
          open={!!selectedChecklist}
          onClose={() => setSelectedChecklist(null)}
          onChecklistUpdate={() => {
            // Refetch data when checklist is updated (e.g., after unlock on submit)
            console.log("Checklist updated, refetching data...");
            refetchCreatorChecklists();
            refetchSystemDcls();
          }}
        />
      )}
    </div>
  );
};

export default Myqueue;
