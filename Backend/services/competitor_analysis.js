const AWS = require('aws-sdk');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const colorContrastChecker = require('color-contrast-checker');

require('dotenv').config();

const rekognition = new AWS.Rekognition({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

class CompetitorAnalysisService {
    constructor() {
        this.ccc = new colorContrastChecker();
        this.outputDatasetPath = './output_dataset';
    }

    async analyzeImage(imagePath) {
        try {
            const imageBuffer = await fs.readFile(imagePath);
            const imageMetadata = await sharp(imageBuffer).metadata();
            const detectResults = await this.getImageAnalysis(imageBuffer);
            const analysis = {
                logoAnalysis: await this.analyzeLogo(detectResults, imageMetadata),
                objectAnalysis: await this.analyzeObjects(detectResults, imageMetadata),
                faceAnalysis: await this.analyzeFaces(detectResults, imageMetadata),
                textAnalysis: await this.analyzeText(detectResults),
                colorContrastAnalysis: await this.analyzeColorContrast(imageBuffer),
                ctaAnalysis: await this.analyzeCTA(detectResults),
                discountAnalysis: await this.analyzeDiscounts(detectResults)
            };
            const comparison = await this.compareWithDataset(analysis);
            const recommendations = this.generateRecommendations(analysis, comparison);
            const rating = this.calculateDesignRating(analysis, comparison);

            return {
                analysis,
                comparison,
                recommendations,
                rating
            };
        } catch (error) {
            console.error('Error in image analysis:', error);
            throw error;
        }
    }

    async getImageAnalysis(imageBuffer) {
        const params = {
            Image: {
                Bytes: imageBuffer
            },
            Features: [
                'GENERAL_LABELS',
                'TEXT',
                'FACE_DETECTION',
                'LOGOS'
            ]
        };

        const results = await rekognition.detectLabels(params).promise();
        const textResults = await rekognition.detectText(params).promise();
        const faceResults = await rekognition.detectFaces(params).promise();
        const logoResults = await rekognition.detectLabels({
            ...params,
            Features: ['LOGOS']
        }).promise();

        return {
            labels: results.Labels,
            text: textResults.TextDetections,
            faces: faceResults.FaceDetails,
            logos: logoResults.Labels
        };
    }

    async analyzeLogo(detectResults, imageMetadata) {
        const logos = detectResults.logos.filter(label => label.Name.toLowerCase().includes('logo'));
        if (logos.length === 0) return { present: false };

        const logo = logos[0];
        const area = this.calculateArea(logo.Instances[0], imageMetadata);
        const position = this.calculatePosition(logo.Instances[0]);

        return {
            present: true,
            area,
            position,
            confidence: logo.Confidence
        };
    }

    async analyzeObjects(detectResults, imageMetadata) {
        const objects = detectResults.labels.filter(label => 
            label.Categories.some(cat => cat.Name === 'Object'));

        return objects.map(obj => ({
            name: obj.Name,
            area: this.calculateArea(obj.Instances[0], imageMetadata),
            position: this.calculatePosition(obj.Instances[0]),
            confidence: obj.Confidence
        }));
    }

    async analyzeFaces(detectResults, imageMetadata) {
        return detectResults.faces.map(face => ({
            area: this.calculateArea(face.BoundingBox, imageMetadata),
            position: this.calculatePosition(face.BoundingBox),
            confidence: face.Confidence,
            emotions: face.Emotions
        }));
    }

    async analyzeText(detectResults) {
        const lines = detectResults.text.filter(text => text.Type === 'LINE');
        const words = detectResults.text.filter(text => text.Type === 'WORD');

        return {
            lineCount: lines.length,
            wordCount: words.length,
            lines: lines.map(line => ({
                text: line.DetectedText,
                confidence: line.Confidence,
                position: this.calculatePosition(line.Geometry.BoundingBox)
            }))
        };
    }

    async analyzeColorContrast(imageBuffer) {
        const image = sharp(imageBuffer);
        const { dominant } = await image.stats();
        const backgroundColor = `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`;
        return {
            backgroundColorRGB: backgroundColor,
            contrastRatio: this.ccc.getContrastRatio(backgroundColor, '#000000'), 
            meetsWCAG: this.ccc.isLevelAA(backgroundColor, '#000000')
        };
    }

    async analyzeCTA(detectResults) {
        const ctaKeywords = ['buy', 'shop', 'get', 'order', 'sign up', 'subscribe'];
        const ctaTexts = detectResults.text.filter(text => 
            ctaKeywords.some(keyword => 
                text.DetectedText.toLowerCase().includes(keyword)
            )
        );

        return ctaTexts.map(cta => ({
            text: cta.DetectedText,
            position: this.calculatePosition(cta.Geometry.BoundingBox),
            confidence: cta.Confidence
        }));
    }

    async analyzeDiscounts(detectResults) {
        const discountPattern = /(\d+%\s*off|\$\d+\s*off|save\s*\$?\d+)/i;
        const discountTexts = detectResults.text.filter(text => 
            discountPattern.test(text.DetectedText)
        );

        return discountTexts.map(discount => ({
            text: discount.DetectedText,
            position: this.calculatePosition(discount.Geometry.BoundingBox),
            confidence: discount.Confidence
        }));
    }

    async compareWithDataset(analysis) {
        const datasetFiles = await fs.readdir(this.outputDatasetPath);
        const datasetAnalyses = await Promise.all(
            datasetFiles.map(file => this.loadDatasetAnalysis(file))
        );

        return {
            logoComparison: this.compareLogoMetrics(analysis.logoAnalysis, datasetAnalyses),
            objectComparison: this.compareObjectMetrics(analysis.objectAnalysis, datasetAnalyses),
            faceComparison: this.compareFaceMetrics(analysis.faceAnalysis, datasetAnalyses),
            textComparison: this.compareTextMetrics(analysis.textAnalysis, datasetAnalyses),
            contrastComparison: this.compareContrastMetrics(analysis.colorContrastAnalysis, datasetAnalyses),
            ctaComparison: this.compareCTAMetrics(analysis.ctaAnalysis, datasetAnalyses),
            discountComparison: this.compareDiscountMetrics(analysis.discountAnalysis, datasetAnalyses)
        };
    }

    generateRecommendations(analysis, comparison) {
        const recommendations = [];
        if (!analysis.logoAnalysis.present) {
            recommendations.push('Consider adding a logo to improve brand visibility');
        } else if (comparison.logoComparison.areaDeviation > 0.2) {
            recommendations.push('Adjust logo size to match industry standards');
        }
        if (!analysis.colorContrastAnalysis.meetsWCAG) {
            recommendations.push('Improve text-background contrast for better readability');
        }

        if (analysis.textAnalysis.lineCount > comparison.textComparison.averageLines + 2) {
            recommendations.push('Consider reducing text content for better visual balance');
        }
        if (analysis.ctaAnalysis.length === 0) {
            recommendations.push('Add a clear call-to-action button');
        } else if (comparison.ctaComparison.positionDeviation > 0.2) {
            recommendations.push('Optimize CTA button position for better visibility');
        }

        return recommendations;
    }

    calculateDesignRating(analysis, comparison) {
        let score = 0;
        const weights = {
            logo: 15,
            objects: 10,
            faces: 10,
            text: 20,
            contrast: 20,
            cta: 15,
            discounts: 10
        };
        if (analysis.logoAnalysis.present) {
            score += weights.logo * (1 - comparison.logoComparison.areaDeviation);
        }
        if (analysis.colorContrastAnalysis.meetsWCAG) {
            score += weights.contrast;
        }
        const textDeviation = Math.abs(analysis.textAnalysis.lineCount - comparison.textComparison.averageLines) / comparison.textComparison.averageLines;
        score += weights.text * (1 - textDeviation);
        if (analysis.ctaAnalysis.length > 0) {
            score += weights.cta * (1 - comparison.ctaComparison.positionDeviation);
        }
        return Math.min(100, Math.max(0, score));
    }
    calculateArea(boundingBox, imageMetadata) {
        return (boundingBox.Width * boundingBox.Height) * (imageMetadata.width * imageMetadata.height);
    }

    calculatePosition(boundingBox) {
        return {
            x: boundingBox.Left + (boundingBox.Width / 2),
            y: boundingBox.Top + (boundingBox.Height / 2)
        };
    }

    async loadDatasetAnalysis(filename) {
        const filePath = path.join(this.outputDatasetPath, filename);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    }
}

module.exports = CompetitorAnalysisService;