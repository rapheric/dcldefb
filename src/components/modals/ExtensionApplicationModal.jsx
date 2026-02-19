import React, { useState } from "react";
import {
    Modal,
    Form,
    Input,
    InputNumber,
    Button,
    message,
    Space,
    Descriptions,
    Tag,
    Card,
    Upload,
    List,
    Tooltip,
    DatePicker,
} from "antd";
import {
    UploadOutlined,
    EyeOutlined,
    DownloadOutlined,
    DeleteOutlined,
    FileOutlined,
    FileDoneOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import UniformTag from "../common/UniformTag";
import { formatDeferralDocumentType } from "../../utils/deferralDocumentType";
import { getDeferralDocumentBuckets } from "../../utils/deferralDocuments";

const PRIMARY_BLUE = "#164679";
const ERROR_RED = "#ff4d4f";

const ExtensionApplicationModal = ({ open, onClose, deferral, onSubmit, loading }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [supportingFiles, setSupportingFiles] = useState([]);

    const currentDueDate = deferral?.nextDueDate || deferral?.nextDocumentDueDate || null;
    const requestedDays = Form.useWatch("requestedDaysSought", form);
    const computedNextDueDate = currentDueDate && requestedDays
        ? dayjs(currentDueDate).add(Number(requestedDays), "day")
        : null;
    const { requestedDocs, uploadedDocs } = getDeferralDocumentBuckets(deferral);

    const handleSupportingUpload = (file) => {
        setSupportingFiles((prev) => [...prev, file]);
        message.success(`${file.name} added`);
        return false;
    };

    const handleRemoveSupporting = (file) => {
        setSupportingFiles((prev) => prev.filter((f) => f.uid !== file.uid));
        message.info(`${file.name} removed`);
    };

    const handleViewSupporting = (file) => {
        const f = file.originFileObj || file;
        const url = URL.createObjectURL(f);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    const handleDownloadSupporting = (file) => {
        const f = file.originFileObj || file;
        const url = URL.createObjectURL(f);
        const link = document.createElement("a");
        link.href = url;
        link.download = f.name || "document";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            await onSubmit({
                ...values,
                supportingDocuments: supportingFiles,
            });
            form.resetFields();
            setSupportingFiles([]);
        } catch (error) {
            console.error("Error submitting extension:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title="Apply for Extension"
            open={open}
            onCancel={() => {
                form.resetFields();
                setSupportingFiles([]);
                onClose();
            }}
            footer={null}
            width={600}
            styles={{
                header: { backgroundColor: PRIMARY_BLUE },
                title: { color: "white" },
            }}
        >
            <div style={{ marginBottom: 24 }}>
                {/* Deferral Details */}
                <Descriptions size="small" bordered style={{ marginBottom: 20 }}>
                    <Descriptions.Item label="Deferral Number" span={3}>
                        <strong>{deferral?.deferralNumber}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer" span={3}>
                        {deferral?.customerName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Current Days Sought" span={3}>
                        <Tag color="blue">{deferral?.daysSought || 0} days</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Current Due Date" span={3}>
                        {deferral?.nextDueDate || deferral?.nextDocumentDueDate
                            ? dayjs(deferral?.nextDueDate || deferral?.nextDocumentDueDate).format("DD MMM YYYY")
                            : "Not set"}
                    </Descriptions.Item>
                </Descriptions>

                <Card
                    size="small"
                    title={<span style={{ color: PRIMARY_BLUE }}>Document(s) to be deferred ({requestedDocs.length})</span>}
                    style={{ marginBottom: 20 }}
                >
                    {requestedDocs.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {requestedDocs.map((doc, idx) => {
                                const isUploaded = uploadedDocs.some((u) =>
                                    (u.name || "").toLowerCase().includes((doc.name || "").toLowerCase())
                                );
                                const uploadedVersion = uploadedDocs.find((u) =>
                                    (u.name || "").toLowerCase().includes((doc.name || "").toLowerCase())
                                );

                                return (
                                    <div
                                        key={doc.id || idx}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "12px 16px",
                                            backgroundColor: isUploaded ? "#f6ffed" : "#fff7e6",
                                            borderRadius: 6,
                                            border: isUploaded ? "1px solid #b7eb8f" : "1px solid #ffd591",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <FileDoneOutlined style={{ color: isUploaded ? "#52c41a" : "#faad14", fontSize: 16 }} />
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                                                    {doc.name}
                                                    <UniformTag color={isUploaded ? "green" : "orange"} text={isUploaded ? "Uploaded" : "Requested"} />
                                                </div>
                                                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                                    <b>Type:</b> {formatDeferralDocumentType(doc)}
                                                </div>
                                                {uploadedVersion && (
                                                    <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                                                        Uploaded as: {uploadedVersion.name}
                                                        {uploadedVersion.uploadDate
                                                            ? ` • ${dayjs(uploadedVersion.uploadDate).format("DD MMM YYYY HH:mm")}`
                                                            : ""}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <span style={{ color: "#8c8c8c" }}>Not specified</span>
                    )}
                </Card>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        requestedDaysSought: undefined,
                        extensionReason: "",
                    }}
                >
                    {/* Requested Days */}
                    <Form.Item
                        label="Requested Days"
                        name="requestedDaysSought"
                        rules={[
                            { required: true, message: "Please enter requested days" },
                        ]}
                    >
                        <InputNumber
                            min={1}
                            max={365}
                            style={{ width: "100%" }}
                            placeholder="Enter additional days needed"
                        />
                    </Form.Item>

                    <Form.Item label="Next Due Date">
                        <DatePicker
                            value={computedNextDueDate}
                            disabled
                            style={{ width: "100%" }}
                            format="DD MMM YYYY"
                            placeholder="Auto-calculated"
                        />
                    </Form.Item>

                    {/* Extension Reason */}
                    <Form.Item
                        label="Reason for Extension"
                        name="extensionReason"
                        rules={[
                            { required: true, message: "Please provide a reason" },
                            { min: 10, message: "Reason must be at least 10 characters" },
                        ]}
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="Explain why this extension is needed..."
                            maxLength={500}
                        />
                    </Form.Item>

                    {/* Supporting Documents */}
                    <Form.Item label="Additional Supporting Documents">
                        <Upload
                            beforeUpload={handleSupportingUpload}
                            fileList={[]}
                            multiple
                            showUploadList={false}
                        >
                            <Button icon={<UploadOutlined />}>Upload Documents</Button>
                        </Upload>

                        {supportingFiles.length > 0 && (
                            <div style={{ marginTop: 12 }}>
                                <List
                                    size="small"
                                    dataSource={supportingFiles}
                                    renderItem={(file) => (
                                        <List.Item
                                            actions={[
                                                <Tooltip title="View" key="view">
                                                    <Button
                                                        type="text"
                                                        icon={<EyeOutlined />}
                                                        onClick={() => handleViewSupporting(file)}
                                                    />
                                                </Tooltip>,
                                                <Tooltip title="Download" key="download">
                                                    <Button
                                                        type="text"
                                                        icon={<DownloadOutlined />}
                                                        onClick={() => handleDownloadSupporting(file)}
                                                    />
                                                </Tooltip>,
                                                <Tooltip title="Remove" key="remove">
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleRemoveSupporting(file)}
                                                    />
                                                </Tooltip>,
                                            ]}
                                        >
                                            <List.Item.Meta
                                                avatar={<FileOutlined />}
                                                title={file.name}
                                                description={file.size ? `${(file.size / 1024).toFixed(2)} KB` : ""}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </div>
                        )}
                    </Form.Item>

                    {/* Buttons */}
                    <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitting || loading}
                            style={{ backgroundColor: PRIMARY_BLUE }}
                        >
                            Submit Extension Request
                        </Button>
                    </Space>
                </Form>
            </div>
        </Modal>
    );
};

export default ExtensionApplicationModal;