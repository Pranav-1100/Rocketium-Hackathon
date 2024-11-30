import sharp from 'sharp';

export class ImageService {
    async processImage(imageBuffer) {
        try {
            // Get image metadata
            const metadata = await sharp(imageBuffer).metadata();

            // Process image
            const processedBuffer = await sharp(imageBuffer)
                .resize(2000, 2000, { 
                    fit: 'inside',
                    withoutEnlargement: true 
                })
                .toBuffer();

            // Convert to base64
            const base64 = processedBuffer.toString('base64');

            return {
                base64,
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    size: imageBuffer.length
                }
            };
        } catch (error) {
            console.error('Error processing image:', error);
            throw error;
        }
    }

    async extractColors(imageBuffer) {
        try {
            const { dominant } = await sharp(imageBuffer)
                .stats();

            return {
                dominant: {
                    r: dominant.r,
                    g: dominant.g,
                    b: dominant.b
                }
            };
        } catch (error) {
            console.error('Error extracting colors:', error);
            throw error;
        }
    }
}
