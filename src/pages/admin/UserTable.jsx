// 

import React, { useState, useMemo } from "react";
import { Table, Tag, Button, Input } from "antd";
import {
  SearchOutlined,
  PoweroffOutlined,
} from "@ant-design/icons";

import {
  getNextRole,
  getNextRoleLabel,
} from "../../components/admin/RoleUtils";

const UserTable = ({ users, onToggleActive }) => {
  const [searchText, setSearchText] = useState("");

  // Filter to show only active users
  const activeUsers = useMemo(() => {
    return users.filter((u) => u.active);
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!searchText.trim()) return activeUsers;

    return activeUsers.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const customerNumber = (u.customerNumber || "").toLowerCase();
      const query = searchText.toLowerCase();
      return name.includes(query) || email.includes(query) || customerNumber.includes(query);
    });
  }, [activeUsers, searchText]);

  const columns = [
    {
      title: <span className="text-gray-700 dark:text-gray-300">Name</span>,
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <span className="text-gray-900 dark:text-gray-100">{name}</span>
      ),
    },
    {
      title: <span className="text-gray-700 dark:text-gray-300">Email</span>,
      dataIndex: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
      render: (email) => (
        <span className="text-gray-700 dark:text-gray-300">{email}</span>
      ),
    },
    {
      title: <span className="text-gray-700 dark:text-gray-300">Customer #</span>,
      dataIndex: "customerNumber",
      sorter: (a, b) => (a.customerNumber || "").localeCompare(b.customerNumber || ""),
      render: (customerNumber) => (
        <Tag
          color={customerNumber ? "blue" : "default"}
          className="dark:text-gray-200"
        >
          {customerNumber || "N/A"}
        </Tag>
      ),
    },
    {
      title: <span className="text-gray-700 dark:text-gray-300">Role</span>,
      dataIndex: "role",
      filters: [
        { text: "RM", value: "rm" },
        { text: "CO Creator", value: "cocreator" },
        { text: "CO Checker", value: "cochecker" },
        { text: "Admin", value: "admin" },
        { text: "Customer", value: "customer" },
      ],
      onFilter: (value, record) => record.role === value,
      render: (role) => (
        <Tag
          color={
            role === "admin"
              ? "red"
              : role === "cocreator"
                ? "green"
                : role === "customer"
                  ? "blue"
                  : role === "cochecker"
                    ? "purple"
                    : "default"
          }
          className="capitalize dark:text-gray-200"
        >
          {role}
        </Tag>
      ),
    },
    {
      title: <span className="text-gray-700 dark:text-gray-300">Status</span>,
      dataIndex: "active",
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      onFilter: (value, record) => record.active === value,
      render: (active) => (
        <Tag
          color={active ? "green" : "volcano"}
          className="dark:text-gray-200"
        >
          {active ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: <span className="text-gray-700 dark:text-gray-300">Actions</span>,
      render: (_, record) => (
        <Button
          size="small"
          danger
          icon={<PoweroffOutlined />}
          onClick={() => onToggleActive(record._id)}
          className="dark:bg-gray-700 dark:text-gray-200"
        >
          Deactivate
        </Button>
      ),
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-md">
      <div className="mb-4">
        <Input
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Search name or email..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full sm:w-72 dark:bg-gray-800 dark:text-gray-200"
          allowClear
        />
      </div>

      <div className="overflow-x-auto">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filteredUsers}
          pagination={{ pageSize: 6, showSizeChanger: false }}
          bordered
          className="rounded-lg dark:bg-gray-900 dark:text-gray-200"
        />
      </div>
    </div>
  );
};

export default UserTable;

