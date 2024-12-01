import dotenv from 'dotenv';
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

dotenv.config();

export const config = {
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    }
};

// Initialize Bedrock Runtime Client
export const bedrockRuntime = new BedrockRuntimeClient(config);

export const BEDROCK_MODELS = {
    CLAUDE: "anthropic.claude-3-5-sonnet-20240620-v1:0",
    STABLE_DIFFUSION: "stability.sd3-large-v1:0",
    TITAN: "amazon.titan-image-generator-v2:0"
};

export const BEDROCK_PARAMS = {
    claude: {
        max_tokens: 4096,
        temperature: 0.7,
        top_p: 0.9
    }
};

// Export a function to test the connection
export const testBedrockConnection = async () => {
    try {
        // Try a simple operation to test connection
        await bedrockRuntime.send(new ListModelsCommand({}));
        console.log('Successfully connected to Bedrock');
        return true;
    } catch (error) {
        console.error('Error connecting to Bedrock:', error);
        return false;
    }
};