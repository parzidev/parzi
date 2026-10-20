const hiragana = [
  // Basic gojūon
  { char: 'あ', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi', strokes: 3, reading: 'a' },
  { char: 'い', strokes: 2, reading: 'i', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'う', strokes: 2, reading: 'u', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'え', strokes: 2, reading: 'e', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'お', strokes: 3, reading: 'o', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },

  { char: 'か', strokes: 3, reading: 'ka', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'き', strokes: 4, reading: 'ki', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'く', strokes: 1, reading: 'ku', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'け', strokes: 3, reading: 'ke', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'こ', strokes: 2, reading: 'ko', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },

  { char: 'さ', strokes: 3, reading: 'sa', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'し', strokes: 1, reading: 'shi', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'す', strokes: 2, reading: 'su', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'せ', strokes: 3, reading: 'se', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'そ', strokes: 2, reading: 'so', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },

  { char: 'た', strokes: 4, reading: 'ta', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'ち', strokes: 2, reading: 'chi', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'つ', strokes: 1, reading: 'tsu', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'て', strokes: 1, reading: 'te', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'と', strokes: 2, reading: 'to', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },

  { char: 'な', strokes: 4, reading: 'na', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'に', strokes: 3, reading: 'ni', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'ぬ', strokes: 2, reading: 'nu', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'ね', strokes: 4, reading: 'ne', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'の', strokes: 1, reading: 'no', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },

  { char: 'は', strokes: 3, reading: 'ha', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'ひ', strokes: 2, reading: 'hi', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'ふ', strokes: 1, reading: 'fu', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'へ', strokes: 1, reading: 'he', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'ほ', strokes: 4, reading: 'ho', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },

  { char: 'ま', strokes: 3, reading: 'ma', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'み', strokes: 3, reading: 'mi', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'む', strokes: 2, reading: 'mu', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'め', strokes: 2, reading: 'me', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'も', strokes: 3, reading: 'mo', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },

  { char: 'や', strokes: 3, reading: 'ya', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'ゆ', strokes: 2, reading: 'yu', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'よ', strokes: 2, reading: 'yo', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },

  { char: 'ら', strokes: 2, reading: 'ra', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'り', strokes: 1, reading: 'ri', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'る', strokes: 1, reading: 'ru', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'れ', strokes: 2, reading: 're', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'ろ', strokes: 1, reading: 'ro', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },

  { char: 'わ', strokes: 2, reading: 'wa', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },
  { char: 'を', strokes: 3, reading: 'wo', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },

  { char: 'ん', strokes: 2, reading: 'n', meaning: 'hiragana syllable', meaningTR: 'hiragana hecesi' },

  // Dakuten
  { char: 'が', strokes: 5, reading: 'ga', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'ぎ', strokes: 6, reading: 'gi', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'ぐ', strokes: 3, reading: 'gu', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'げ', strokes: 5, reading: 'ge', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'ご', strokes: 4, reading: 'go', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },

  { char: 'ざ', strokes: 5, reading: 'za', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'じ', strokes: 3, reading: 'ji', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'ず', strokes: 4, reading: 'zu', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'ぜ', strokes: 5, reading: 'ze', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'ぞ', strokes: 4, reading: 'zo', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },

  { char: 'だ', strokes: 5, reading: 'da', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'ぢ', strokes: 3, reading: 'ji', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'づ', strokes: 3, reading: 'zu', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'で', strokes: 3, reading: 'de', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'ど', strokes: 3, reading: 'do', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },

  { char: 'ば', strokes: 5, reading: 'ba', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'び', strokes: 4, reading: 'bi', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'ぶ', strokes: 2, reading: 'bu', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'べ', strokes: 3, reading: 'be', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },
  { char: 'ぼ', strokes: 5, reading: 'bo', meaning: 'dakuten hiragana', meaningTR: 'dakuten hiragana' },

  // Handakuten
  { char: 'ぱ', strokes: 4, reading: 'pa', meaning: 'handakuten hiragana', meaningTR: 'handakuten hiragana' },
  { char: 'ぴ', strokes: 3, reading: 'pi', meaning: 'handakuten hiragana', meaningTR: 'handakuten hiragana' },
  { char: 'ぷ', strokes: 2, reading: 'pu', meaning: 'handakuten hiragana', meaningTR: 'handakuten hiragana' },
  { char: 'ぺ', strokes: 2, reading: 'pe', meaning: 'handakuten hiragana', meaningTR: 'handakuten hiragana' },
  { char: 'ぽ', strokes: 4, reading: 'po', meaning: 'handakuten hiragana', meaningTR: 'handakuten hiragana' },


  // ✅ Yoon merged
  { char: 'きゃ', strokes: 6, reading: 'kya', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'きゅ', strokes: 6, reading: 'kyu', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'きょ', strokes: 6, reading: 'kyo', meaning: 'yoon combination', meaningTR: 'birleşik hece' },

  { char: 'ぎゃ', strokes: 8, reading: 'gya', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'ぎゅ', strokes: 8, reading: 'gyu', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'ぎょ', strokes: 8, reading: 'gyo', meaning: 'yoon combination', meaningTR: 'birleşik hece' },

  { char: 'しゃ', strokes: 4, reading: 'sha', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'しゅ', strokes: 4, reading: 'shu', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'しょ', strokes: 4, reading: 'sho', meaning: 'yoon combination', meaningTR: 'birleşik hece' },

  { char: 'じゃ', strokes: 6, reading: 'ja', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'じゅ', strokes: 6, reading: 'ju', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'じょ', strokes: 6, reading: 'jo', meaning: 'yoon combination', meaningTR: 'birleşik hece' },

  { char: 'ちゃ', strokes: 5, reading: 'cha', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'ちゅ', strokes: 5, reading: 'chu', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'ちょ', strokes: 5, reading: 'cho', meaning: 'yoon combination', meaningTR: 'birleşik hece' },

  { char: 'にゃ', strokes: 5, reading: 'nya', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'にゅ', strokes: 5, reading: 'nyu', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'にょ', strokes: 5, reading: 'nyo', meaning: 'yoon combination', meaningTR: 'birleşik hece' },

  { char: 'ひゃ', strokes: 5, reading: 'hya', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'ひゅ', strokes: 5, reading: 'hyu', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'ひょ', strokes: 5, reading: 'hyo', meaning: 'yoon combination', meaningTR: 'birleşik hece' },

  { char: 'びゃ', strokes: 7, reading: 'bya', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'びゅ', strokes: 7, reading: 'byu', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'びょ', strokes: 7, reading: 'byo', meaning: 'yoon combination', meaningTR: 'birleşik hece' },

  { char: 'ぴゃ', strokes: 6, reading: 'pya', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'ぴゅ', strokes: 6, reading: 'pyu', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'ぴょ', strokes: 6, reading: 'pyo', meaning: 'yoon combination', meaningTR: 'birleşik hece' },

  { char: 'みゃ', strokes: 5, reading: 'mya', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'みゅ', strokes: 5, reading: 'myu', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'みょ', strokes: 5, reading: 'myo', meaning: 'yoon combination', meaningTR: 'birleşik hece' },

  { char: 'りゃ', strokes: 4, reading: 'rya', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'りゅ', strokes: 4, reading: 'ryu', meaning: 'yoon combination', meaningTR: 'birleşik hece' },
  { char: 'りょ', strokes: 4, reading: 'ryo', meaning: 'yoon combination', meaningTR: 'birleşik hece' }

]