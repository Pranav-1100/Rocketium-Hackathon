import pdfParse from 'pdf-parse/lib/pdf-parse.js';


export const formatImageAnalysis = (analysisResponse) => {
    try {
        // Ensure we have a valid response
        if (!analysisResponse) {
            throw new Error('Invalid analysis response');
        }

        // Structure the analysis in our required format
        return {
            technical_specs: analysisResponse.technical_specs || {},
            visual_elements: analysisResponse.visual_elements || {},
            brand_elements: analysisResponse.brand_elements || {},
            content_analysis: analysisResponse.content_analysis || {},
            metadata: analysisResponse.metadata || {}
        };
    } catch (error) {
        console.error('Error formatting analysis:', error);
        throw error;
    }
};

export const extractTextFromPDF = async (buffer) => {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting PDF text:', error);
        throw new Error('Failed to extract text from PRD PDF');
    }
};

export const processAnalysisResults = (initialAnalysis, qcReport, crmAnalysis) => {
    const status = qcReport.overall_status || 'FAIL';
    
    return {
        status,
        timestamp: new Date().toISOString(),
        analysis: {
            initial: initialAnalysis,
            qc: qcReport,
            crm: status === 'PASS' ? crmAnalysis : null
        },
        summary: {
            passed_qc: status === 'PASS',
            key_issues: qcReport.issues || [],
            recommendations: qcReport.recommendations || []
        }
    };
};

export const validateFiles = (imageFile, prdFile) => {
    const errors = [];

    // Image validation
    if (!imageFile) {
        errors.push('No image file provided');
    } else if (!imageFile.mimetype.startsWith('image/')) {
        errors.push('Invalid image file type');
    }

    // PRD validation
    if (!prdFile) {
        errors.push('No PRD file provided');
    } else if (prdFile.mimetype !== 'application/pdf') {
        errors.push('PRD must be a PDF file');
    }

    return errors;
};

export const convertImageToBase64 = (buffer) => {
    return buffer.toString('base64');
};
