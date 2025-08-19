#!/usr/bin/env python3

import os
import sys
import argparse
import subprocess
import shutil
from pathlib import Path
from typing import List, Optional
import time
import json

class FaceFusionBatch:
    def __init__(self, source_image: str, target_dir: str, output_dir: str, 
                 facefusion_path: Optional[str] = None, 
                 execution_provider: str = 'cpu',
                 face_swapper_model: str = 'inswapper_128',
                 verbose: bool = False):
        
        self.source_image = Path(source_image)
        self.target_dir = Path(target_dir)
        self.output_dir = Path(output_dir)
        self.facefusion_path = Path(facefusion_path) if facefusion_path else self._find_facefusion()
        self.execution_provider = execution_provider
        self.face_swapper_model = face_swapper_model
        self.verbose = verbose
        
        self._validate_inputs()
        self._prepare_output_dir()
    
    def _find_facefusion(self) -> Path:
        possible_paths = [
            Path.home() / 'facefusion',
            Path.cwd() / 'facefusion',
            Path('/opt/facefusion'),
            Path.home() / 'projects' / 'facefusion'
        ]
        
        for path in possible_paths:
            if path.exists() and (path / 'facefusion.py').exists():
                if self.verbose:
                    print(f"Found FaceFusion at: {path}")
                return path
        
        raise FileNotFoundError(
            "FaceFusion installation not found. Please specify the path using --facefusion-path or "
            "install it in one of the default locations: ~/facefusion, ./facefusion, /opt/facefusion"
        )
    
    def _validate_inputs(self):
        if not self.source_image.exists():
            raise FileNotFoundError(f"Source image not found: {self.source_image}")
        
        if not self.target_dir.exists():
            raise FileNotFoundError(f"Target directory not found: {self.target_dir}")
        
        if not (self.facefusion_path / 'facefusion.py').exists():
            raise FileNotFoundError(f"facefusion.py not found in: {self.facefusion_path}")
        
        target_images = self._get_target_images()
        if not target_images:
            raise ValueError(f"No valid image files found in target directory: {self.target_dir}")
    
    def _prepare_output_dir(self):
        self.output_dir.mkdir(parents=True, exist_ok=True)
        if self.verbose:
            print(f"Output directory prepared: {self.output_dir}")
    
    def _get_target_images(self) -> List[Path]:
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
        target_images = []
        
        for file in self.target_dir.iterdir():
            if file.is_file() and file.suffix.lower() in image_extensions:
                target_images.append(file)
        
        return sorted(target_images)
    
    def _build_command(self, target_image: Path, output_path: Path) -> List[str]:
        cmd = [
            sys.executable,
            str(self.facefusion_path / 'facefusion.py'),
            'headless-run',
            '--source', str(self.source_image),
            '--target', str(target_image),
            '--output', str(output_path),
            '--processors', 'face_swapper',
            '--face-swapper-model', self.face_swapper_model,
            '--execution-providers', self.execution_provider,
            '--skip-download'
        ]
        
        if self.execution_provider == 'cuda':
            cmd.extend(['--execution-device-id', '0'])
        
        return cmd
    
    def process_single_image(self, target_image: Path) -> bool:
        output_filename = f"{self.source_image.stem}_to_{target_image.stem}{target_image.suffix}"
        output_path = self.output_dir / output_filename
        
        if output_path.exists() and not self.verbose:
            print(f"  ⏭️  Skipping (exists): {target_image.name}")
            return True
        
        cmd = self._build_command(target_image, output_path)
        
        if self.verbose:
            print(f"\n  Command: {' '.join(cmd)}")
        
        try:
            result = subprocess.run(
                cmd,
                cwd=str(self.facefusion_path),
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode == 0:
                if output_path.exists():
                    print(f"  ✅ Success: {target_image.name} -> {output_filename}")
                    return True
                else:
                    print(f"  ⚠️  Warning: Process completed but output not found: {output_filename}")
                    if self.verbose and result.stdout:
                        print(f"     stdout: {result.stdout[-500:]}")
                    return False
            else:
                print(f"  ❌ Failed: {target_image.name}")
                if self.verbose:
                    print(f"     Error: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"  ❌ Error processing {target_image.name}: {str(e)}")
            return False
    
    def process_batch(self):
        target_images = self._get_target_images()
        total = len(target_images)
        
        print(f"\n🚀 Starting FaceFusion Batch Processing")
        print(f"   Source: {self.source_image.name}")
        print(f"   Targets: {total} images from {self.target_dir}")
        print(f"   Output: {self.output_dir}")
        print(f"   Model: {self.face_swapper_model}")
        print(f"   Provider: {self.execution_provider}")
        print(f"\n{'='*60}\n")
        
        successful = 0
        failed = 0
        start_time = time.time()
        
        for idx, target_image in enumerate(target_images, 1):
            print(f"[{idx}/{total}] Processing: {target_image.name}")
            
            if self.process_single_image(target_image):
                successful += 1
            else:
                failed += 1
            
            if idx < total:
                time.sleep(0.5)
        
        elapsed_time = time.time() - start_time
        
        print(f"\n{'='*60}")
        print(f"\n📊 Batch Processing Complete!")
        print(f"   ✅ Successful: {successful}/{total}")
        if failed > 0:
            print(f"   ❌ Failed: {failed}/{total}")
        print(f"   ⏱️  Time: {elapsed_time:.1f} seconds")
        print(f"   📁 Output: {self.output_dir}\n")
        
        return successful, failed

def main():
    parser = argparse.ArgumentParser(
        description='Batch process face swapping using FaceFusion',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Basic usage with CPU:
    python facefusion_batch.py source.jpg ./targets ./output
  
  With CUDA acceleration:
    python facefusion_batch.py source.jpg ./targets ./output --provider cuda
  
  With custom FaceFusion path:
    python facefusion_batch.py source.jpg ./targets ./output --facefusion-path ~/my-facefusion
  
  With high quality model:
    python facefusion_batch.py source.jpg ./targets ./output --model inswapper_128_fp16
        """
    )
    
    parser.add_argument('source', help='Path to source image (face to apply)')
    parser.add_argument('target_dir', help='Directory containing target images')
    parser.add_argument('output_dir', help='Directory for output images')
    
    parser.add_argument('--facefusion-path', 
                       help='Path to FaceFusion installation (auto-detect if not specified)')
    
    parser.add_argument('--provider', '--execution-provider',
                       dest='execution_provider',
                       default='cpu',
                       choices=['cpu', 'cuda', 'directml', 'openvino', 'rocm'],
                       help='Execution provider for processing (default: cpu)')
    
    parser.add_argument('--model', '--face-swapper-model',
                       dest='face_swapper_model',
                       default='inswapper_128',
                       choices=['inswapper_128', 'inswapper_128_fp16', 'simswap_256', 'simswap_512_unofficial'],
                       help='Face swapper model to use (default: inswapper_128)')
    
    parser.add_argument('-v', '--verbose',
                       action='store_true',
                       help='Enable verbose output')
    
    args = parser.parse_args()
    
    try:
        processor = FaceFusionBatch(
            source_image=args.source,
            target_dir=args.target_dir,
            output_dir=args.output_dir,
            facefusion_path=args.facefusion_path,
            execution_provider=args.execution_provider,
            face_swapper_model=args.face_swapper_model,
            verbose=args.verbose
        )
        
        successful, failed = processor.process_batch()
        
        sys.exit(0 if failed == 0 else 1)
        
    except (FileNotFoundError, ValueError) as e:
        print(f"\n❌ Error: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Batch processing interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}", file=sys.stderr)
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()