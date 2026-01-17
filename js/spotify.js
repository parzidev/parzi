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
                duration: data.duration.ms,
                progress: data.progress.ms,
                progressPercent: data.progress_percent,
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
        const albumCover = spotifyCard.querySelector('.album-cover-placeholder');
        const songTitle = spotifyCard.querySelector('.song-title');
        const songArtist = spotifyCard.querySelector('.song-artist');
        const songAlbum = spotifyCard.querySelector('.song-album');
        const spotifyStatus = spotifyCard.querySelector('.spotify-status');
        const lastPlayed = spotifyCard.querySelector('.last-played');
        const progressBar = spotifyCard.querySelector('.progress-bar');

        // Şarkı çalıyor mu durumunu güncelle
        if (data.is_playing) {
            spotifyStatus.textContent = '🟢';
            lastPlayed.textContent = `${data.progress.formatted} / ${data.duration.formatted}`;
            // İlerleme çubuğunu güncelle
            if (progressBar) {
                progressBar.style.width = `${data.progress_percent}%`;
            }

            // Albüm kapağını güncelle
            if (albumCover) {
                // Albüm kapağı placeholder'ı bir img elementi ile değiştir
                albumCover.innerHTML = `<img src="${data.album_image}" alt="${data.album_name}" class="album-cover">`;
                albumCover.className = 'album-cover-container';
            }

            // Şarkı bilgilerini güncelle
            if (songTitle) songTitle.textContent = data.track_name;
            if (songArtist) songArtist.textContent = `by ${data.artists}`;
            if (songAlbum) songAlbum.textContent = data.album_name;
        } else {
            spotifyStatus.textContent = '⚪';

            // Spotify kapalı olduğunda özel mesaj göster (İngilizce)
            if (songTitle) songTitle.textContent = "Not currently listening";
            if (songArtist) songArtist.textContent = "Spotify is closed";
            if (songAlbum) songAlbum.textContent = "Check back later";
            if (lastPlayed) lastPlayed.textContent = 'Last checked just now';

            // Albüm kapağını varsayılan hale getir
            if (albumCover) {
                albumCover.innerHTML = '🎵';
                albumCover.className = 'album-cover-placeholder';
            }

            // İlerleme çubuğunu sıfırla
            if (progressBar) {
                progressBar.style.width = '0%';
            }
        }

        // Spotify kartına tıklandığında şarkıya yönlendir (şarkı çalıyorsa)
        if (data.is_playing) {
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

    // Public API
    return {
        init: init,
        getData: function () { return spotifyData; }
    };

})(); 