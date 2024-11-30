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

// Route 1: QC Check
router.post('/qc',
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

            res.json({
                status: qcReport.overall_status,
                timestamp: new Date().toISOString(),
                analysis: {
                    initial: initialAnalysis,
                    qc: qcReport
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

// Route 2: CRM Analysis (requires analysis ID or full QC data)
router.post('/analysis',
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'prd', maxCount: 1 }
    ]),
    async (req, res, next) => {
        try {
            const { qcReport, initialAnalysis } = req.body;
            
            if (!qcReport || !initialAnalysis) {
                return res.status(400).json({
                    status: 'FAIL',
                    error: 'QC report and initial analysis are required'
                });
            }

            // Validate if QC passed
            if (qcReport.overall_status !== 'PASS') {
                return res.json({
                    status: 'FAIL',
                    reason: 'QC check did not pass',
                    qc_report: qcReport
                });
            }

            // Process image if provided (for re-analysis)
            let imageBase64 = null;
            if (req.files['image']) {
                imageBase64 = convertImageToBase64(req.files['image'][0].buffer);
            }

            // Generate CRM Analysis
            const crmAnalysis = await bedrockService.generateCRMAnalysis(
                qcReport,
                initialAnalysis,
                imageBase64
            );

            res.json({
                status: 'SUCCESS',
                timestamp: new Date().toISOString(),
                analysis: {
                    crm: crmAnalysis
                }
            });

        } catch (error) {
            next(error);
        }
    }
);

export default router;
