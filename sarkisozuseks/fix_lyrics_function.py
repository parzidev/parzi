with open('song_viewer.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find formatLyrics function and replace critical lines
in_function = False
function_start = -1
new_lines = []
skip_until_closing = False

for i, line in enumerate(lines):
    if 'function formatLyrics(htmlLyrics)' in line:
        in_function = True
        function_start = i
        new_lines.append(line)
        continue
    
    # Replace the critical part - the word count check
    if in_function and 'const wordCount = line.trim().split' in line:
        # Replace next 5 lines with new logic
        new_lines.append(line)  # Keep the wordCount line
        
        # Skip old lines and add new logic
        skip_until_closing = True
        
        # Add new chord detection logic
        new_lines.append('                \n')
        new_lines.append('                // Kaç kelime TAM akor formatında?\n')
        new_lines.append('                let chordCount = 0;\n')
        new_lines.append('                const words = line.trim().split(/\\s+/).filter(w => w.length > 0);\n')
        new_lines.append('                words.forEach(word => {\n')
        new_lines.append('                    if (/^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*$/.test(word)) {\n')
        new_lines.append('                        chordCount++;\n')
        new_lines.append('                    }\n')
        new_lines.append('                });\n')
        new_lines.append('                \n')
        new_lines.append('                // Akor satırı: En az %60 akor olmalı\n')
        new_lines.append('                const chordRatio = words.length > 0 ? chordCount / words.length : 0;\n')
        new_lines.append('                \n')
        new_lines.append('                if (chordRatio >= 0.6 && words.length <= 15 && line.trim().length > 0) {\n')
        continue
    
    if skip_until_closing and 'if (wordCount <= 10' in line:
        # Skip this line, we already added our if
        continue
        
    if skip_until_closing and '// Muhtemelen akor' in line:
        # Skip comment
        continue
        
    if skip_until_closing and 'return line.replace(chordPattern' in line:
        new_lines.append(line)
        skip_until_closing = False
        continue
    
    if in_function and 'return formattedLines.join' in line:
        in_function = False
    
    new_lines.append(line)

# Write back
with open('song_viewer.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Güncellendi!")
print(f"Toplam satır: {len(new_lines)}")
