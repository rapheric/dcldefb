import React from 'react';
import { Button, message } from 'antd';
import { FilePdfOutlined } from "@ant-design/icons";
import { PRIMARY_BLUE } from '../../../utils/constants';
import { generateChecklistPDF } from '../../../utils/reportGenerator';
import { calculateDocumentStats } from '../../../utils/checklistUtils';

const PDFGenerator = ({
    checklist,
    docs,
    supportingDocs = [],
    creatorComment,
    comments = []
}) => {
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleGeneratePDF = async () => {
        try {
            if (!checklist) {
                message.error("No checklist data available");
                return;
            }

            setIsGenerating(true);
            
            // Calculate document statistics
            const documentStats = calculateDocumentStats(docs || []);
            
            // Generate PDF using unified function
            generateChecklistPDF(checklist, docs || [], documentStats, comments || []);
            
            message.success("PDF generated successfully!");
        } catch (error) {
            console.error("PDF generation error:", error);
            message.error(error.message || "Failed to generate PDF");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Button
            icon={<FilePdfOutlined />}
            loading={isGenerating}
            onClick={handleGeneratePDF}
            style={{
                backgroundColor: PRIMARY_BLUE,
                borderColor: PRIMARY_BLUE,
                color: "white",
                borderRadius: "6px",
                fontWeight: 600,
                marginRight: 8
            }}
        >
            Download PDF
        </Button>
    );
};

export default PDFGenerator