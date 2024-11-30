// src/config/bedrock.js

import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import dotenv from 'dotenv';

dotenv.config();

export const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

export const MODELS = {
    CLAUDE: process.env.BEDROCK_CLAUDE_MODEL,
    STABLE_DIFFUSION: process.env.BEDROCK_STABLE_DIFFUSION_MODEL,
    TITAN: process.env.BEDROCK_TITAN_MODEL
};

export const DEFAULT_PARAMS = {
    claude: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 4096
    },
    stableDiffusion: {
        cfg_scale: 7,
        steps: 30,
        seed: 0
    }
};