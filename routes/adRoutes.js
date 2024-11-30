import express from 'express';
import multer from 'multer';
import { BedrockService } from '../services/bedrockService.js';
import { 
    extractTextFromPDF,
    validateFiles,
    convertImageToBase64,
    processAnalysisResults
} from '../utils/helpers.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const bedrockService = new BedrockService();

// Single route for complete analysis
router.post('/analyze', 
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'prd', maxCount: 1 }
    ]), 
    async (req, res, next) => {
        try {
            // Validate files
            const imageFile = req.files['image']?.[0];
            const prdFile = req.files['prd']?.[0];
            
            const validationErrors = validateFiles(imageFile, prdFile);
            if (validationErrors.length > 0) {
                return res.status(400).json({
                    status: 'FAIL',
                    errors: validationErrors
                });
            }

            // Process files
            const imageBase64 = convertImageToBase64(imageFile.buffer);
            const prdText = await extractTextFromPDF(prdFile.buffer);

            // Step 1: Initial Analysis
            let initialAnalysis;
            try {
                initialAnalysis = await bedrockService.generateInitialAnalysis(
                    imageBase64,
                    prdText
                );
            } catch (error) {
                return res.json({
                    status: 'FAIL',
                    stage: 'initial_analysis',
                    error: error.message
                });
            }

            // Step 2: QC Check
            let qcReport;
            try {
                qcReport = await bedrockService.performQCCheck(
                    initialAnalysis,
                    imageBase64,
                    prdText
                );
            } catch (error) {
                return res.json({
                    status: 'FAIL',
                    stage: 'qc_check',
                    initial_analysis: initialAnalysis,
                    error: error.message
                });
            }

            // Step 3: CRM Analysis (only if QC passed)
            let crmAnalysis = null;
            if (qcReport.overall_status === 'PASS') {
                try {
                    crmAnalysis = await bedrockService.generateCRMAnalysis(
                        qcReport,
                        initialAnalysis,
                        imageBase64
                    );
                } catch (error) {
                    console.error('CRM Analysis Error:', error);
                    // Continue without CRM analysis
                }
            }

            // Process and return results
            const results = processAnalysisResults(
                initialAnalysis,
                qcReport,
                crmAnalysis
            );

            res.json(results);

        } catch (error) {
            next(error);
        }
    }
);

export default router;
