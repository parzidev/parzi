const katakana = [
    // Basic gojūon
    { char: 'ア', strokes: 2, reading: 'a', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'イ', strokes: 2, reading: 'i', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ウ', strokes: 2, reading: 'u', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'エ', strokes: 3, reading: 'e', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'オ', strokes: 3, reading: 'o', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },

    { char: 'カ', strokes: 2, reading: 'ka', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'キ', strokes: 3, reading: 'ki', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ク', strokes: 2, reading: 'ku', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ケ', strokes: 3, reading: 'ke', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'コ', strokes: 2, reading: 'ko', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },

    { char: 'サ', strokes: 3, reading: 'sa', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'シ', strokes: 3, reading: 'shi', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ス', strokes: 2, reading: 'su', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'セ', strokes: 3, reading: 'se', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ソ', strokes: 2, reading: 'so', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },

    { char: 'タ', strokes: 3, reading: 'ta', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'チ', strokes: 3, reading: 'chi', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ツ', strokes: 3, reading: 'tsu', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'テ', strokes: 3, reading: 'te', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ト', strokes: 2, reading: 'to', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },

    { char: 'ナ', strokes: 2, reading: 'na', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ニ', strokes: 2, reading: 'ni', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ヌ', strokes: 2, reading: 'nu', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ネ', strokes: 4, reading: 'ne', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ノ', strokes: 1, reading: 'no', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },

    { char: 'ハ', strokes: 2, reading: 'ha', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ヒ', strokes: 1, reading: 'hi', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'フ', strokes: 1, reading: 'fu', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ヘ', strokes: 1, reading: 'he', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ホ', strokes: 4, reading: 'ho', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },

    { char: 'マ', strokes: 2, reading: 'ma', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ミ', strokes: 3, reading: 'mi', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ム', strokes: 2, reading: 'mu', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'メ', strokes: 2, reading: 'me', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'モ', strokes: 3, reading: 'mo', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },

    { char: 'ヤ', strokes: 2, reading: 'ya', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ユ', strokes: 2, reading: 'yu', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ヨ', strokes: 2, reading: 'yo', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },

    { char: 'ラ', strokes: 2, reading: 'ra', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'リ', strokes: 2, reading: 'ri', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ル', strokes: 2, reading: 'ru', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'レ', strokes: 2, reading: 're', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ロ', strokes: 1, reading: 'ro', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },

    { char: 'ワ', strokes: 2, reading: 'wa', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },
    { char: 'ヲ', strokes: 3, reading: 'o', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },

    { char: 'ン', strokes: 2, reading: 'n', meaning: 'katakana syllable', meaningTR: 'katakana hecesi' },

    // Dakuten
    { char: 'ガ', strokes: 4, reading: 'ga', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ギ', strokes: 5, reading: 'gi', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'グ', strokes: 3, reading: 'gu', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ゲ', strokes: 5, reading: 'ge', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ゴ', strokes: 4, reading: 'go', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },

    { char: 'ザ', strokes: 5, reading: 'za', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ジ', strokes: 3, reading: 'ji', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ズ', strokes: 3, reading: 'zu', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ゼ', strokes: 4, reading: 'ze', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ゾ', strokes: 3, reading: 'zo', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },

    { char: 'ダ', strokes: 4, reading: 'da', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ヂ', strokes: 3, reading: 'ji', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ヅ', strokes: 3, reading: 'zu', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'デ', strokes: 3, reading: 'de', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ド', strokes: 3, reading: 'do', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },

    { char: 'バ', strokes: 4, reading: 'ba', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ビ', strokes: 3, reading: 'bi', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ブ', strokes: 2, reading: 'bu', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ベ', strokes: 3, reading: 'be', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },
    { char: 'ボ', strokes: 4, reading: 'bo', meaning: 'dakuten katakana', meaningTR: 'dakuten katakana' },

    // Handakuten
    { char: 'パ', strokes: 3, reading: 'pa', meaning: 'handakuten katakana', meaningTR: 'handakuten katakana' },
    { char: 'ピ', strokes: 2, reading: 'pi', meaning: 'handakuten katakana', meaningTR: 'handakuten katakana' },
    { char: 'プ', strokes: 2, reading: 'pu', meaning: 'handakuten katakana', meaningTR: 'handakuten katakana' },
    { char: 'ペ', strokes: 2, reading: 'pe', meaning: 'handakuten katakana', meaningTR: 'handakuten katakana' },
    { char: 'ポ', strokes: 3, reading: 'po', meaning: 'handakuten katakana', meaningTR: 'handakuten katakana' },

    // Small kana
    { char: 'ァ', strokes: 2, reading: 'a', meaning: 'small kana', meaningTR: 'küçük kana' },
    { char: 'ィ', strokes: 2, reading: 'i', meaning: 'small kana', meaningTR: 'küçük kana' },
    { char: 'ゥ', strokes: 2, reading: 'u', meaning: 'small kana', meaningTR: 'küçük kana' },
    { char: 'ェ', strokes: 3, reading: 'e', meaning: 'small kana', meaningTR: 'küçük kana' },
    { char: 'ォ', strokes: 3, reading: 'o', meaning: 'small kana', meaningTR: 'küçük kana' },

    { char: 'ャ', strokes: 2, reading: 'ya', meaning: 'small kana', meaningTR: 'küçük kana' },
    { char: 'ュ', strokes: 2, reading: 'yu', meaning: 'small kana', meaningTR: 'küçük kana' },
    { char: 'ョ', strokes: 2, reading: 'yo', meaning: 'small kana', meaningTR: 'küçük kana' },

    { char: 'ッ', strokes: 1, reading: 'small tsu', meaning: 'gemination marker', meaningTR: 'çiftleme işareti' },
    { char: 'ヮ', strokes: 2, reading: 'wa', meaning: 'small kana', meaningTR: 'küçük kana' },

    { char: 'ー', strokes: 1, reading: 'long vowel', meaning: 'vowel extender', meaningTR: 'ünlü uzatma işareti' },

    // Foreign extensions
    { char: 'ファ', strokes: 3, reading: 'fa', meaning: 'foreign sound', meaningTR: 'yabancı ses' },
    { char: 'フィ', strokes: 3, reading: 'fi', meaning: 'foreign sound', meaningTR: 'yabancı ses' },
    { char: 'フェ', strokes: 4, reading: 'fe', meaning: 'foreign sound', meaningTR: 'yabancı ses' },
    { char: 'フォ', strokes: 4, reading: 'fo', meaning: 'foreign sound', meaningTR: 'yabancı ses' },
    { char: 'ティ', strokes: 4, reading: 'ti', meaning: 'foreign sound', meaningTR: 'yabancı ses' },
    { char: 'ディ', strokes: 4, reading: 'di', meaning: 'foreign sound', meaningTR: 'yabancı ses' },
    { char: 'ヴ', strokes: 3, reading: 'vu', meaning: 'foreign sound', meaningTR: 'yabancı ses' },
    { char: 'ヴァ', strokes: 4, reading: 'va', meaning: 'foreign sound', meaningTR: 'yabancı ses' },
    { char: 'ヴィ', strokes: 4, reading: 'vi', meaning: 'foreign sound', meaningTR: 'yabancı ses' },
    { char: 'ヴェ', strokes: 5, reading: 've', meaning: 'foreign sound', meaningTR: 'yabancı ses' },
    { char: 'ヴォ', strokes: 5, reading: 'vo', meaning: 'foreign sound', meaningTR: 'yabancı ses' }
]