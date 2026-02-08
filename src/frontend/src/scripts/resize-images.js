import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const DIMENSION_PATTERN = /^(.+?)\.dim_(\d+)x(\d+)(\.[^.]+)$/;
const ASSETS_DIR = 'src/frontend/dist/assets/generated';

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

function getOutputOptions(ext) {
    const extension = ext.toLowerCase();

    switch (extension) {
        case '.png':
            return {
                format: 'png',
                options: {
                    compressionLevel: 6, // (0-9) 6 for balance of speed and size
                    palette: true, // Quantize to 256 colors
                    quality: 80, // Quality for palette quantization
                    effort: 8, // (0-10)
                    adaptiveFiltering: true
                }
            };
        case '.jpg':
        case '.jpeg':
            return {
                format: 'jpeg',
                options: {
                    quality: 80, // 80 is a good balance
                    mozjpeg: true, // Use MozJPEG encoder (much better compression)
                    trellisQuantisation: true,
                    overshootDeringing: true,
                    optimizeScans: true
                }
            };
        case '.webp':
            return {
                format: 'webp',
                options: {
                    quality: 80,
                    effort: 6, // Max effort (0-6)
                    smartSubsample: true
                }
            };
        default:
            return null;
    }
}

async function resizeImages() {
    if (!(await fileExists(ASSETS_DIR))) {
        console.log(`Directory ${ASSETS_DIR} does not exist, skipping resize`);
        return;
    }

    let files;
    try {
        files = await fs.readdir(ASSETS_DIR);
    } catch (error) {
        console.log(`Could not read ${ASSETS_DIR}: ${error.message}`);
        return;
    }

    let resizedCount = 0;

    for (const file of files) {
        const match = file.match(DIMENSION_PATTERN);
        if (match) {
            const [, , width, height, ext] = match;
            const filePath = path.join(ASSETS_DIR, file);
            const outputConfig = getOutputOptions(ext);

            if (!outputConfig) {
                console.log(`Skipping unsupported format: ${file}`);
                continue;
            }

            try {
                let pipeline = sharp(filePath)
                    .resize(parseInt(width, 10), parseInt(height, 10), {
                        fit: 'cover',
                        withoutEnlargement: false,
                        position: 'center'
                    })
                    .keepIccProfile();

                // Apply format-specific optimization
                pipeline = pipeline[outputConfig.format](outputConfig.options);

                const resized = await pipeline.toBuffer();
                await fs.writeFile(filePath, resized);
                resizedCount++;
            } catch (error) {
                console.error(`Failed to resize ${file}:`, error.message);
            }
        }
    }
}

resizeImages().catch((error) => {
    console.error('Image resize process failed:', error);
    process.exit(1);
});
