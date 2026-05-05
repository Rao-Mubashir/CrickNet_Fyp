import os
from PIL import Image

input_path = 'src/assets/logo.png'
output_path = 'src/assets/splash_icon.png'

try:
    with Image.open(input_path) as img:
        # Convert to RGBA to support transparency
        img = img.convert("RGBA")
        
        # Calculate new size with padding. 
        # Android 12 splash screen requires the logo to fit in a circle.
        # We'll create a canvas that is 1.5x larger than the logo.
        width, height = img.size
        
        # Determine the maximum dimension to make it square
        max_dim = max(width, height)
        new_size = int(max_dim * 1.5)
        
        # Create a new transparent image
        new_img = Image.new("RGBA", (new_size, new_size), (255, 255, 255, 0))
        
        # Paste the original logo in the center
        paste_x = (new_size - width) // 2
        paste_y = (new_size - height) // 2
        new_img.paste(img, (paste_x, paste_y), img)
        
        # Resize to recommended max 1152x1152 for Android 12
        new_img.thumbnail((1152, 1152), Image.Resampling.LANCZOS)
        
        new_img.save(output_path, "PNG")
        print(f"Created perfectly padded splash icon at {output_path}")

except Exception as e:
    print(f"Error: {e}")
