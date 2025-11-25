import re
import os
from PIL import Image, ImageDraw, ImageFont

# Configuration
RADICALS_FILE = 'radicals.js'
OUTPUT_DIR = '.' # The image paths in radicals.js include 'minimages/', so we start from current dir
FONT_PATH = 'C:\\Windows\\Fonts\\msgothic.ttc' # Standard Windows Japanese font
FONT_SIZE = 80
IMAGE_SIZE = (100, 100)

def generate_images():
    # 1. Read radicals.js
    try:
        with open(RADICALS_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: {RADICALS_FILE} not found.")
        return

    # 2. Extract data using regex
    # Matches: { char: '一', ... image: 'minimages/one.png', ... }
    # We look for char and image fields.
    pattern = re.compile(r"char:\s*'([^']+)'.*?image:\s*'([^']+)'")
    matches = pattern.findall(content)

    print(f"Found {len(matches)} radicals to process.")

    # 3. Setup Font
    try:
        font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    except IOError:
        print(f"Warning: Font not found at {FONT_PATH}. Trying Arial.")
        try:
            font = ImageFont.truetype("arial.ttf", FONT_SIZE)
        except IOError:
             print("Error: Could not load any font.")
             return

    # 4. Generate Images
    count = 0
    for char, image_rel_path in matches:
        # Construct full output path
        output_path = os.path.join(OUTPUT_DIR, image_rel_path)
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Create image
        img = Image.new('RGB', IMAGE_SIZE, color='white')
        d = ImageDraw.Draw(img)

        # Calculate text position to center it
        # getbbox returns (left, top, right, bottom)
        bbox = d.textbbox((0, 0), char, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Center position
        x = (IMAGE_SIZE[0] - text_width) / 2 - bbox[0] # Adjust for left bearing
        y = (IMAGE_SIZE[1] - text_height) / 2 - bbox[1] # Adjust for top bearing

        # Draw text
        d.text((x, y), char, font=font, fill='black')

        # Save
        try:
            img.save(output_path)
            count += 1
            # print(f"Generated {output_path}")
        except Exception as e:
            print(f"Error saving {output_path}: {e}")

    print(f"Successfully generated {count} images.")

if __name__ == "__main__":
    generate_images()
