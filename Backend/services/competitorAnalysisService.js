// import { BedrockService } from './bedrockService.js';
import sharp from 'sharp';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { OpenAIService } from './bedrockService.js';


export class CompetitorAnalysisService {
    constructor() {
        this.openaiService = new OpenAIService();
        this.datasetPath = 'output_dataset';
    }

    async analyzeImage(imageBuffer) {
        try {
            const metadata = await sharp(imageBuffer).metadata();
            const base64Image = imageBuffer.toString('base64');
            
            // Get comprehensive analysis from GPT-4V
            const analysisResults = await this.getImageAnalysis(base64Image);
            const datasetAnalyses = await this.getDatasetAnalyses();
            
            // Get comparative insights
            const insights = await this.getGPTInsights(analysisResults, datasetAnalyses);

            return {
                analysis: analysisResults,
                insights,
                recommendations: insights.recommendations,
                rating: insights.rating
            };
        } catch (error) {
            console.error('Analysis error:', error);
            throw error;
        }
    }

    async getImageAnalysis(base64Image) {
        const prompt = `Analyze this advertisement image in detail. Provide a comprehensive analysis of:

        1. Logo detection and analysis:
           - Position (x,y coordinates)
           - Size relative to image
           - Prominence score
        
        2. Object detection:
           - Main objects and their positions
           - Size and prominence
           - Layout effectiveness
        
        3. Face detection:
           - Number of faces
           - Positions and sizes
           - Expressions/emotions
        
        4. Text analysis:
           - Number of text blocks
           - Position of each block
           - Number of lines and words
           - Contrast with background
        
        5. Color analysis:
           - Dominant colors
           - Color scheme
           - Contrast ratios
        
        6. CTA analysis:
           - Position and size
           - Prominence
           - Text content
        
        7. Discount/Offer analysis:
           - Presence of discounts
           - Value and position
           - Prominence

        Respond with ONLY a JSON object using this structure:
        {
            "logo_analysis": {
                "detected": boolean,
                "position": { "x": number, "y": number },
                "relative_size": number,
                "prominence_score": number
            },
            "object_analysis": {
                "main_objects": [{
                    "type": string,
                    "position": { "x": number, "y": number },
                    "relative_size": number,
                    "prominence": number
                }]
            },
            "face_analysis": {
                "faces": [{
                    "position": { "x": number, "y": number },
                    "relative_size": number,
                    "expression": string
                }]
            },
            "text_analysis": {
                "blocks": [{
                    "content": string,
                    "position": { "x": number, "y": number },
                    "contrast_ratio": number
                }],
                "total_lines": number,
                "total_words": number
            },
            "color_analysis": {
                "dominant_colors": [string],
                "color_scheme": string,
                "contrast_scores": [{
                    "element": string,
                    "score": number
                }]
            },
            "cta_analysis": {
                "detected": boolean,
                "text": string,
                "position": { "x": number, "y": number },
                "prominence_score": number
            },
            "discount_analysis": {
                "detected": boolean,
                "value": string,
                "position": { "x": number, "y": number },
                "prominence_score": number
            }
        }`;

        return await this.openaiService.invokeModel(prompt, base64Image);
    }

    async getDatasetAnalyses() {
        try {
            const files = await readdir(this.datasetPath);
            const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
            
            const analyses = await Promise.all(imageFiles.map(async file => {
                const imageBuffer = await readFile(join(this.datasetPath, file));
                const base64Image = imageBuffer.toString('base64');
                return await this.getImageAnalysis(base64Image);
            }));

            return analyses;
        } catch (error) {
            console.error('Dataset analysis error:', error);
            throw error;
        }
    }

    async getGPTInsights(analysis, datasetAnalyses) {
        const prompt = `Compare this advertisement design with the dataset analyses and provide insights:

        Current Analysis:
        ${JSON.stringify(analysis, null, 2)}

        Dataset Analyses:
        ${JSON.stringify(datasetAnalyses, null, 2)}

        Provide detailed comparison and recommendations. Return as JSON with this structure:
        {
            "comparisons": {
                "logo": {
                    "alignment_with_dataset": number,
                    "size_comparison": string,
                    "position_effectiveness": number
                },
                "layout": {
                    "object_placement_score": number,
                    "space_utilization": string,
                    "balance_rating": number
                },
                "text": {
                    "readability_score": number,
                    "contrast_effectiveness": number,
                    "placement_rating": number
                },
                "cta": {
                    "prominence_comparison": number,
                    "position_effectiveness": number,
                    "clarity_score": number
                },
                "overall": {
                    "design_coherence": number,
                    "brand_alignment": number,
                    "effectiveness_score": number
                }
            },
            "recommendations": [{
                "element": string,
                "current_state": string,
                "recommended_change": string,
                "priority": number
            }],
            "rating": {
                "overall_score": number,
                "breakdown": {
                    "branding": number,
                    "layout": number,
                    "readability": number,
                    "call_to_action": number
                }
            }
        }`;

        return await this.openaiService.invokeModel(prompt);
    }

    async batchAnalyze(images) {
        const analyses = await Promise.all(
            images.map(img => this.analyzeImage(img.buffer))
        );
        
        return {
            analyses,
            aggregate_insights: await this.getGPTBatchInsights(analyses)
        };
    }

    async getGPTBatchInsights(analyses) {
        const prompt = `Analyze this batch of advertisements and provide aggregate insights:

        Analyses:
        ${JSON.stringify(analyses, null, 2)}

        Identify patterns, trends, and consistent elements. Return as JSON with this structure:
        {
            "patterns": {
                "layout": [string],
                "branding": [string],
                "text": [string],
                "cta": [string]
            },
            "effectiveness_metrics": {
                "average_rating": number,
                "top_performing_elements": [string],
                "common_weaknesses": [string]
            },
            "recommendations": {
                "design_guidelines": [string],
                "optimization_suggestions": [string]
            }
        }`;

        return await this.openaiService.invokeModel(prompt);
    }
}


// export class CompetitorAnalysisService {
//     constructor() {
//         this.bedrockService = new BedrockService();
//         this.datasetPath = 'output_dataset';
//     }

//     async analyzeImage(imageBuffer) {
//         try {
//             const metadata = await sharp(imageBuffer).metadata();
//             const base64Image = imageBuffer.toString('base64');
            
//             // Get comprehensive analysis from Claude
//             const analysisResults = await this.getImageAnalysis(base64Image);
//             const datasetAnalyses = await this.getDatasetAnalyses();
            
//             // Get comparative insights
//             const insights = await this.getClaudeInsights(analysisResults, datasetAnalyses);

//             return {
//                 analysis: analysisResults,
//                 insights,
//                 recommendations: insights.recommendations,
//                 rating: insights.rating
//             };
//         } catch (error) {
//             console.error('Analysis error:', error);
//             throw error;
//         }
//     }

//     async getImageAnalysis(base64Image) {
//         const prompt = `Analyze this advertisement image in detail. Provide a comprehensive analysis of:

//         1. Logo detection and analysis:
//            - Position (x,y coordinates)
//            - Size relative to image
//            - Prominence score
        
//         2. Object detection:
//            - Main objects and their positions
//            - Size and prominence
//            - Layout effectiveness
        
//         3. Face detection:
//            - Number of faces
//            - Positions and sizes
//            - Expressions/emotions
        
//         4. Text analysis:
//            - Number of text blocks
//            - Position of each block
//            - Number of lines and words
//            - Contrast with background
        
//         5. Color analysis:
//            - Dominant colors
//            - Color scheme
//            - Contrast ratios
        
//         6. CTA analysis:
//            - Position and size
//            - Prominence
//            - Text content
        
//         7. Discount/Offer analysis:
//            - Presence of discounts
//            - Value and position
//            - Prominence

//         Respond with ONLY a JSON object using this structure:
//         {
//             "logo_analysis": {
//                 "detected": boolean,
//                 "position": { "x": number, "y": number },
//                 "relative_size": number,
//                 "prominence_score": number
//             },
//             "object_analysis": {
//                 "main_objects": [{
//                     "type": string,
//                     "position": { "x": number, "y": number },
//                     "relative_size": number,
//                     "prominence": number
//                 }]
//             },
//             "face_analysis": {
//                 "faces": [{
//                     "position": { "x": number, "y": number },
//                     "relative_size": number,
//                     "expression": string
//                 }]
//             },
//             "text_analysis": {
//                 "blocks": [{
//                     "content": string,
//                     "position": { "x": number, "y": number },
//                     "contrast_ratio": number
//                 }],
//                 "total_lines": number,
//                 "total_words": number
//             },
//             "color_analysis": {
//                 "dominant_colors": [string],
//                 "color_scheme": string,
//                 "contrast_scores": [{
//                     "element": string,
//                     "score": number
//                 }]
//             },
//             "cta_analysis": {
//                 "detected": boolean,
//                 "text": string,
//                 "position": { "x": number, "y": number },
//                 "prominence_score": number
//             },
//             "discount_analysis": {
//                 "detected": boolean,
//                 "value": string,
//                 "position": { "x": number, "y": number },
//                 "prominence_score": number
//             }
//         }`;

//         return await this.bedrockService.invokeModel(prompt, base64Image);
//     }

//     async getDatasetAnalyses() {
//         try {
//             const files = await readdir(this.datasetPath);
//             const imageFiles = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file));
            
//             const analyses = await Promise.all(imageFiles.map(async file => {
//                 const imageBuffer = await readFile(join(this.datasetPath, file));
//                 const base64Image = imageBuffer.toString('base64');
//                 return await this.getImageAnalysis(base64Image);
//             }));

//             return analyses;
//         } catch (error) {
//             console.error('Dataset analysis error:', error);
//             throw error;
//         }
//     }

//     async getClaudeInsights(analysis, datasetAnalyses) {
//         const prompt = `Compare this advertisement design with the dataset analyses and provide insights:

//         Current Analysis:
//         ${JSON.stringify(analysis, null, 2)}

//         Dataset Analyses:
//         ${JSON.stringify(datasetAnalyses, null, 2)}

//         Provide detailed comparison and recommendations. Return as JSON with this structure:
//         {
//             "comparisons": {
//                 "logo": {
//                     "alignment_with_dataset": number,
//                     "size_comparison": string,
//                     "position_effectiveness": number
//                 },
//                 "layout": {
//                     "object_placement_score": number,
//                     "space_utilization": string,
//                     "balance_rating": number
//                 },
//                 "text": {
//                     "readability_score": number,
//                     "contrast_effectiveness": number,
//                     "placement_rating": number
//                 },
//                 "cta": {
//                     "prominence_comparison": number,
//                     "position_effectiveness": number,
//                     "clarity_score": number
//                 },
//                 "overall": {
//                     "design_coherence": number,
//                     "brand_alignment": number,
//                     "effectiveness_score": number
//                 }
//             },
//             "recommendations": [{
//                 "element": string,
//                 "current_state": string,
//                 "recommended_change": string,
//                 "priority": number
//             }],
//             "rating": {
//                 "overall_score": number,
//                 "breakdown": {
//                     "branding": number,
//                     "layout": number,
//                     "readability": number,
//                     "call_to_action": number
//                 }
//             }
//         }`;

//         return await this.bedrockService.invokeModel(prompt);
//     }

//     async batchAnalyze(images) {
//         const analyses = await Promise.all(
//             images.map(img => this.analyzeImage(img.buffer))
//         );
        
//         return {
//             analyses,
//             aggregate_insights: await this.getClaudeBatchInsights(analyses)
//         };
//     }

//     async getClaudeBatchInsights(analyses) {
//         const prompt = `Analyze this batch of advertisements and provide aggregate insights:

//         Analyses:
//         ${JSON.stringify(analyses, null, 2)}

//         Identify patterns, trends, and consistent elements. Return as JSON with this structure:
//         {
//             "patterns": {
//                 "layout": [string],
//                 "branding": [string],
//                 "text": [string],
//                 "cta": [string]
//             },
//             "effectiveness_metrics": {
//                 "average_rating": number,
//                 "top_performing_elements": [string],
//                 "common_weaknesses": [string]
//             },
//             "recommendations": {
//                 "design_guidelines": [string],
//                 "optimization_suggestions": [string]
//             }
//         }`;

//         return await this.bedrockService.invokeModel(prompt);
//     }
// }