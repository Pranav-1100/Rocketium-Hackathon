// services/bedrockService.js
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { bedrockRuntime, BEDROCK_MODELS } from '../config/aws.js';

export class BedrockService {
    async invokeModel(prompt, imageBase64 = null) {
        try {
            const messages = [{
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `${prompt}\n\nYou must respond with valid JSON only. No other text or explanations.`
                    }
                ]
            }];

            if (imageBase64) {
                messages[0].content.push({
                    type: "image",
                    source: {
                        type: "base64",
                        media_type: "image/jpeg",
                        data: imageBase64
                    }
                });
            }

            const payload = {
                modelId: BEDROCK_MODELS.CLAUDE,
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify({
                    anthropic_version: "bedrock-2023-05-31",
                    messages,
                    max_tokens: 4096,
                    temperature: 0.7
                })
            };

            const command = new InvokeModelCommand(payload);
            const response = await bedrockRuntime.send(command);
            const responseData = JSON.parse(new TextDecoder().decode(response.body));
            
            // Extract JSON from Claude's response
            const content = responseData.content[0].text;
            return JSON.parse(content);
        } catch (error) {
            console.error('Bedrock invoke error:', error);
            throw error;
        }
    }

    // For the first route (/qc)
    async runQCProcess(imageBase64, prdText) {
        // Step 1: Initial Analysis
        const initialAnalysis = await this.generateInitialAnalysis(imageBase64, prdText);

        // Step 2: QC Check
        const qcReport = await this.performQCCheck(initialAnalysis, imageBase64, prdText);

        return {
            initial_analysis: initialAnalysis,
            qc_report: qcReport,
            timestamp: new Date().toISOString()
        };
    }

    // For the second route (/analysis)
    async runCRMAnalysis(qcReport, initialAnalysis, imageBase64 = null) {
        if (qcReport.overall_status !== 'PASS') {
            return {
                status: 'SKIPPED',
                reason: 'QC check failed',
                qc_report: qcReport
            };
        }

        const crmAnalysis = await this.generateCRMAnalysis(
            qcReport,
            initialAnalysis,
            imageBase64
        );

        return {
            crm_analysis: crmAnalysis,
            timestamp: new Date().toISOString()
        };
    }

    // Original methods remain the same
    async generateInitialAnalysis(imageBase64, prdText) {
        const prompt = `Analyze this advertisement image and provided PRD requirements.
        
        PRD Content: ${prdText}

        Respond with ONLY a JSON object using this exact structure:
        {
            "technical_specs": {
                "dimensions": {"width": number, "height": number},
                "format": string,
                "file_size": string
            },
            "visual_elements": {
                "colors": {
                    "dominant": [string],
                    "palette": [string]
                },
                "objects": [string],
                "composition": string
            },
            "brand_elements": {
                "logo": {
                    "present": boolean,
                    "position": string,
                    "size": string
                },
                "colors_matching": boolean,
                "fonts": [string]
            },
            "content_analysis": {
                "text_content": string,
                "messaging_tone": string,
                "cta_presence": boolean
            },
            "metadata": {
                "analysis_timestamp": string,
                "version": string
            }
        }`;

        return await this.invokeModel(prompt, imageBase64);
    }

    async performQCCheck(analysisJson, imageBase64, prdText) {
        const prompt = `Perform a quality control check on this advertisement.
        
        Current Analysis: ${JSON.stringify(analysisJson, null, 2)}
        PRD Requirements: ${prdText}

        Respond with ONLY a JSON object using this exact structure:
        {
            "overall_status": "PASS" | "FAIL",
            "technical_compliance": {
                "status": "PASS" | "FAIL",
                "issues": [string],
                "recommendations": [string]
            },
            "brand_compliance": {
                "status": "PASS" | "FAIL",
                "issues": [string],
                "recommendations": [string]
            },
            "content_compliance": {
                "status": "PASS" | "FAIL",
                "issues": [string],
                "recommendations": [string]
            }
        }`;

        return await this.invokeModel(prompt, imageBase64);
    }

    async generateCRMAnalysis(qcReport, analysisJson, imageBase64) {
        const prompt = `Generate CRM and performance insights for this advertisement.
        
        Analysis: ${JSON.stringify(analysisJson, null, 2)}
        QC Report: ${JSON.stringify(qcReport, null, 2)}

        Respond with ONLY a JSON object using this exact structure:
        {
            "audience_insights": {
                "target_demographics": [string],
                "interests": [string],
                "platforms": [string]
            },
            "recommendations": {
                "a_b_testing": [string],
                "improvements": [string],
                "platform_specific": object
            }
        }`;

        return await this.invokeModel(prompt, imageBase64);
    }
}