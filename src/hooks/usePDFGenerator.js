import { useState, useCallback } from 'react';
import { message } from 'antd';
import { generateChecklistPDF } from '../utils/pdfGeneratorImproved';

const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Generate and download PDF using improved generator
   */
  const generatePDF = useCallback(async ({
    checklist,
    documents = [],
    supportingDocs = [],
    creatorComment = '',
    comments = [],
    onProgress,
    fileName // Optional custom filename
  }) => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      const updateProgress = (percent) => {
        setProgress(percent);
        onProgress?.(percent);
      };

      updateProgress(10);

      // Validate required data
      if (!checklist) {
        throw new Error("Checklist data is required");
      }

      // Log for debugging
      console.log('📊 Generating PDF with:', {
        checklistId: checklist?._id || checklist?.id,
        documentsCount: documents.length,
        supportingDocsCount: supportingDocs.length,
        hasComments: comments?.length > 0
      });

      updateProgress(30);

      // Use the improved PDF generator
      const result = await generateChecklistPDF({
        checklist,
        documents,
        supportingDocs,
        creatorComment,
        comments,
        fileName, // Pass custom filename if provided
      });

      updateProgress(100);

      message.success({
        content: `PDF generated: ${result.fileName}`,
        duration: 3,
      });

      return {
        success: true,
        fileName: result.fileName,
        fileUrl: result.fileUrl,
      };
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      setError(error.message);
      
      message.error({
        content: error.message || "Failed to generate PDF",
        duration: 4,
      });

      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsGenerating(false);
      // Keep progress at 100 for a moment before resetting
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  return {
    isGenerating,
    progress,
    error,
    generatePDF,
  };
};

export default usePDFGenerator;