# Read file
lines = []
with open('song_viewer.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and replace specific lines
output = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Found the problematic line
    if i >= 672 and i <= 679 and ('wordCount' in line or 'if (wordCount' in line or 'Muhtemelen' in line):
        # Skip these old lines and insert new ones
        if 'wordCount' in line and 'line.trim().split' in line:
            # Add new logic
            output.append('                const trimmed = line.trim();\r\n')
            output.append('                if (!trimmed) return line;\r\n')
            output.append('                const words = trimmed.split(/\\s+/).filter(w => w.length > 0);\r\n')
            output.append('                let chordCount = 0;\r\n')
            output.append('                words.forEach(word => {\r\n')
            output.append('                    if (/^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*$/.test(word)) {\r\n')
            output.append('                        chordCount++;\r\n')
            output.append('                    }\r\n')
            output.append('                });\r\n')
            output.append('                const chordRatio = words.length > 0 ? chordCount / words.length : 0;\r\n')
            output.append('                if (chordRatio >= 0.6 && words.length <= 15) {\r\n')
            
            # Skip next lines until we find the return statement
            i += 1
            while i < len(lines) and 'return line.replace(chordPattern' not in lines[i]:
                i += 1
            # Don't increment i, we want to include the return line
            continue
        else:
            # Skip this line
            i += 1
            continue
    
    output.append(line)
    i += 1

# Write
with open('song_viewer.html', 'w', encoding='utf-8') as f:
    f.writelines(output)

print("Done! Lines:", len(output))
