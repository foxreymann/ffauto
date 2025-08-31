1. call "C:\ProgramData\miniconda3\condabin\conda.bat" activate facefusion
2. Run
python facefusion.py batch-run ^
  --source-pattern "C:\AITools\facefusion-3.3.0\source.jpg" ^
  --target-pattern "C:\Pictures\*.jpg" ^
  --output-pattern "C:\AITools\facefusion-3.3.0\output\pic-{index}.jpg" ^
  --execution-providers cuda tensorrt ^
  --processors face_swapper expression_restorer face_editor face_enhancer frame_enhancer ^
  --output-image-quality 100 ^
  --face-swapper-model hyperswap_1a_256 ^
  --reference-face-distance 1.0 ^
  --face-mask-blur 0.9 ^
  --expression-restorer-factor 100 ^
  --face-enhancer-blend 100 ^
  --execution-thread-count 28 ^
  --face-mask-types box occlusion region ^
  --face-swapper-pixel-boost 1024x1024 ^
  --frame-enhancer-model clear_reality_x4 ^
  --frame-enhancer-blend 100 ^
  --face-selector-gender female