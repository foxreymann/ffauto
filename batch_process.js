#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { readFileSync } = require('node:fs');
const { imageSize } = require('image-size');



// Configuration
const CONFIG = {
    facefusionPath: process.platform === 'win32' ? 'C:\\FaceFusion\\3.1.2' : path.join(os.homedir(), 'code', 'facefusion', 'facefusion'),
    sourceImage: null,
    //sourceImage: path.join(__dirname, 'data', 'src'),
    targetDir: path.join(__dirname, 'data', 'trgt'),
    outputDir: path.join(__dirname, 'data', 'out'),
    condaEnv: 'facefusion',
    
    // Settings from settings.txt
    //processors: ['face_swapper', 'age_modifier', 'expression_restorer', 'face_editor', 'face_enhancer', 'frame_enhancer'],
    processors: ['face_swapper', 'age_modifier', 'frame_enhancer', 'face_enhancer'],
    //agemodifierdirection: -50, // -100 to 100 with 0 as default
    //faceEditorEyeOpenRatio: 0, //-1 to 1 with 0 as default
    faceSwapperPixelBoost: '1024x1024',
    frameEnhancerModel: 'real_esrgan_x4_fp16',
    //executionProviders: process.platform === 'win32' ? ['cuda' , 'tensorrt'] : ['cpu'],
    executionProviders: ['tensorrt'],
    //executionThreadCount: process.platform === 'win32' ? 16 : 4,
    executionThreadCount: 16,
    //faceMaskTypes: ['box', 'occlusion'],
    faceMaskTypes: ['box'],
    faceDetectorAngles: [0, 90, 180, 270],
    //outputimageresolution: '1920x1080', // error [FACEFUSION.CORE] Copying image with a resolution of 6000x4000. Fails with frame enhancer
    //faceselectorgender: 'female', // female or male
    //faceMaskBlur: 0.3, //0.3 should be default
    referenceFacePosition: 0, // 0 default, next face would be 1
    
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}


// Get the source image from the data/src directory
function getSourceImage() {
    const srcDir = path.join(__dirname, 'data', 'src');
    try {
        const files = fs.readdirSync(srcDir);
        if (files.length > 0) {
            return path.join(srcDir, files[0]);
        }
    } catch (error) {
        console.error(`Error reading source directory: ${error.message}`);
    }
    return null;
}

// Get all image files from target directory
function getTargetImages() {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'];
    
    try {
        const files = fs.readdirSync(CONFIG.targetDir);
        return files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
        }).map(file => path.join(CONFIG.targetDir, file));
    } catch (error) {
        console.error(`Error reading target directory: ${error.message}`);
        return [];
    }
}

// Process a single image
function processImage(targetImage) {
    return new Promise((resolve, reject) => {
        const targetName = path.basename(targetImage);
        //const outputName = targetName.replace(path.extname(targetName), '_processed' + path.extname(targetName));
        const outputName = targetName.replace(path.extname(targetName) + path.extname(targetName));
        const outputPath = path.join(CONFIG.outputDir, outputName);
        
        console.log(`Processing: ${targetName}`);

        
        // Get image dimensions
        const buffer = readFileSync(targetImage)
        const dimensions = imageSize(buffer)

        let processors = CONFIG.processors;
        if (dimensions.width > 3840 || dimensions.height > 2160) {
            processors = processors.filter(p => p !== 'frame_enhancer');
            console.log(`  Image dimensions (${dimensions.width}x${dimensions.height}) exceed 2048x1200, skipping frame_enhancer.`);
        }

        // Build command arguments
        const args = [
            'facefusion.py',
            'headless-run',
            '--source', CONFIG.sourceImage,
            '--target', targetImage,
            '--output-path', outputPath,
            '--processors', ...processors,
            '--face-swapper-pixel-boost', CONFIG.faceSwapperPixelBoost,
            '--frame-enhancer-model', CONFIG.frameEnhancerModel.toString(),
            '--execution-providers', ...CONFIG.executionProviders,
            '--execution-thread-count', CONFIG.executionThreadCount.toString(),
            '--face-mask-types', ...CONFIG.faceMaskTypes,
            '--face-detector-angles', ...CONFIG.faceDetectorAngles.map(a => a.toString()),
            //'--face-mask-blur', CONFIG.faceMaskBlur.toString(),
            '--reference-face-position', CONFIG.referenceFacePosition.toString(),
            //'--face-selector-gender', CONFIG.faceselectorgender.toString(),
            //'--face-editor-eye-open-ratio', CONFIG.faceEditorEyeOpenRatio.toString(),
            //'--age-modifier-direction', CONFIG.agemodifierdirection.toString(),
            //'--output-image-resolution', CONFIG.outputimageresolution.toString(),
        ];

console.log(args.join(' ')); // Debugging output to see the command being run
        
        // Construct the command to activate conda and run facefusion
        const command = process.platform === 'win32' 
            ? `conda activate ${CONFIG.condaEnv} && cd ${CONFIG.facefusionPath} && python ${args.join(' ')}`
            : `source $(conda info --base)/etc/profile.d/conda.sh && conda activate ${CONFIG.condaEnv} && cd ${CONFIG.facefusionPath} && python ${args.join(' ')}`;

        console.log(`Executing command: ${command}`);
        
        const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
        const shellArgs = process.platform === 'win32' ? ['/c', command] : ['-c', command];
        
        const child = spawn(shell, shellArgs, {
            stdio: 'pipe',
            shell: false
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
            if (CONFIG.verbose) {
                process.stdout.write(data);
            }
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
            if (CONFIG.verbose) {
                process.stderr.write(data);
            }
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                console.log(`  ✅ Success: ${targetName} -> ${outputName}`);
                resolve({ success: true, target: targetName, output: outputName });
            } else {
                console.error(`  ❌ Failed: ${targetName} (exit code: ${code})`);
                if (stderr) {
                    console.error(`     Error: ${stderr.slice(0, 200)}`);
                }
                resolve({ success: false, target: targetName, error: stderr });
            }
        });
        
        child.on('error', (error) => {
            console.error(`  ❌ Error processing ${targetName}: ${error.message}`);
            resolve({ success: false, target: targetName, error: error.message });
        });
    });
}

// Main batch processing function
async function processBatch() {
    console.log('🚀 Starting FaceFusion Batch Processing');
    console.log(`   Source: ${path.basename(CONFIG.sourceImage)}`);
    console.log(`   Target Directory: ${CONFIG.targetDir}`);
    console.log(`   Output Directory: ${CONFIG.outputDir}`);
    console.log(`   Execution Providers: ${CONFIG.executionProviders.join(', ')}`);
    console.log(`   Processors: ${CONFIG.processors.join(', ')}`);
    console.log('=' .repeat(60));
    
    const targetImages = getTargetImages();
    
    if (targetImages.length === 0) {
        console.error('No target images found!');
        process.exit(1);
    }
    
    console.log(`Found ${targetImages.length} target images\n`);
    
    const startTime = Date.now();
    const results = [];
    
    // Process images sequentially to avoid overwhelming the system
    for (let i = 0; i < targetImages.length; i++) {
        console.log(`[${i + 1}/${targetImages.length}] ${path.basename(targetImages[i])}`);
        const result = await processImage(targetImages[i]);
        results.push(result);
        
        // Small delay between processing
        if (i < targetImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    const elapsedTime = (Date.now() - startTime) / 1000;
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

console.log({results});
const dump=results;(await import('fs')).writeFileSync('./results.json', JSON.stringify(dump, null, 2) , 'utf-8')
    
    console.log('=' .repeat(60));
    console.log('\n📊 Batch Processing Complete!');
    console.log(`   ✅ Successful: ${successful}/${targetImages.length}`);
    if (failed > 0) {
        console.log(`   ❌ Failed: ${failed}/${targetImages.length}`);
    }
    console.log(`   ⏱️  Time: ${elapsedTime.toFixed(1)} seconds`);
    console.log(`   📁 Output: ${CONFIG.outputDir}\n`);
    
    process.exit(failed > 0 ? 1 : 0);
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--verbose') || args.includes('-v')) {
    CONFIG.verbose = true;
}

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node batch_process.js [options]

Options:
  -v, --verbose    Show verbose output
  -h, --help       Show this help message

Configuration:
  Edit the CONFIG object in this file to change paths and settings.
  
Current configuration:
  - FaceFusion Path: ${CONFIG.facefusionPath}
  - Source Image: ${CONFIG.sourceImage}
  - Target Directory: ${CONFIG.targetDir}
  - Output Directory: ${CONFIG.outputDir}
  - Conda Environment: ${CONFIG.condaEnv}
`);
    process.exit(0);
}

// Set the source image
CONFIG.sourceImage = getSourceImage();

// Check if source image exists
if (!CONFIG.sourceImage || !fs.existsSync(CONFIG.sourceImage)) {
    console.error(`Error: Source image not found in ${path.join(__dirname, 'data', 'src')}`);
    process.exit(1);
}

// Check if target directory exists
if (!fs.existsSync(CONFIG.targetDir)) {
    console.error(`Error: Target directory not found: ${CONFIG.targetDir}`);
    process.exit(1);
}

// Run batch processing
processBatch().catch(error => {
    console.error(`Unexpected error: ${error.message}`);
});
