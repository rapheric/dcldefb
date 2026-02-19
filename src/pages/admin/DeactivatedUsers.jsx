import React, { useState, useMemo } from "react";
import { Table, Tag, Button, Space, Card, Typography, message, Modal, Row, Col, Statistic, Tooltip } from "antd";
import {
    PoweroffOutlined,
    SwapOutlined,
    ExclamationCircleOutlined,
    ReloadOutlined,
} from "@ant-design/icons";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from "recharts";
import ReassignModal from "./ReassignModal";
import { useGetUsersQuery, useReassignTasksMutation, useToggleActiveMutation } from "../../api/userApi";

const { Title, Text } = Typography;
const { confirm } = Modal;

const DeactivatedUsers = () => {
    const { data: users = [], isLoading, refetch } = useGetUsersQuery();
    const [toggleActive] = useToggleActiveMutation();
    const [reassignTasks, { isLoading: isReassigning }] = useReassignTasksMutation();
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Filter only deactivated users
    const deactivatedUsers = users.filter((u) => !u.active);

    // Calculate statistics
    const inactiveCount = deactivatedUsers.length;
    const totalUsers = users.length;
    const inactivePercentage = totalUsers > 0 ? Math.round((inactiveCount / totalUsers) * 100) : 0;

    // Chart data - Role distribution of inactive users
    const roleDistributionData = useMemo(() => {
        const roles = {};
        deactivatedUsers.forEach(user => {
            roles[user.role] = (roles[user.role] || 0) + 1;
        });
        return Object.entries(roles).map(([role, count]) => ({
            name: role.charAt(0).toUpperCase() + role.slice(1),
            users: count,
        }));
    }, [deactivatedUsers]);

    // Pie chart data with colors
    const pieData = useMemo(() => {
        const roleColors = {
            "Admin": "#1e3a8a",
            "Rm": "#3b82f6", 
            "Cocreator": "#60a5fa",
            "Cochecker": "#93c5fd",
            "Customer": "#bfdbfe",
            "Approver": "#dbeafe",
        };
        return roleDistributionData.map(item => ({
            ...item,
            fill: roleColors[item.name] || "#d1d5db",
        }));
    }, [roleDistributionData]);

    const handleActivate = async (userId) => {
        console.log('=== handleActivate called ===');
        console.log('userId:', userId);
        console.log('userId type:', typeof userId);
        console.log('toggleActive function:', toggleActive);

        try {
            console.log('=== Calling toggleActive directly ===');
            console.log('About to call toggleActive with:', userId);

            const result = await toggleActive(userId).unwrap();

            console.log('=== toggleActive SUCCESS ===');
            console.log('Result:', result);

            message.success("User activated successfully");
            await refetch();
            console.log('Data refetched after activation');
        } catch (err) {
            console.error('=== toggleActive ERROR ===');
            console.error('Full error:', err);
            console.error('Error status:', err?.status);
            console.error('Error data:', err?.data);
            console.error('Error message:', err?.data?.message || err?.message);

            message.error(err?.data?.message || err?.message || "Failed to activate user");
        }
    };

    const handleReassign = (user) => {
        setSelectedUser(user);
        setReassignModalOpen(true);
    };

    const handleConfirmReassign = async (fromUserId, toUserId) => {
        try {
            await reassignTasks({ fromUserId, toUserId }).unwrap();
            message.success("Tasks reassigned successfully!");
            setReassignModalOpen(false);
            refetch();
        } catch (err) {
            message.error(err?.data?.message || "Failed to reassign tasks");
        }
    };

    const getRoleColor = (role) => {
        const colors = {
            admin: "red",
            rm: "orange",
            cocreator: "green",
            cochecker: "purple",
            customer: "blue",
            approver: "cyan",
        };
        return colors[role] || "default";
    };

    // Filter available users for reassignment (same role and active)
    const getAvailableUsersForReassignment = (currentUser) => {
        if (!currentUser) return [];
        return users.filter(
            (u) => u._id !== currentUser._id && u.role === currentUser.role && u.active
        );
    };

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name) => <Text strong>{name}</Text>,
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: "Customer #",
            dataIndex: "customerNumber",
            key: "customerNumber",
            render: (customerNumber) => (
                <Tag color={customerNumber ? "blue" : "default"}>
                    {customerNumber || "N/A"}
                </Tag>
            ),
        },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            filters: [
                { text: "RM", value: "rm" },
                { text: "CO Creator", value: "cocreator" },
                { text: "CO Checker", value: "cochecker" },
                { text: "Approver", value: "approver" },
                { text: "Customer", value: "customer" },
                { text: "Admin", value: "admin" },
            ],
            onFilter: (value, record) => record.role === value,
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
            render: () => <Tag color="volcano">Inactive</Tag>,
        },
        {
            title: "Deactivated At",
            dataIndex: "updatedAt",
            key: "updatedAt",
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => {
                const availableUsers = getAvailableUsersForReassignment(record);
                // Check database flag for reassignment status
                const hasBeenReassigned = record.tasksReassigned === true;
                return (
                    <Space>
                        <Button
                            size="small"
                            type="primary"
                            icon={<SwapOutlined />}
                            onClick={() => handleReassign(record)}
                            disabled={availableUsers.length === 0 || hasBeenReassigned}
                        >
                            {hasBeenReassigned ? "Reassigned" : "Reassign Tasks"}
                        </Button>
                        <Button
                            size="small"
                            type="default"
                            icon={<PoweroffOutlined />}
                            onClick={() => handleActivate(record._id)}
                            style={{ color: '#52c41a', borderColor: '#52c41a' }}
                        >
                            Activate
                        </Button>
                    </Space>
                );
            },
        },
    ];

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
            {/* TOP HEADER */}
            <div style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                padding: "24px 32px",
                borderBottom: "1px solid #e0e7ff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
            }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <div>
                            <Title level={2} style={{ color: "white", margin: 0, marginBottom: 4 }}>
                                ⏸️ Deactivated Users
                            </Title>
                            <Text style={{ color: "#e0e7ff", fontSize: "14px" }}>
                                Manage and reactivate inactive user accounts
                            </Text>
                        </div>
                    </Col>
                    <Col>
                        <Tooltip title="Refresh data">
                            <Button
                                icon={<ReloadOutlined />}
                                size="large"
                                onClick={() => {
                                    refetch();
                                    message.success("Data refreshed!");
                                }}
                                style={{
                                    background: "rgba(255,255,255,0.2)",
                                    border: "1px solid rgba(255,255,255,0.3)",
                                    color: "white"
                                }}
                            />
                        </Tooltip>
                    </Col>
                </Row>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ padding: "32px" }}>

                {/* STATISTICS CARDS */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {/* Total Inactive Users Card */}
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            style={{
                                borderRadius: "12px",
                                border: "1px solid #e5e7eb",
                                background: "linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)",
                                cursor: "pointer",
                                transition: "all 0.3s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 8px 16px rgba(220, 38, 38, 0.12)";
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "none";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
                                    borderRadius: "10px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <PoweroffOutlined style={{ color: "white", fontSize: 24 }} />
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                                        Inactive Users
                                    </Text>
                                    <Statistic
                                        value={inactiveCount}
                                        style={{ color: "#991b1b" }}
                                        valueStyle={{ fontSize: 28, fontWeight: 700, color: "#991b1b" }}
                                    />
                                </div>
                            </Space>
                        </Card>
                    </Col>

                    {/* Percentage Card */}
                    <Col xs={24} sm={12} lg={6}>
                        <Card
                            style={{
                                borderRadius: "12px",
                                border: "1px solid #e5e7eb",
                                background: "linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)",
                                cursor: "pointer",
                                transition: "all 0.3s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 8px 16px rgba(202, 138, 4, 0.12)";
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "none";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    background: "linear-gradient(135deg, #ca8a04 0%, #92400e 100%)",
                                    borderRadius: "10px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}>
                                    <Text style={{ color: "white", fontSize: 20, fontWeight: "bold" }}>
                                        %
                                    </Text>
                                </div>
                                <div>
                                    <Text type="secondary" style={{ fontSize: "13px", fontWeight: 500 }}>
                                        Inactive Rate
                                    </Text>
                                    <Statistic
                                        value={inactivePercentage}
                                        style={{ color: "#92400e" }}
                                        suffix="%"
                                        valueStyle={{ fontSize: 28, fontWeight: 700, color: "#92400e" }}
                                    />
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                {/* CHARTS */}
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    {/* Role Distribution - Bar Chart */}
                    <Col xs={24} md={12}>
                        <Card
                            style={{
                                borderRadius: "12px",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            }}
                        >
                            <div style={{ marginBottom: "16px" }}>
                                <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                                    📊 Inactive Users by Role
                                </Title>
                                <Text type="secondary" style={{ fontSize: "12px" }}>
                                    Breakdown by role type
                                </Text>
                            </div>
                            {roleDistributionData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={roleDistributionData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="name" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <ChartTooltip />
                                        <Bar dataKey="users" fill="#dc2626" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                                    No inactive users data
                                </div>
                            )}
                        </Card>
                    </Col>

                    {/* Role Distribution - Pie Chart */}
                    <Col xs={24} md={12}>
                        <Card
                            style={{
                                borderRadius: "12px",
                                border: "1px solid #e5e7eb",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                            }}
                        >
                            <div style={{ marginBottom: "16px" }}>
                                <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                                    👥 Distribution by Role
                                </Title>
                                <Text type="secondary" style={{ fontSize: "12px" }}>
                                    Proportion of inactive users
                                </Text>
                            </div>
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, users }) => `${name}: ${users}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="users"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                                    No distribution data
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* USERS TABLE CARD */}
                <Card
                    style={{
                        borderRadius: "12px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        padding: "24px",
                    }}
                >
                    <div style={{ marginBottom: "20px" }}>
                        <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
                            👥 Inactive Users List
                        </Title>
                        <Text type="secondary" style={{ fontSize: "13px" }}>
                            {inactiveCount} inactive user{inactiveCount !== 1 ? "s" : ""} in the system
                        </Text>
                    </div>

                    <Table
                        rowKey="_id"
                        columns={columns}
                        dataSource={deactivatedUsers}
                        loading={isLoading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Total ${total} deactivated users`,
                        }}
                        locale={{
                            emptyText: "No deactivated users found",
                        }}
                    />
                </Card>
            </div>

            <ReassignModal
                visible={reassignModalOpen}
                onClose={() => setReassignModalOpen(false)}
                onConfirm={handleConfirmReassign}
                currentUser={selectedUser}
                availableUsers={getAvailableUsersForReassignment(selectedUser)}
                loading={isReassigning}
            />
        </div>
    );
};

export default DeactivatedUsers;
