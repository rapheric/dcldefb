// import React, { useState } from "react";
// import {
//     Card,
//     Table,
//     Tag,
//     Space,
//     Typography,
//     Button,
//     Badge,
//     Statistic,
//     Row,
//     Col,
//     Select,
//     message,
// } from "antd";
// import {
//     DownloadOutlined,
//     UserOutlined,
//     FileTextOutlined,
//     ReloadOutlined,
// } from "@ant-design/icons";
// import { useGetUsersQuery } from "../../api/userApi";
// import axios from "axios";
// import { jsPDF } from "jspdf";
// import autoTable from "jspdf-autotable";
// import dayjs from "dayjs";

// const { Title, Text } = Typography;
// const { Option } = Select;

// const AuditLogsPage = () => {
//     const { data: users = [], isLoading, refetch } = useGetUsersQuery();
//     const [selectedRole, setSelectedRole] = useState("all");

//     // Count users by role
//     const usersByRole = {
//         all: users.length,
//         admin: users.filter((u) => u.role === "admin").length,
//         cocreator: users.filter((u) => u.role === "cocreator").length,
//         cochecker: users.filter((u) => u.role === "cochecker").length,
//         customer: users.filter((u) => u.role === "customer").length,
//         rm: users.filter((u) => u.role === "rm").length,
//     };

//     // Filter users by selected role
//     const filteredUsers =
//         selectedRole === "all"
//             ? users
//             : users.filter((u) => u.role === selectedRole);

//     const getRoleColor = (role) => {
//         const colors = {
//             admin: "red",
//             cocreator: "green",
//             cochecker: "purple",
//             customer: "blue",
//             rm: "orange",
//         };
//         return colors[role] || "default";
//     };

//     const generateUserActivityPDF = async (user) => {
//         try {
//             console.log("📄 Starting PDF generation for user:", user.name);
//             message.loading({ content: "Generating PDF...", key: "pdf" });

//             // Fetch real activity data from API
//             const storedUser = JSON.parse(localStorage.getItem('user'));
//             const token = storedUser?.token;

//             if (!token) {
//                 throw new Error("Authentication token not found. Please log in again.");
//             }

//             const baseURL = import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000";

//             const response = await axios.get(`${baseURL}/api/users/${user._id}/activity`, {
//                 headers: {
//                     Authorization: `Bearer ${token}`
//                 }
//             });

//             const userActivities = response.data.activities || [];
//             console.log("📊 Fetched activities:", userActivities.length);

//             const doc = new jsPDF();
//             const pageWidth = doc.internal.pageSize.getWidth();

//             // Header
//             doc.setFillColor(43, 28, 103);
//             doc.rect(0, 0, pageWidth, 40, "F");

//             doc.setTextColor(255, 255, 255);
//             doc.setFontSize(20);
//             doc.text("User Activity Report", pageWidth / 2, 20, { align: "center" });

//             doc.setFontSize(10);
//             doc.text(`Generated: ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`, pageWidth / 2, 30, {
//                 align: "center",
//             });

//             // User Information
//             doc.setTextColor(0, 0, 0);
//             doc.setFontSize(14);
//             doc.text("User Information", 14, 55);

//             const userInfo = [
//                 ["Name", user.name || "N/A"],
//                 ["Email", user.email || "N/A"],
//                 ["Role", (user.role || "").toUpperCase()],
//                 ["Status", user.active ? "Active" : "Inactive"],
//                 ["Customer Number", user.customerNumber || "N/A"],
//                 ["RM ID", user.rmId || "N/A"],
//                 ["Account Created", user.createdAt ? dayjs(user.createdAt).format("YYYY-MM-DD HH:mm:ss") : "N/A"],
//                 ["Last Updated", user.updatedAt ? dayjs(user.updatedAt).format("YYYY-MM-DD HH:mm:ss") : "N/A"],
//             ];

//             autoTable(doc, {
//                 startY: 60,
//                 head: [["Field", "Value"]],
//                 body: userInfo,
//                 theme: "striped",
//                 headStyles: { fillColor: [43, 28, 103] },
//             });

//             // Activity Log Section
//             let finalY = doc.lastAutoTable.finalY + 15;
//             doc.setFontSize(14);
//             doc.text(`Recent Activity (${userActivities.length} records)`, 14, finalY);

//             if (userActivities.length > 0) {
//                 // Use real activity data
//                 const activityData = userActivities.slice(0, 50).map(activity => [
//                     dayjs(activity.date).format("YYYY-MM-DD HH:mm:ss"),
//                     activity.action.replace(/_/g, ' '),
//                     activity.details || "No details available",
//                     activity.status || "Success"
//                 ]);

//                 autoTable(doc, {
//                     startY: finalY + 5,
//                     head: [["Date", "Action", "Details", "Status"]],
//                     body: activityData,
//                     theme: "grid",
//                     headStyles: { fillColor: [43, 28, 103] },
//                     styles: { fontSize: 8 },
//                     columnStyles: {
//                         0: { cellWidth: 40 },
//                         1: { cellWidth: 35 },
//                         2: { cellWidth: 80 },
//                         3: { cellWidth: 25 }
//                     }
//                 });
//             } else {
//                 // No activity found
//                 doc.setFontSize(10);
//                 doc.setTextColor(128, 128, 128);
//                 doc.text("No activity records found for this user.", 14, finalY + 10);
//             }

//             // Footer
//             const pageCount = doc.internal.getNumberOfPages();
//             for (let i = 1; i <= pageCount; i++) {
//                 doc.setPage(i);
//                 doc.setFontSize(8);
//                 doc.setTextColor(128, 128, 128);
//                 doc.text(
//                     `Page ${i} of ${pageCount}`,
//                     pageWidth / 2,
//                     doc.internal.pageSize.getHeight() - 10,
//                     { align: "center" }
//                 );
//             }

//             // Save PDF
//             const filename = `${user.name.replace(/[^a-z0-9]/gi, '_')}_Activity_Report_${dayjs().format("YYYY-MM-DD")}.pdf`;
//             console.log("💾 Saving PDF as:", filename);
//             doc.save(filename);

//             console.log("✅ PDF generated successfully");
//             message.success({ content: "PDF downloaded successfully!", key: "pdf", duration: 3 });
//         } catch (error) {
//             console.error("❌ Error generating PDF:", error);
//             message.error({ content: `Failed to generate PDF: ${error.message}`, key: "pdf", duration: 5 });
//         }
//     };

//     const columns = [
//         {
//             title: "Name",
//             dataIndex: "name",
//             key: "name",
//             sorter: (a, b) => a.name.localeCompare(b.name),
//             render: (name, record) => (
//                 <Space>
//                     <UserOutlined />
//                     <div>
//                         <div>
//                             <Text strong>{name}</Text>
//                         </div>
//                         <div>
//                             <Text type="secondary" style={{ fontSize: 12 }}>
//                                 {record.email}
//                             </Text>
//                         </div>
//                     </div>
//                 </Space>
//             ),
//         },
//         {
//             title: "Role",
//             dataIndex: "role",
//             key: "role",
//             render: (role) => (
//                 <Tag color={getRoleColor(role)} className="capitalize">
//                     {role}
//                 </Tag>
//             ),
//         },
//         {
//             title: "Status",
//             dataIndex: "active",
//             key: "active",
//             render: (active) => (
//                 <Tag color={active ? "success" : "default"}>
//                     {active ? "Active" : "Inactive"}
//                 </Tag>
//             ),
//         },
//         {
//             title: "Customer No.",
//             dataIndex: "customerNumber",
//             key: "customerNumber",
//             render: (num) => <Text>{num || "—"}</Text>,
//         },
//         {
//             title: "Joined",
//             dataIndex: "createdAt",
//             key: "createdAt",
//             sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
//             render: (date) => dayjs(date).format("YYYY-MM-DD"),
//         },
//         {
//             title: "Action",
//             key: "action",
//             render: (_, record) => (
//                 <Button
//                     type="primary"
//                     icon={<DownloadOutlined />}
//                     onClick={() => generateUserActivityPDF(record)}
//                     size="small"
//                 >
//                     Download Activity
//                 </Button>
//             ),
//         },
//     ];

//     return (
//         <div style={{ padding: 24 }}>
//             <Card
//                 style={{
//                     borderRadius: 10,
//                     boxShadow: "0 3px 15px rgba(0,0,0,0.1)",
//                 }}
//             >
//                 <Space direction="vertical" size="large" style={{ width: "100%" }}>
//                     {/* Header */}
//                     <div
//                         style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                         }}
//                     >
//                         <Space direction="vertical" size={0}>
//                             <Title level={3} style={{ margin: 0 }}>
//                                 <FileTextOutlined /> Audit Logs
//                             </Title>
//                             <Text type="secondary">
//                                 User activity tracking and report generation
//                             </Text>
//                         </Space>

//                         <Space>
//                             <Select
//                                 value={selectedRole}
//                                 onChange={setSelectedRole}
//                                 style={{ width: 150 }}
//                             >
//                                 <Option value="all">All Roles ({usersByRole.all})</Option>
//                                 <Option value="admin">Admin ({usersByRole.admin})</Option>
//                                 <Option value="cocreator">CO Creator ({usersByRole.cocreator})</Option>
//                                 <Option value="cochecker">CO Checker ({usersByRole.cochecker})</Option>
//                                 <Option value="customer">Customer ({usersByRole.customer})</Option>
//                                 <Option value="rm">RM ({usersByRole.rm})</Option>
//                             </Select>

//                             <Button
//                                 icon={<ReloadOutlined />}
//                                 onClick={() => refetch()}
//                                 loading={isLoading}
//                             >
//                                 Refresh
//                             </Button>
//                         </Space>
//                     </div>

//                     {/* Statistics Cards */}
//                     <Row gutter={16}>
//                         <Col xs={24} sm={12} md={8} lg={4}>
//                             <Card>
//                                 <Statistic
//                                     title="Total Users"
//                                     value={usersByRole.all}
//                                     prefix={<UserOutlined />}
//                                     valueStyle={{ color: "#3f8600" }}
//                                 />
//                             </Card>
//                         </Col>
//                         <Col xs={24} sm={12} md={8} lg={4}>
//                             <Card>
//                                 <Statistic
//                                     title="Admins"
//                                     value={usersByRole.admin}
//                                     valueStyle={{ color: "#cf1322" }}
//                                 />
//                             </Card>
//                         </Col>
//                         <Col xs={24} sm={12} md={8} lg={4}>
//                             <Card>
//                                 <Statistic
//                                     title="CO Creators"
//                                     value={usersByRole.cocreator}
//                                     valueStyle={{ color: "#52c41a" }}
//                                 />
//                             </Card>
//                         </Col>
//                         <Col xs={24} sm={12} md={8} lg={4}>
//                             <Card>
//                                 <Statistic
//                                     title="CO Checkers"
//                                     value={usersByRole.cochecker}
//                                     valueStyle={{ color: "#722ed1" }}
//                                 />
//                             </Card>
//                         </Col>
//                         <Col xs={24} sm={12} md={8} lg={4}>
//                             <Card>
//                                 <Statistic
//                                     title="Customers"
//                                     value={usersByRole.customer}
//                                     valueStyle={{ color: "#1890ff" }}
//                                 />
//                             </Card>
//                         </Col>
//                         <Col xs={24} sm={12} md={8} lg={4}>
//                             <Card>
//                                 <Statistic
//                                     title="RMs"
//                                     value={usersByRole.rm}
//                                     valueStyle={{ color: "#fa8c16" }}
//                                 />
//                             </Card>
//                         </Col>
//                     </Row>

//                     {/* Users Table */}
//                     <Table
//                         columns={columns}
//                         dataSource={filteredUsers}
//                         rowKey="_id"
//                         loading={isLoading}
//                         pagination={{
//                             pageSize: 10,
//                             showSizeChanger: true,
//                             showTotal: (total) => `Total ${total} users`,
//                         }}
//                         bordered
//                     />
//                 </Space>
//             </Card>
//         </div>
//     );
// };

// export default AuditLogsPage;

import React, { useState, useMemo } from "react";
import {
    Card,
    Table,
    Tag,
    Space,
    Typography,
    Button,
    Badge,
    Statistic,
    Row,
    Col,
    Select,
    message,
    Modal,
    Timeline,
    Empty,
    Spin,
    DatePicker,
} from "antd";
import {
    DownloadOutlined,
    UserOutlined,
    FileTextOutlined,
    ReloadOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    FilterOutlined,
    ClearOutlined,
} from "@ant-design/icons";
import { useGetUsersQuery } from "../../api/userApi";
import axios from "axios";
import { generateAuditPDF } from "../../utils/reportGenerator";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const AuditLogsPage = () => {
    const { data: users = [], isLoading, refetch } = useGetUsersQuery();
    const [selectedRole, setSelectedRole] = useState("all");
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userActivities, setUserActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [dateRange, setDateRange] = useState(null);

    // Count users by role
    const usersByRole = {
        all: users.length,
        admin: users.filter((u) => u.role === "admin").length,
        cocreator: users.filter((u) => u.role === "cocreator").length,
        cochecker: users.filter((u) => u.role === "cochecker").length,
        customer: users.filter((u) => u.role === "customer").length,
        rm: users.filter((u) => u.role === "rm").length,
    };

    // Filter users by selected role
    const filteredUsers =
        selectedRole === "all"
            ? users
            : users.filter((u) => u.role === selectedRole);

    const getRoleColor = (role) => {
        const colors = {
            admin: "red",
            cocreator: "green",
            cochecker: "purple",
            customer: "blue",
            rm: "orange",
        };
        return colors[role] || "default";
    };

    const fetchUserActivities = async (user) => {
        try {
            setLoadingActivities(true);
            console.log("📊 Fetching activities for user:", user.name);

            const storedUser = JSON.parse(localStorage.getItem('user'));
            const token = storedUser?.token;

            if (!token) {
                throw new Error("Authentication token not found. Please log in again.");
            }

            const baseURL = import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000";

            const response = await axios.get(`${baseURL}/api/users/${user._id}/activity`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const activities = response.data.activities || [];
            console.log("✅ Fetched activities:", activities.length);

            setUserActivities(activities);
            setSelectedUser(user);
            setModalVisible(true);
        } catch (error) {
            console.error("❌ Error fetching activities:", error);
            message.error(`Failed to fetch user activities: ${error.message}`);
        } finally {
            setLoadingActivities(false);
        }
    };

    const handleViewActivity = (user) => {
        fetchUserActivities(user);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedUser(null);
        setDateRange(null);
    };

    const handleDownloadFromModal = () => {
        if (selectedUser) {
            // Pass filtered activities to PDF generation
            generateUserActivityPDF(selectedUser, filteredActivities);
        }
    };

    const handleDateRangeChange = (dates) => {
        setDateRange(dates);
    };

    const handleClearFilter = () => {
        setDateRange(null);
    };

    // Filter activities based on date range
    const filteredActivities = useMemo(() => {
        if (!dateRange || !dateRange[0] || !dateRange[1]) {
            return userActivities;
        }

        const [startDate, endDate] = dateRange;
        return userActivities.filter((activity) => {
            const activityDate = dayjs(activity.date);
            return activityDate.isBetween(
                startDate.startOf('day'),
                endDate.endOf('day'),
                null,
                '[]'
            );
        });
    }, [userActivities, dateRange]);

    const generateUserActivityPDF = async (user, activities = null) => {
        try {
            message.loading({ content: "Generating PDF...", key: "pdf" });

            let userActivities = activities;

            // If activities not provided, fetch them
            if (!userActivities) {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                const token = storedUser?.token;

                if (!token) {
                    throw new Error("Authentication token not found. Please log in again.");
                }

                const baseURL = import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000";

                const response = await axios.get(`${baseURL}/api/users/${user._id}/activity`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                userActivities = response.data.activities || [];
            }

            // Format activities for PDF export
            const formattedActivities = (userActivities || []).map((item) => ({
                timestamp: item.date || item.timestamp || item.createdAt,
                userName: user.name,
                action: item.action || item.activity || "N/A",
                description: item.details || item.description || "N/A",
                status: item.status || "success"
            }));

            // Use unified PDF export
            generateAuditPDF(formattedActivities, `${user.name} Activity Report`);
            
            message.success({ content: "PDF downloaded successfully!", key: "pdf", duration: 3 });
        } catch (error) {
            console.error("❌ Error generating PDF:", error);
            message.error({ content: `Failed to generate PDF: ${error.message}`, key: "pdf", duration: 5 });
        }
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name, record) => (
                <Space>
                    <UserOutlined />
                    <div>
                        <div>
                            <Text strong>{name}</Text>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {record.email}
                            </Text>
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role) => (
                <Tag color={getRoleColor(role)} className="capitalize">
                    {role}
                </Tag>
            ),
        },
        {
            title: "Status",
            dataIndex: "active",
            key: "active",
            render: (active) => (
                <Tag color={active ? "success" : "default"}>
                    {active ? "Active" : "Inactive"}
                </Tag>
            ),
        },
        {
            title: "Customer No.",
            dataIndex: "customerNumber",
            key: "customerNumber",
            render: (num) => <Text>{num || "—"}</Text>,
        },
        {
            title: "Joined",
            dataIndex: "createdAt",
            key: "createdAt",
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            render: (date) => dayjs(date).format("YYYY-MM-DD"),
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewActivity(record)}
                        size="small"
                        loading={loadingActivities && selectedUser?._id === record._id}
                    >
                        View Activity
                    </Button>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() => generateUserActivityPDF(record)}
                        size="small"
                    >
                        Download
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Card
                style={{
                    borderRadius: 10,
                    boxShadow: "0 3px 15px rgba(0,0,0,0.1)",
                }}
            >
                <Space direction="vertical" size="large" style={{ width: "100%" }}>
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Space direction="vertical" size={0}>
                            <Title level={3} style={{ margin: 0 }}>
                                <FileTextOutlined /> Audit Logs
                            </Title>
                            <Text type="secondary">
                                User activity tracking and report generation
                            </Text>
                        </Space>

                        <Space>
                            <Select
                                value={selectedRole}
                                onChange={setSelectedRole}
                                style={{ width: 150 }}
                            >
                                <Option value="all">All Roles ({usersByRole.all})</Option>
                                <Option value="admin">Admin ({usersByRole.admin})</Option>
                                <Option value="cocreator">CO Creator ({usersByRole.cocreator})</Option>
                                <Option value="cochecker">CO Checker ({usersByRole.cochecker})</Option>
                                <Option value="customer">Customer ({usersByRole.customer})</Option>
                                <Option value="rm">RM ({usersByRole.rm})</Option>
                            </Select>

                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => refetch()}
                                loading={isLoading}
                            >
                                Refresh
                            </Button>
                        </Space>
                    </div>

                    {/* Statistics Cards */}
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="Total Users"
                                    value={usersByRole.all}
                                    prefix={<UserOutlined />}
                                    valueStyle={{ color: "#3f8600" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="Admins"
                                    value={usersByRole.admin}
                                    valueStyle={{ color: "#cf1322" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="CO Creators"
                                    value={usersByRole.cocreator}
                                    valueStyle={{ color: "#52c41a" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="CO Checkers"
                                    value={usersByRole.cochecker}
                                    valueStyle={{ color: "#722ed1" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="Customers"
                                    value={usersByRole.customer}
                                    valueStyle={{ color: "#1890ff" }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={4}>
                            <Card>
                                <Statistic
                                    title="RMs"
                                    value={usersByRole.rm}
                                    valueStyle={{ color: "#fa8c16" }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Users Table */}
                    <Table
                        columns={columns}
                        dataSource={filteredUsers}
                        rowKey="_id"
                        loading={isLoading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} users`,
                        }}
                        bordered
                    />
                </Space>
            </Card>

            {/* Activity Modal */}
            <Modal
                title={
                    <Space>
                        <UserOutlined />
                        <span>
                            Activity History - {selectedUser?.name}
                        </span>
                    </Space>
                }
                open={modalVisible}
                onCancel={handleCloseModal}
                width={800}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        Close
                    </Button>,
                    <Button
                        key="download"
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleDownloadFromModal}
                    >
                        Download PDF
                    </Button>,
                ]}
            >
                {loadingActivities ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16 }}>Loading activities...</div>
                    </div>
                ) : userActivities.length > 0 ? (
                    <div>
                        {/* User Info Summary */}
                        <Card size="small" style={{ marginBottom: 16, background: "#f5f5f5" }}>
                            <Row gutter={16}>
                                <Col span={8}>
                                    <Text strong>Email:</Text> {selectedUser?.email}
                                </Col>
                                <Col span={8}>
                                    <Text strong>Role:</Text>{" "}
                                    <Tag color={getRoleColor(selectedUser?.role)}>
                                        {selectedUser?.role?.toUpperCase()}
                                    </Tag>
                                </Col>
                                <Col span={8}>
                                    <Text strong>Status:</Text>{" "}
                                    <Tag color={selectedUser?.active ? "success" : "default"}>
                                        {selectedUser?.active ? "Active" : "Inactive"}
                                    </Tag>
                                </Col>
                            </Row>
                        </Card>

                        {/* Date Filter */}
                        <Card size="small" style={{ marginBottom: 16 }}>
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <Space>
                                    <FilterOutlined />
                                    <Text strong>Filter by Date:</Text>
                                </Space>
                                <Space>
                                    <RangePicker
                                        value={dateRange}
                                        onChange={handleDateRangeChange}
                                        format="YYYY-MM-DD"
                                        style={{ width: 280 }}
                                        presets={[
                                            { label: 'Today', value: [dayjs().startOf('day'), dayjs().endOf('day')] },
                                            { label: 'Yesterday', value: [dayjs().subtract(1, 'day').startOf('day'), dayjs().subtract(1, 'day').endOf('day')] },
                                            { label: 'Last 7 Days', value: [dayjs().subtract(7, 'day'), dayjs()] },
                                            { label: 'Last 30 Days', value: [dayjs().subtract(30, 'day'), dayjs()] },
                                            { label: 'This Month', value: [dayjs().startOf('month'), dayjs().endOf('month')] },
                                            { label: 'Last Month', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                                        ]}
                                    />
                                    {dateRange && (
                                        <Button
                                            icon={<ClearOutlined />}
                                            onClick={handleClearFilter}
                                            size="small"
                                        >
                                            Clear Filter
                                        </Button>
                                    )}
                                    <Text type="secondary">
                                        Showing {filteredActivities.length} of {userActivities.length} activities
                                    </Text>
                                </Space>
                            </Space>
                        </Card>

                        {/* Activity Timeline */}
                        {filteredActivities.length > 0 ? (
                            <div style={{ maxHeight: "500px", overflowY: "auto", padding: "8px" }}>
                                <Timeline mode="left">
                                    {filteredActivities.map((activity, index) => (
                                        <Timeline.Item
                                            key={index}
                                            color={activity.status === "success" ? "green" : "red"}
                                            label={
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {dayjs(activity.date).format("YYYY-MM-DD HH:mm:ss")}
                                                </Text>
                                            }
                                        >
                                            <Space direction="vertical" size={4}>
                                                <Text strong style={{ fontSize: 14 }}>
                                                    {activity.action.replace(/_/g, " ")}
                                                </Text>
                                                {activity.details && (
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {activity.details}
                                                    </Text>
                                                )}
                                                {activity.status && (
                                                    <Tag
                                                        color={activity.status === "success" ? "success" : "error"}
                                                        style={{ fontSize: 11 }}
                                                    >
                                                        {activity.status.toUpperCase()}
                                                    </Tag>
                                                )}
                                            </Space>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            </div>
                        ) : (
                            <Empty
                                description={
                                    dateRange
                                        ? "No activities found in the selected date range"
                                        : "No activities found"
                                }
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                style={{ marginTop: 20 }}
                            />
                        )}

                        <div style={{ marginTop: 16, textAlign: "center" }}>
                            <Text type="secondary">
                                <ClockCircleOutlined /> {dateRange
                                    ? `${filteredActivities.length} of ${userActivities.length} activities`
                                    : `Total ${userActivities.length} activities`}
                            </Text>
                        </div>
                    </div>
                ) : (
                    <Empty
                        description="No activity records found for this user"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                )}
            </Modal>
        </div>
    );
};

export default AuditLogsPage;