"""
Minimalist Chord Diagram SVG Generator (v2)
Clean, professional guitar chord SVGs for dark-themed web applications.
"""

class ChordDiagram:
    def __init__(self, width=120, height=140):
        self.width = width
        self.height = height
        self.string_count = 6
        self.fret_count = 5
        self.margin_top = 25
        self.margin_left = 30
        self.margin_right = 15
        self.fret_width = (width - self.margin_left - self.margin_right) / (self.string_count - 1)
        self.fret_height = (height - self.margin_top - 20) / (self.fret_count - 1)

    def create_svg(self, chord_name, fingering):
        frets = fingering.get('frets', [])
        fingers = fingering.get('fingers', [])
        
        # Auto-calculate base fret to avoid redundant empty rows
        pressed_frets = [f for f in frets if f > 0]
        max_f = max(pressed_frets) if pressed_frets else 0
        min_f = min(pressed_frets) if pressed_frets else 1
        
        base_fret = fingering.get('base_fret', 1)
        if base_fret == 1 and max_f > 4:
            base_fret = min_f

        svg = [f'<svg width="{self.width}" height="{self.height}" viewBox="0 0 {self.width} {self.height}" xmlns="http://www.w3.org/2000/svg">']
        
        # Fretboard (Strings) - Slate Gray
        for i in range(self.string_count):
            x = self.margin_left + (i * self.fret_width)
            y1, y2 = self.margin_top, self.margin_top + (self.fret_count - 1) * self.fret_height
            width = 2 if i == 0 else 1 # Thicker low E
            svg.append(f'<line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="#475569" stroke-width="{width}"/>')
        
        # Fretboard (Frets) - Slate Gray
        for i in range(self.fret_count):
            x1, x2 = self.margin_left, self.margin_left + (self.string_count - 1) * self.fret_width
            y = self.margin_top + (i * self.fret_height)
            width = 4 if i == 0 and base_fret == 1 else 1 # Nut
            svg.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="#475569" stroke-width="{width}"/>')

        # Base Fret Indicator
        if base_fret > 1:
            svg.append(f'<text x="{self.margin_left - 18}" y="{self.margin_top + self.fret_height/2 + 5}" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="700" fill="#94a3b8">{base_fret}fr</text>')

        # Detect Barres (Simplified logic: same finger, same fret, multiple strings)
        barres = {}
        for s_idx, (f, finger) in enumerate(zip(frets, fingers)):
            if f > 0 and finger > 0:
                key = (f, finger)
                barres.setdefault(key, []).append(s_idx)
        
        for (f, finger), strings in barres.items():
            if len(strings) > 1:
                start_x = self.margin_left + (min(strings) * self.fret_width)
                end_x = self.margin_left + (max(strings) * self.fret_width)
                rel_fret = f - base_fret + 0.5
                y = self.margin_top + (rel_fret * self.fret_height)
                # Minimalist Barre: Indigo Blue rounding
                svg.append(f'<rect x="{start_x - 7}" y="{y - 7}" width="{end_x - start_x + 14}" height="14" rx="7" fill="#6366f1"/>')

        # Finger Markers - Indigo/Violet system
        for string_idx, (fret, finger) in enumerate(zip(frets, fingers)):
            x = self.margin_left + (string_idx * self.fret_width)
            if fret == -1:
                svg.append(f'<text x="{x}" y="{self.margin_top - 10}" text-anchor="middle" font-family="system-ui" font-size="14" font-weight="900" fill="#ef4444">×</text>')
            elif fret == 0:
                svg.append(f'<circle cx="{x}" cy="{self.margin_top - 10}" r="4" fill="none" stroke="#94a3b8" stroke-width="2"/>')
            else:
                rel_fret = fret - base_fret + 0.5
                y = self.margin_top + (rel_fret * self.fret_height)
                svg.append(f'<circle cx="{x}" cy="{y}" r="8" fill="#6366f1"/>')
                if finger > 0:
                    svg.append(f'<text x="{x}" y="{y+1}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui" font-size="10" font-weight="700" fill="#fff">{finger}</text>')

        svg.append('</svg>')
        return '\n'.join(svg)

# Standard Chords Database
CHORD_DATABASE = {
    'C':   {'frets': [-1, 3, 2, 0, 1, 0], 'fingers': [0, 3, 2, 0, 1, 0]},
    'D':   {'frets': [-1, -1, 0, 2, 3, 2], 'fingers': [0, 0, 0, 1, 3, 2]},
    'E':   {'frets': [0, 2, 2, 1, 0, 0],   'fingers': [0, 2, 3, 1, 0, 0]},
    'F':   {'frets': [1, 3, 3, 2, 1, 1],   'fingers': [1, 3, 4, 2, 1, 1]},
    'G':   {'frets': [3, 2, 0, 0, 0, 3],   'fingers': [3, 2, 0, 0, 0, 4]},
    'A':   {'frets': [-1, 0, 2, 2, 2, 0],  'fingers': [0, 0, 1, 2, 3, 0]},
    'B':   {'frets': [-1, 2, 4, 4, 4, 2],  'fingers': [0, 1, 3, 3, 3, 1]},
    'Am':  {'frets': [-1, 0, 2, 2, 1, 0],  'fingers': [0, 0, 2, 3, 1, 0]},
    'Bm':  {'frets': [-1, 2, 4, 4, 3, 2],  'fingers': [0, 1, 3, 4, 2, 1]},
    'Cm':  {'frets': [-1, 3, 5, 5, 4, 3],  'fingers': [0, 1, 3, 4, 2, 1]},
    'Dm':  {'frets': [-1, -1, 0, 2, 3, 1], 'fingers': [0, 0, 0, 2, 3, 1]},
    'Em':  {'frets': [0, 2, 2, 0, 0, 0],   'fingers': [0, 2, 3, 0, 0, 0]},
    'Fm':  {'frets': [1, 3, 3, 1, 1, 1],   'fingers': [1, 3, 4, 1, 1, 1]},
    'Gm':  {'frets': [3, 5, 5, 3, 3, 3],   'fingers': [1, 3, 4, 1, 1, 1]},
    'C#':  {'frets': [-1, 4, 6, 6, 6, 4],  'fingers': [0, 1, 3, 3, 3, 1]},
    'C#m': {'frets': [-1, 4, 6, 6, 5, 4],  'fingers': [0, 1, 3, 4, 2, 1]},
    'F#':  {'frets': [2, 4, 4, 3, 2, 2],   'fingers': [1, 3, 4, 2, 1, 1]},
    'F#m': {'frets': [2, 4, 4, 2, 2, 2],   'fingers': [1, 3, 4, 1, 1, 1]},
}

def generate_chord_svg(name, path=None):
    data = CHORD_DATABASE.get(name)
    if not data: return None
    svg = ChordDiagram().create_svg(name, data)
    if path:
        with open(path, 'w', encoding='utf-8') as f: f.write(svg)
    return svg

if __name__ == "__main__":
    import os
    target = "test_chords"
    os.makedirs(target, exist_ok=True)
    for c in CHORD_DATABASE:
        generate_chord_svg(c, f"{target}/{c}.svg")
    print("Regenerated Chords with Minimalism v2.")
