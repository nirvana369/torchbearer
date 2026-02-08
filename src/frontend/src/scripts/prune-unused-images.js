import { promises as fs } from 'fs';
import path from 'path';

const DIST_ASSETS_DIR = 'src/frontend/dist/assets';
const GENERATED_DIR = path.join(DIST_ASSETS_DIR, 'generated');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.ico', '.avif']);

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function getAssetFiles(dir) {
    const files = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Skip the generated folder itself
                if (entry.name !== 'generated') {
                    files.push(...(await getAssetFiles(fullPath)));
                }
            } else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs') || entry.name.endsWith('.css')) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error.message);
    }

    return files;
}

async function getGeneratedImages(dir) {
    const images = [];

    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (IMAGE_EXTENSIONS.has(ext)) {
                    images.push(entry.name);
                }
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(`Error reading generated directory:`, error.message);
        }
    }

    return images;
}

/**
 * Algorithm for finding referenced images:
 * 1. Read all asset file contents into a single concatenated string
 * 2. For each generated image filename, check if it exists in the combined content
 *
 * This approach is O(n * avg_filename_length) for the search phase,
 * where n = number of images. V8's String.includes() uses optimized
 * substring search algorithms that are very fast in practice.
 *
 * For 500 images with ~30 char filenames against ~2MB of JS/CSS content,
 * this completes in milliseconds.
 */
async function findReferencedImages(assetFiles, generatedImages) {
    const contents = await Promise.all(assetFiles.map((file) => fs.readFile(file, 'utf-8').catch(() => '')));
    const combinedContent = contents.join('\n');

    const referencedImages = new Set();

    for (const filename of generatedImages) {
        // This catches references in any context: strings, paths, url(), etc.
        if (combinedContent.includes(filename)) {
            referencedImages.add(filename);
        }
    }

    return referencedImages;
}

async function pruneUnusedImages() {
    if (!(await fileExists(DIST_ASSETS_DIR))) {
        console.log(`Directory ${DIST_ASSETS_DIR} does not exist, skipping prune`);
        return;
    }

    if (!(await fileExists(GENERATED_DIR))) {
        console.log(`Directory ${GENERATED_DIR} does not exist, nothing to prune`);
        return;
    }

    const generatedImages = await getGeneratedImages(GENERATED_DIR);

    if (generatedImages.length === 0) {
        console.log('No images in generated folder, nothing to prune');
        return;
    }

    console.log(`Found ${generatedImages.length} image(s) in generated folder`);

    const assetFiles = await getAssetFiles(DIST_ASSETS_DIR);

    if (assetFiles.length === 0) {
        console.log('No JS/CSS files found in dist/assets, skipping prune');
        return;
    }

    const jsCount = assetFiles.filter((f) => f.endsWith('.js') || f.endsWith('.mjs')).length;
    const cssCount = assetFiles.filter((f) => f.endsWith('.css')).length;
    console.log(`Scanning ${jsCount} JS file(s) and ${cssCount} CSS file(s) for image references...`);

    const referencedImages = await findReferencedImages(assetFiles, generatedImages);
    console.log(`Found ${referencedImages.size} image reference(s) in compiled assets`);

    const unusedImages = generatedImages.filter((img) => !referencedImages.has(img));

    if (unusedImages.length === 0) {
        console.log('\nNo unused images to prune');
        return;
    }

    // Remove unused images in parallel (batch of 10 for reasonable I/O)
    let removedCount = 0;
    let savedBytes = 0;

    const BATCH_SIZE = 10;
    for (let i = 0; i < unusedImages.length; i += BATCH_SIZE) {
        const batch = unusedImages.slice(i, i + BATCH_SIZE);

        const results = await Promise.all(
            batch.map(async (image) => {
                const imagePath = path.join(GENERATED_DIR, image);
                try {
                    const stats = await fs.stat(imagePath);
                    await fs.unlink(imagePath);
                    return { success: true, image, size: stats.size };
                } catch (error) {
                    return { success: false, image, error: error.message };
                }
            })
        );

        for (const result of results) {
            if (result.success) {
                removedCount++;
                savedBytes += result.size;
                console.log(`  Removed: ${result.image} (${formatBytes(result.size)})`);
            } else {
                console.error(`  Failed to remove ${result.image}: ${result.error}`);
            }
        }
    }

    console.log(`\nPruned ${removedCount} unused image(s), saved ${formatBytes(savedBytes)}`);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

pruneUnusedImages().catch((error) => {
    console.error('Image prune process failed:', error);
    process.exit(1);
});
