import express from 'express';
import multer from 'multer';
import { CompetitorAnalysisService } from '../services/competitorAnalysisService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const competitorService = new CompetitorAnalysisService();

// Basic competitor analysis
router.post('/analyze', 
    upload.single('image'),
    async (req, res) => {
        try {
            const analysis = await competitorService.analyzeImage(req.file.buffer);
            res.json({ success: true, data: analysis });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

// Batch Analysis
router.post('/batch',
    upload.array('images', 10),
    async (req, res) => {
        try {
            const analyses = await competitorService.batchAnalyze(req.files);
            res.json({ success: true, data: analyses });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

// Get Category Insights
router.get('/insights/:category', async (req, res) => {
    try {
        const insights = await competitorService.getCategoryInsights(req.params.category);
        res.json({ success: true, data: insights });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Compare with dataset
router.post('/compare',
    upload.single('image'),
    async (req, res) => {
        try {
            const analysis = await competitorService.analyzeImage(req.file.buffer);
            const comparison = await competitorService.compareWithDataset(analysis);
            res.json({ success: true, data: { analysis, comparison } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
);

export default router;