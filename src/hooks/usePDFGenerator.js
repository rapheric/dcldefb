import { useState, useCallback } from 'react';
import { message } from 'antd';
import { generateChecklistPDF } from '../utils/pdfGeneratorImproved';

const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Generate and download PDF using improved generator
   */
  const generatePDF = useCallback(async ({
    checklist,
    documents = [],
    supportingDocs = [],
    creatorComment = '',
    comments = [],
    onProgress
  }) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      const updateProgress = (percent) => {
        setProgress(percent);
        onProgress?.(percent);
      };

      updateProgress(10);

      // Use the improved PDF generator
      const result = await generateChecklistPDF({
        checklist,
        documents,
        supportingDocs,
        creatorComment,
        comments,
      });

      updateProgress(100);

      message.success('Checklist PDF generated successfully!');

      return {
        success: true,
        fileName: result.fileName
      };
    } catch (error) {
      console.error('PDF generation error:', error);
      message.error('Failed to generate PDF. Please try again.');

      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, []);

  return {
    isGenerating,
    progress,
    generatePDF,
  };
};

export default usePDFGenerator;
