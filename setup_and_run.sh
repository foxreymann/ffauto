#!/bin/bash

set -e

echo "FaceFusion Batch Processing Setup Script"
echo "========================================"
echo ""

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "Error: Conda is not installed. Please install Anaconda or Miniconda first."
    echo "Visit: https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

# Initialize conda for bash
eval "$(conda shell.bash hook)"

# Check if facefusion environment exists
if conda env list | grep -q "^facefusion "; then
    echo "Found existing facefusion conda environment"
    conda activate facefusion
else
    echo "Creating new facefusion conda environment..."
    conda create --name facefusion python=3.12 pip=25.0 -y
    conda activate facefusion
fi

# Check if FaceFusion is installed
FACEFUSION_PATH="$HOME/facefusion"
if [ ! -d "$FACEFUSION_PATH" ]; then
    echo ""
    echo "FaceFusion not found at $FACEFUSION_PATH"
    echo "Installing FaceFusion..."
    
    cd "$HOME"
    git clone https://github.com/facefusion/facefusion
    cd facefusion
    
    echo ""
    echo "Select your execution provider:"
    echo "1) CPU (default)"
    echo "2) CUDA (NVIDIA GPU)"
    echo "3) DirectML (Windows)"
    echo "4) OpenVINO (Intel)"
    echo "5) ROCm (AMD GPU)"
    read -p "Enter choice [1-5]: " choice
    
    case $choice in
        2)
            echo "Installing with CUDA support..."
            python install.py --onnxruntime cuda
            ;;
        3)
            echo "Installing with DirectML support..."
            python install.py --onnxruntime directml
            ;;
        4)
            echo "Installing with OpenVINO support..."
            python install.py --onnxruntime openvino
            ;;
        5)
            echo "Installing with ROCm support..."
            python install.py --onnxruntime rocm
            ;;
        *)
            echo "Installing with CPU support..."
            python install.py --onnxruntime default
            ;;
    esac
    
    echo "FaceFusion installation complete!"
else
    echo "FaceFusion found at: $FACEFUSION_PATH"
fi

# Return to script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo "========================================"
echo "Setup complete! You can now use the batch processor."
echo ""
echo "Example usage:"
echo "  python facefusion_batch.py source.jpg ./targets ./output"
echo ""
echo "For CUDA acceleration:"
echo "  python facefusion_batch.py source.jpg ./targets ./output --provider cuda"
echo ""
echo "For help:"
echo "  python facefusion_batch.py --help"
echo ""
echo "Make sure you're in the facefusion conda environment:"
echo "  conda activate facefusion"