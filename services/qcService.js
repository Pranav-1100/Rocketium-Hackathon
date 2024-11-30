import { BedrockService } from './bedrockService.js';

export class QCService {
    constructor() {
        this.bedrockService = new BedrockService();
    }

    async performFullAnalysis(processedImage, prd) {
        try {
            // Get image analysis
            const imageAnalysis = await this.bedrockService.analyzeImage(
                processedImage.base64,
                this.createImageAnalysisPrompt(prd)
            );

            // Perform QC check
            const qcReport = await this.bedrockService.performQC(
                imageAnalysis,
                prd
            );

            // Generate CRM insights
            const crmInsights = await this.bedrockService.generateCRMInsights(qcReport);

            return {
                image_analysis: imageAnalysis,
                qc_report: qcReport,
                crm_insights: crmInsights,
                summary: {
                    status: this.generateStatusSummary(qcReport),
                    key_findings: this.extractKeyFindings(qcReport, crmInsights),
                    recommendations: this.extractRecommendations(qcReport, crmInsights)
                }
            };
        } catch (error) {
            console.error('Error in full analysis:', error);
            throw error;
        }
    }

    createImageAnalysisPrompt(prd) {
        return `Analyze this advertisement image considering the following PRD requirements:
            ${JSON.stringify(prd)}
            
            Provide a detailed analysis including:
            1. Technical specifications
            2. Visual elements
            3. Brand elements
            4. Text content
            5. Layout & composition
            
            Format the response as a structured JSON matching the required schema.`;
    }

    generateStatusSummary(qcReport) {
        const statuses = qcReport.qc_results || {};
        return {
            overall: this.calculateOverallStatus(statuses),
            technical: statuses.technical_compliance?.status || 'UNKNOWN',
            brand: statuses.brand_compliance?.status || 'UNKNOWN',
            platform: statuses.platform_compliance?.status || 'UNKNOWN',
            safety: statuses.content_safety?.status || 'UNKNOWN'
        };
    }

    calculateOverallStatus(statuses) {
        const statusValues = Object.values(statuses)
            .filter(s => s?.status)
            .map(s => s.status);

        if (statusValues.includes('FAIL')) return 'FAIL';
        if (statusValues.includes('PARTIAL')) return 'PARTIAL';
        return 'PASS';
    }

    extractKeyFindings(qcReport, crmInsights) {
        const findings = [];
        
        // Extract QC issues
        Object.values(qcReport.qc_results || {}).forEach(category => {
            if (category.issues) {
                findings.push(...category.issues);
            }
        });

        // Extract key CRM insights
        if (crmInsights.performance_metrics) {
            findings.push(`Estimated CTR: ${crmInsights.performance_metrics.estimated_ctr}`);
            findings.push(`Engagement Score: ${crmInsights.performance_metrics.engagement_score}`);
        }

        return findings;
    }

    extractRecommendations(qcReport, crmInsights) {
        const recommendations = [];
        
        // Extract QC recommendations
        Object.values(qcReport.qc_results || {}).forEach(category => {
            if (category.recommendations) {
                recommendations.push(...category.recommendations);
            }
        });

        // Extract CRM recommendations
        if (crmInsights.campaign_insights?.improvement_opportunities) {
            recommendations.push(...crmInsights.campaign_insights.improvement_opportunities);
        }

        return recommendations;
    }
}
