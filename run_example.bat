@echo off
:: Example batch file to run FaceFusion batch processing on Windows

:: Activate the conda environment
call conda activate facefusion

:: Create example directories if they don't exist
if not exist "input\targets" mkdir input\targets
if not exist "output" mkdir output

:: Run the batch processor
:: Replace these paths with your actual image paths
python facefusion_batch.py ^
    input\source.jpg ^
    input\targets ^
    output ^
    --provider cpu

:: For NVIDIA GPU users, uncomment the following instead:
:: python facefusion_batch.py ^
::     input\source.jpg ^
::     input\targets ^
::     output ^
::     --provider cuda

:: For Windows GPU acceleration (DirectML), uncomment:
:: python facefusion_batch.py ^
::     input\source.jpg ^
::     input\targets ^
::     output ^
::     --provider directml

pause