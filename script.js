/* =========================================================
   Kunjus Corner — script.js
   - section navigation + transitions
   - IST clock + Nov 10 birthday countdown (IST locked)
   - tiny prompt shuffle + copy
   - Boost quotes (tries internet API, fallback offline)
   - Two-way notes (localStorage)
   - YouTube playlist embed via playlist ID (localStorage)
   ========================================================= */

(() => {
  "use strict";

  // -----------------------------
  // Helpers
  // -----------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("is-on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("is-on"), 1600);
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied ✓");
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      toast("Copied ✓");
    }
  }

  // -----------------------------
  // Navigation (always visible)
  // -----------------------------
  const sections = $$("[data-section]");
  const navItems = $$(".nav-item");

  function showSection(id) {
    sections.forEach(s => s.classList.toggle("is-active", s.id === id));
    navItems.forEach(b => b.classList.toggle("is-active", b.dataset.target === id));
    // Update aria-current
    navItems.forEach(b => b.removeAttribute("aria-current"));
    const active = navItems.find(b => b.dataset.target === id);
    if (active) active.setAttribute("aria-current", "page");
    // Close modal if open
    closeModal();
    // Tiny scroll reset for nicer feel
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navItems.forEach(btn => {
    btn.addEventListener("click", () => showSection(btn.dataset.target));
  });

  $$("[data-jump]").forEach(btn => {
    btn.addEventListener("click", () => showSection(btn.dataset.jump));
  });

  // -----------------------------
  // “Dock” effect: big name shrinks on scroll
  // -----------------------------
  const dockThreshold = 72;
  function updateDock() {
    document.body.classList.toggle("is-docked", window.scrollY > dockThreshold);
  }
  window.addEventListener("scroll", updateDock, { passive: true });
  updateDock();

  // -----------------------------
  // Photo fallback if nandana.png missing
  // -----------------------------
  const photo = $("#nandanaPhoto");
  const fallback = $("#photoFallback");
  function ensurePhoto() {
    if (!photo) return;
    // If image fails, show fallback
    photo.addEventListener("error", () => {
      photo.style.display = "none";
      fallback.classList.add("is-on");
    }, { once: true });
  }
  ensurePhoto();

  // -----------------------------
  // IST time helpers (timezone-locked)
  // -----------------------------
  const IST_TZ = "Asia/Kolkata";

  function nowInISTDateObject() {
    // Creates a Date object representing current IST time, regardless of local TZ.
    // Uses locale string conversion as a practical approach.
    return new Date(new Date().toLocaleString("en-US", { timeZone: IST_TZ }));
  }

  function formatTimeHHMM(dateObj) {
    // dateObj assumed in IST "representation"
    const hh = String(dateObj.getHours()).padStart(2, "0");
    const mm = String(dateObj.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  // IST clock in sidebar
  const istClock = $("#istClock");
  function tickISTClock() {
    const nowIST = nowInISTDateObject();
    if (istClock) istClock.textContent = `IST • ${formatTimeHHMM(nowIST)}`;
  }
  tickISTClock();
  setInterval(tickISTClock, 15_000);

  // -----------------------------
  // Birthday countdown to Nov 10 (IST)
  // Target: Nov 10, 00:00:00 IST of next occurrence.
  // -----------------------------
  const cdDays = $("#cdDays");
  const cdHours = $("#cdHours");
  const cdMins = $("#cdMins");
  const cdSecs = $("#cdSecs");
  const daysToMini = $("#daysToBdayMini");

  function getNextBirthdayTargetIST() {
    const nowIST = nowInISTDateObject();
    const year = nowIST.getFullYear();

    // Build target in IST with explicit offset (+05:30)
    let target = new Date(`${year}-11-10T00:00:00+05:30`);
    if (target.getTime() <= Date.now()) {
      target = new Date(`${year + 1}-11-10T00:00:00+05:30`);
    }
    return target;
  }

  let birthdayTarget = getNextBirthdayTargetIST();

  function updateBirthdayCountdown() {
    // Ensure target stays correct when year rolls
    const next = getNextBirthdayTargetIST();
    if (next.getTime() !== birthdayTarget.getTime()) birthdayTarget = next;

    const diff = birthdayTarget.getTime() - Date.now();
    const total = Math.max(0, diff);

    const secs = Math.floor(total / 1000);
    const days = Math.floor(secs / 86400);
    const hours = Math.floor((secs % 86400) / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    if (cdDays) cdDays.textContent = String(days);
    if (cdHours) cdHours.textContent = String(hours).padStart(2, "0");
    if (cdMins) cdMins.textContent = String(mins).padStart(2, "0");
    if (cdSecs) cdSecs.textContent = String(s).padStart(2, "0");
    if (daysToMini) daysToMini.textContent = String(days);
  }

  updateBirthdayCountdown();
  setInterval(updateBirthdayCountdown, 1000);

  // -----------------------------
  // Tiny prompt widget (Home)
  // -----------------------------
  const prompts = [
    "“You’re allowed to take up space.”",
    "“Pick one thing. Do it properly.”",
    "“Consistency beats intensity (yes, even at the gym).”",
    "“Small progress counts. Don’t bully yourself.”",
    "“Drink water. Then decide.”",
    "“Do it in 10 minutes. Perfect later.”",
    "“Your future self likes clean schedules.”",
    "“Be kind. Be sharp. Be unstoppable.”",
    "“You don’t need permission to be proud.”",
    "“No overthinking today—just one step.”",
    "“If it’s worth doing, it’s worth doing calmly.”"
  ];

  const missions = [
    "Do one small thing with full focus.",
    "Stretch for 3 minutes. Your body will forgive you.",
    "Reply to one message you’ve been postponing.",
    "Clean one tiny area (one drawer counts).",
    "Plan tomorrow’s top 2 tasks. Stop there.",
    "Walk for 8 minutes. No headphones. Just air."
  ];

  const promptText = $("#promptText");
  const tinyMission = $("#tinyMission");
  const newPromptBtn = $("#newPromptBtn");
  const copyPromptBtn = $("#copyPromptBtn");

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function setPrompt() {
    if (promptText) promptText.textContent = randomFrom(prompts);
    if (tinyMission) tinyMission.textContent = randomFrom(missions);
  }

  if (newPromptBtn) newPromptBtn.addEventListener("click", () => {
    // micro animation
    promptText?.classList.add("fade-pop");
    setTimeout(() => promptText?.classList.remove("fade-pop"), 220);
    setPrompt();
  });

  if (copyPromptBtn) copyPromptBtn.addEventListener("click", () => {
    if (!promptText) return;
    copyToClipboard(promptText.textContent.trim());
  });

  setPrompt();

  // Add a tiny CSS class via JS for micro animation (keeps CSS clean)
  const style = document.createElement("style");
  style.textContent = `
    .fade-pop{ animation: fadePop .22s ease both; }
    @keyframes fadePop{ from{ opacity:.35; transform: translateY(6px); } to{ opacity:1; transform: translateY(0);} }
  `;
  document.head.appendChild(style);

  // -----------------------------
  // Boost quotes (internet + fallback)
  // Uses https://api.quotable.io/random?tags=... (CORS-friendly in most browsers)
  // If it fails (offline/local restrictions), fallback list is used.
  // -----------------------------
  const quoteBox = $("#quoteBox");
  const quoteText = $("#quoteText");
  const quoteMeta = $("#quoteMeta");
  const newQuoteBtn = $("#newQuoteBtn");
  const copyQuoteBtn = $("#copyQuoteBtn");

  const offlineQuotes = [
    { q: "Discipline is just kindness to your future self.", a: "offline set" },
    { q: "Focus on what you can control. Let the rest be background noise.", a: "offline set" },
    { q: "Start before you feel ready.", a: "offline set" },
    { q: "You don’t need a new plan. You need a clean next step.", a: "offline set" },
    { q: "Make it simple. Make it repeatable.", a: "offline set" },
    { q: "Done is better than perfect, and calm is better than rushed.", a: "offline set" },
    { q: "Your confidence grows every time you keep a promise to yourself.", a: "offline set" }
  ];

  async function fetchInternetQuote() {
    // Avoid romantic tags; focus on general motivation/productivity.
    const url = "https://api.quotable.io/random?tags=motivational|inspirational|success|wisdom|famous-quotes";
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("quote fetch failed");
    const data = await res.json();
    return { q: data.content, a: data.author || "Unknown", src: "Quotable" };
  }

  function setQuote(q, a, sourceLabel) {
    if (!quoteBox || !quoteText || !quoteMeta) return;
    quoteBox.classList.add("is-changing");
    setTimeout(() => {
      quoteText.textContent = q;
      quoteMeta.textContent = `— ${a}${sourceLabel ? ` • ${sourceLabel}` : ""}`;
      quoteBox.classList.remove("is-changing");
    }, 180);
  }

  async function newQuote() {
    try {
      const it = await fetchInternetQuote();
      setQuote(it.q, it.a, it.src);
    } catch {
      const pick = randomFrom(offlineQuotes);
      setQuote(pick.q, pick.a, "");
    }
  }

  if (newQuoteBtn) newQuoteBtn.addEventListener("click", newQuote);
  if (copyQuoteBtn) copyQuoteBtn.addEventListener("click", () => {
    const txt = `${quoteText?.textContent || ""} ${quoteMeta?.textContent || ""}`.trim();
    if (txt) copyToClipboard(txt);
  });

  newQuote();

  // -----------------------------
  // Countdown list (custom) — localStorage
  // -----------------------------
  const LS_COUNTDOWNS = "kunjus_countdowns_v1";

  const newCdName = $("#newCdName");
  const newCdDate = $("#newCdDate");
  const addCountdownBtn = $("#addCountdownBtn");
  const countdownList = $("#countdownList");
  const clearCountdownsBtn = $("#clearCountdownsBtn");

  function loadCountdowns() {
    try {
      return JSON.parse(localStorage.getItem(LS_COUNTDOWNS) || "[]");
    } catch {
      return [];
    }
  }

  function saveCountdowns(items) {
    localStorage.setItem(LS_COUNTDOWNS, JSON.stringify(items));
  }

  function parseDateToISTTarget(dateStr) {
    // dateStr: YYYY-MM-DD
    // Set target at 00:00 IST for that date
    return new Date(`${dateStr}T00:00:00+05:30`);
  }

  function formatRemaining(ms) {
    const secs = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m`;
  }

  function renderCountdowns() {
    if (!countdownList) return;
    const items = loadCountdowns();

    if (!items.length) {
      countdownList.innerHTML = `<div class="micro-note">No saved countdowns yet. Add one above.</div>`;
      return;
    }

    countdownList.innerHTML = items.map(item => {
      return `
        <div class="cd-item" data-id="${item.id}">
          <div>
            <div class="cd-name">${escapeHTML(item.name)}</div>
            <div class="cd-sub">${escapeHTML(item.date)} • IST midnight</div>
          </div>
          <div class="cd-right">
            <div class="cd-time" data-remaining>—</div>
            <button class="btn btn-mini btn-mini-ghost cd-del" type="button" data-del>Delete</button>
          </div>
        </div>
      `;
    }).join("");

    // Bind delete buttons
    $$("[data-del]", countdownList).forEach(btn => {
      btn.addEventListener("click", (e) => {
        const row = e.currentTarget.closest(".cd-item");
        const id = row?.dataset.id;
        const next = loadCountdowns().filter(x => x.id !== id);
        saveCountdowns(next);
        renderCountdowns();
        toast("Countdown deleted");
      });
    });

    // initial tick
    tickCustomCountdowns();
  }

  function tickCustomCountdowns() {
    if (!countdownList) return;
    const items = loadCountdowns();
    const map = new Map(items.map(i => [i.id, parseDateToISTTarget(i.date)]));
    $$(".cd-item", countdownList).forEach(row => {
      const id = row.dataset.id;
      const target = map.get(id);
      const remEl = $("[data-remaining]", row);
      if (!target || !remEl) return;
      const diff = target.getTime() - Date.now();
      remEl.textContent = diff <= 0 ? "done ✓" : formatRemaining(diff);
    });
  }

  if (addCountdownBtn) addCountdownBtn.addEventListener("click", () => {
    const name = (newCdName?.value || "").trim();
    const date = (newCdDate?.value || "").trim();

    if (!name) return toast("Please enter an event name");
    if (!date) return toast("Please pick a date");

    const items = loadCountdowns();
    items.unshift({ id: cryptoRandomId(), name, date, createdAt: Date.now() });
    saveCountdowns(items);

    newCdName.value = "";
    newCdDate.value = "";
    renderCountdowns();
    toast("Countdown added");
  });

  if (clearCountdownsBtn) clearCountdownsBtn.addEventListener("click", () => {
    localStorage.removeItem(LS_COUNTDOWNS);
    renderCountdowns();
    toast("Saved countdowns cleared");
  });

  renderCountdowns();
  setInterval(tickCustomCountdowns, 30_000);

  // -----------------------------
  // Notes — localStorage (two-way linked)
  // -----------------------------
  const LS_NOTES = "kunjus_notes_v1";

  const segBtns = $$(".seg-btn");
  const primaryLabel = $("#primaryLabel");
  const replyLabel = $("#replyLabel");
  const primaryNote = $("#primaryNote");
  const replyNote = $("#replyNote");
  const addNoteBtn = $("#addNoteBtn");
  const clearNotesBtn = $("#clearNotesBtn");
  const notesList = $("#notesList");
  const notesCount = $("#notesCount");

  let currentAuthor = "kunjus"; // default

  function loadNotes() {
    try {
      return JSON.parse(localStorage.getItem(LS_NOTES) || "[]");
    } catch {
      return [];
    }
  }
  function saveNotes(items) {
    localStorage.setItem(LS_NOTES, JSON.stringify(items));
  }

  function setAuthor(author) {
    currentAuthor = author;
    segBtns.forEach(b => b.classList.toggle("is-active", b.dataset.author === author));
    if (author === "kunjus") {
      primaryLabel.textContent = "Kunjus note";
      replyLabel.textContent = "My reply (optional)";
      primaryNote.placeholder = "Type something small & real…";
      replyNote.placeholder = "Add a reply to link it… (optional)";
    } else {
      primaryLabel.textContent = "My note";
      replyLabel.textContent = "Kunjus reply (optional)";
      primaryNote.placeholder = "Drop a note for her…";
      replyNote.placeholder = "Her reply (optional)";
    }
  }

  segBtns.forEach(b => b.addEventListener("click", () => setAuthor(b.dataset.author)));
  setAuthor("kunjus");

  function renderNotes() {
    if (!notesList || !notesCount) return;
    const items = loadNotes();
    notesCount.textContent = String(items.length);

    if (!items.length) {
      notesList.innerHTML = `<div class="micro-note">No notes yet. Add one on the left.</div>`;
      return;
    }

    notesList.innerHTML = items.map(n => {
      const time = new Date(n.createdAt).toLocaleString("en-IN", { timeZone: IST_TZ, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
      const leftIsKunjus = (n.author === "kunjus");
      const leftTitle = leftIsKunjus ? "Kunjus" : "Me";
      const rightTitle = leftIsKunjus ? "Me" : "Kunjus";

      const leftText = escapeHTML(n.text || "");
      const rightText = escapeHTML(n.reply || "");

      return `
        <div class="note" data-id="${n.id}">
          <div class="note-top">
            <div class="note-time">${time} • IST</div>
            <button class="btn btn-mini btn-mini-ghost note-del" type="button" data-note-del>Delete</button>
          </div>

          <div class="pair">
            <div class="bubble ${leftIsKunjus ? "" : "me"}">
              <div class="bubble-h">${leftTitle}</div>
              <div class="bubble-t">${leftText || "<span style='opacity:.55'>—</span>"}</div>
            </div>
            <div class="bubble ${leftIsKunjus ? "me" : ""}">
              <div class="bubble-h">${rightTitle}</div>
              <div class="bubble-t">${rightText || "<span style='opacity:.55'>—</span>"}</div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    $$("[data-note-del]", notesList).forEach(btn => {
      btn.addEventListener("click", (e) => {
        const row = e.currentTarget.closest(".note");
        const id = row?.dataset.id;
        const next = loadNotes().filter(x => x.id !== id);
        saveNotes(next);
        renderNotes();
        toast("Note deleted");
      });
    });
  }

  if (addNoteBtn) addNoteBtn.addEventListener("click", () => {
    const text = (primaryNote?.value || "").trim();
    const reply = (replyNote?.value || "").trim();

    if (!text) return toast("Write something first");

    const items = loadNotes();
    items.unshift({
      id: cryptoRandomId(),
      author: currentAuthor,
      text,
      reply,
      createdAt: Date.now()
    });
    saveNotes(items);

    primaryNote.value = "";
    replyNote.value = "";
    renderNotes();
    toast("Note added");
  });

  if (clearNotesBtn) clearNotesBtn.addEventListener("click", () => {
    localStorage.removeItem(LS_NOTES);
    renderNotes();
    toast("All notes cleared");
  });

  renderNotes();

  // -----------------------------
  // Playlist modal + localStorage
  // -----------------------------
  const LS_PLAYLIST = "kunjus_playlist_v1";
  const openPlaylistBtn = $("#openPlaylistBtn");
  const playlistModal = $("#playlistModal");
  const playlistInput = $("#playlistInput");
  const savePlaylistBtn = $("#savePlaylistBtn");
  const resetPlaylistBtn = $("#resetPlaylistBtn");
  const ytFrame = $("#ytFrame");

  const DEFAULT_PLAYLIST_ID = "PLoTn6R_eiyqdKUJDcZzNFGvaPPOw3QshW&si=qpOgmABLRrrTmy7-"; // You can replace later

  function extractPlaylistId(str) {
    const s = (str || "").trim();
    if (!s) return "";
    // If direct ID
    if (/^PL[a-zA-Z0-9_-]{10,}$/.test(s)) return s;
    // If URL with list=
    const m = s.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    return s; // last resort
  }

  function setIframePlaylist(id) {
    if (!ytFrame) return;
    const safeId = encodeURIComponent(id);
    // Clean embed URL
    ytFrame.src = `https://www.youtube-nocookie.com/embed/videoseries?list=${safeId}`;
  }

  function loadPlaylistId() {
    return localStorage.getItem(LS_PLAYLIST) || DEFAULT_PLAYLIST_ID;
  }

  function savePlaylistId(id) {
    localStorage.setItem(LS_PLAYLIST, id);
  }

  function openModal() {
    if (!playlistModal) return;
    playlistModal.classList.add("is-open");
    playlistModal.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    if (!playlistModal) return;
    playlistModal.classList.remove("is-open");
    playlistModal.setAttribute("aria-hidden", "true");
  }

  if (openPlaylistBtn) openPlaylistBtn.addEventListener("click", () => {
    const id = loadPlaylistId();
    if (playlistInput) playlistInput.value = id;
    setIframePlaylist(id);
    openModal();
  });

  if (playlistModal) {
    playlistModal.addEventListener("click", (e) => {
      const t = e.target;
      if (t && t.hasAttribute("data-close")) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && playlistModal.classList.contains("is-open")) closeModal();
    });
  }

  if (savePlaylistBtn) savePlaylistBtn.addEventListener("click", () => {
    const raw = playlistInput?.value || "";
    const id = extractPlaylistId(raw);
    if (!id) return toast("Enter a playlist ID or URL");
    savePlaylistId(id);
    setIframePlaylist(id);
    toast("Playlist saved");
  });

  if (resetPlaylistBtn) resetPlaylistBtn.addEventListener("click", () => {
    savePlaylistId(DEFAULT_PLAYLIST_ID);
    if (playlistInput) playlistInput.value = DEFAULT_PLAYLIST_ID;
    setIframePlaylist(DEFAULT_PLAYLIST_ID);
    toast("Playlist reset");
  });

  // -----------------------------
  // Year in footer
  // -----------------------------
  const yearNow = $("#yearNow");
  if (yearNow) yearNow.textContent = String(new Date().getFullYear());

  // -----------------------------
  // Utility
  // -----------------------------
  function escapeHTML(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cryptoRandomId() {
    // Prefer crypto for uniqueness, fallback to timestamp.
    try {
      const a = new Uint8Array(8);
      crypto.getRandomValues(a);
      return [...a].map(x => x.toString(16).padStart(2, "0")).join("");
    } catch {
      return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
    }
  }

})();
