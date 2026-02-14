// Load vocabulary data from local file
fetch('assets/data.json')
  .then(response => response.json())
  .then(data => {
    const cards = data
      .map(c => ({
        num: c[0],
        word: c[1],
        url: `assets/audio/${c[0]}. ${c[1]}.mp3`
      }))
      .sort((a, b) => a.num - b.num);

    initApp(cards);
  })
  .catch(error => {
    console.error('Failed to load vocabulary data:', error);
    // Show error toast if available
    const errorToast = document.getElementById('errorToast');
    if (errorToast) {
      errorToast.classList.add('show');
      setTimeout(() => errorToast.classList.remove('show'), 4000);
    }
  });

// Initialize the application with loaded cards
function initApp(cards) {
  let currentIndex = -1;
  let filteredCards = [...cards];
  let isPlaying = false;

  // DOM Elements
  const $ = (id) => document.getElementById(id);
  const searchInput = $("searchInput");
  const cardList = $("cardList");
  const clearBtn = $("clearBtn");
  const nowPlaying = $("nowPlaying");
  const npNum = $("npNum");
  const npWord = $("npWord");
  const npPlayPause = $("npPlayPause");
  const npIconPlay = $("npIconPlay");
  const npIconPause = $("npIconPause");
  const audio = $("audioPlayer");
  const errorToast = $("errorToast");

  // Initialize total count
  $("totalCount").textContent = cards.length;

  // SVG Icons
  const playSvg =
    '<svg fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>';
  const pauseSvg =
    '<svg fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

  // Render card list
  function renderCards() {
    if (filteredCards.length === 0) {
      cardList.innerHTML =
        '<div class="empty"><div class="empty-icon">&#128269;</div><p>Nothing found</p></div>';
      return;
    }
    const frag = document.createDocumentFragment();
    filteredCards.forEach((card) => {
      const idx = cards.indexOf(card);
      const isActive = currentIndex === idx;
      const div = document.createElement("div");
      div.className = "card-item" + (isActive ? " playing" : "");
      div.dataset.index = idx;
      div.innerHTML =
        '<div class="card-num">' +
        card.num +
        "</div>" +
        '<div class="card-word">' +
        card.word +
        "</div>" +
        '<button class="play-btn" title="Listen">' +
        (isActive && isPlaying ? pauseSvg : playSvg) +
        "</button>";
      div.addEventListener("click", () => {
        if (currentIndex === idx && isPlaying) pauseAudio();
        else playCard(idx);
      });
      frag.appendChild(div);
    });
    cardList.innerHTML = "";
    cardList.appendChild(frag);
  }

  // Search functionality
  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const q = searchInput.value.trim().toLowerCase();
      clearBtn.classList.toggle("show", q.length > 0);
      if (!q) {
        filteredCards = [...cards];
        $("resultCount").textContent = "";
        $("searchTip").style.display = "";
      } else {
        $("searchTip").style.display = "none";
        const isNum = /^\d+$/.test(q);
        filteredCards = isNum
          ? cards.filter((c) => c.num.toString().startsWith(q))
          : cards.filter((c) => c.word.toLowerCase().includes(q));
        $("resultCount").textContent = "Found: " + filteredCards.length;
      }
      renderCards();
    }, 150);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.classList.remove("show");
    filteredCards = [...cards];
    $("resultCount").textContent = "";
    $("searchTip").style.display = "";
    renderCards();
    searchInput.focus();
  });

  // Audio playback functions
  function playCard(index) {
    const card = cards[index];
    if (!card) return;
    currentIndex = index;
    isPlaying = true;
    updateNP();
    renderCards();
    const el = cardList.querySelector(".playing");
    if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    audio.src = card.url;
    audio.play().catch(() => showError());
  }

  function pauseAudio() {
    audio.pause();
    isPlaying = false;
    updateNP();
    renderCards();
  }

  function resumeAudio() {
    audio.play().catch(() => {});
    isPlaying = true;
    updateNP();
    renderCards();
  }

  function playNext() {
    if (currentIndex < 0) return;
    const cur = cards[currentIndex];
    const fi = filteredCards.indexOf(cur);
    if (fi >= 0 && fi < filteredCards.length - 1)
      playCard(cards.indexOf(filteredCards[fi + 1]));
  }

  function playPrev() {
    if (currentIndex < 0) return;
    const cur = cards[currentIndex];
    const fi = filteredCards.indexOf(cur);
    if (fi > 0) playCard(cards.indexOf(filteredCards[fi - 1]));
  }

  // Update now playing bar
  function updateNP() {
    if (currentIndex < 0) {
      nowPlaying.classList.remove("visible");
      return;
    }
    const card = cards[currentIndex];
    nowPlaying.style.visibility = "";
    nowPlaying.classList.add("visible");
    npNum.textContent = "#" + card.num;
    npWord.textContent = card.word;
    npIconPlay.style.display = isPlaying ? "none" : "";
    npIconPause.style.display = isPlaying ? "" : "none";
  }

  // Audio event listeners
  audio.addEventListener("ended", () => {
    isPlaying = false;
    updateNP();
    renderCards();
  });

  audio.addEventListener("play", () => {
    isPlaying = true;
    updateNP();
    renderCards();
  });

  audio.addEventListener("pause", () => {
    isPlaying = false;
    updateNP();
    renderCards();
  });

  audio.addEventListener("error", () => showError());

  // Now playing controls
  npPlayPause.addEventListener("click", () => {
    if (isPlaying) pauseAudio();
    else resumeAudio();
  });

  $("npPrev").addEventListener("click", playPrev);
  $("npNext").addEventListener("click", playNext);

  // Error handling
  let errorTimer;
  function showError() {
    errorToast.classList.add("show");
    clearTimeout(errorTimer);
    errorTimer = setTimeout(
      () => errorToast.classList.remove("show"),
      4000,
    );
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.target === searchInput) return;
    if (e.code === "Space") {
      e.preventDefault();
      if (currentIndex >= 0) {
        if (isPlaying) pauseAudio();
        else resumeAudio();
      }
    }
    if (e.code === "ArrowRight") playNext();
    if (e.code === "ArrowLeft") playPrev();
  });

  // Blur search input when tapping outside
  document.addEventListener("click", (e) => {
    if (e.target !== searchInput && !searchInput.contains(e.target)) {
      searchInput.blur();
    }
  });

  // Initial render
  renderCards();
}
