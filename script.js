const swatches = document.querySelectorAll('.color-swatch');
const root = document.documentElement;
const playTriggers = document.querySelectorAll('.play-trigger');
const navItems = document.querySelectorAll('.nav-item');
const appViews = document.querySelectorAll('.app-view');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const trackMenuOverlay = document.getElementById('trackMenuOverlay');
const closeTrackMenuButton = document.getElementById('closeTrackMenu');
const trackMenuTitle = document.getElementById('trackMenuTitle');
const trackMenuItems = document.querySelectorAll('.track-menu-item');
const miniPlayer = document.getElementById('miniPlayer');
const miniCover = document.getElementById('miniCover');
const miniTitle = document.getElementById('miniTitle');
const miniArtist = document.getElementById('miniArtist');
const miniPlayToggle = document.getElementById('miniPlayToggle');
const miniLikeBtn = document.getElementById('miniLikeBtn');
const miniProgressFill = document.getElementById('miniProgressFill');
const fullPlayer = document.getElementById('fullPlayer');
const closePlayer = document.getElementById('closePlayer');
const fullCover = document.getElementById('fullCover');
const fullTitle = document.getElementById('fullTitle');
const fullArtist = document.getElementById('fullArtist');
const fullPlayToggle = document.getElementById('fullPlayToggle');
const fullLikeBtn = document.getElementById('fullLikeBtn');
const progressFill = document.getElementById('progressFill');
const currentTimeDisplay = document.getElementById('currentTime');
const totalTime = document.getElementById('totalTime');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const headerSearchBtn = document.getElementById('headerSearchBtn');
const mainAudio = document.getElementById('main-audio');
const uiErrorMessage = document.getElementById('uiErrorMessage');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const artistHeader = document.getElementById('artistHeader');
const artistName = document.getElementById('artistName');
const artistStats = document.getElementById('artistStats');
const artistImage = document.getElementById('artistImage');
const artistSongs = document.getElementById('artistSongs');
const settingsRecentList = document.getElementById('recentlyPlayedList');
const settingsLikedCount = document.getElementById('likedSongsCount');

const browseSection = document.getElementById('browseSection');
const resultsSection = document.getElementById('resultsSection');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const topResult = document.getElementById('topResult');
const resultsList = document.getElementById('resultsList');

const tracks = Array.from(playTriggers).map((button) => ({
  title: button.dataset.title,
  artist: button.dataset.artist,
  cover: button.dataset.cover,
  src: button.dataset.src || '',
  duration: Number(button.dataset.duration),
  videoId: button.dataset.videoid
}));

let currentTrackIndex = 0;
let currentPlayingTrack = null;
let isPlaying = false;
let currentProgress = 0;
let progressTimer = null;
let activeTab = 'home';
let filteredIndexes = tracks.map((_, index) => index);
let isBlackTheme = localStorage.getItem('theme') === 'dark';
let selectedTrack = null;

let mockResults = [];
let currentPlaylistIndex = null;
let playlists = JSON.parse(localStorage.getItem('nimiq_playlists') || '[]');
let history = JSON.parse(localStorage.getItem('nimiq_history') || '[]');
let likedSongs = JSON.parse(localStorage.getItem('nimiq_liked') || '[]');




async function searchNimiq(query) {
  if (!query || query.trim().length < 2) {
    if (browseSection) browseSection.hidden = false;
    if (resultsSection) resultsSection.hidden = true;
    if (uiErrorMessage) {
      uiErrorMessage.hidden = true;
      uiErrorMessage.textContent = '';
    }
    // Clean URL if query is cleared
    if (window.history.replaceState) {
      const url = new URL(window.location);
      url.searchParams.delete('q');
      window.history.replaceState({}, '', url.toString());
    }
    return;
  }
  
  const showError = (msg) => {
    if (uiErrorMessage) {
      uiErrorMessage.hidden = false;
      uiErrorMessage.textContent = msg;
    }
  };
  
  const hideError = () => {
    if (uiErrorMessage) {
      uiErrorMessage.hidden = true;
      uiErrorMessage.textContent = '';
    }
  };
  
  hideError();

  const resultsHeader = document.getElementById('resultsHeader');
  if (resultsHeader) {
    resultsHeader.textContent = `Showing results for "${query}"`;
  }
  
  if (browseSection) browseSection.hidden = true;
  if (resultsSection) resultsSection.hidden = false;

  // Update URL if supported
  if (window.history.pushState) {
    const newContextUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?q=' + encodeURIComponent(query);
    window.history.pushState({path:newContextUrl},'',newContextUrl);
  }
  
  try {
    const res = await fetch(`https://nimiq-music.onrender.com/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) { showError('Search failed'); return; }
    const data = await res.json();
    mockResults = data.map(item => ({
      title: item.title,
      uploader: item.artist,
      thumbnail: item.thumbnail,
      videoId: item.videoId
    }));
  } catch (e) {
    showError('Search unavailable');
    return;
  }
  
  if (mockResults.length === 0) {
    if (resultsList) resultsList.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:20px;">No results found</p>';
    return;
  }
  
  if (mockResults.length > 0 && topResult) {
    const top = mockResults[0];
    topResult.innerHTML = `
      <img src="${top.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200'}" alt="${top.uploader}" />
      <div class="top-result-info">
        <div class="top-result-label">Top Artist</div>
        <div class="top-result-name">${top.uploader}</div>
      </div>
    `;
    topResult.onclick = () => openArtistPage(top.uploader, '');
  }
  
  if (resultsList) {
    resultsList.innerHTML = mockResults.slice(0, 10).map((r) => `
      <div class="song-item" data-videoid="${r.videoId}" data-title="${r.title}" data-artist="${r.uploader}" data-cover="${r.thumbnail}">
        <img src="${r.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100'}" alt="${r.title}" />
        <div class="song-item-info">
          <div class="song-item-title">${r.title}</div>
          <div class="song-item-artist">${r.uploader}</div>
        </div>
        <button class="like-btn" data-videoid="${r.videoId}" data-title="${r.title}" data-artist="${r.uploader}" data-cover="${r.thumbnail}" aria-label="Like">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
    `).join('');
  }
}

async function getAudioStream(videoId) {
  try {
    const res = await fetch(`https://nimiq-music.onrender.com/stream/${videoId}`);
    if (!res.ok) {
      if (uiErrorMessage) { uiErrorMessage.hidden = false; uiErrorMessage.textContent = 'Stream failed'; }
      return false;
    }
    const data = await res.json();
    if (!data.url) {
      if (uiErrorMessage) { uiErrorMessage.hidden = false; uiErrorMessage.textContent = 'No audio stream found'; }
      return false;
    }
    
    const audio = document.getElementById('main-audio');
    if (!audio) return false;
    
    audio.src = data.url;
    currentPlayingTrack = { videoId, title: data.title, artist: data.artist, cover: data.thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` };
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setPlaying(true);
          if (fullPlayToggle) fullPlayToggle.classList.remove('loading');
          if (miniPlayToggle) miniPlayToggle.classList.remove('loading');
          updateMiniPlayerMetadata(currentPlayingTrack.title, currentPlayingTrack.artist, currentPlayingTrack.cover, videoId);
          if (miniPlayer) requestAnimationFrame(() => { if (miniPlayer) miniPlayer.classList.add('is-visible'); });
        })
        .catch(() => {
          if (fullPlayToggle) fullPlayToggle.classList.remove('loading');
          if (miniPlayToggle) miniPlayToggle.classList.remove('loading');
        });
    }
    
    addToHistory({ videoId, title: currentPlayingTrack.title, artist: currentPlayingTrack.artist, thumbnail: currentPlayingTrack.cover });
    return true;
  } catch (e) {
    if (uiErrorMessage) { uiErrorMessage.hidden = false; uiErrorMessage.textContent = 'Stream unavailable'; }
    return false;
  }
}



function updateMiniPlayerMetadata(title, artist, cover, videoId) {
  if (title && miniTitle) {
    miniTitle.textContent = title;
    console.log('Set title:', title);
  }
  if (artist && miniArtist) miniArtist.textContent = artist;
  if (cover && miniCover) {
    miniCover.src = cover;
    miniCover.alt = title ? `${title} cover` : '';
  }
  if (cover && fullCover) {
    fullCover.src = cover;
  }
  if (title && fullTitle) fullTitle.textContent = title;
  if (artist && fullArtist) fullArtist.textContent = artist;
  
  if (miniPlayer) {
    miniPlayer.classList.add('is-visible');
    console.log('Added is-visible to miniPlayer');
  }
  
  if (videoId) {
    if (miniLikeBtn) miniLikeBtn.dataset.videoid = videoId;
    if (fullLikeBtn) fullLikeBtn.dataset.videoid = videoId;
    updateLikeButtons();
  }
}

const savedAccent = localStorage.getItem('--accent-color');
if (savedAccent) {
  root.style.setProperty('--accent', savedAccent);
  swatches.forEach((swatch) => {
    swatch.classList.toggle('is-active', swatch.dataset.accent === savedAccent);
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

function getCurrentTrack() {
  if (currentPlayingTrack) return currentPlayingTrack;
  return tracks[currentTrackIndex] || { title: 'Unknown', artist: 'Unknown', cover: '' };
}

function renderTrack() {
  const track = getCurrentTrack();
  miniCover.src = track.cover;
  miniCover.alt = `${track.title} cover`;
  miniTitle.textContent = track.title;
  miniArtist.textContent = track.artist;

  fullCover.src = track.cover;
  fullTitle.textContent = track.title;
  fullArtist.textContent = track.artist;

  totalTime.textContent = formatTime(track.duration);
  updateProgressUI();
}

function updateProgressUI() {
  const track = getCurrentTrack();
  const ratio = track.duration ? currentProgress / track.duration : 0;
  const percent = Math.min(Math.max(ratio * 100, 0), 100);

  if (progressFill) progressFill.style.width = `${percent}%`;
  if (currentTime) currentTime.textContent = formatTime(currentProgress);
  root.style.setProperty('--ring-progress', `${percent}%`);

  const bars = document.querySelectorAll('.waveform-bar');
  if (bars.length > 0) {
    const activeCount = Math.floor((percent / 100) * bars.length);
    bars.forEach((bar, index) => {
      bar.classList.toggle('active', index < activeCount);
    });
  }
}

function updatePlayButtons() {
  const label = isPlaying ? 'Pause playback' : 'Play playback';

  if (miniPlayToggle) {
    miniPlayToggle.innerHTML = isPlaying 
      ? `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`;
    miniPlayToggle.setAttribute('aria-label', label);
  }
  
  if (fullPlayToggle) {
    const playIcon = fullPlayToggle.querySelector('.play-icon');
    const pauseIcon = fullPlayToggle.querySelector('.pause-icon');
    if (playIcon && pauseIcon) {
      playIcon.style.display = isPlaying ? 'none' : 'block';
      pauseIcon.style.display = isPlaying ? 'block' : 'none';
    }
    fullPlayToggle.setAttribute('aria-label', label);
  }
}

function stopProgressTimer() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function startProgressTimer() {
  stopProgressTimer();

  progressTimer = setInterval(() => {
    const audio = document.getElementById('main-audio');
    const track = getCurrentTrack();

    if (!isPlaying || !audio) {
      return;
    }

    const currentTime = audio.currentTime;
    const duration = audio.duration;

    if (duration && duration > 0) {
      const progressPercent = (currentTime / duration) * 100 + '%';
      if (progressFill) {
        progressFill.style.width = progressPercent;
      }
      if (miniProgressFill) {
        miniProgressFill.style.width = progressPercent;
      }
      if (currentTimeDisplay) {
        currentTimeDisplay.textContent = formatTime(Math.floor(currentTime));
      }
    }

    if (audio.ended) {
      currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
      playTrackByIndex(currentTrackIndex);
    }
  }, 1000);
}

function setPlaying(nextState) {
  isPlaying = nextState;
  updatePlayButtons();
  updateSongListUI();
  localStorage.setItem('isPlaying', nextState ? '1' : '0');
  const audio = document.getElementById('main-audio');
  if (audio) {
    if (nextState) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaying = true;
            updatePlayButtons();
          })
          .catch(error => {
            console.log('Playback prevented:', error);
            isPlaying = false;
            updatePlayButtons();
          });
      }
    } else {
      audio.pause();
    }
  }
}

function openFullPlayer() {
  fullPlayer.classList.add('is-open');
  fullPlayer.inert = false;
  document.body.classList.add('full-player-open');
}

function closeFullPlayer() {
  fullPlayer.classList.remove('is-open');
  fullPlayer.inert = true;
  document.body.classList.remove('full-player-open');
}

function openTrackMenu(trackName) {
  if (trackMenuTitle) {
    trackMenuTitle.textContent = trackName;
  }
  trackMenuOverlay.classList.add('is-open');
  trackMenuOverlay.inert = false;
}

function openTrackMenuWithData(track, context = 'default') {
  currentTrackMenuData = track;
  
  // Close any existing modals first to avoid the 'overlapping' problem
  if (typeof closeModalFunc === 'function') closeModalFunc();
  
  openTrackMenu(track.title);

  const menuItems = document.querySelectorAll('.track-menu-item');
  menuItems.forEach((btn) => {
    const listEl = btn.parentElement;
    const type = listEl.dataset.menuType;
    const action = btn.dataset.action;

    // Default: Show most items
    listEl.style.display = '';

    if (context === 'playlist-item') {
      // Management mode: ONLY show Rename and Delete
      if (type === 'playlist-item' || action === 'share') {
        listEl.style.display = '';
      } else {
        listEl.style.display = 'none';
      }
    } else {
      // Song mode: NEVER show Rename or Delete
      if (type === 'playlist-item') {
        listEl.style.display = 'none';
      }
    }
  });
}

function closeTrackMenu() {
  trackMenuOverlay.classList.remove('is-open');
  trackMenuOverlay.inert = true;
  selectedTrack = null;
}

function playTrackByIndex(index) {
  currentTrackIndex = index;
  currentProgress = 0;
  const track = getCurrentTrack();
  renderTrack();
  updateMiniPlayerMetadata(track.title, track.artist, track.cover, track.videoId);
  updateSongListUI();
  setPlaying(true);
  if (miniPlayer) {
    requestAnimationFrame(() => {
      if (miniPlayer) miniPlayer.classList.add('is-visible');
    });
  }
  if (track.src) {
    const audio = document.getElementById('main-audio');
    if (audio) { audio.src = track.src; audio.play().catch(() => {}); }
  } else {
    openFullPlayer();
  }
  startProgressTimer();
  localStorage.setItem('currentTrackIndex', index);
}

function updateSongListUI() {
  const allItems = document.querySelectorAll('.recommendations > li');
  allItems.forEach((li, i) => {
    if (li) {
      li.classList.toggle('is-playing', i === currentTrackIndex && isPlaying);
      const existingEq = li.querySelector('.equalizer');
      if (existingEq) existingEq.remove();
      if (i === currentTrackIndex && isPlaying) {
        const menuBtn = li.querySelector('.menu-button');
        if (menuBtn) menuBtn.style.display = 'none';
        const eq = document.createElement('div');
        eq.className = 'equalizer';
        eq.innerHTML = '<span></span><span></span><span></span>';
        li.appendChild(eq);
      } else {
        const menuBtn = li.querySelector('.menu-button');
        if (menuBtn) menuBtn.style.display = '';
      }
    }
  });
}

function shiftTrack(step) {
  currentTrackIndex = (currentTrackIndex + step + tracks.length) % tracks.length;
  currentProgress = 0;
  renderTrack();
}

function applyTheme() {
  document.body.classList.add('theme-black');
  localStorage.setItem('theme', 'dark');
}

function setActiveTab(nextTab) {
  activeTab = nextTab;

  navItems.forEach((item) => {
    const isActive = item.dataset.tab === activeTab;
    item.classList.toggle('is-active', isActive);
    item.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  appViews.forEach((view) => {
    const isActive = view.dataset.view === activeTab;
    view.classList.toggle('is-active', isActive);
    view.inert = !isActive;
  });

  // Update URL: remove search query if not on search tab
  if (window.history.replaceState) {
    const url = new URL(window.location);
    if (nextTab !== 'search') {
      url.searchParams.delete('q');
    } else if (searchInput && searchInput.value.trim().length >= 2) {
      url.searchParams.set('q', searchInput.value.trim());
    }
    window.history.replaceState({}, '', url.toString());
  }

  if (activeTab === 'library') {
    renderLibrary();
  }

  if (activeTab === 'search' && searchInput) {
    searchInput.focus();
  }

  if (activeTab === 'profile') {
    const cards = document.querySelectorAll('.settings-card');
    cards.forEach((card, idx) => {
       card.style.opacity = '0';
       card.style.transform = 'translateY(20px)';
       setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
       }, 50 + (idx * 80));
    });
  }
}

function renderLibrary() {
  const contentDiv = document.getElementById('libraryContent');
  if (!contentDiv) return;
  
  const likedCount = likedSongs.length;
  
  let html = `
    <!-- Liked Songs Row -->
    <div class="lib-item" onclick="showLikedSongsModal()">
      <div class="lib-art liked-gradient">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
      </div>
      <div class="lib-info">
        <p>Liked Songs</p>
        <span>
          <svg class="pin-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3H8c-1.1 0-2 .9-2 2v16l6-3 6 3V5c0-1.1-.9-2-2-2z"/></svg>
          Playlist • ${likedCount} songs
        </span>
      </div>
    </div>
  `;

  // Recently Played (Internal grouping or secondary list - user wants it cleaned up, so I'll put it after playlists or remove if it was confusing)


  // Playlists
  playlists.forEach((p, idx) => {
    html += `
      <div class="lib-item">
        <div style="flex:1; display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="showPlaylistDetailModal(${idx})">
          <img class="lib-art" src="${p.songs[0]?.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100'}" alt="${p.name}" />
          <div class="lib-info">
            <p>${p.name}</p>
            <span>Playlist • ${p.songs.length} songs</span>
          </div>
        </div>
        <button class="menu-button" style="background:none; border:none; color:#888; padding:8px;" 
                onclick="openPlaylistMenu(${idx}, event)">•••</button>
      </div>
    `;
  });

  contentDiv.innerHTML = html;

  // Plus btn in header
  const createBtnTop = document.getElementById('createPlaylistBtnTop');
  if (createBtnTop) {
    createBtnTop.addEventListener('click', (e) => {
      e.stopPropagation();
      showCreatePlaylistModal();
    });
  }
}


function showPlaylistDetailModal(idx) {
  const p = playlists[idx];
  renderPlaylistDetail(p.name, p.songs, p.cover || (p.songs[0]?.cover) || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400');
}

function showLikedSongsModal() {
  renderPlaylistDetail('Liked Songs', likedSongs, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400');
}

function renderPlaylistDetail(name, songs, cover) {
  setActiveTab('playlist-detail');
  
  const detailHeader = document.querySelector('.detail-header');
  const detailCover = document.getElementById('detailCover');
  const detailTitle = document.getElementById('detailTitle');
  const detailSongs = document.getElementById('detailSongs');
  const detailStats = document.getElementById('detailStats');
  const bigPlayBtn = document.getElementById('playlistPlayBtn');
  const shuffleBtn = document.querySelector('.shuffle-btn');
  const sortFilter = document.getElementById('playlistSortFilter');

  if (detailHeader) {
      detailHeader.style.background = `linear-gradient(to bottom, rgba(140, 40, 50, 0.8), transparent)`;
  }
  
  if (detailCover) detailCover.src = cover;
  if (detailTitle) detailTitle.textContent = name;
  
  // Calculate actual song count and total duration
  const songCount = songs.length;
  const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 180), 0);
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);
  const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
  
  if (detailStats) {
      detailStats.textContent = `${songCount} songs • ${durationStr}`;
  }

  // Store songs for sorting
  currentPlaylistSongs = [...songs];
  
  // Apply initial sort (recent first by default)
  sortPlaylistSongs('recent');
  
  // Handle sort/filter change
  if (sortFilter) {
    sortFilter.onchange = () => {
      sortPlaylistSongs(sortFilter.value);
    };
  }

  // Functional Play Button
  if (bigPlayBtn) {
    bigPlayBtn.onclick = (e) => {
      e.stopPropagation();
      if (songs.length > 0) {
        playTrackDirectly({
          title: songs[0].title,
          artist: songs[0].artist,
          cover: songs[0].cover,
          videoId: songs[0].videoId
        });
      }
    };
  }

  // Functional Shuffle Button
  if (shuffleBtn) {
    shuffleBtn.onclick = (e) => {
      e.stopPropagation();
      if (songs.length > 0) {
        const randomIdx = Math.floor(Math.random() * songs.length);
        const s = songs[randomIdx];
        playTrackDirectly({title: s.title, artist: s.artist, cover: s.cover, videoId: s.videoId});
      }
    };
  }

  renderPlaylistSongs(songs);

  // Hook back button
  const backBtn = document.getElementById('backToLibrary');
  if (backBtn) {
    backBtn.onclick = () => setActiveTab('library');
  }
}

let currentPlaylistSongs = [];
let currentPlaylistName = '';

function sortPlaylistSongs(sortType) {
  if (!currentPlaylistSongs.length) return;
  
  let sorted = [...currentPlaylistSongs];
  
  switch(sortType) {
    case 'recent':
      // Already in order (most recently added first)
      break;
    case 'oldest':
      sorted.reverse();
      break;
    case 'title':
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      break;
  }
  
  renderPlaylistSongs(sorted);
}

function renderPlaylistSongs(songs) {
  const detailSongs = document.getElementById('detailSongs');
  if (!detailSongs) return;
  
  detailSongs.innerHTML = songs.map((s, idx) => `
    <div class="track-item-spotify" onclick="playTrackDirectly({title:'${s.title}', artist:'${s.artist}', cover:'${s.cover}', videoId:'${s.videoId}'})">
      <img src="${s.cover}" class="track-thumb" alt="${s.title}" />
      <div class="track-info-main">
        <p>${s.title}</p>
        <span>${s.artist}</span>
      </div>
      <button class="track-action-btn" onclick="event.stopPropagation(); openTrackMenuWithData({title:'${s.title}', artist:'${s.artist}', cover:'${s.cover}', videoId:'${s.videoId}'}, 'playlist')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
    </div>
  `).join('');
}

function openPlaylistMenu(idx, e) {
  e.stopPropagation();
  const playlist = playlists[idx];
  openTrackMenuWithData({ title: playlist.name, artist: 'Playlist' }, 'playlist-item');
  // Store the actual playlist index globally for the menu actions
  currentPlaylistMenuIdx = idx;
}

let currentPlaylistMenuIdx = null;

function renderPlaylists() {
  const container = document.getElementById('playlistsList');
  if (!container) return;
  if (playlists.length === 0) {
    container.innerHTML = '<p style="color:#666;font-size:0.85rem;">No playlists yet</p>';
    return;
  }
  container.innerHTML = playlists.map((p, i) => `
    <div class="playlist-item" data-index="${i}">
      <img src="${p.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100'}" alt="" />
      <div class="playlist-item-info">
        <p>${p.name}</p>
        <span>${p.songs.length} songs</span>
      </div>
      <button class="playlist-menu-btn" data-index="${i}" aria-label="Playlist options">⋯</button>
    </div>
  `).join('');
  updatePlaylistMenuListeners();
}

function renderLikedSongs() {
  const container = document.getElementById('likedSongsList');
  if (!container) return;
  if (likedSongs.length === 0) {
    container.innerHTML = '<p style="color:#666;font-size:0.85rem;">No liked songs</p>';
    return;
  }
  container.innerHTML = likedSongs.map((song, i) => `
    <div class="library-item" data-videoid="${song.videoId}" data-title="${song.title}" data-artist="${song.artist}" data-cover="${song.thumbnail}">
      <img src="${song.thumbnail || ''}" alt="" />
      <div class="library-item-info">
        <p>${song.title}</p>
        <span>${song.artist}</span>
      </div>
      <button class="like-btn" data-videoid="${song.videoId}" data-title="${song.title}" data-artist="${song.artist}" data-cover="${song.thumbnail}" aria-label="Unlike">
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <button class="menu-button" aria-label="More options for ${song.title}" aria-haspopup="dialog">•••</button>
    </div>
  `).join('');
  updateLikeButtons();
}

function renderRecentlyPlayed() {
  const container = document.getElementById('libraryRecentList');
  if (!container) return;
  if (history.length === 0) {
    container.innerHTML = '<p style="color:#666;font-size:0.85rem;">No recently played songs</p>';
    return;
  }
  container.innerHTML = history.slice(0, 15).map((h, i) => `
    <div class="library-item" data-videoid="${h.videoId}" data-title="${h.title}" data-artist="${h.artist}" data-cover="${h.thumbnail}">
      <img src="${h.thumbnail || ''}" alt="" />
      <div class="library-item-info">
        <p>${h.title}</p>
        <span>${h.artist}</span>
      </div>
      <button class="like-btn" data-videoid="${h.videoId}" data-title="${h.title}" data-artist="${h.artist}" data-cover="${h.thumbnail}" aria-label="Like">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>
      <button class="menu-button" aria-label="More options for ${h.title}" aria-haspopup="dialog">•••</button>
    </div>
  `).join('');
  updateLikeButtons();
}

function updatePlaylistMenuListeners() {
  document.querySelectorAll('.playlist-menu-btn').forEach(btn => {
    btn.removeEventListener('click', playlistMenuClick);
    btn.addEventListener('click', playlistMenuClick);
  });
}

function playlistMenuClick(e) {
  e.stopPropagation();
  const idx = Number(e.target.dataset.index);
  showPlaylistActionsModal(idx);
}

function showPlaylistActionsModal(index) {
  const playlist = playlists[index];
  const content = `
    <div class="modal-playlist-item" style="cursor:default;background:var(--surface-strong);">
      <div class="modal-playlist-item-info">
        <img src="${playlist.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100'}" alt="" />
        <div>
          <p>${playlist.name}</p>
          <span>${playlist.songs.length} songs</span>
        </div>
      </div>
    </div>
    <button class="modal-btn" id="renamePlaylistBtn" style="margin-top:12px;background:transparent;border:1px solid #444;color:var(--text-main);">Rename</button>
    <button class="modal-btn" id="deletePlaylistBtn" style="margin-top:8px;background:#ff4444;border:none;color:#fff;">Delete Playlist</button>
  `;
  
  openModal('Playlist Options', content);
  
  const renameBtn = document.getElementById('renamePlaylistBtn');
  const deleteBtn = document.getElementById('deletePlaylistBtn');
  
  if (renameBtn) {
    renameBtn.addEventListener('click', () => {
      showRenamePlaylistModal(index);
    });
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('Delete this playlist?')) {
        playlists.splice(index, 1);
        savePlaylists();
        closeModalFunc();
      }
    });
  }
}

function showRenamePlaylistModal(idx) {
  const p = playlists[idx];
  openModal('Rename Playlist', `
    <div style="padding:10px 0;">
      <label for="renamePlaylistInput" style="display:block;margin-bottom:12px;font-size:0.9rem;color:#888;">New Name</label>
      <input type="text" id="renamePlaylistInput" value="${p.name}" style="width:100%;padding:12px;border-radius:12px;background:#262626;border:1px solid #333;color:#fff;margin-bottom:20px;" />
      <button id="saveRenameBtn" style="width:100%;padding:14px;background:var(--accent);color:#000;border:none;border-radius:12px;font-weight:700;cursor:pointer;">Update Name</button>
    </div>
  `);
  
  setTimeout(() => {
    const input = document.getElementById('renamePlaylistInput');
    const btn = document.getElementById('saveRenameBtn');
    input.focus();
    input.select();
    
    btn.onclick = () => {
      const newName = input.value.trim();
      if (!newName) return;
      
      const exists = playlists.some((p, i) => i !== idx && p.name.toLowerCase() === newName.toLowerCase());
      if (exists) {
        alert('A playlist with this name already exists!');
        return;
      }

      playlists[idx].name = newName;
      localStorage.setItem('nimiq_playlists', JSON.stringify(playlists));
      renderLibrary();
      closeModalFunc();
      closeTrackMenu();
    };
  }, 100);
}

function showCreatePlaylistModal(trackToAdd = null) {
  const content = `
    <input type="text" id="newPlaylistName" class="modal-input" placeholder="Playlist name" autofocus />
    <button id="confirmCreatePlaylist" class="modal-btn">Create</button>
  `;
  
  openModal('Create Playlist', content);
  
  const input = document.getElementById('newPlaylistName');
  const btn = document.getElementById('confirmCreatePlaylist');
  
  if (input) input.focus();
  
  if (btn) {
    btn.addEventListener('click', () => {
      const name = input ? input.value.trim() : '';
      if (name) {
        const exists = playlists.some(p => p.name.toLowerCase() === name.toLowerCase());
        if (exists) {
          alert('A playlist with this name already exists!');
          return;
        }

        const newPlaylist = { name: name, songs: [], cover: '' };
        if (trackToAdd) {
          newPlaylist.songs.push({ title: trackToAdd.title, artist: trackToAdd.artist, videoId: trackToAdd.videoId, cover: trackToAdd.cover, thumbnail: trackToAdd.cover, duration: 180 });
        }
        playlists.push(newPlaylist);
        savePlaylists();
        closeModalFunc();
      }
    });
  }
  
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn.click();
    });
  }
}

function showAddToPlaylistModal(track) {
  let content = '';
  
  if (playlists.length > 0) {
    content += playlists.map((p, i) => `
      <div class="modal-playlist-item" data-index="${i}">
        <div class="modal-playlist-item-info">
          <img src="${p.cover || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100'}" alt="" />
          <div>
            <p>${p.name}</p>
            <span>${p.songs.length} songs</span>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  content += `
    <button class="modal-create-btn" id="modalCreatePlaylist">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Create Playlist
    </button>
  `;
  
  openModal('Add to Playlist', content);
  
  document.querySelectorAll('.modal-playlist-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = Number(item.dataset.index);
      const playlist = playlists[idx];
      const exists = playlist.songs.some(s => s.videoId === track.videoId);
      if (exists) {
        closeModalFunc();
        return;
      }
      playlist.songs.push({ title: track.title, artist: track.artist, videoId: track.videoId, cover: track.cover, thumbnail: track.cover, duration: 180 });
      savePlaylists();
      closeModalFunc();
    });
  });
  
  const modalCreateBtn = document.getElementById('modalCreatePlaylist');
  if (modalCreateBtn) {
    modalCreateBtn.addEventListener('click', () => {
      showCreatePlaylistModal(track);
    });
  }
}

function openModal(title, content) {
  if (modalTitle) modalTitle.textContent = title;
  if (modalBody) modalBody.innerHTML = content;
  if (modalOverlay) modalOverlay.hidden = false;
}

function closeModalFunc() {
  if (modalOverlay) modalOverlay.hidden = true;
}

if (closeModal) {
  closeModal.addEventListener('click', closeModalFunc);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModalFunc();
  });
}

function openArtistPage(artistNameVal, artistId) {
  setActiveTab('artist');
  if (artistName) artistName.textContent = artistNameVal;
  if (artistStats) artistStats.textContent = 'Loading...';
  if (artistImage) artistImage.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200';
  
  if (artistSongs) {
    artistSongs.innerHTML = '<p style="color:#666;">Loading songs...</p>';
  }
  
  searchNimiq(artistNameVal);
}

trackMenuItems.forEach((item) => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const action = item.dataset.action;
    const track = selectedTrack || getCurrentTrack();
    
    if (action === 'like') {
      toggleLike(track.videoId, track.title, track.artist, track.cover, e);
    } else if (action === 'playlist') {
      showAddToPlaylistModal(track);
    } else if (action === 'artist') {
      openArtistPage(track.artist, '');
    } else if (action === 'credits') {
      const duration = track.duration ? formatTime(track.duration) : 'Unknown';
      openModal('Song Credits', `
        <div style="text-align:center;">
          <p style="font-size:1.1rem;font-weight:700;margin-bottom:8px;">${track.title}</p>
          <p style="color:var(--text-secondary);margin-bottom:4px;">${track.artist}</p>
          <p style="color:var(--text-secondary);font-size:0.85rem;">Duration: ${duration}</p>
        </div>
      `);
    } else if (action === 'album') {
      openModal('Album View', `
        <div style="text-align:center;padding:10px;">
          <img src="${track.cover}" style="width:120px;height:120px;border-radius:12px;margin-bottom:12px;box-shadow:0 8px 16px rgba(0,0,0,0.5);" />
          <p style="font-size:1.1rem;font-weight:700;">${track.title} (Single)</p>
          <p style="color:#888;">${track.artist}</p>
          <div style="margin-top:20px;text-align:left;opacity:0.6;">
            <p>1. ${track.title}</p>
          </div>
        </div>
      `);
    } else if (action === 'rename_playlist') {
      if (currentPlaylistMenuIdx !== null) {
        showRenamePlaylistModal(currentPlaylistMenuIdx);
      }
    } else if (action === 'delete_playlist') {
      if (currentPlaylistMenuIdx !== null) {
        if (confirm(`Are you sure you want to delete "${playlists[currentPlaylistMenuIdx].name}"?`)) {
          playlists.splice(currentPlaylistMenuIdx, 1);
          localStorage.setItem('nimiq_playlists', JSON.stringify(playlists));
          renderLibrary();
          closeTrackMenu();
        }
      }
    } else if (action === 'queue') {
      tracks.splice(currentTrackIndex + 1, 0, track);
    } else if (action === 'remove_playlist') {
      if (currentPlaylistIndex !== null) {
        const p = playlists[currentPlaylistIndex];
        const idx = p.songs.findIndex(s => s.videoId === track.videoId);
        if (idx !== -1) {
          p.songs.splice(idx, 1);
          localStorage.setItem('nimiq_playlists', JSON.stringify(playlists));
          renderPlaylists();
          showPlaylistDetailModal(currentPlaylistIndex);
        }
      }
    } else if (action === 'share') {
      const shareUrl = `https://youtube.com/watch?v=${track.videoId || ''}`;
      if (navigator.share) {
        navigator.share({ title: track.title, text: `Listen to ${track.title} by ${track.artist}`, url: shareUrl });
      } else {
        openModal('Share', `
          <input type="text" class="modal-input" value="${shareUrl}" readonly />
          <button class="modal-btn" onclick="navigator.clipboard.writeText('${shareUrl}');closeModalFunc();">Copy Link</button>
        `);
      }
    }
    closeTrackMenu();
  });
});



function toggleLike(videoId, title, artist, cover, event) {
  if (event) {
    if (typeof event.stopPropagation === 'function') event.stopPropagation();
    if (typeof event.preventDefault === 'function') event.preventDefault();
  }
  
  const idx = likedSongs.findIndex(s => s.videoId === videoId);
  if (idx >= 0) {
    likedSongs.splice(idx, 1);
  } else {
    likedSongs.push({ videoId: videoId, title: title, artist: artist, thumbnail: cover, cover: cover, duration: 180 });
  }
  localStorage.setItem('nimiq_liked', JSON.stringify(likedSongs));
  updateLikeButtons();
  renderLikedSongs();
  updateSettingsPersonalization();
}

function updateLikeButtons() {
  document.querySelectorAll('.like-btn, .mini-like-btn, .full-like-btn').forEach(btn => {
    const videoId = btn.dataset.videoid;
    if (videoId) {
      btn.classList.toggle('is-liked', likedSongs.some(s => s.videoId === videoId));
    }
  });
}

function updateSettingsPersonalization() {
  if (settingsRecentList) {
    const recentTitles = history.slice(0, 3).map(h => h.title).join(' · ');
    settingsRecentList.textContent = recentTitles || 'No recent tracks';
  }
  if (settingsLikedCount) {
    settingsLikedCount.textContent = `${likedSongs.length} songs`;
  }
}

function savePlaylists() {
  localStorage.setItem('nimiq_playlists', JSON.stringify(playlists));
  renderPlaylists();
}

function addToHistory(track) {
  history = history.filter(h => h.videoId !== track.videoId);
  history.unshift(track);
  history = history.slice(0, 50);
  localStorage.setItem('nimiq_history', JSON.stringify(history));
  renderRecentlyPlayed();
  updateSettingsPersonalization();
}

function renderSearchResults(indexes) {
  if (!searchResults) {
    return;
  }

  if (!indexes.length) {
    searchResults.innerHTML = '<li class="search-result-item"><div class="placeholder-card"><p>No matches found</p><span>Try another song title or artist name.</span></div></li>';
    return;
  }

  searchResults.innerHTML = indexes
    .map((trackIndex) => {
      const track = tracks[trackIndex];
      return `
        <li class="search-result-item">
          <button class="search-result-btn" data-track-index="${trackIndex}" aria-label="Play ${track.title}">
            <img src="${track.cover}" alt="${track.title} artwork" />
            <div>
              <p>${track.title}</p>
              <span>${track.artist}</span>
            </div>
            <span class="search-result-play">▶</span>
          </button>
        </li>
      `;
    })
    .join('');
}

function filterTracks(query) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    filteredIndexes = tracks.map((_, index) => index);
    renderSearchResults(filteredIndexes);
    return;
  }

  filteredIndexes = tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => {
      return track.title.toLowerCase().includes(normalized) || track.artist.toLowerCase().includes(normalized);
    })
    .map(({ index }) => index);

  renderSearchResults(filteredIndexes);
}

// Accent switching is now handled in setupProfileSettings


playTriggers.forEach((trigger, index) => {
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    playTrackByIndex(index);
  });
});

navItems.forEach((item) => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    setActiveTab(item.dataset.tab || 'home');
  });
});

if (headerSearchBtn) {
  headerSearchBtn.addEventListener('click', () => {
    setActiveTab('search');
  });
}

if (closePlayer) {
  closePlayer.addEventListener('click', (e) => {
    e.stopPropagation();
    closeFullPlayer();
  });
}

if (miniPlayer) {
  miniPlayer.addEventListener('click', (e) => {
    if (e.target.closest('.mini-play-toggle') || e.target.closest('.mini-like-btn')) return;
    openFullPlayer();
  });
}

if (fullPlayToggle) {
  fullPlayToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setPlaying(!isPlaying);
  });
}

if (miniPlayToggle) {
  miniPlayToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setPlaying(!isPlaying);
  });
}

if (miniLikeBtn) {
  miniLikeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const track = getCurrentTrack();
    if (track && track.videoId) {
      toggleLike(track.videoId, track.title, track.artist, track.cover, { 
        stopPropagation: () => e.stopPropagation(), 
        preventDefault: () => e.preventDefault(),
        currentTarget: miniLikeBtn 
      });
    }
  });
}

if (prevBtn) {
  prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    shiftTrack(-1);
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    shiftTrack(1);
  });
}



if (closeTrackMenuButton) {
  closeTrackMenuButton.addEventListener('click', (e) => {
    e.stopPropagation();
    closeTrackMenu();
  });
}

if (fullLikeBtn) {
  fullLikeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const track = getCurrentTrack();
    if (track && track.videoId) {
      toggleLike(track.videoId, track.title || fullTitle?.textContent, track.artist || fullArtist?.textContent, track.cover || fullCover?.src, { 
        stopPropagation: () => e.stopPropagation(), 
        preventDefault: () => e.preventDefault(),
        currentTarget: fullLikeBtn 
      });
    }
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    e.stopPropagation();
    const value = e.target.value;
    searchNimiq(value);
    if (clearSearchBtn) {
      clearSearchBtn.hidden = value.length === 0;
    }
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (searchInput) {
      searchInput.value = '';
      clearSearchBtn.hidden = true;
      if (browseSection) browseSection.hidden = false;
      if (resultsSection) resultsSection.hidden = true;
      
      // Clean URL
      if (window.history.replaceState) {
        const url = new URL(window.location);
        url.searchParams.delete('q');
        window.history.replaceState({}, '', url.toString());
      }
      
      searchInput.focus();
    }
  });
}

renderTrack();
updatePlayButtons();
updateProgressUI();
renderSearchResults(filteredIndexes);
applyTheme();
startProgressTimer();
setActiveTab('home');
updateLikeButtons();
updateSettingsPersonalization();

async function loadHomeContent() {
  try {
    const res = await fetch('https://nimiq-music.onrender.com/search?q=Top+Hits+2026');
    if (!res.ok) return;
    const items = await res.json();
    if (items.length === 0) return;
    
    const topResults = items.slice(0, 3).map(item => ({
      title: item.title,
      uploader: item.artist,
      thumbnail: item.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
      videoId: item.videoId
    }));
    
    const recommendations = items.slice(3, 10).map(item => ({
      title: item.title,
      uploader: item.artist,
      thumbnail: item.thumbnail || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200',
      videoId: item.videoId
    }));
    
    const topResultsContainer = document.querySelector('.top-results');
    const recommendationsContainer = document.querySelector('.recommendations');
    
    if (topResultsContainer) {
      topResultsContainer.innerHTML = topResults.map(t => `
        <button class="result-card play-trigger" data-title="${t.title}" data-artist="${t.uploader}" data-cover="${t.thumbnail}" data-videoid="${t.videoId}" data-duration="180" aria-label="Play ${t.title}">
          <img src="${t.thumbnail}" alt="${t.title}" onerror="this.src='https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400'" />
          <div class="card-meta">
            <p>${t.title}</p>
            <span>${t.uploader}</span>
          </div>
        </button>
      `).join('');
    }
    
    if (recommendationsContainer) {
      recommendationsContainer.innerHTML = recommendations.map(r => `
        <li>
          <button class="recommendation-play play-trigger" data-title="${r.title}" data-artist="${r.uploader}" data-cover="${r.thumbnail}" data-videoid="${r.videoId}" data-duration="180" aria-label="Play ${r.title}">
            <img src="${r.thumbnail}" alt="${r.title}" onerror="this.src='https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200'" />
            <div>
              <p>${r.title}</p>
              <span>${r.uploader}</span>
            </div>
          </button>
          <button class="like-btn" data-videoid="${r.videoId}" data-title="${r.title}" data-artist="${r.uploader}" data-cover="${r.thumbnail}" aria-label="Like">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button class="menu-button" aria-label="More options for ${r.title}" aria-haspopup="dialog">•••</button>
        </li>
      `).join('');
    }
    
    if (typeof updateLikeButtons === 'function') {
      updateLikeButtons();
    }
  } catch (e) {
    console.error('Failed to load home content:', e);
  }
}

document.addEventListener('click', (e) => {
  const playTrigger = e.target.closest('.play-trigger');
  if (playTrigger) {
    e.stopPropagation();
    const videoId = playTrigger.dataset.videoid;
    if (videoId) {
      if (fullPlayToggle) fullPlayToggle.classList.add('loading');
      if (miniPlayToggle) miniPlayToggle.classList.add('loading');
      getAudioStream(videoId);
    }
    return;
  }

  const pill = e.target.closest('.pill');
  if (pill) {
    e.stopPropagation();
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('is-active'));
    pill.classList.add('is-active');
    return;
  }
  
  const likeBtn = e.target.closest('.like-btn');
  if (likeBtn) {
    e.stopPropagation();
    e.preventDefault();
    const videoId = likeBtn.dataset.videoid;
    const title = likeBtn.dataset.title;
    const artist = likeBtn.dataset.artist;
    const cover = likeBtn.dataset.cover;
    if (videoId) {
      toggleLike(videoId, title, artist, cover, { 
        stopPropagation: () => e.stopPropagation(), 
        preventDefault: () => e.preventDefault(),
        currentTarget: likeBtn 
      });
    }
  }
  
  const libraryItem = e.target.closest('.library-item');
  if (libraryItem) {
    e.stopPropagation();
    const videoId = libraryItem.dataset.videoid;
    if (videoId) {
      getAudioStream(videoId);
    }
  }

  const songItem = e.target.closest('.song-item');
  if (songItem) {
    e.stopPropagation();
    const videoId = songItem.dataset.videoid;
    if (videoId) {
      getAudioStream(videoId);
    }
  }

  const playlistItem = e.target.closest('.playlist-item');
  if (playlistItem) {
    e.stopPropagation();
    const idx = Number(playlistItem.dataset.index);
    showPlaylistDetailModal(idx);
  }
  
  const menuBtn = e.target.closest('.menu-button');
  if (menuBtn) {
    e.stopPropagation();
    let track = null;
    let context = 'default';

    if (menuBtn.closest('#fullPlayer')) {
      context = 'full-player';
      track = getCurrentTrack();
    } else {
      const item = menuBtn.closest('.library-item, .playlist-song-item, .song-item, li');
      if (!item) return;

      if (menuBtn.closest('#playlistSongs')) context = 'playlist';
      else if (menuBtn.closest('.home-screen')) context = 'home';
      
      const playBtn = item.querySelector('.recommendation-play, .search-result-btn');
      if (playBtn) {
        track = {
          title: playBtn.dataset.title,
          artist: playBtn.dataset.artist,
          videoId: playBtn.dataset.videoid,
          cover: playBtn.querySelector('img')?.src
        };
      } else {
        const videoId = item.dataset.videoid;
        const title = item.dataset.title;
        const artist = item.dataset.artist;
        const cover = item.dataset.cover;
        if (videoId || title || artist || cover) {
          track = { videoId, title, artist, cover };
        }
      }
    }
    
    if (track) {
      openTrackMenuWithData(track, context);
    }
  }
});

document.addEventListener('click', (e) => {
  if (trackMenuOverlay && trackMenuOverlay.classList.contains('is-open')) {
    if (!e.target.closest('.track-menu-sheet') && !e.target.closest('.menu-button')) {
      closeTrackMenu();
    }
  }
  
  if (modalOverlay && !modalOverlay.hidden) {
    if (!e.target.closest('.modal-content')) {
      closeModalFunc();
    }
  }
  
  if (fullPlayer && fullPlayer.classList.contains('is-open')) {
    if (e.target === fullPlayer) {
      closeFullPlayer();
    }
  }
});



function playTrackDirectly(track) {
  const existingIndex = tracks.findIndex(t => t.videoId === track.videoId);
  if (existingIndex !== -1) {
    playTrackByIndex(existingIndex);
  } else {
    tracks.push(track);
    playTrackByIndex(tracks.length - 1);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadHomeContent();
  renderPlaylists();

  // Category clicks trigger search
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const category = card.querySelector('span').textContent;
      if (searchInput) {
        searchInput.value = category;
        setActiveTab('search');
        searchNimiq(category);
      }
    });
  });

  // Handle URL parameters on load - only if explicitly set via navigation
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  if (query && query.trim().length > 0) {
    setActiveTab('search');
    if (searchInput) searchInput.value = query;
    setTimeout(() => searchNimiq(query), 300);
    // Clean up URL without reload
    window.history.replaceState({}, '', window.location.pathname);
  }

  // Initialize Profile Settings
  setupProfileSettings();
});

function setupProfileSettings() {
  const userNameInput = document.getElementById('userNameInput');
  const userAvatar = document.getElementById('userAvatar');
  const avatarUpload = document.getElementById('avatarUpload');
  const changeAvatarBtn = document.getElementById('changeAvatarBtn');
  const themeMode = document.getElementById('themeMode');
  const interfaceStyle = document.getElementById('interfaceStyle');
  const resetBtn = document.getElementById('resetProfileBtn');
  const saveBtn = document.getElementById('saveProfileBtn');
  const swatches = document.querySelectorAll('.color-swatch');

  // Load from LocalStorage
  const savedName = localStorage.getItem('nimiq_user_name');
  if (savedName && userNameInput) userNameInput.value = savedName;

  const savedAvatar = localStorage.getItem('nimiq_user_avatar');
  if (savedAvatar && userAvatar) {
    userAvatar.src = savedAvatar;
    updateNavAvatar();
  }

  // Name Editing
  if (userNameInput) {
    userNameInput.addEventListener('input', () => {
      localStorage.setItem('nimiq_user_name', userNameInput.value);
    });
  }

  // Avatar Upload
  if (changeAvatarBtn && avatarUpload) {
    changeAvatarBtn.addEventListener('click', () => avatarUpload.click());
    avatarUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64 = event.target.result;
          userAvatar.src = base64;
          localStorage.setItem('nimiq_user_avatar', base64);
          updateNavAvatar();
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Segmented Controls (Theme, Interface Style)
  const setupGridSelector = (containerId, storageKey, onChange) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const btns = container.querySelectorAll('.grid-btn');
    
    // Load saved
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      btns.forEach(b => {
        b.classList.toggle('is-active', b.dataset.value === saved);
      });
      onChange(saved);
    }

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const val = btn.dataset.value;
        localStorage.setItem(storageKey, val);
        onChange(val);
      });
    });
  };

  setupGridSelector('themeMode', 'nimiq_theme', (val) => {
    document.body.classList.remove('light-mode', 'amoled-mode', 'dark-mode');
    if (val === 'light') document.body.classList.add('light-mode');
    if (val === 'amoled') document.body.classList.add('amoled-mode');
    if (val === 'dark') document.body.classList.add('dark-mode');
  });

  setupGridSelector('interfaceStyle', 'nimiq_interface_style', (val) => {
    document.body.className = document.body.className.replace(/\bstyle-\S+/g, '');
    document.body.classList.add('style-' + val);
  });

  // Accent Colors
  const savedAccent = localStorage.getItem('--accent-color');
  if (savedAccent) {
    document.documentElement.style.setProperty('--accent', savedAccent);
    swatches.forEach(s => s.classList.toggle('is-active', s.dataset.accent === savedAccent));
  }

  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const accent = swatch.dataset.accent;
      document.documentElement.style.setProperty('--accent', accent);
      localStorage.setItem('--accent-color', accent);
      swatches.forEach(s => s.classList.remove('is-active'));
      swatch.classList.add('is-active');
    });
  });

  // Music Room
  const createRoomBtn = document.querySelector('.create-room-btn');
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', () => {
      const roomSessions = document.querySelector('.room-sessions');
      roomSessions.innerHTML = `
        <div class="room-placeholder active-room">
          <p>playing in "nimiq vibe lounge"</p>
          <span style="font-size:12px; color:var(--text-secondary)">3 friends listening</span>
          <button class="create-room-btn outline" style="margin-top:8px">leave room</button>
        </div>
      `;
    });
  }

  // Reset/Save
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.clear();
      window.location.reload();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveBtn.textContent = 'saved!';
      saveBtn.style.background = '#10b981';
      setTimeout(() => {
        saveBtn.textContent = 'save changes';
        saveBtn.style.background = '';
      }, 2000);
    });
  }
}

function updateNavAvatar() {
  const profileTab = document.querySelector('.nav-item[data-tab="profile"]');
  if (!profileTab) return;
  const savedAvatar = localStorage.getItem('nimiq_user_avatar');
  if (savedAvatar) {
    profileTab.innerHTML = `<img src="${savedAvatar}" class="nav-avatar-img" alt="Profile" />`;
  }
}
