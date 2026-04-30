// Spotify modülü
const spotifyModule = (function () {
    // Özel değişkenler
    let spotifyData = {
        lastFetched: null,
        isPlaying: false,
        trackName: '',
        artists: '',
        albumName: '',
        albumImage: '',
        duration: 0,
        progress: 0,
        progressPercent: 0,
        spotifyUrl: ''
    };
    let progressAnimationFrame = null;
    let progressState = {
        isPlaying: false,
        baseProgressMs: 0,
        durationMs: 0,
        syncedAt: 0,
        lastRenderedSecond: -1
    };

    // Modül başlatma
    function init() {
        // Spotify'da çalan şarkıyı getir
        fetchCurrentlyPlaying();

        // Spotify verilerini düzenli olarak güncelle (5 saniyede bir)
        setInterval(fetchCurrentlyPlaying, 5000);

        return this;
    }

    // Spotify'da çalan şarkıyı getirme fonksiyonu
    async function fetchCurrentlyPlaying() {
        try {
            // Artık CORS sorunu çözüldüğü için doğrudan API'ye istek yapabiliriz
            const response = await fetch('https://spoti.parzi.dev/api/public/currently-playing?username=31stgqfrikmgl3jhingnah3qoz2y');

            if (!response.ok) {
                // 404 hatası Spotify kapalı demektir - sessizce işle
                if (response.status === 404) {
                    console.log('⚪ Şu anda bir şey dinlemiyorsunuz');
                } else {
                    console.warn(`⚠️ Spotify API hatası: ${response.status}`);
                }

                // API hatası durumunda, "kapalı" durumu gibi göster
                const data = { is_playing: false };
                updateSpotifyCard(data);
                return;
            }

            const data = await response.json();

            if (data.is_playing) {
                console.log(`🟢 Çalıyor: ${data.track_name} - ${data.artists}`);
            } else {
                console.log('⚪ Spotify açık ama şu anda bir şey çalmıyor');
            }

            // Global değişkenleri güncelle
            spotifyData = {
                lastFetched: new Date(),
                isPlaying: data.is_playing,
                trackName: data.track_name,
                artists: data.artists,
                albumName: data.album_name,
                albumImage: data.album_image,
                duration: data.duration?.ms || 0,
                progress: data.progress?.ms || 0,
                progressPercent: data.progress_percent || 0,
                spotifyUrl: data.spotify_url
            };

            // Spotify kartını güncelle
            updateSpotifyCard(data);

        } catch (error) {
            // Network hataları için
            console.log('⚪ Spotify durumu kontrol edilemiyor');

            // API hatası durumunda, "kapalı" durumu gibi göster
            const data = { is_playing: false };
            updateSpotifyCard(data);
        }
    }

    // Spotify kartını güncelleme fonksiyonu
    function updateSpotifyCard(data) {
        const spotifyCard = document.querySelector('.spotify-card');
        const albumCover = spotifyCard.querySelector('.album-cover-placeholder, .album-cover-container');
        const songTitle = spotifyCard.querySelector('.song-title');
        const songArtist = spotifyCard.querySelector('.song-artist');
        const songAlbum = spotifyCard.querySelector('.song-album');
        const spotifyStatus = spotifyCard.querySelector('.spotify-status');
        const lastPlayed = spotifyCard.querySelector('.last-played');
        const progressBar = spotifyCard.querySelector('.progress-bar');

        // Şarkı çalıyor mu durumunu güncelle
        if (data.is_playing) {
            spotifyCard.classList.add('is-playing');
            spotifyStatus.textContent = '🟢';
            syncSmoothProgress(data);

            // Albüm kapağını güncelle
            if (albumCover) {
                const currentImage = albumCover.querySelector('img');
                const nextImage = data.album_image || '';
                const currentImageSrc = currentImage ? currentImage.getAttribute('src') : '';

                if (!nextImage) {
                    albumCover.textContent = '🎵';
                    albumCover.className = 'album-cover-placeholder';
                } else if (!currentImage || currentImageSrc !== nextImage) {
                    albumCover.textContent = '';
                    const image = document.createElement('img');
                    image.src = nextImage;
                    image.alt = data.album_name || data.track_name || 'Album cover';
                    image.className = 'album-cover';
                    albumCover.appendChild(image);
                    albumCover.className = 'album-cover-container';
                }
            }

            // Şarkı bilgilerini güncelle
            if (songTitle) songTitle.textContent = data.track_name;
            if (songArtist) songArtist.textContent = `by ${data.artists}`;
            if (songAlbum) songAlbum.textContent = data.album_name;
        } else {
            stopSmoothProgress();
            spotifyData.isPlaying = false;
            spotifyData.progress = 0;
            spotifyData.progressPercent = 0;
            spotifyCard.classList.remove('is-playing');
            spotifyStatus.textContent = '⚪';

            // Spotify kapalı olduğunda özel mesaj göster (İngilizce)
            if (songTitle) songTitle.textContent = "Not currently listening";
            if (songArtist) songArtist.textContent = "Spotify is closed";
            if (songAlbum) songAlbum.textContent = "Check back later";
            if (lastPlayed) lastPlayed.textContent = 'Last checked just now';

            // Albüm kapağını varsayılan hale getir
            if (albumCover) {
                albumCover.textContent = '🎵';
                albumCover.className = 'album-cover-placeholder';
            }

            // İlerleme çubuğunu sıfırla
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }

        // Spotify kartına tıklandığında şarkıya yönlendir (şarkı çalıyorsa)
        if (data.is_playing && data.spotify_url) {
            spotifyCard.onclick = function (e) {
                window.open(data.spotify_url, '_blank');
            };
            // Kartın tıklanabilir olduğunu belirtmek için stil ekle
            spotifyCard.style.cursor = 'pointer';
        } else {
            // Spotify kapalıysa tıklama özelliğini kaldır
            spotifyCard.onclick = null;
            spotifyCard.style.cursor = 'default';
        }
    }

    function syncSmoothProgress(data) {
        const durationMs = data.duration?.ms || 0;
        const progressMs = data.progress?.ms || 0;

        if (!durationMs) {
            stopSmoothProgress();
            const progressBar = document.querySelector('.spotify-card .progress-bar');
            const lastPlayed = document.querySelector('.spotify-card .last-played');
            if (progressBar) progressBar.style.width = `${data.progress_percent || 0}%`;
            if (lastPlayed && data.progress?.formatted && data.duration?.formatted) {
                lastPlayed.textContent = `${data.progress.formatted} / ${data.duration.formatted}`;
            }
            return;
        }

        progressState = {
            isPlaying: true,
            baseProgressMs: progressMs,
            durationMs: durationMs,
            syncedAt: Date.now(),
            lastRenderedSecond: -1
        };

        startSmoothProgress();
        renderSmoothProgress();
    }

    function startSmoothProgress() {
        if (progressAnimationFrame) return;

        const tick = () => {
            renderSmoothProgress();
            if (progressState.isPlaying) {
                progressAnimationFrame = requestAnimationFrame(tick);
            }
        };

        progressAnimationFrame = requestAnimationFrame(tick);
    }

    function stopSmoothProgress() {
        progressState.isPlaying = false;
        progressState.lastRenderedSecond = -1;

        if (progressAnimationFrame) {
            cancelAnimationFrame(progressAnimationFrame);
            progressAnimationFrame = null;
        }
    }

    function renderSmoothProgress() {
        const progressBar = document.querySelector('.spotify-card .progress-bar');
        const lastPlayed = document.querySelector('.spotify-card .last-played');
        if (!progressBar || !lastPlayed || !progressState.durationMs) {
            stopSmoothProgress();
            return;
        }

        const elapsedMs = progressState.isPlaying ? Date.now() - progressState.syncedAt : 0;
        const currentProgressMs = Math.min(
            progressState.baseProgressMs + elapsedMs,
            progressState.durationMs
        );
        const progressPercent = (currentProgressMs / progressState.durationMs) * 100;

        progressBar.style.width = `${progressPercent}%`;

        const currentSecond = Math.floor(currentProgressMs / 1000);
        if (currentSecond !== progressState.lastRenderedSecond) {
            lastPlayed.textContent = `${formatTime(currentProgressMs)} / ${formatTime(progressState.durationMs)}`;
            progressState.lastRenderedSecond = currentSecond;
        }

        spotifyData.progress = currentProgressMs;
        spotifyData.progressPercent = progressPercent;

        if (currentProgressMs >= progressState.durationMs) {
            stopSmoothProgress();
        }
    }

    function formatTime(milliseconds) {
        const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }

    // Public API
    return {
        init: init,
        getData: function () { return spotifyData; }
    };

})();
