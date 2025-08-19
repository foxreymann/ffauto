# FaceFusion Batch Processor

Automate face swapping from one source image to multiple target images using FaceFusion.

## Prerequisites

1. **Install FaceFusion** following the [official documentation](https://docs.facefusion.io/installation):

```bash
# Create conda environment
conda create --name facefusion python=3.12 pip=25.0
conda activate facefusion

# Clone and install FaceFusion
git clone https://github.com/facefusion/facefusion
cd facefusion

# Install with your preferred accelerator
python install.py --onnxruntime default  # For CPU
# OR
python install.py --onnxruntime cuda     # For NVIDIA GPU
```

2. **Install Python dependencies** for this script:
```bash
pip install pathlib
```

## Usage

### Basic Usage
```bash
python facefusion_batch.py source.jpg ./target_images ./output
```

### With CUDA Acceleration
```bash
python facefusion_batch.py source.jpg ./target_images ./output --provider cuda
```

### With Custom FaceFusion Path
```bash
python facefusion_batch.py source.jpg ./target_images ./output --facefusion-path ~/my-facefusion
```

### With High Quality Model
```bash
python facefusion_batch.py source.jpg ./target_images ./output --model inswapper_128_fp16
```

### Verbose Output
```bash
python facefusion_batch.py source.jpg ./target_images ./output -v
```

## Parameters

- `source`: Path to the source image (the face to apply)
- `target_dir`: Directory containing target images to process
- `output_dir`: Directory where processed images will be saved

### Optional Arguments

- `--facefusion-path`: Path to FaceFusion installation (auto-detects if not specified)
- `--provider`: Execution provider (`cpu`, `cuda`, `directml`, `openvino`, `rocm`)
- `--model`: Face swapper model (`inswapper_128`, `inswapper_128_fp16`, `simswap_256`, `simswap_512_unofficial`)
- `-v, --verbose`: Enable verbose output for debugging

## Features

- **Batch Processing**: Automatically processes all images in the target directory
- **Progress Tracking**: Shows real-time progress with success/failure status
- **Auto-Detection**: Automatically finds FaceFusion installation in common locations
- **Skip Existing**: Skips already processed images to save time
- **Error Handling**: Graceful error handling with informative messages
- **Multiple Formats**: Supports JPG, JPEG, PNG, BMP, TIFF, and WEBP

## Output

Processed images are saved with the naming convention:
```
{source_name}_to_{target_name}.{extension}
```

For example:
- Source: `person1.jpg`
- Target: `photo1.png`
- Output: `person1_to_photo1.png`

## Example Workflow

1. Prepare your images:
```bash
mkdir -p input/targets output
cp your_face.jpg input/source.jpg
cp target_photos/*.jpg input/targets/
```

2. Run batch processing:
```bash
python facefusion_batch.py input/source.jpg input/targets output
```

3. Check results in the output directory:
```bash
ls -la output/
```

## Troubleshooting

### FaceFusion Not Found
If the script can't find FaceFusion, specify the path explicitly:
```bash
python facefusion_batch.py source.jpg targets output --facefusion-path /path/to/facefusion
```

### CUDA Not Working
Ensure you installed FaceFusion with CUDA support:
```bash
cd facefusion
python install.py --onnxruntime cuda
```

### Memory Issues
For large batches or high-resolution images, consider:
- Processing in smaller batches
- Using a lower resolution model
- Increasing system swap space

## Performance Tips

1. **Use GPU acceleration** when available (`--provider cuda`)
2. **Pre-resize images** to reasonable dimensions before processing
3. **Use SSD storage** for faster I/O operations
4. **Close other applications** to free up memory

## License

This automation script is provided as-is for use with FaceFusion. Please refer to [FaceFusion's license](https://github.com/facefusion/facefusion) for usage terms.