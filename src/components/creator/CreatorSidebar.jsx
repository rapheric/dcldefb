import React from "react";
import SharedSidebar from "../common/SharedSidebar";
import {
  CirclePlus,
  Inbox,
  Clock,
  CheckCircle,
  BarChart2,
  FileEdit,
} from "lucide-react";

const CreatorSidebar = ({
  selectedKey,
  setSelectedKey,
  collapsed,
  toggleCollapse,
  onMenuItemClick,
}) => {
  const menuItems = [
    {
      key: "creatchecklist",
      icon: <CirclePlus size={18} />,
      label: "Create New DCL",
    },
    {
      key: "drafts",
      icon: <FileEdit size={18} />,
      label: "Drafts",
    },
    {
      key: "myqueue",
      icon: <Inbox size={18} />,
      label: "My Queue",
    },
    {
      key: "deferrals",
      icon: <Clock size={18} />,
      label: "Deferrals",
    },
    {
      key: "completed",
      icon: <CheckCircle size={18} />,
      label: "Completed",
    },
    {
      key: "report",
      icon: <BarChart2 size={18} />,
      label: "Reports",
    },
  ];

  return (
    <SharedSidebar
      selectedKey={selectedKey}
      setSelectedKey={setSelectedKey}
      collapsed={collapsed}
      toggleCollapse={toggleCollapse}
      onMenuItemClick={onMenuItemClick}
      menuItems={menuItems}
    />
  );
};

export default CreatorSidebar;
