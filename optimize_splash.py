import os
from PIL import Image

input_path = 'src/assets/splash.png'
output_path = 'src/assets/splash_optimized.png'

try:
    with Image.open(input_path) as img:
        # Resize to max 1152x1152 (Android 12 spec) while keeping aspect ratio
        img.thumbnail((1152, 1152), Image.Resampling.LANCZOS)
        # Save optimized
        img.save(output_path, optimize=True, quality=85)
    print(f"Successfully optimized {input_path} -> {output_path}")
    print(f"Original size: {os.path.getsize(input_path)} bytes")
    print(f"Optimized size: {os.path.getsize(output_path)} bytes")
except Exception as e:
    print(f"Error: {e}")
