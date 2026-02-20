import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  DatePicker,
  Table,
  Tag,
  Upload,
  Divider,
  Typography,
  Modal,
  Steps,
  Space,
  message,
  Form,
  InputNumber,
  Descriptions,
  Tooltip,
  List,
  Avatar
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  EyeOutlined,
  BankOutlined,
  MailOutlined,
  FileDoneOutlined,
  PaperClipOutlined,
  SendOutlined,
  BellOutlined,
  ArrowLeftOutlined,
  FileOutlined
} from "@ant-design/icons";

import deferralApi from "../../service/deferralApi";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

// Import the separate components
import DocumentPicker from "../../components/deferrals/DocumentPicker";
import ApproverSelector from "../../components/deferrals/ApproverSelector";
import { useGetApproversQuery } from "../../api/userApi";
import FacilityTable from "../../components/deferrals/FacilityTable";

// Theme colors from MyQueue
const PRIMARY_PURPLE = "#2B1C67";
const PRIMARY_BLUE = "#164679";
const ACCENT_LIME = "#b5d334";
const SECONDARY_BLUE = "#164679";
const SUCCESS_GREEN = "#52c41a";
const ERROR_RED = "#ff4d4f";
const WARNING_ORANGE = "#faad14";

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Post-submission modal removed — navigation will redirect to My Deferrals after successful submit

export default function DeferralForm({ userId, onSuccess }) {
  const navigate = useNavigate();

  // ----------------------
  // STATES
  // ----------------------
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [isCustomerFetched, setIsCustomerFetched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User state - will be populated from your auth system
  const [currentUser, setCurrentUser] = useState({
    name: "",
    role: "",
    email: "",
    employeeId: ""
  });

  // Populate current user from stored auth info so the Requestor label shows their name
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const u = parsed?.user || {};
        setCurrentUser((prev) => ({
          ...prev,
          name: u.name || prev.name || 'Requestor',
          role: u.role || prev.role,
          email: u.email || prev.email,
          employeeId: u.employeeId || prev.employeeId,
        }));
      }
    } catch (e) {
      console.warn('Unable to load user from storage', e);
    }
  }, []);

  const [customerName, setCustomerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("");
  const [loanType, setLoanType] = useState(""); // Added for customer info card

  // legacy approvers array (kept for backward compatibility)
  const [approvers, setApprovers] = useState([""]);

  // Slots driven by approval matrix; each slot: { role, userId }
  const [approverSlots, setApproverSlots] = useState([]);
  const [approverCustomized, setApproverCustomized] = useState(false);

  // Fetch available approvers from server for selector
  const { data: approverList = [], isLoading: approversLoading } = useGetApproversQuery();
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  // Determine document category (Primary when any selected doc is Primary)
  const documentCategory = selectedDocuments.some((d) => d.type === "Primary") ? "Primary" : "Secondary";

  // Loan amount state needed by parsedLoanAmount — define before function to avoid TDZ
  const [loanAmount, setLoanAmount] = useState("");

  const parsedLoanAmount = () => {
    if (!loanAmount) return 0;
    try {
      const loanStr = String(loanAmount).toLowerCase().trim();
      
      // Handle predefined dropdown values
      if (loanStr === "above75") return 76000000; // Above threshold
      if (loanStr === "below75") return 74000000; // Below threshold
      
      // Handle numeric input (fallback for direct number entry)
      const normalized = loanStr.replace(/[^0-9.-]+/g, "");
      return parseFloat(normalized) || 0;
    } catch (e) {
      return 0;
    }
  };

  const LOAN_THRESHOLD = 75000000; // 75M

  const computeDefaultRoles = () => {
    const hasPrimary = selectedDocuments.some(
      (d) => String(d?.type || "").toLowerCase() === "primary"
    );
    const hasSecondary = selectedDocuments.some(
      (d) => String(d?.type || "").toLowerCase() === "secondary"
    );
    const isAboveThreshold = parsedLoanAmount() > LOAN_THRESHOLD;

    if (hasPrimary) {
      return isAboveThreshold
        ? [
            "Head of Business Segment",
            "Group Director of Business Unit",
            "Senior Manager, Retail & Corporate Credit Approvals / Assistant General Manager Corporate Credit Approvals / Head of Retail/Corporate Credit approvals",
          ]
        : [
            "Head of Business Segment / Corporate Sector head",
            "Director of Business Unit",
            "Senior Manager, Retail & Corporate Credit Approvals / Assistant General Manager Corporate Credit Approvals / Head of Retail/Corporate Credit approvals",
          ];
    }

    if (hasSecondary) {
      return isAboveThreshold
        ? [
            "Head of Business Segment",
            "Group Director of Business Unit",
            "Head of Credit Operations",
          ]
        : [
            "Head of Business Segment",
            "Director of Business Unit",
            "Head of Credit Operations",
          ];
    }

    return [];
  };

  // Initialize approver slots when document selection or loan amount changes
  // Always update when documents or loan amount change, even if user has customized approvers
  useEffect(() => {
    const defaultRoles = computeDefaultRoles();
    if (defaultRoles.length > 0) {
      // Use functional update to access current state and avoid stale closure
      setApproverSlots((prevSlots) => {
        return defaultRoles.map((role, index) => {
          const existingSlot = prevSlots[index];
          return {
            role,
            userId: existingSlot?.userId || "",
            isCustom: existingSlot?.isCustom || false
          };
        });
      });
    }
  }, [selectedDocuments.length, loanAmount, LOAN_THRESHOLD]);


  const [daysSought, setDaysSought] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [dclNumber, setDclNumber] = useState("");
  const [deferralDescription, setDeferralDescription] = useState("");

  // Customer search form state
  const [searchCustomerNumber, setSearchCustomerNumber] = useState("");
  const [searchLoanType, setSearchLoanType] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [selectCustomerModalVisible, setSelectCustomerModalVisible] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const searchTimeoutRef = useRef(null);

  // DCL search form state
  const [searchMode, setSearchMode] = useState("customer"); // "customer" or "dcl"
  const [searchDclNumber, setSearchDclNumber] = useState("");
  const [dclSearchResults, setDclSearchResults] = useState([]);
  const dclSearchTimeoutRef = useRef(null);
  const [isSearchedByDcl, setIsSearchedByDcl] = useState(false); // Track if DCL search was used
  const [selectedDclId, setSelectedDclId] = useState(null); // Store selected DCL ID

  // File upload states
  const [dclFile, setDclFile] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);
  // Comments for the deferral
  const [comments, setComments] = useState('');
  const [postedComments, setPostedComments] = useState([]);
  // Post-submission modal state removed; we will redirect to My Deferrals after create

  // ----------------------
  // EFFECT to get current user
  // ----------------------
  useEffect(() => {
    // This function should fetch the current logged-in user from your auth system
    // Replace this with your actual authentication logic
    const fetchCurrentUser = async () => {
      try {
        // Example: Get user from localStorage, context, or API
        const userData = localStorage.getItem('currentUser');

        if (userData) {
          // If you store user data in localStorage
          const parsedUser = JSON.parse(userData);
          setCurrentUser({
            name: parsedUser.name || "",
            role: parsedUser.role || "",
            email: parsedUser.email || "",
            employeeId: parsedUser.employeeId || ""
          });
        } else {
          // No stored user; integrate with your auth system to populate `currentUser`
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // Unable to populate current user; ensure auth integration is configured
      }
    };

    fetchCurrentUser();
  }, []);

  // ----------------------
  // FORMAT LOAN TYPE FUNCTION
  // ----------------------
  const formatLoanType = (loanType) => {
    if (!loanType) return "Not selected";

    // Map lowercase values to display values
    const loanTypeMap = {
      "asset finance": "Asset Finance",
      "business loan": "Business Loan",
      "consumer": "Consumer",
      "mortgage": "Mortgage",
      "construction": "Construction Loan",
      "shamba loan": "Shamba Loan"
    };

    return loanTypeMap[loanType.toLowerCase()] ||
      loanType.charAt(0).toUpperCase() + loanType.slice(1);
  };

  // ----------------------
  // HANDLERS for ApproverSelector (slot-based)
  // ----------------------
  const addApprover = (insertIndex, role) => {
    setApproverCustomized(true);
    const next = [...approverSlots];
    const slot = { role: role || "Approver", userId: "", isCustom: true };

    if (typeof insertIndex === "number" && Number.isFinite(insertIndex)) {
      const clampedIndex = Math.max(1, Math.min(insertIndex, next.length - 1));
      next.splice(clampedIndex, 0, slot);
      setApproverSlots(next);
      return;
    }

    setApproverSlots([...approverSlots, slot]);
  };

  const updateApprover = (index, userId, role) => {
    setApproverCustomized(true);
    const arr = [...approverSlots];
    arr[index] = {
      ...arr[index],
      userId,
      ...(role ? { role } : {}),
    };
    setApproverSlots(arr);
  };

  const removeApprover = (index) => {
    setApproverCustomized(true);
    setApproverSlots(approverSlots.filter((_, i) => i !== index));
  };

  // ----------------------
  // CUSTOMER FETCH
  // ----------------------
  const fetchCustomer = async () => {
    try {
      setIsFetching(true);
      // token is stored under localStorage 'user' as { user, token }
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      const token = stored?.token;

      let data = null;

      if (selectedCustomerId) {
        // If a customer was pre-selected from typeahead/modal, fetch fresh details from users endpoint
        const url = `${import.meta.env.VITE_API_URL}/api/users/customers/${selectedCustomerId}`;
        const res = await fetch(url, {
          headers: {
            ...(token ? { authorization: `Bearer ${token}` } : {}),
            "content-type": "application/json",
          },
        });

        if (res.status === 401) {
          message.error("Unauthorized: please login");
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch customer details");
        data = await res.json();
      } else {
        // Otherwise call core-banking/mock search with both fields
        const url = `${import.meta.env.VITE_API_URL}/api/customers/search`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ customerNumber: searchCustomerNumber, loanType: searchLoanType }),
        });

        if (res.status === 401) {
          message.error("Unauthorized: please login");
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch customers");
        data = await res.json();
      }

      if (!data) {
        message.info("No customer found");
        return;
      }

      // If an array was returned, handle chooser/one-result cases
      if (Array.isArray(data)) {
        if (data.length === 0) {
          message.info("No customer found");
          return;
        }

        if (data.length === 1) {
          const d = data[0];
          setCustomerName(d.name || "");
          setBusinessName(d.businessName || "");
          setCustomerNumber(d.customerNumber || "");
          setSelectedCustomerId(d._id || null);
        } else {
          setCustomerSearchResults(data);
          setSelectCustomerModalVisible(true);
          return;
        }
      } else {
        // single object
        const d = data;
        setCustomerName(d.customerName || d.name || "");
        setBusinessName(d.businessName || "");
        setCustomerNumber(d.customerNumber || "");
        setSelectedCustomerId(d._id || null);
      }

      // Set loan type to what RM selected in the search form (preferred), otherwise use returned loanType if provided
      if (searchLoanType) {
        setLoanType(searchLoanType);
      } else if (data?.loanType) {
        setLoanType(data.loanType);
      }



      // Proceed to deferral details page (hide search form)
      setIsCustomerFetched(true);
      setShowSearchForm(false);

    } catch (err) {
      console.error(err);
      message.error("Failed to fetch customers");
    } finally {
      setIsFetching(false);
    }
  };

  // Lightweight typeahead search used while typing customer number
  const searchCustomersTypeahead = async (q) => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      const token = stored?.token;
      const url = `${import.meta.env.VITE_API_URL}/api/users/customers?q=${encodeURIComponent(
        q
      )}${searchLoanType ? `&loanType=${encodeURIComponent(searchLoanType)}` : ""}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          "content-type": "application/json",
        },
      });
      if (!res.ok) return;
      const results = await res.json();
      setCustomerSearchResults(results || []);
    } catch (err) {
      console.error("Typeahead search failed", err);
    }
  };

  useEffect(() => {
    // Debounce as user types
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    // Trigger search after at least 1 digit
    if (!searchCustomerNumber || searchCustomerNumber.length < 1) {
      setCustomerSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCustomersTypeahead(searchCustomerNumber);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchCustomerNumber]);

  const handleSelectCustomer = (customer) => {
    // Prefill fields but DO NOT proceed to the deferral details page automatically.
    // The RM must click "Fetch Customer" to validate and move forward.
    setCustomerName(customer.name || "");
    setBusinessName(customer.businessName || "");
    setCustomerNumber(customer.customerNumber || "");
    setSearchCustomerNumber(customer.customerNumber || "");
    setSelectedCustomerId(customer._id || null);

    // Close selection UI but keep the search form visible so the RM can confirm and click Fetch
    setSelectCustomerModalVisible(false);
    setCustomerSearchResults([]);
  };

  const handleCloseCustomerModal = () => {
    setSelectCustomerModalVisible(false);
    setCustomerSearchResults([]);
  };

  // ----------------------
  // DCL SEARCH FUNCTIONS
  // ----------------------
  const searchDclsTypeahead = async (q) => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      const token = stored?.token;
      const url = `${import.meta.env.VITE_API_URL}/api/customers/search-dcl?dclNo=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          "content-type": "application/json",
        },
      });
      if (!res.ok) return;
      const results = await res.json();
      setDclSearchResults(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error("DCL typeahead search failed", err);
    }
  };

  useEffect(() => {
    // Debounce as user types DCL number
    if (dclSearchTimeoutRef.current) clearTimeout(dclSearchTimeoutRef.current);
    // Trigger search after at least 1 character
    if (!searchDclNumber || searchDclNumber.length < 1) {
      setDclSearchResults([]);
      return;
    }

    dclSearchTimeoutRef.current = setTimeout(() => {
      searchDclsTypeahead(searchDclNumber);
    }, 300);

    return () => {
      if (dclSearchTimeoutRef.current) clearTimeout(dclSearchTimeoutRef.current);
    };
  }, [searchDclNumber]);

  const handleSelectDcl = (deferral) => {
    // Populate customer details from the selected deferral
    setCustomerName(deferral.customerName || "");
    setBusinessName(deferral.businessName || "");
    setCustomerNumber(deferral.customerNumber || "");
    setLoanType(deferral.loanType || "");
    setSearchDclNumber(deferral.dclNo || "");
    setDclNumber(deferral.dclNo || ""); // Auto-fill DCL number field
    setSelectedCustomerId(deferral.customerId || null);
    setSelectedDclId(deferral.id); // Store the selected DCL ID
    setIsSearchedByDcl(true); // Mark that DCL search was used

    // Fetch and auto-download the DCL file
    fetchDclFile(deferral.id, deferral.dclNo);

    // Auto-proceed to deferral details page
    setIsCustomerFetched(true);
    setShowSearchForm(false);
    setDclSearchResults([]);
  };

  // ----------------------
  // FETCH DCL FILE
  // ----------------------
  const fetchDclFile = async (checklistId, dclNumber) => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || 'null');
      const token = stored?.token;

      // Fetch the checklist to get the documents
      const url = `${import.meta.env.VITE_API_URL}/api/cocreatorChecklist/${checklistId}`;
      const res = await fetch(url, {
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          "content-type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch DCL checklist");
        return;
      }

      const checklist = await res.json();

      // Find the most recent DCL file (if documents array exists)
      if (checklist.documents && Array.isArray(checklist.documents)) {
        // Flatten all documents and find the most recent one
        const allDocs = [];
        checklist.documents.forEach(category => {
          if (category.docList && Array.isArray(category.docList)) {
            allDocs.push(...category.docList);
          }
        });

        // Sort by timestamp and get the most recent
        allDocs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        if (allDocs.length > 0) {
          const latestDoc = allDocs[0];

          // Set the DCL file with the document details for display in the compartment
          if (latestDoc.fileUrl || latestDoc.url) {
            const fileName = latestDoc.name || `${dclNumber}.pdf`;
            const fileUrl = latestDoc.fileUrl || latestDoc.url;

            setDclFile({
              name: fileName,
              url: fileUrl,
              type: latestDoc.type || 'DCL',
              isDCL: true,
              size: latestDoc.size || 0,
            });
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch DCL file:", err);
    }
  };

  // Helper function to download file
  const downloadFile = (url, filename) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download file:", err);
    }
  };



  // ----------------------
  // FILE UPLOAD HANDLERS
  // ----------------------
  const handleDCLUpload = (file) => {
    // Check file type
    const allowedTypes = ['.pdf', '.PDF', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      message.error(`File type not allowed. Please upload: ${allowedTypes.join(', ')}`);
      return false;
    }

    setDclFile(file);
    message.success(`${file.name} selected for DCL upload`);
    return false; // Prevent auto upload
  };

  const handleAdditionalFileUpload = (file) => {
    // Check file type
    const allowedTypes = ['.pdf', '.PDF', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      message.error(`File type not allowed. Please upload: ${allowedTypes.join(', ')}`);
      return false;
    }

    // Add to existing files
    const newFileList = [...additionalFiles, file];
    setAdditionalFiles(newFileList);
    message.success(`${file.name} added to additional documents`);
    return false; // Prevent auto upload
  };

  const removeDCLFile = () => {
    setDclFile(null);
    message.info('DCL file removed');
  };

  const removeAdditionalFile = (file) => {
    const newFileList = additionalFiles.filter(f => f.uid !== file.uid);
    setAdditionalFiles(newFileList);
    message.info(`${file.name} removed`);
  };

  // ----------------------
  // DOCUMENT VIEW HANDLER
  // ----------------------
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: ERROR_RED }} />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined style={{ color: PRIMARY_BLUE }} />;
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined style={{ color: SUCCESS_GREEN }} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <FileImageOutlined style={{ color: WARNING_ORANGE }} />;
      default:
        return <FileOutlined />;
    }
  };

  const handleViewDocument = (file) => {
    if (file && file.originFileObj) {
      // Create a URL for the file
      const fileURL = URL.createObjectURL(file.originFileObj);

      // Open in new tab
      window.open(fileURL, '_blank');

      // Clean up the URL object after some time
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 10000);

      message.info(`Opening ${file.name}`);
    } else if (file && file instanceof File) {
      // If it's a file object directly
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
      setTimeout(() => {
        URL.revokeObjectURL(fileURL);
      }, 10000);
      message.info(`Opening ${file.name}`);
    } else if (file && file.url) {
      // If it's a saved URL (data URL or external)
      window.open(file.url, '_blank');
      message.info(`Opening ${file.name || 'document'}`);
    } else {
      message.info('No preview available');
    }
  };

  // Download helper for both File objects and saved URLs
  const handleDownload = (item) => {
    if (!item) return message.info('No file available');

    if (item.fileObj && (item.fileObj instanceof File || item.fileObj.originFileObj)) {
      const blob = item.fileObj.originFileObj ? item.fileObj.originFileObj : item.fileObj;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (blob.name || item.name || 'download');
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return;
    }

    if (item.url) {
      // For data URLs or external links, set download
      const a = document.createElement('a');
      a.href = item.url;
      a.download = item.name || 'download';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    message.info('No file available for download');
  };

  // ----------------------
  // RENDER DOCUMENT LIST ITEMS
  // ----------------------
  const renderDocumentItem = (file, allowDelete = true) => {
    const fileSize = file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'Size unknown';

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        border: '1px solid #f0f0f0',
        borderRadius: '6px',
        marginBottom: '8px',
        backgroundColor: '#fafafa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {getFileIcon(file.name)}
          <div>
            <Text strong style={{ display: 'block', fontSize: '13px' }}>
              {file.name}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {fileSize}
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Tooltip title="View document">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined style={{ color: PRIMARY_BLUE }} />}
              onClick={() => handleViewDocument(file)}
            />
          </Tooltip>
          {allowDelete && (
            <Tooltip title="Delete document">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => file.isDCL ? removeDCLFile() : removeAdditionalFile(file)}
              />
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  // ----------------------
  // SUBMIT HANDLER
  // ----------------------
  // Submit handler moved later (API-based) — see other `handleSubmitDeferral` below.

  // ----------------------
  // RENDER FUNCTIONS
  // ----------------------
  const renderCustomerInfoCard = () => {
    // Get the first selected approver or show "Pending" if none
    const firstApprover = approvers.find(a => a !== "") || "Pending";

    return (
      <Card
        size="small"
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              width: 4,
              height: 20,
              backgroundColor: ACCENT_LIME,
              marginRight: 12,
              borderRadius: 2
            }} />
            {/* Changed to use Title level={4} to match Deferral Details */}
            <Title level={4} style={{ color: PRIMARY_BLUE, margin: 0 }}>
              Customer Information
            </Title>
          </div>
        }
        style={{
          marginBottom: 24,
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
        headStyle={{
          borderBottom: "1px solid #f0f0f0",
          padding: "12px 16px",
        }}
        styles={{ body: { padding: "16px" } }}
      >
        <Descriptions size="middle" column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="Customer Name">
            <Text strong style={{ color: PRIMARY_PURPLE }}>
              {customerName}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Customer Number">
            <Text strong style={{ color: PRIMARY_BLUE }}>
              {customerNumber}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="DCL No">
            <Text strong style={{ color: SECONDARY_BLUE }}>
              {dclNumber || "Not entered"}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            <div>
              <Text strong style={{ color: PRIMARY_PURPLE }}>
                {new Date().toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                {new Date().toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Approver">
            <div style={{ display: "flex", alignItems: "center" }}>
              <Text strong style={{
                color: firstApprover === "Pending" ? "#d9d9d9" : PRIMARY_PURPLE
              }}>
                {firstApprover}
              </Text>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="Loan Type">
            <Text strong style={{ color: SECONDARY_BLUE }}>
              {formatLoanType(loanType)}
            </Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    );
  };

  // Customer selection modal (for multiple matches)
  const renderCustomerSelectionModal = () => (
    <Modal
      open={selectCustomerModalVisible}
      onCancel={handleCloseCustomerModal}
      title="Select Customer"
      footer={null}
      centered
    >
      <List
        dataSource={customerSearchResults}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Button type="primary" onClick={() => handleSelectCustomer(item)}>
                Select
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={`${item.name} ${item.customerNumber ? `(${item.customerNumber})` : ""}`}
              description={item.email || ""}
            />
          </List.Item>
        )}
      />
    </Modal>
  );

  const renderDeferralDetailsCard = () => (
    <Card
      style={{
        marginBottom: 24,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: 4,
            height: 20,
            backgroundColor: ACCENT_LIME,
            marginRight: 12,
            borderRadius: 2
          }} />
          {/* Removed FileTextOutlined icon and kept just the title */}
          <Title level={4} style={{ color: PRIMARY_PURPLE, margin: 0 }}>
            Deferral Details
          </Title>
        </div>
      }
    >
      <Row gutter={[16, 16]}>


        <Col span={12}>
          <Text strong>Loan Amount</Text>
          <Select
            value={loanAmount}
            onChange={setLoanAmount}
            style={{ width: "100%" }}
            size="large"
            placeholder="Select loan amount"
          >
            <Option value="below75">Below 75 million</Option>
            <Option value="above75">Above 75 million</Option>
          </Select>
        </Col>




        <Col span={12}>
          <Text strong>No. of Days Sought</Text>
          <Select
            value={daysSought}
            onChange={(val) => {
              setDaysSought(val);
              if (val) {
                const days = Number(val);
                const next = dayjs().add(days, "day").format("YYYY-MM-DD");
                setNextDueDate(next);
              } else {
                setNextDueDate("");
              }
            }}
            style={{ width: "100%" }}
            size="large"
            placeholder="Select days"
          >
            <Option value="10">10 days</Option>
            <Option value="20">20 days</Option>
            <Option value="30">30 days</Option>
            <Option value="45">45 days</Option>
          </Select>
        </Col>

        <Col span={12}>
          <Text strong>Next Document Due Date</Text>
          <DatePicker
            value={nextDueDate ? dayjs(nextDueDate) : null}
            onChange={(date) => setNextDueDate(date ? date.format("YYYY-MM-DD") : "")}
            style={{ width: "100%" }}
            size="large"
            format="DD/MM/YYYY"
            disabled
          />
        </Col>






        {/* Document Picker Component - Imported with custom title */}
        <Col span={24}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{
                width: 4,
                height: 20,
                backgroundColor: ACCENT_LIME,
                marginRight: 12,
                borderRadius: 2
              }} />
              <Title level={4} style={{ color: PRIMARY_BLUE, margin: 0 }}>
                Document Name
              </Title>
            </div>
          </div>
          <DocumentPicker
            selectedDocuments={selectedDocuments}
            setSelectedDocuments={setSelectedDocuments}
          />
        </Col>

        <Col span={24}>
          <Text strong>Deferral Description</Text>
          <TextArea
            value={deferralDescription}
            onChange={(e) => setDeferralDescription(e.target.value)}
            rows={4}
            placeholder="Enter reason for deferral..."
            required
          />
        </Col>

        {/* Facility Table Component - Imported with custom title */}
        <Col span={24}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{
                width: 4,
                height: 20,
                backgroundColor: ACCENT_LIME,
                marginRight: 12,
                borderRadius: 2
              }} />
              <Title level={4} style={{ color: PRIMARY_BLUE, margin: 0 }}>
                Facility Details
              </Title>
            </div>
          </div>
          <FacilityTable
            facilities={facilities}
            setFacilities={setFacilities}
          />
        </Col>

        <Col span={24}>
          <Text strong>DCL Number</Text>
          <Input
            value={dclNumber}
            onChange={(e) => !isSearchedByDcl && setDclNumber(e.target.value)}
            placeholder="Enter DCL number"
            size="large"
            prefix={<FileTextOutlined />}
            required
            disabled={isSearchedByDcl}
            style={{
              backgroundColor: isSearchedByDcl ? '#f5f5f5' : '#fff',
              cursor: isSearchedByDcl ? 'not-allowed' : 'text',
              opacity: isSearchedByDcl ? 0.7 : 1,
            }}
          />
        </Col>

        <Col span={24}>
          {/* Updated Mandatory: DCL Upload with view and delete actions */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{
                width: 4,
                height: 20,
                backgroundColor: ACCENT_LIME,
                marginRight: 12,
                borderRadius: 2
              }} />
              <Title level={4} style={{ color: PRIMARY_BLUE, margin: 0 }}>
                Mandatory: DCL Upload
              </Title>
            </div>
            <Upload
              disabled={!dclNumber}
              accept=".pdf,.PDF,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              beforeUpload={handleDCLUpload}
              fileList={[]}
              maxCount={1}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} disabled={!dclNumber}>
                Upload DCL Document
              </Button>
            </Upload>

            {dclFile && (
              <div style={{ marginTop: 16 }}>
                {renderDocumentItem(dclFile, true)}
              </div>
            )}

            {!dclNumber ? (
              <Text type="secondary" style={{ display: "block", marginTop: 8 }}>
                Please enter DCL number first
              </Text>
            ) : !dclFile ? (
              <Text type="secondary" style={{ display: "block", marginTop: 8, color: WARNING_ORANGE }}>
                DCL document is required for submission
              </Text>
            ) : null}

          </Card>
        </Col>

        <Col span={24}>
          {/* Updated Additional Documents with view and delete actions */}
          <Card size="small">
            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
              <div style={{
                width: 4,
                height: 20,
                backgroundColor: ACCENT_LIME,
                marginRight: 12,
                borderRadius: 2
              }} />
              <Title level={4} style={{ color: PRIMARY_BLUE, margin: 0 }}>
                Additional Documents
              </Title>
            </div>
            <Upload
              accept=".pdf,.PDF,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              beforeUpload={handleAdditionalFileUpload}
              fileList={[]}
              multiple
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>
                Upload Additional Documents
              </Button>
            </Upload>

            {additionalFiles.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {additionalFiles.map((file, index) => (
                  <div key={file.uid || index}>
                    {renderDocumentItem(file)}
                  </div>
                ))}
                <div>
                  <Text type="success" style={{ display: "block", marginTop: 8, fontSize: '12px' }}>
                    ✓ {additionalFiles.length} additional document{additionalFiles.length !== 1 ? 's' : ''} ready
                  </Text>

                </div>
              </div>
            )}

          </Card>
        </Col>

        <Col span={24}>
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
              <div style={{
                width: 4,
                height: 20,
                backgroundColor: ACCENT_LIME,
                marginRight: 12,
                borderRadius: 2
              }} />
              <Title level={4} style={{ color: PRIMARY_BLUE, margin: 0 }}>
                Comments
              </Title>
            </div>

            <TextArea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              placeholder="Add any notes or comments for the deferral (optional)"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, gap: 8 }}>
              <Button
                type="default"
                onClick={() => setComments('')}
              >
                Clear
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  if (!comments || !comments.trim()) {
                    message.error('Please enter a comment before posting');
                    return;
                  }
                  const newComment = {
                    message: comments.trim(),
                    user: { name: currentUser.name || 'You', role: currentUser.role || 'rm' },
                    createdAt: new Date().toISOString()
                  };
                  setPostedComments((p) => [newComment, ...p]);
                  setComments('');
                  message.success('Comment posted');
                }}
              >
                Post Comment
              </Button>
            </div>

            {postedComments.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <List
                  dataSource={postedComments}
                  itemLayout="horizontal"
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <b>{item.user.name}</b>
                              <Tag style={{ marginLeft: 8, textTransform: 'uppercase' }}>{item.user.role}</Tag>
                            </div>
                            <div style={{ fontSize: 12, color: '#777' }}>{new Date(item.createdAt).toLocaleString()}</div>
                          </div>
                        }
                        description={<div style={{ whiteSpace: 'pre-wrap' }}>{item.message}</div>}
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

          </Card>
        </Col>

      </Row>
    </Card>
  );

  // ----------------------
  // SUBMIT HANDLER for Deferral
  // ----------------------
  // Helper: read a File (or File-like object) into a data URL for upload preview/storage
  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    try {
      const f = file.originFileObj || file;
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(f);
    } catch (err) {
      reject(err);
    }
  });

  const handleSubmitDeferral = async () => {
    // Basic validation
    if (!selectedCustomerId && !String(customerNumber || '').trim()) {
      message.error('Please fetch and confirm a customer before submitting');
      return;
    }
    if (!dclNumber || !dclNumber.trim()) {
      message.error('Please enter DCL number');
      return;
    }
    if (!Array.isArray(selectedDocuments) || selectedDocuments.length === 0) {
      message.error('Please select at least one document before submitting');
      return;
    }

    const expectedRoles = computeDefaultRoles();
    const selectedApproverSlots = approverSlots.filter((slot) => !!slot.userId);
    const approverIds = selectedApproverSlots.map((slot) => String(slot.userId));
    if (new Set(approverIds).size !== approverIds.length) {
      message.error('Same approver cannot be selected for multiple approval steps');
      return;
    }
    if (selectedApproverSlots.length !== approverSlots.length) {
      message.error('Please assign all approvers before submitting');
      return;
    }

    const normalizedExpectedRoles = expectedRoles.map((role) => String(role || "").trim().toLowerCase());
    const normalizedSelectedRoles = selectedApproverSlots.map((slot) => String(slot?.role || "").trim().toLowerCase());

    if (normalizedSelectedRoles.length < normalizedExpectedRoles.length) {
      message.error('Please assign all required approvers before submitting');
      return;
    }

    const firstRoleMismatch = normalizedSelectedRoles[0] !== normalizedExpectedRoles[0];
    const lastRoleMismatch =
      normalizedSelectedRoles[normalizedSelectedRoles.length - 1] !==
      normalizedExpectedRoles[normalizedExpectedRoles.length - 1];

    if (firstRoleMismatch || lastRoleMismatch) {
      message.error('First and final approvers must match the required approval matrix');
      return;
    }

    let expectedIndex = 0;
    for (const role of normalizedSelectedRoles) {
      if (role === normalizedExpectedRoles[expectedIndex]) {
        expectedIndex += 1;
      }
      if (expectedIndex >= normalizedExpectedRoles.length) break;
    }

    if (expectedIndex < normalizedExpectedRoles.length) {
      message.error('Required approval matrix order must be preserved when adding extra approvers');
      return;
    }

    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    setIsSubmitting(true);

    try {
      const resolvedApprovers = selectedApproverSlots.map((slot) => {
        const matched = approverList.find(
          (approver) =>
            String(approver?._id || approver?.id || approver?.userId || "") === String(slot.userId)
        );

        const resolvedUserId = matched?.id || matched?._id || matched?.userId || slot.userId;
        return {
          role: slot.role,
          userId: resolvedUserId,
          user: resolvedUserId,
        };
      });

      if (resolvedApprovers.some((approver) => !guidRegex.test(String(approver.userId || "")))) {
        message.error('One or more selected approvers have invalid IDs. Please reselect approvers and try again.');
        setIsSubmitting(false);
        return;
      }

      const normalizedFacilities = (facilities || []).map((facility) => ({
        type: facility?.type || facility?.facilityType || facility?.name || "",
        sanctioned: Number(facility?.sanctioned ?? facility?.amount ?? 0) || 0,
        balance: Number(facility?.balance ?? 0) || 0,
        headroom: Number(facility?.headroom ?? Math.max(0, (Number(facility?.amount ?? facility?.sanctioned ?? 0) || 0) - (Number(facility?.balance ?? 0) || 0))) || 0,
      }));

      const normalizeDocumentType = (doc) => {
        const rawType = String(doc?.type || "").trim().toLowerCase();
        if (rawType === "primary") return "Primary";
        if (rawType === "secondary") return "Secondary";
        return documentCategory === "Primary" ? "Primary" : "Secondary";
      };

      const payload = {
        customerId: selectedCustomerId || undefined,
        customerNumber,
        customerName,
        businessName,

        loanType,
        loanAmount: parsedLoanAmount(),
        daysSought: Number(daysSought) || undefined,
        nextDocumentDueDate: nextDueDate ? dayjs(nextDueDate).toISOString() : undefined,
        dclNumber,
        deferralDescription,
        facilities: normalizedFacilities,
        approvers: resolvedApprovers,
        // Preserve selected document names/metadata so they appear in pending modal
        selectedDocuments: (selectedDocuments || []).map((doc) => {
          if (typeof doc === 'string') {
            return { name: doc, type: documentCategory === "Primary" ? "Primary" : "Secondary" };
          }
          return {
            ...doc,
            type: normalizeDocumentType(doc),
          };
        }),
        // Include posted comments so they appear in the comment trail
        comments: postedComments.map(c => ({
          text: c.message,
          createdAt: c.createdAt,
          authorName: c.user?.name || currentUser.name || 'RM',
          authorRole: c.user?.role || currentUser.role || 'RM',
          author: {
            name: c.user?.name || currentUser.name || 'RM',
            role: c.user?.role || currentUser.role || 'RM',
          },
        }))
      };

      // Convert uploaded files to data URLs and include them in the create payload so documents are persisted atomically
      const docsToAttach = [];

      if (dclFile) {
        try {
          const dataUrl = await fileToDataUrl(dclFile);
          docsToAttach.push({ name: dclFile.name, url: dataUrl, size: dclFile.size, uploadDate: new Date().toISOString(), isDCL: true });
        } catch (e) {
          console.error('Failed to read DCL file for upload, will still create record without url', e);
          docsToAttach.push({ name: dclFile.name, size: dclFile.size, uploadDate: new Date().toISOString(), isDCL: true });
        }
      }

      if (additionalFiles && additionalFiles.length > 0) {
        for (const f of additionalFiles) {
          try {
            const dataUrl = await fileToDataUrl(f);
            docsToAttach.push({ name: f.name, url: dataUrl, size: f.size, uploadDate: new Date().toISOString(), isAdditional: true });
          } catch (e) {
            console.error('Failed to read additional file for upload, creating record without url', e);
            docsToAttach.push({ name: f.name, size: f.size, uploadDate: new Date().toISOString(), isAdditional: true });
          }
        }
      }

      let newDeferral;
      try {
        // Let the server generate the authoritative deferral number
        newDeferral = await deferralApi.createDeferral(payload);
      } catch (err) {
        message.error(err.message || 'Failed to create deferral');
        setIsSubmitting(false);
        return;
      }

      // Use backend deferralNumber
      const finalDeferralNumber = newDeferral.deferralNumber;
      const createdDeferralId = newDeferral?.id || newDeferral?._id;

      if (!createdDeferralId) {
        console.error('Create deferral succeeded but response had no id/_id', newDeferral);
        message.warning('Deferral created but document linking failed: missing deferral ID');
        navigate('/rm/deferrals/pending');
        return;
      }

      // Prepare object to display in modal (include DCL and facilities)
      const display = {
        ...newDeferral,
        deferralNumber: finalDeferralNumber,
        dclNumber,
        facilities,
        selectedDocuments,
        approverFlow: approverSlots.map((s) => ({ role: s.role, userId: s.userId }))
      };

      // Upload any selected files as multipart form uploads (binary)
      // Attach selected files as deferral documents using supported backend endpoint
      const documentRequests = docsToAttach
        .filter((doc) => !!doc?.name)
        .map((doc) =>
          deferralApi.addDocument(createdDeferralId, {
            name: doc.name,
            url: doc.url || "",
            isDCL: doc.isDCL === true,
            isAdditional: doc.isAdditional === true,
          })
        );

      // Best-effort attach; do not fail deferral creation if a document attachment fails
      try {
        await Promise.all(documentRequests);
      } catch (e) {
        console.error('One or more document attachments failed', e);
      }

      const attemptedRecipients = Number(newDeferral?.emailNotification?.attemptedRecipients || 0);
      const hadDispatchError = !!newDeferral?.emailNotification?.hadDispatchError;

      // Redirect to My Deferrals after uploads are attempted
      navigate('/rm/deferrals/pending');

      if (attemptedRecipients > 0) {
        message.success(
          hadDispatchError
            ? `Deferral request created. Email notifications attempted for ${attemptedRecipients} recipient(s), but dispatch had issues.`
            : `Deferral request created. Email notifications queued for ${attemptedRecipients} recipient(s).`
        );
      } else {
        message.success('Deferral request created');
      }

      // Dispatch a global event so other dashboards (CO/Creator) can refresh their pending lists
      try { window.dispatchEvent(new CustomEvent('deferral:created', { detail: newDeferral })); } catch (e) { /* ignore */ }

    } catch (err) {
      console.error(err);
      message.error('Failed to submit deferral');
    } finally {
      setIsSubmitting(false);
    }
  };


  // ----------------------
  // Confirmation modal and Approver SIDEBAR (with confirm-before-submit)
  // ----------------------

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [previewDeferralNumber, setPreviewDeferralNumber] = useState("");

  const openConfirmModal = async () => {
    // Minimal validation before showing the summary
    if (!selectedCustomerId && !String(customerNumber || '').trim()) {
      message.error('Please fetch and confirm a customer before submitting');
      return;
    }
    if (!dclNumber || !dclNumber.trim()) {
      message.error('Please enter DCL number');
      return;
    }

    // Ask backend for a preview next deferral number. If it fails, fall back to 'TBD'
    try {
      const resp = await deferralApi.getNextDeferralNumber();
      setPreviewDeferralNumber(resp.deferralNumber || 'TBD');
    } catch (e) {
      console.error('Preview number fetch failed', e);
      setPreviewDeferralNumber('TBD');
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    await handleSubmitDeferral();
  };

  const renderConfirmModal = () => (
    <Modal
      open={showConfirmModal}
      title={`Confirm submission to approver${approverSlots.filter(s => s.userId).length > 1 ? 's' : ''}`}
      onCancel={() => setShowConfirmModal(false)}
      footer={[
        <Button key="back" onClick={() => setShowConfirmModal(false)}>Cancel</Button>,
        <Button key="submit" type="primary" onClick={handleConfirmSubmit} disabled={approverSlots.filter(s => s.userId).length === 0} loading={isSubmitting}>
          Confirm & Submit
        </Button>
      ]}
      width={900}
      centered
    >
      <Descriptions bordered column={1} size="small">
        <Descriptions.Item label="Deferral Number">{previewDeferralNumber}</Descriptions.Item>
        <Descriptions.Item label="Customer">{customerName} — {customerNumber}</Descriptions.Item>
        <Descriptions.Item label="DCL No">{dclNumber}</Descriptions.Item>

        <Descriptions.Item label="Loan Type">{formatLoanType(loanType)}</Descriptions.Item>
        <Descriptions.Item label="Days Sought">{daysSought || '-'}</Descriptions.Item>
        <Descriptions.Item label="Deferred due date">{nextDueDate || '-'}</Descriptions.Item>

        <Descriptions.Item label="Document(s) to be deferred">
          {selectedDocuments && selectedDocuments.length > 0 ? (
            <List
              size="small"
              dataSource={selectedDocuments}
              renderItem={(doc) => {
                const docName = typeof doc === 'string' ? doc : doc.name || doc.label || 'Document';
                const docTypeRaw = typeof doc === 'string' ? '' : String(doc.type || '').trim().toLowerCase();
                const docType = docTypeRaw === 'primary' ? 'Primary' : docTypeRaw === 'secondary' ? 'Secondary' : documentCategory;
                const uploadedFiles = [...(dclFile ? [{ name: dclFile.name, fileObj: dclFile }] : []), ...additionalFiles.map(f => ({ name: f.name, fileObj: f }))];
                const uploaded = uploadedFiles.find(u => u.name && docName && u.name.toLowerCase().includes(docName.toLowerCase()));
                return (
                  <List.Item>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{docName}</div>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={docType === 'Primary' ? 'purple' : 'orange'} style={{ margin: 0 }}>
                            {docType}
                          </Tag>
                        </div>
                        {uploaded && <div style={{ fontSize: 12, color: '#666' }}>Uploaded as: {uploaded.name}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color={uploaded ? 'green' : 'orange'} style={{ alignSelf: 'center' }}>{uploaded ? 'Uploaded' : 'Requested'}</Tag>
                        {uploaded ? (
                          <>
                            <Button type="link" size="small" onClick={() => uploaded.fileObj ? handleViewDocument(uploaded.fileObj) : (uploaded.url && window.open(uploaded.url, '_blank'))}>View</Button>
                            <Button type="link" size="small" onClick={() => handleDownload(uploaded)}>Download</Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          ) : '-'}
        </Descriptions.Item>

        {deferralDescription && (
          <Descriptions.Item label="Deferral Description">
            <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 6 }}>{deferralDescription}</div>
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Approvers">
          <List
            size="small"
            dataSource={approverSlots.filter(s => s.userId)}
            renderItem={(s) => {
              const user = approverList.find(a => a._id === s.userId);
              return <List.Item>{user ? `${user.name} — ${user.position || user.role || ''}` : s.userId}</List.Item>;
            }}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Facilities">
          <Table
            size="small"
            dataSource={facilities.map((f, i) => ({ ...f, key: i }))}
            pagination={false}
            columns={[
              { title: 'Facility Type', dataIndex: 'type', key: 'type', render: (t, record) => <Text strong>{t || record.facilityType || record.name || 'N/A'}</Text> },
              { title: "Sanctioned (KES '000)", dataIndex: 'sanctioned', key: 'sanctioned', align: 'right', render: (v, r) => Number(v ?? r.amount ?? 0).toLocaleString() },
              { title: "Balance (KES '000)", dataIndex: 'balance', key: 'balance', align: 'right', render: (v, r) => Number(v ?? r.balance ?? 0).toLocaleString() },
              { title: "Headroom (KES '000)", dataIndex: 'headroom', key: 'headroom', align: 'right', render: (v, r) => Number(v ?? r.headroom ?? Math.max(0, (r.amount || 0) - (r.balance || 0))).toLocaleString() },
            ]}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Uploaded Documents">
          <List
            size="small"
            dataSource={[...(dclFile ? [{ name: dclFile.name, fileObj: dclFile }] : []), ...additionalFiles.map(f => ({ name: f.name, fileObj: f }))]}
            renderItem={(it) => (
              <List.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {getFileIcon(it.name)}
                    <div>
                      <div>{it.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{it.fileObj && it.fileObj.size ? `${(it.fileObj.size / 1024).toFixed(2)} KB` : ''}</div>
                    </div>
                  </div>
                  <div>
                    <Button type="link" onClick={() => it.fileObj ? handleViewDocument(it.fileObj) : (it.url && window.open(it.url, '_blank'))}>View</Button>
                    <Button type="link" onClick={() => handleDownload(it)}>Download</Button>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Comment Trail & History">
          {postedComments && postedComments.length > 0 ? (
            <List
              dataSource={postedComments}
              itemLayout="horizontal"
              renderItem={(item) => (
                <List.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar icon={<UserOutlined />} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <b>{item.user?.name || 'Unknown'}</b>
                        {item.user?.role && (
                          <Tag style={{ textTransform: 'uppercase', margin: 0 }}>
                            {item.user.role}
                          </Tag>
                        )}
                        <span style={{ color: '#4a4a4a' }}>{item.message}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#777' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : '-'}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );

  const renderApproverSidebar = () => (
    <Card
      style={{
        height: "calc(100vh - 48px)",
        position: "sticky",
        top: 24,
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      <ApproverSelector
        slots={approverSlots}
        availableApprovers={approverList}
        updateApprover={updateApprover}
        addApprover={addApprover}
        removeApprover={removeApprover}
        onSubmitDeferral={openConfirmModal}
        isSubmitting={isSubmitting}
        currentUser={currentUser}
        selectedDocuments={selectedDocuments}
        loanAmount={loanAmount}
        // dclFileReady={!!dclFile}
        onCancel={() => navigate('/rm/deferrals/pending')}
      />
      {renderConfirmModal()}
    </Card>
  );

  // ----------------------
  // RENDER LOGIC
  // ----------------------
  if (!isCustomerFetched) {
    return (
      <div style={{ padding: 24 }}>
        <Card
          style={{
            maxWidth: 600,
            margin: "100px auto",
            textAlign: "center",
            borderRadius: 12,
            boxShadow: "0 4px 20px rgba(43, 28, 103, 0.1)",
            borderTop: `4px solid ${ACCENT_LIME}`,
          }}
        >
          <BankOutlined style={{ fontSize: 64, color: PRIMARY_PURPLE, marginBottom: 24 }} />

          <Title level={3} style={{ color: PRIMARY_PURPLE, marginBottom: 8 }}>
            Start New Deferral Request
          </Title>

          <Text type="secondary" style={{ display: "block", marginBottom: 32, fontSize: 16 }}>
            Please search for a customer to begin the deferral request process
          </Text>

          {/* Only show the search form if showSearchForm is true */}
          {showSearchForm ? (
            <>
              <Divider style={{ margin: "24px 0" }} />

              {/* Search Mode Tabs */}
              <div style={{ marginBottom: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Button
                  type={searchMode === 'customer' ? 'primary' : 'default'}
                  onClick={() => {
                    setSearchMode('customer');
                    setSearchDclNumber('');
                    setDclSearchResults([]);
                  }}
                  style={{
                    backgroundColor: searchMode === 'customer' ? PRIMARY_PURPLE : 'transparent',
                    borderColor: PRIMARY_PURPLE,
                    color: searchMode === 'customer' ? '#fff' : PRIMARY_PURPLE,
                    fontWeight: 600,
                  }}
                >
                  Search by Customer Number
                </Button>
                <Button
                  type={searchMode === 'dcl' ? 'primary' : 'default'}
                  onClick={() => {
                    setSearchMode('dcl');
                    setSearchCustomerNumber('');
                    setSearchLoanType('');
                    setCustomerSearchResults([]);
                  }}
                  style={{
                    backgroundColor: searchMode === 'dcl' ? PRIMARY_PURPLE : 'transparent',
                    borderColor: PRIMARY_PURPLE,
                    color: searchMode === 'dcl' ? '#fff' : PRIMARY_PURPLE,
                    fontWeight: 600,
                  }}
                >
                  Search by DCL Number
                </Button>
              </div>

              <div style={{ textAlign: "left", marginBottom: 32 }}>
                {searchMode === 'customer' ? (
                  <Form
                    layout="vertical"
                    onFinish={fetchCustomer}
                  >
                    <Form.Item
                      label="Customer Number"
                      name="customerNumber"
                      rules={[{ required: true, message: 'Please enter customer number' }]}
                    >
                      <div style={{ position: 'relative' }}>
                        <Input
                          type="text"
                          size="large"
                          value={searchCustomerNumber}
                          onChange={(e) => setSearchCustomerNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 123456"
                          autoFocus
                        />

                        {/* Typeahead suggestions */}
                        {customerSearchResults && customerSearchResults.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '42px',
                            left: 0,
                            right: 0,
                            zIndex: 1200,
                            background: '#fff',
                            border: '1px solid #eee',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            maxHeight: 240,
                            overflowY: 'auto',
                            borderRadius: 6,
                          }}>
                            {customerSearchResults.map((c) => (
                              <div
                                key={c._id}
                                onClick={() => handleSelectCustomer(c)}
                                style={{
                                  padding: '10px 12px',
                                  borderBottom: '1px solid #f6f6f6',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <div>
                                  <div style={{ fontWeight: 600 }}>{c.name}</div>
                                  <div style={{ fontSize: 12, color: '#666' }}>{c.customerNumber}</div>
                                </div>
                                <div style={{ fontSize: 12, color: '#999' }}>{c.email}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Form.Item>

                    <Form.Item
                      label="Loan Type"
                      name="loanType"
                      rules={[{ required: true, message: 'Please select loan type' }]}
                    >
                      <Select
                        size="large"
                        style={{ width: "100%" }}
                        value={searchLoanType}
                        onChange={setSearchLoanType}
                        placeholder="Select loan type"
                      >
                        <Option value="asset finance">Asset Finance</Option>
                        <Option value="business loan">Business Loan</Option>
                        <Option value="consumer">Consumer</Option>
                        <Option value="mortgage">Mortgage</Option>
                        <Option value="construction">Construction Loan</Option>
                        <Option value="shamba loan">Shamba Loan</Option>
                      </Select>
                    </Form.Item>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
                      <Button
                        type="default"
                        onClick={() => setShowSearchForm(false)}
                        size="large"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={isFetching}
                        size="large"
                        style={{
                          backgroundColor: PRIMARY_PURPLE,
                          borderColor: PRIMARY_PURPLE,
                        }}
                      >
                        {isFetching ? "Fetching..." : "Fetch Customer"}
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <Form layout="vertical">
                    <Form.Item
                      label="DCL Number"
                      rules={[{ required: true, message: 'Please enter DCL number' }]}
                    >
                      <div style={{ position: 'relative' }}>
                        <Input
                          type="text"
                          size="large"
                          value={searchDclNumber}
                          onChange={(e) => setSearchDclNumber(e.target.value)}
                          placeholder="e.g. DCL-26-0183"
                          autoFocus
                        />

                        {/* DCL Typeahead suggestions */}
                        {dclSearchResults && dclSearchResults.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '42px',
                            left: 0,
                            right: 0,
                            zIndex: 1200,
                            background: '#fff',
                            border: '1px solid #eee',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            maxHeight: 240,
                            overflowY: 'auto',
                            borderRadius: 6,
                          }}>
                            {dclSearchResults.map((dcl) => (
                              <div
                                key={dcl.id}
                                onClick={() => handleSelectDcl(dcl)}
                                style={{
                                  padding: '12px',
                                  borderBottom: '1px solid #f6f6f6',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 4
                                }}
                              >
                                <div style={{ fontWeight: 600, color: PRIMARY_PURPLE }}>{dcl.dclNo}</div>
                                <div style={{ fontSize: 12, color: '#666' }}>
                                  {dcl.customerName} ({dcl.customerNumber})
                                </div>
                                <div style={{ fontSize: 12, color: '#999' }}>
                                  Loan Type: {dcl.loanType}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Form.Item>

                    <Text type="secondary" style={{ marginTop: 8, display: 'block', fontSize: 13 }}>
                      Tip: Start typing a DCL number to search. Customer details will auto-populate when you select a DCL.
                    </Text>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
                      <Button
                        type="default"
                        onClick={() => setShowSearchForm(false)}
                        size="large"
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                )}
              </div>
            </>
          ) : (
            <Button
              type="primary"
              size="large"
              icon={<SearchOutlined />}
              onClick={() => setShowSearchForm(true)}
              loading={isFetching}
              style={{
                backgroundColor: PRIMARY_PURPLE,
                borderColor: PRIMARY_PURPLE,
                height: 48,
                fontSize: 16,
                padding: "0 32px",
              }}
            >
              {isFetching ? "Searching..." : "Search Customer"}
            </Button>
          )}

          <div style={{ marginTop: 24 }}>
            <Button
              type="default"
              onClick={() => navigate('/rm/deferrals/pending')}
              style={{ marginTop: 16 }}
            >
              ← Back to My Deferrals
            </Button>
          </div>

          <div style={{ marginTop: 24 }}>

          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[24, 0]}>
        <Col span={18}>
          {renderCustomerInfoCard()}
          {renderDeferralDetailsCard()}
        </Col>

        <Col span={6}>
          {renderApproverSidebar()}
        </Col>
      </Row>
      {renderCustomerSelectionModal()}
    </div>
  );
}