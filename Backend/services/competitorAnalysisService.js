import { RekognitionClient, DetectLabelsCommand, DetectTextCommand, DetectFacesCommand } from "@aws-sdk/client-rekognition";
import { BedrockService } from './bedrockService.js';
import sharp from 'sharp';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

export class CompetitorAnalysisService {
    constructor() {
        this.rekognition = new RekognitionClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN
            }
        });
        this.bedrockService = new BedrockService();
        this.datasetPath = './output_dataset';
    }

    async analyzeImage(imageBuffer) {
        try {
            const metadata = await sharp(imageBuffer).metadata();
            const analysisResults = await this.getImageAnalysis(imageBuffer);
            const datasetAnalyses = await this.getDatasetAnalyses();
            
            // Prepare data for Claude
            const analysis = {
                logo: this.analyzeLogo(analysisResults, metadata),
                objects: this.analyzeObjects(analysisResults, metadata),
                faces: this.analyzeFaces(analysisResults, metadata),
                text: this.analyzeText(analysisResults),
                colors: await this.analyzeColors(imageBuffer),
                cta: this.analyzeCTA(analysisResults),
                discounts: this.analyzeDiscounts(analysisResults)
            };

            // Get insights from Claude
            const insights = await this.getClaudeInsights(analysis, datasetAnalyses);

            return {
                analysis,
                insights,
                recommendations: insights.recommendations,
                rating: insights.rating
            };
        } catch (error) {
            console.error('Analysis error:', error);
            throw error;
        }
    }

    async getImageAnalysis(imageBuffer) {
        try {
            const params = {
                Image: { Bytes: imageBuffer }
            };

            const [labels, text, faces] = await Promise.all([
                this.rekognition.send(new DetectLabelsCommand(params)),
                this.rekognition.send(new DetectTextCommand(params)),
                this.rekognition.send(new DetectFacesCommand(params))
            ]);

            return { labels, text, faces };
        } catch (error) {
            throw new Error(`Rekognition analysis failed: ${error.message}`);
        }
    }

    async batchAnalyze(images) {
        const analyses = await Promise.all(
            images.map(img => this.analyzeImage(img.buffer))
        );
        
        const batchInsights = await this.getClaudeBatchInsights(analyses);
        
        return {
            analyses,
            insights: batchInsights
        };
    }

    async getCategoryInsights(category) {
        const datasetAnalyses = await this.getDatasetAnalyses(category);
        return await this.getClaudeCategoryInsights(datasetAnalyses, category);
    }

    async compareWithDataset(analysis) {
        const datasetAnalyses = await this.getDatasetAnalyses();
        return await this.getClaudeComparison(analysis, datasetAnalyses);
    }

    async getClaudeInsights(analysis, datasetAnalyses) {
        const prompt = `Analyze this advertisement design compared to the dataset:

        Current Design Analysis:
        ${JSON.stringify(analysis, null, 2)}

        Dataset Analyses:
        ${JSON.stringify(datasetAnalyses, null, 2)}

        Compare and provide insights on:
        1. Logo placement and size
        2. Object positioning
        3. Face detection and positioning
        4. Text analysis and readability
        5. Color contrast
        6. CTA effectiveness
        7. Discount visibility

        Provide specific recommendations for improvement and a design rating out of 100.
        
        Return as JSON with this structure:
        {
            "comparisons": {
                "logo": {},
                "objects": {},
                "faces": {},
                "text": {},
                "colors": {},
                "cta": {},
                "discounts": {}
            },
            "recommendations": [],
            "rating": number
        }`;

        return await this.bedrockService.invokeModel(prompt);
    }

    // Helper methods...
    analyzeLogo(results, metadata) {
        const logos = results.labels.Labels.filter(label => 
            label.Name.toLowerCase().includes('logo'));
        return logos.map(logo => ({
            confidence: logo.Confidence,
            area: this.calculateArea(logo.Instances[0], metadata),
            position: this.calculatePosition(logo.Instances[0])
        }));
    }

    calculateArea(box, metadata) {
        return (box.Width * box.Height) * (metadata.width * metadata.height);
    }

    calculatePosition(box) {
        return {
            x: box.Left + (box.Width / 2),
            y: box.Top + (box.Height / 2)
        };
    }
}