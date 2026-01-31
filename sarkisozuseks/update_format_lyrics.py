import re

# Read file
with open('song_viewer.html', 'r', encoding='utf-8') as f:
    content = f.read()

# New function code
new_function = r'''        function formatLyrics(htmlLyrics) {
            let lyrics = htmlLyrics.replace(/<pre[^>]*>/g, '').replace(/<\/pre>/g, '');
            lyrics = lyrics.replace(/<br\/?>/g, '\n');
            lyrics = lyrics.replace(/<[^>]+>/g, '');
            lyrics = lyrics.replace(/&nbsp;/g, ' ');
            const lines = lyrics.split('\n');
            const formattedLines = lines.map(line => {
                const trimmed = line.trim();
                if (!trimmed) return line;
                const chordPattern = /\b([A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*)\b/g;
                const words = trimmed.split(/\s+/).filter(w => w.length > 0);
                let chordCount = 0;
                words.forEach(word => {
                    if (/^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add)?[0-9]*$/.test(word)) {
                        chordCount++;
                    }
                });
                const chordRatio = words.length > 0 ? chordCount / words.length : 0;
                if (chordRatio >= 0.6 && words.length <= 15) {
                    return line.replace(chordPattern, '<span class="chord">$1</span>');
                }
                return line;
            });
            return formattedLines.join('\n');
        }'''

# Pattern to find and replace the function
pattern = r'function formatLyrics\(htmlLyrics\)[\s\S]*?return formattedLines\.join\([^)]+\);\s*}'

# Replace
content = re.sub(pattern, new_function, content)

# Write back
with open('song_viewer.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Updated!")
