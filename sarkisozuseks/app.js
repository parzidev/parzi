/* ========================================
   ŞarkıSözÜ - Mobile App JavaScript
   Exact Replica of Design Mockup
   ======================================== */

// ============ State ============
const AppState = {
    songs: [],
    currentSong: null,
    currentScreen: 'home',
    favorites: new Set(JSON.parse(localStorage.getItem('favorites') || '[]')),
    recentlyViewed: JSON.parse(localStorage.getItem('recentlyViewed') || '[]'),
    transposeAmount: 0,
    capoAmount: 0,
    showChords: true,
    autoScrollInterval: null
};

// ============ Init ============
document.addEventListener('DOMContentLoaded', init);

async function init() {
    try {
        const response = await fetch('detayli_sarki_bilgileri_restructured.json');
        AppState.songs = await response.json();

        renderRecentCarousel();
        renderPopularList();
        renderFavorites();
        setupEventListeners();

        // Handle deep links
        handleHash();
        window.addEventListener('hashchange', handleHash);
    } catch (error) {
        console.error('Failed to load songs:', error);
    }
}

function setupEventListeners() {
    // Home search
    document.getElementById('homeSearch')?.addEventListener('input', (e) => {
        filterAndRenderPopular(e.target.value);
    });

    // Main search
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });

    // Auto-scroll toggle
    document.getElementById('autoScrollToggle')?.addEventListener('change', (e) => {
        toggleAutoScroll(e.target.checked);
    });

    // Favorites segmented control
    document.querySelectorAll('#favoritesToggle .segment').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#favoritesToggle .segment').forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// ============ Navigation ============
function switchScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));

    document.getElementById(`screen-${screenId}`)?.classList.add('active');

    // Update tab bar
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.screen === screenId);
    });

    // Song screen doesn't have a tab
    if (screenId === 'song') {
        document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
    }

    AppState.currentScreen = screenId;

    // Stop auto-scroll when leaving song
    if (screenId !== 'song') {
        toggleAutoScroll(false);
    }
}

function handleHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#song/')) {
        const songId = parseInt(hash.split('/')[1]);
        loadSong(songId);
    }
}

// ============ Rendering ============
function renderRecentCarousel() {
    const carousel = document.getElementById('recentCarousel');
    if (!carousel) return;

    let recentSongs = AppState.recentlyViewed
        .map(id => AppState.songs.find(s => s.id === id))
        .filter(Boolean)
        .slice(0, 10);

    // If no recent, show random
    if (recentSongs.length === 0) {
        recentSongs = shuffleArray([...AppState.songs]).slice(0, 10);
    }

    // Update count
    document.getElementById('recentCount').textContent = `Seni ${recentSongs.length} ›`;

    carousel.innerHTML = recentSongs.map(song => `
        <div class="carousel-item" onclick="openSong(${song.id})">
            <div class="carousel-item-image">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                </svg>
            </div>
            <div class="carousel-item-title">${escapeHtml(song.sarkiadi)}</div>
            <div class="carousel-item-subtitle">${escapeHtml(song.sanatci)}</div>
            <div class="carousel-item-meta">
                ${song.kapo ? `<span class="carousel-meta-badge">Kapo: ${song.kapo}</span>` : ''}
                ${song.orjinal_ton ? `<span class="carousel-meta-badge">${song.orjinal_ton}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function renderPopularList() {
    const list = document.getElementById('popularList');
    if (!list) return;

    const popularSongs = AppState.songs.slice(0, 15);

    // Update count
    document.getElementById('popularCount').textContent = `Seni ${popularSongs.length} ›`;

    list.innerHTML = popularSongs.map((song, index) => createSongRowHTML(song, index + 1)).join('');
}

function createSongRowHTML(song, index = null) {
    const mainChord = song.orjinal_ton || (song.used_chords?.[0]) || '';

    return `
        <div class="song-row" onclick="openSong(${song.id})">
            ${index !== null ? `<span class="song-row-index">${index}</span>` : ''}
            <div class="song-row-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                </svg>
            </div>
            <div class="song-row-info">
                <div class="song-row-title">${escapeHtml(song.sarkiadi)}</div>
                <div class="song-row-artist">${escapeHtml(song.sanatci)}</div>
            </div>
            ${mainChord ? `<span class="song-row-badge">#${mainChord}</span>` : ''}
        </div>
    `;
}

function filterAndRenderPopular(query) {
    const list = document.getElementById('popularList');
    if (!list) return;

    const q = query.toLowerCase().trim();

    if (!q) {
        renderPopularList();
        return;
    }

    const filtered = AppState.songs
        .filter(s =>
            s.sarkiadi.toLowerCase().includes(q) ||
            s.sanatci.toLowerCase().includes(q)
        )
        .slice(0, 20);

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35" stroke-linecap="round"/>
                </svg>
                <h3>Sonuç bulunamadı</h3>
                <p>Farklı anahtar kelimeler deneyin</p>
            </div>
        `;
        return;
    }

    list.innerHTML = filtered.map((song, i) => createSongRowHTML(song, i + 1)).join('');
}

// ============ Search ============
function performSearch(query) {
    const resultsList = document.getElementById('searchResults');
    if (!resultsList) return;

    const q = query.toLowerCase().trim();

    if (!q) {
        resultsList.innerHTML = '';
        return;
    }

    const results = AppState.songs
        .filter(s =>
            s.sarkiadi.toLowerCase().includes(q) ||
            s.sanatci.toLowerCase().includes(q)
        )
        .slice(0, 30);

    if (results.length === 0) {
        resultsList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35" stroke-linecap="round"/>
                </svg>
                <h3>Sonuç bulunamadı</h3>
                <p>"${escapeHtml(query)}" için sonuç yok</p>
            </div>
        `;
        return;
    }

    resultsList.innerHTML = results.map(song => createSongRowHTML(song)).join('');
}

function doSearch(query) {
    document.getElementById('searchInput').value = query;
    performSearch(query);
}

// ============ Song Detail ============
function openSong(songId) {
    window.location.hash = `#song/${songId}`;
    loadSong(songId);
}

function loadSong(songId) {
    const song = AppState.songs.find(s => s.id === songId);
    if (!song) return;

    AppState.currentSong = song;
    AppState.transposeAmount = 0;
    AppState.capoAmount = parseInt(song.kapo) || 0;

    // Update recently viewed
    updateRecentlyViewed(songId);

    // Update header
    document.getElementById('songTitle').textContent = song.sarkiadi;
    document.getElementById('songArtist').textContent = song.sanatci;
    document.getElementById('songTonPill').innerHTML = `Ton: <strong>${song.orjinal_ton || '-'}</strong>`;
    document.getElementById('songCapoPill').innerHTML = `Capo: <strong>${song.kapo || '0'}</strong>`;

    // Update song card header
    document.getElementById('songCardTitle').textContent = song.sarkiadi;
    document.getElementById('songCardArtist').textContent = song.sanatci;
    document.getElementById('songCardChord').textContent = song.orjinal_ton || '';

    // Reset controls
    document.getElementById('tonValue').textContent = '0';
    document.getElementById('capoValue').textContent = song.kapo || '0';

    // Update favorite button
    updateFavoriteButton(songId);

    // Render lyrics
    renderLyrics(song);

    // Render chord carousel
    renderChordCarousel(song.used_chords || []);

    // Switch to song screen
    switchScreen('song');
}

function renderLyrics(song) {
    const lyricsContent = document.getElementById('lyricsContent');
    if (!lyricsContent) return;

    const lines = song.lyrics_data?.lines || [];

    lyricsContent.innerHTML = lines.map(line => {
        let text = line.content || '';

        if (AppState.showChords && line.chords && line.chords.length > 0) {
            const sortedChords = [...new Set(line.chords)].sort((a, b) => b.length - a.length);

            sortedChords.forEach(chord => {
                const transposedChord = transposeChord(chord, AppState.transposeAmount);
                const escaped = chord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(?<![A-Za-z0-9#b])${escaped}(?![A-Za-z0-9#b])`, 'g');
                text = text.replace(regex, `<span class="chord">${transposedChord}</span>`);
            });
        }

        return `<p class="lyrics-line">${text || '&nbsp;'}</p>`;
    }).join('');
}

function renderChordCarousel(chords) {
    const carousel = document.getElementById('chordCarousel');
    if (!carousel) return;

    if (!chords || chords.length === 0) {
        carousel.innerHTML = '';
        return;
    }

    const uniqueChords = [...new Set(chords)];

    carousel.innerHTML = uniqueChords.map(chord => `
        <div class="chord-card">
            <div class="chord-card-label">${transposeChord(chord, AppState.transposeAmount)}</div>
            <div class="chord-svg" data-chord="${chord}"></div>
        </div>
    `).join('');

    loadChordSVGs(uniqueChords);
}

async function loadChordSVGs(chords) {
    for (const chord of chords) {
        const container = document.querySelector(`.chord-svg[data-chord="${chord}"]`);
        if (!container) continue;

        try {
            let response = await fetch(`test_chords/${encodeURIComponent(chord)}.svg`);

            if (!response.ok) {
                const baseChord = chord.replace(/[0-9]/g, '');
                response = await fetch(`test_chords/${encodeURIComponent(baseChord)}.svg`);
            }

            if (response.ok) {
                container.innerHTML = await response.text();
            } else {
                container.innerHTML = '<div style="font-size:10px; opacity:0.3;">N/A</div>';
            }
        } catch (e) {
            container.innerHTML = '<div style="font-size:10px; opacity:0.3;">ERR</div>';
        }
    }
}

// ============ Music Theory ============
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_MAP = { 'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B' };

function transposeChord(chord, semitones) {
    if (semitones === 0) return chord;

    return chord.replace(/^([A-G][#b]?)/, (match, note) => {
        const normalizedNote = NOTE_MAP[note] || note;
        const index = NOTES.indexOf(normalizedNote);
        if (index === -1) return match;

        const newIndex = (index + semitones + 12) % 12;
        return NOTES[newIndex];
    });
}

function transpose(direction) {
    AppState.transposeAmount += direction;

    const tonValue = document.getElementById('tonValue');
    if (tonValue) {
        const val = AppState.transposeAmount;
        tonValue.textContent = val >= 0 ? `${val}` : `${val}`;
    }

    if (AppState.currentSong) {
        renderLyrics(AppState.currentSong);
        renderChordCarousel(AppState.currentSong.used_chords || []);
    }
}

function adjustCapo(direction) {
    const capoValue = document.getElementById('capoValue');
    if (!capoValue) return;

    let current = parseInt(capoValue.textContent) || 0;
    current = Math.max(0, Math.min(12, current + direction));
    capoValue.textContent = current;

    document.getElementById('songCapoPill').innerHTML = `Capo: <strong>${current}</strong>`;
}

// ============ Lyrics Mode ============
function setLyricsMode(mode) {
    AppState.showChords = mode === 'chords';

    document.querySelectorAll('#lyricsToggle .segment').forEach(s => {
        s.classList.toggle('active', s.dataset.value === mode);
    });

    if (AppState.currentSong) {
        renderLyrics(AppState.currentSong);
    }
}

// ============ Auto Scroll ============
function toggleAutoScroll(enabled) {
    const toggle = document.getElementById('autoScrollToggle');
    if (toggle) toggle.checked = enabled;

    if (enabled) {
        startAutoScroll();
    } else {
        stopAutoScroll();
    }
}

function startAutoScroll() {
    stopAutoScroll();

    AppState.autoScrollInterval = setInterval(() => {
        const content = document.querySelector('.song-content');
        if (content) {
            content.scrollTop += 1;

            if (content.scrollTop >= content.scrollHeight - content.clientHeight) {
                toggleAutoScroll(false);
            }
        }
    }, 50);
}

function stopAutoScroll() {
    if (AppState.autoScrollInterval) {
        clearInterval(AppState.autoScrollInterval);
        AppState.autoScrollInterval = null;
    }
}

// ============ Favorites ============
function toggleFavorite(songId) {
    if (AppState.favorites.has(songId)) {
        AppState.favorites.delete(songId);
    } else {
        AppState.favorites.add(songId);
    }

    saveFavorites();
    updateFavoriteButton(songId);
    renderFavorites();
}

function updateFavoriteButton(songId) {
    const btn = document.getElementById('favoriteBtn');
    if (!btn) return;

    const isFav = AppState.favorites.has(songId);
    btn.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
    `;

    btn.onclick = () => toggleFavorite(songId);
}

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify([...AppState.favorites]));
}

function renderFavorites() {
    const list = document.getElementById('favoritesList');
    if (!list) return;

    if (AppState.favorites.size === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                <h3>Henüz favori yok</h3>
                <p>Beğendiğiniz şarkıları favorilere ekleyin</p>
            </div>
        `;
        return;
    }

    const favoriteSongs = [...AppState.favorites]
        .map(id => AppState.songs.find(s => s.id === id))
        .filter(Boolean);

    list.innerHTML = favoriteSongs.map(song => createSongRowHTML(song)).join('');
}

// ============ Recent History ============
function updateRecentlyViewed(songId) {
    const index = AppState.recentlyViewed.indexOf(songId);
    if (index > -1) {
        AppState.recentlyViewed.splice(index, 1);
    }

    AppState.recentlyViewed.unshift(songId);
    AppState.recentlyViewed = AppState.recentlyViewed.slice(0, 30);

    localStorage.setItem('recentlyViewed', JSON.stringify(AppState.recentlyViewed));

    // Update carousel
    renderRecentCarousel();
}

// ============ Utilities ============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Global functions
window.switchScreen = switchScreen;
window.openSong = openSong;
window.transpose = transpose;
window.adjustCapo = adjustCapo;
window.setLyricsMode = setLyricsMode;
window.doSearch = doSearch;
