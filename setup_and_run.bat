@echo off
setlocal enabledelayedexpansion

echo FaceFusion Batch Processing Setup Script (Windows)
echo ==================================================
echo.

:: Check if conda is installed
where conda >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Conda is not installed. Please install Anaconda or Miniconda first.
    echo Visit: https://docs.conda.io/en/latest/miniconda.html
    pause
    exit /b 1
)

:: Check if facefusion environment exists
conda env list | findstr /B "facefusion " >nul 2>nul
if %errorlevel% equ 0 (
    echo Found existing facefusion conda environment
    call conda activate facefusion
) else (
    echo Creating new facefusion conda environment...
    call conda create --name facefusion python=3.12 pip=25.0 -y
    call conda activate facefusion
)

:: Check if FaceFusion is installed
set "FACEFUSION_PATH=%USERPROFILE%\facefusion"
if not exist "%FACEFUSION_PATH%" (
    echo.
    echo FaceFusion not found at %FACEFUSION_PATH%
    echo Installing FaceFusion...
    
    cd /d "%USERPROFILE%"
    git clone https://github.com/facefusion/facefusion
    cd facefusion
    
    echo.
    echo Select your execution provider:
    echo 1) CPU (default)
    echo 2) CUDA (NVIDIA GPU)
    echo 3) DirectML (Windows GPU acceleration)
    echo 4) OpenVINO (Intel)
    echo 5) ROCm (AMD GPU - Linux only)
    set /p choice="Enter choice [1-5]: "
    
    if "!choice!"=="2" (
        echo Installing with CUDA support...
        python install.py --onnxruntime cuda
    ) else if "!choice!"=="3" (
        echo Installing with DirectML support...
        python install.py --onnxruntime directml
    ) else if "!choice!"=="4" (
        echo Installing with OpenVINO support...
        python install.py --onnxruntime openvino
    ) else if "!choice!"=="5" (
        echo Note: ROCm is not supported on Windows. Installing with CPU support instead...
        python install.py --onnxruntime default
    ) else (
        echo Installing with CPU support...
        python install.py --onnxruntime default
    )
    
    echo FaceFusion installation complete!
) else (
    echo FaceFusion found at: %FACEFUSION_PATH%
)

:: Return to script directory
cd /d "%~dp0"

echo.
echo ==================================================
echo Setup complete! You can now use the batch processor.
echo.
echo Example usage:
echo   python facefusion_batch.py source.jpg .\targets .\output
echo.
echo For CUDA acceleration:
echo   python facefusion_batch.py source.jpg .\targets .\output --provider cuda
echo.
echo For DirectML (Windows GPU):
echo   python facefusion_batch.py source.jpg .\targets .\output --provider directml
echo.
echo For help:
echo   python facefusion_batch.py --help
echo.
echo Make sure you're in the facefusion conda environment:
echo   conda activate facefusion
echo.
pause