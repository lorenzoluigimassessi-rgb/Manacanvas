// Filters — artist, creature type, card type, mana type, sets (multi), year range, sort, view
const filtersContainer = document.getElementById("filters");

let artistList = [];
let creatureTypeList = [];
let cardTypeList = [];
let setList = [];
let openDropdown = null;
let currentGridSize = "md";
let viewDropdownOpen = false;

const MANA_TYPES = [
  { code: "w", label: "White",      svg: "https://svgs.scryfall.io/card-symbols/W.svg" },
  { code: "u", label: "Blue",       svg: "https://svgs.scryfall.io/card-symbols/U.svg" },
  { code: "b", label: "Black",      svg: "https://svgs.scryfall.io/card-symbols/B.svg" },
  { code: "r", label: "Red",        svg: "https://svgs.scryfall.io/card-symbols/R.svg" },
  { code: "g", label: "Green",      svg: "https://svgs.scryfall.io/card-symbols/G.svg" },
  { code: "m", label: "Multicolor", svg: "https://svgs.scryfall.io/card-symbols/S.svg" },
  { code: "c", label: "Colorless",  svg: "https://svgs.scryfall.io/card-symbols/C.svg" },
];

const ART_STYLES = [
  { name: "Classic",         desc: "Pre-2003 · Origins era",    query: "year<=2003" },
  { name: "Dark & Gritty",   desc: "Innistrad · Horror sets",   query: "(s:isd OR s:soi OR s:emn)" },
  { name: "Epic & Dramatic", desc: "War · Battle sets",         query: "(s:war OR s:znr OR s:bfz)" },
  { name: "Painterly",       desc: "Lorwyn · Eldraine",         query: "(s:lrw OR s:shm OR s:eld)" },
  { name: "Ethereal",        desc: "Theros · Mystical",         query: "(s:thb OR s:ths OR s:bng)" },
  { name: "Sketch",          desc: "Sketch frame cards",        query: "frame:sketch" },
  { name: "Modern",          desc: "2020 onwards",              query: "year>=2020" },
  { name: "Iconic Creatures",desc: "Dragons · Angels · Demons", query: "(t:dragon OR t:angel OR t:demon)" },
];

async function initFilters() {
  // Mobile: single filters button
  if (isMobile()) {
    filtersContainer.innerHTML = `
      <button class="filter-btn mobile-filters-btn" id="mobileFiltersBtn" onclick="openDrawer()"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="5" cy="3" r="2" fill="var(--bg)" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="8" r="2" fill="var(--bg)" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="13" x2="15" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="7" cy="13" r="2" fill="var(--bg)" stroke="currentColor" stroke-width="1.5"/></svg> Filters</button>
      <button class="mobile-clear-btn" id="mobileClearBtn" style="display:none;" onclick="clearAllFilters()">Clear</button>
    `;
    document.getElementById("row2Right").innerHTML = `
      <button class="filter-btn" id="viewBtn"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/></svg> View</button>
      <button class="filter-btn" id="sortBtn">Random ⇅</button>
      <button class="shuffle-again-btn" id="shuffleAgainBtn" onclick="shuffleAgain()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> Shuffle</button>
    `;
    document.getElementById("sortBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleSort(); });
    document.getElementById("viewBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleViewDropdown(); });
    [artistList, creatureTypeList, cardTypeList] = await Promise.all([fetchArtistNames(), fetchCreatureTypes(), fetchCardTypes()]);
    loadSetsIfNeeded(); // background, don't await
    document.addEventListener("click", () => { closeViewDropdown(); closeSortDropdown(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeViewDropdown(); closeSortDropdown(); } });
    return;
  }

  // Desktop: full filter row
  filtersContainer.innerHTML = `
    <button class="filter-btn" id="artistBtn">All Artists ▾</button>
    <button class="filter-btn" id="setBtn">All Sets ▾</button>
    <button class="filter-btn" id="styleBtn">Art Style ▾</button>
    <button class="filter-btn" id="typeBtn">Creature Type ▾</button>
    <button class="filter-btn more-filters-btn" id="moreBtn"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;vertical-align:middle"><line x1="1" y1="3" x2="15" y2="3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="5" cy="3" r="2" fill="var(--bg)" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="10" cy="8" r="2" fill="var(--bg)" stroke="currentColor" stroke-width="1.5"/><line x1="1" y1="13" x2="15" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="7" cy="13" r="2" fill="var(--bg)" stroke="currentColor" stroke-width="1.5"/></svg> Filters</button>
  `;

  document.getElementById("row2Right").innerHTML = `
    <button class="filter-btn" id="viewBtn">⊞ View ▾</button>
    <button class="filter-btn" id="sortBtn">Random ⇅</button>
    <button class="shuffle-again-btn" id="shuffleAgainBtn" onclick="shuffleAgain()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> Shuffle</button>
  `;

  document.getElementById("artistBtn").addEventListener("click",   (e) => { e.stopPropagation(); toggleDropdown("artist"); });
  document.getElementById("typeBtn").addEventListener("click",     (e) => { e.stopPropagation(); toggleDropdown("type"); });
  document.getElementById("setBtn").addEventListener("click",      (e) => { e.stopPropagation(); toggleDropdown("set"); });
  document.getElementById("styleBtn").addEventListener("click",    (e) => { e.stopPropagation(); toggleDropdown("style"); });
  document.getElementById("moreBtn").addEventListener("click",     (e) => { e.stopPropagation(); closeDropdown(); closeViewDropdown(); closeSortDropdown(); openMoreModal(); });
  document.getElementById("sortBtn").addEventListener("click",     (e) => { e.stopPropagation(); toggleSort(); });
  document.getElementById("viewBtn").addEventListener("click",     (e) => { e.stopPropagation(); toggleViewDropdown(); });

  [artistList, creatureTypeList, cardTypeList] = await Promise.all([
    fetchArtistNames(),
    fetchCreatureTypes(),
    fetchCardTypes(),
  ]);

  document.addEventListener("click", () => { closeDropdown(); closeViewDropdown(); closeSortDropdown(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDropdown(); closeViewDropdown(); closeSortDropdown(); } });
}

async function loadSetsIfNeeded() {
  if (setList.length) return;
  try {
    const res = await fetch("https://api.scryfall.com/sets");
    const json = await res.json();
    setList = (json.data || [])
      .filter(s => s.set_type === "expansion" || s.set_type === "core" || s.set_type === "draft_innovation")
      .map(s => ({ code: s.code, name: s.name, icon: s.icon_svg_uri }));
  } catch (e) { setList = []; }
}

// More Filters Modal
let modalCardType = [];
let modalColour = [];
let modalYearMin = null;
let modalYearMax = null;

function openMoreModal() {
  modalCardType = [...activeCardType];
  modalColour   = [...activeColour];
  modalYearMin  = activeYearMin;
  modalYearMax  = activeYearMax;

  const minY = 1993, maxY = new Date().getFullYear();
  const curMin = modalYearMin || minY;
  const curMax = modalYearMax || maxY;

  document.getElementById("moreModalBody").innerHTML = `
    <div class="more-section">
      <div class="more-section-label">Card Type</div>
      <div class="more-pill-row" id="modalCardTypePills"></div>
    </div>
    <div class="more-section">
      <div class="more-section-label">Mana Type</div>
      <div class="more-pill-row" id="modalManaPills"></div>
    </div>
    <div class="more-section">
      <div class="more-section-label">Year Range</div>
      <div class="more-year-row">
        <span>From</span>
        <input type="range" id="modalYearMin" min="${minY}" max="${maxY}" value="${curMin}" style="flex:1;accent-color:var(--text-primary);">
        <span id="modalYearMinVal">${curMin}</span>
      </div>
      <div class="more-year-row">
        <span>To</span>
        <input type="range" id="modalYearMax" min="${minY}" max="${maxY}" value="${curMax}" style="flex:1;accent-color:var(--text-primary);">
        <span id="modalYearMaxVal">${curMax}</span>
      </div>
    </div>
  `;

  // Card type pills
  const ctPills = document.getElementById("modalCardTypePills");
  ctPills.innerHTML = cardTypeList.map(t =>
    `<div class="more-pill ${modalCardType.includes(t) ? 'active' : ''}" data-val="${t}">${t}</div>`
  ).join("");
  ctPills.querySelectorAll(".more-pill").forEach(el => el.addEventListener("click", () => {
    const idx = modalCardType.indexOf(el.dataset.val);
    if (idx === -1) modalCardType.push(el.dataset.val); else modalCardType.splice(idx, 1);
    ctPills.querySelectorAll(".more-pill").forEach(p => p.classList.toggle("active", modalCardType.includes(p.dataset.val)));
    updateModalClearState();
  }));

  // Mana pills
  const manaPills = document.getElementById("modalManaPills");
  manaPills.innerHTML = MANA_TYPES.map(m =>
    `<div class="more-pill ${modalColour.includes(m.code) ? 'active' : ''}" data-code="${m.code}">
      <img src="${m.svg}" style="width:15px;height:15px;vertical-align:middle;"> ${m.label}
    </div>`
  ).join("");
  manaPills.querySelectorAll(".more-pill").forEach(el => el.addEventListener("click", () => {
    const idx = modalColour.indexOf(el.dataset.code);
    if (idx === -1) modalColour.push(el.dataset.code); else modalColour.splice(idx, 1);
    manaPills.querySelectorAll(".more-pill").forEach(p => p.classList.toggle("active", modalColour.includes(p.dataset.code)));
    updateModalClearState();
  }));

  // Year sliders
  document.getElementById("modalYearMin").addEventListener("input", (e) => {
    if (parseInt(e.target.value) > parseInt(document.getElementById("modalYearMax").value))
      e.target.value = document.getElementById("modalYearMax").value;
    document.getElementById("modalYearMinVal").textContent = e.target.value;
  });
  document.getElementById("modalYearMax").addEventListener("input", (e) => {
    if (parseInt(e.target.value) < parseInt(document.getElementById("modalYearMin").value))
      e.target.value = document.getElementById("modalYearMin").value;
    document.getElementById("modalYearMaxVal").textContent = e.target.value;
  });

  document.getElementById("moreModalOverlay").style.display = "block";
  document.getElementById("moreModal").style.display = "flex";
  document.addEventListener("keydown", handleMoreModalKey);
  updateModalClearState();
}

function closeMoreModal() {
  document.getElementById("moreModalOverlay").style.display = "none";
  document.getElementById("moreModal").style.display = "none";
  document.removeEventListener("keydown", handleMoreModalKey);
}

function applyMoreModal() {
  activeCardType = modalCardType;
  activeColour   = modalColour;
  const min = parseInt(document.getElementById("modalYearMin")?.value || 1993);
  const max = parseInt(document.getElementById("modalYearMax")?.value || new Date().getFullYear());
  activeYearMin = min > 1993 ? min : null;
  activeYearMax = max < new Date().getFullYear() ? max : null;
  closeMoreModal();
  updateMoreBadge();
  updateChips();
  loadInitialGrid();
}

function clearMoreFilters() {
  modalCardType = [];
  modalColour   = [];
  modalYearMin  = null;
  modalYearMax  = null;
  document.querySelectorAll("#modalCardTypePills .more-pill, #modalManaPills .more-pill").forEach(p => p.classList.remove("active"));
  const minY = 1993, maxY = new Date().getFullYear();
  const minEl = document.getElementById("modalYearMin");
  const maxEl = document.getElementById("modalYearMax");
  if (minEl) { minEl.value = minY; document.getElementById("modalYearMinVal").textContent = minY; }
  if (maxEl) { maxEl.value = maxY; document.getElementById("modalYearMaxVal").textContent = maxY; }
  updateModalClearState();
}

function updateModalClearState() {
  const clearEl = document.querySelector('.more-modal-clear');
  if (!clearEl) return;
  const hasFilters = modalCardType.length || modalColour.length || modalYearMin || modalYearMax;
  clearEl.style.opacity = hasFilters ? '1' : '0.3';
  clearEl.style.pointerEvents = hasFilters ? 'auto' : 'none';
}

function handleMoreModalKey(e) {
  if (e.key === "Escape") closeMoreModal();
}

function updateMoreBadge() {
  const btn = document.getElementById("moreBtn");
  if (!btn) return;
  const count = activeCardType.length + activeColour.length +
    (activeYearMin || activeYearMax ? 1 : 0);
  const existing = btn.querySelector(".more-badge");
  if (count > 0) {
    if (existing) existing.textContent = count;
    else btn.insertAdjacentHTML("beforeend", `<span class="more-badge">${count}</span>`);
  } else {
    if (existing) existing.remove();
  }
}
let sortDropdownOpen = false;

function toggleSort() {
  if (sortDropdownOpen) { closeSortDropdown(); return; }
  closeDropdown();
  closeViewDropdown();
  closeSortDropdown();
  sortDropdownOpen = true;
  const btn = document.getElementById("sortBtn");
  const dropdown = document.createElement("div");
  dropdown.className = "view-dropdown";
  dropdown.id = "sortDropdown";
  dropdown.style.right = 'auto';
  dropdown.style.left = '0';
  dropdown.addEventListener("click", (e) => e.stopPropagation());
  dropdown.innerHTML = SORT_OPTIONS.map((opt, i) => `
    <div class="view-dropdown-item ${sortOrder === opt.order && sortDir === opt.dir ? 'active' : ''}" data-idx="${i}">
      ${opt.label}
    </div>
  `).join("");
  btn.style.position = 'relative';
  btn.appendChild(dropdown);
  dropdown.querySelectorAll(".view-dropdown-item").forEach(el => {
    el.addEventListener("click", () => {
      const opt = SORT_OPTIONS[parseInt(el.dataset.idx)];
      sortOrder = opt.order;
      sortDir = opt.dir;
      document.getElementById("sortBtn").textContent = `${opt.label} ⇅`;
      closeSortDropdown();
      window.scrollTo(0, 0);
      loadInitialGrid();
    });
  });
}

function closeSortDropdown() {
  sortDropdownOpen = false;
  const existing = document.getElementById("sortDropdown");
  if (existing) existing.remove();
}

function shuffleAgain() {
  sortOrder = "random";
  sortDir = "auto";
  const sortBtn = document.getElementById("sortBtn");
  if (sortBtn) sortBtn.textContent = "Random ⇅";
  window.scrollTo(0, 0);
  loadInitialGrid();
}

// View dropdown
function toggleViewDropdown() {
  if (viewDropdownOpen) { closeViewDropdown(); return; }
  closeDropdown();
  closeSortDropdown();
  viewDropdownOpen = true;
  const btn = document.getElementById("viewBtn");
  const dropdown = document.createElement("div");
  dropdown.className = "view-dropdown";
  dropdown.id = "viewDropdown";
  dropdown.style.right = 'auto';
  dropdown.style.left = '0';
  dropdown.addEventListener("click", (e) => e.stopPropagation());
  dropdown.innerHTML = `
    <div class="view-dropdown-item ${currentGridSize === 'sm' ? 'active' : ''}" onclick="setGridSize('sm')">Small Grid</div>
    <div class="view-dropdown-item ${currentGridSize === 'md' ? 'active' : ''}" onclick="setGridSize('md')">Medium Grid</div>
    <div class="view-dropdown-item ${currentGridSize === 'lg' ? 'active' : ''}" onclick="setGridSize('lg')">Large Grid</div>
  `;
  btn.style.position = 'relative';
  btn.appendChild(dropdown);
}

function closeViewDropdown() {
  viewDropdownOpen = false;
  const existing = document.getElementById("viewDropdown");
  if (existing) existing.remove();
}

function setGridSize(size) {
  currentGridSize = size;
  const g = document.getElementById("grid");
  g.classList.remove("grid-sm", "grid-md", "grid-lg");
  if (size !== 'md') g.classList.add(`grid-${size}`);
  closeViewDropdown();
}

// Filter dropdowns
function toggleDropdown(type) {
  if (openDropdown === type) { closeDropdown(); return; }
  closeDropdown();
  closeViewDropdown();
  closeSortDropdown();
  openDropdown = type;

  const btnMap = {
    artist: "artistBtn", type: "typeBtn", cardType: "cardTypeBtn",
    mana: "manaBtn", style: "styleBtn", set: "setBtn", year: "yearBtn"
  };
  const triggerBtn = document.getElementById(btnMap[type]);
  triggerBtn.style.position = "relative";

  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";
  dropdown.id = "activeDropdown";
  dropdown.addEventListener("click", (e) => e.stopPropagation());

  if (type === "artist") {
    dropdown.innerHTML = `<input type="text" placeholder="Search artists..." id="artistSearch"><div class="dropdown-list" id="artistList"></div>`;
    triggerBtn.appendChild(dropdown);
    renderArtistList("");
    document.getElementById("artistSearch").addEventListener("input", (e) => renderArtistList(e.target.value));
    document.getElementById("artistSearch").focus();

  } else if (type === "type") {
    dropdown.innerHTML = `<input type="text" placeholder="Search creature types..." id="typeSearch"><div class="dropdown-list" id="typeList"></div>`;
    triggerBtn.appendChild(dropdown);
    renderTypeList("");
    document.getElementById("typeSearch").addEventListener("input", (e) => renderTypeList(e.target.value));
    document.getElementById("typeSearch").focus();

  } else if (type === "cardType") {
    dropdown.innerHTML = `<div class="dropdown-list" id="cardTypeList"></div>`;
    triggerBtn.appendChild(dropdown);
    renderCardTypeList();

  } else if (type === "mana") {
    dropdown.innerHTML = `<div class="mana-picker" id="manaPicker"></div>`;
    triggerBtn.appendChild(dropdown);
    renderManaPicker();

  } else if (type === "style") {
    dropdown.innerHTML = `<div class="style-grid" id="styleGrid"></div>`;
    triggerBtn.appendChild(dropdown);
    renderStyleGrid();

  } else if (type === "set") {
    dropdown.innerHTML = `<input type="text" placeholder="Search sets..." id="setSearch"><div class="dropdown-list" id="setListEl"><div class="dropdown-item" style="cursor:default;">Loading sets...</div></div>`;
    triggerBtn.appendChild(dropdown);
    loadSetsIfNeeded().then(() => {
      renderSetList("");
      document.getElementById("setSearch").addEventListener("input", (e) => renderSetList(e.target.value));
    });
    document.getElementById("setSearch").focus();

  } else if (type === "year") {
    const minY = 1993;
    const maxY = new Date().getFullYear();
    const curMin = activeYearMin || minY;
    const curMax = activeYearMax || maxY;
    dropdown.innerHTML = `
      <div style="padding:0.8rem;">
        <div style="font-size:0.85rem;color:var(--text-primary);margin-bottom:0.6rem;">Year Range</div>
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">
          <span style="font-size:0.8rem;color:var(--text-secondary);">From</span>
          <input type="range" id="yearMinSlider" min="${minY}" max="${maxY}" value="${curMin}" style="flex:1;">
          <span id="yearMinVal" style="font-size:0.8rem;min-width:35px;">${curMin}</span>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.6rem;">
          <span style="font-size:0.8rem;color:var(--text-secondary);">To</span>
          <input type="range" id="yearMaxSlider" min="${minY}" max="${maxY}" value="${curMax}" style="flex:1;margin-left:0.35rem;">
          <span id="yearMaxVal" style="font-size:0.8rem;min-width:35px;">${curMax}</span>
        </div>
        <button class="filter-btn" id="applyYear" style="width:100%;text-align:center;">Apply</button>
      </div>
    `;
    triggerBtn.appendChild(dropdown);
    const minSlider = document.getElementById("yearMinSlider");
    const maxSlider = document.getElementById("yearMaxSlider");
    minSlider.addEventListener("input", () => {
      if (parseInt(minSlider.value) > parseInt(maxSlider.value)) minSlider.value = maxSlider.value;
      document.getElementById("yearMinVal").textContent = minSlider.value;
    });
    maxSlider.addEventListener("input", () => {
      if (parseInt(maxSlider.value) < parseInt(minSlider.value)) maxSlider.value = minSlider.value;
      document.getElementById("yearMaxVal").textContent = maxSlider.value;
    });
    document.getElementById("applyYear").addEventListener("click", () => {
      const min = parseInt(minSlider.value);
      const max = parseInt(maxSlider.value);
      activeYearMin = min > 1993 ? min : null;
      activeYearMax = max < new Date().getFullYear() ? max : null;
      closeDropdown();
      if (activeYearMin || activeYearMax) {
        document.getElementById("yearBtn").textContent = `${activeYearMin || 1993}–${activeYearMax || new Date().getFullYear()}`;
        document.getElementById("yearBtn").classList.add("active");
      } else {
        document.getElementById("yearBtn").textContent = "Year Range ▾";
        document.getElementById("yearBtn").classList.remove("active");
      }
      updateChips();
      loadInitialGrid();
    });
  }
}

// Render functions
function renderArtistList(query) {
  const list = document.getElementById("artistList");
  if (!list) return;
  const q = query.toLowerCase();
  const filtered = q ? artistList.filter(a => a.toLowerCase().includes(q)) : artistList;
  if (!filtered.length) { list.innerHTML = `<div class="dropdown-item" style="cursor:default;">No artists found</div>`; return; }
  list.innerHTML = "";
  renderDropdownChunk(list, filtered, 0, 20, (val) => toggleArtist(val), q, false);
}

function renderTypeList(query = "") {
  const list = document.getElementById("typeList");
  if (!list) return;
  const q = query.toLowerCase();
  const filtered = q ? creatureTypeList.filter(t => t.toLowerCase().includes(q)) : creatureTypeList;
  if (!filtered.length) { list.innerHTML = `<div class="dropdown-item" style="cursor:default;">No types found</div>`; return; }
  list.innerHTML = "";
  renderDropdownChunk(list, filtered, 0, 20, (val) => toggleType(val), q, false);
}

function renderCardTypeList() {
  const list = document.getElementById("cardTypeList");
  if (!list) return;
  list.innerHTML = "";
  renderDropdownChunk(list, cardTypeList, 0, 20, (val) => toggleCardType(val), "", false);
}

function renderManaPicker() {
  const picker = document.getElementById("manaPicker");
  picker.innerHTML = MANA_TYPES.map(m => `
    <div class="mana-option ${activeColour.includes(m.code) ? 'active' : ''}" data-code="${m.code}" data-label="${m.label}">
      <span class="dropdown-checkbox">${activeColour.includes(m.code) ? "<svg width='10' height='10' viewBox='0 0 10 10'><polyline points='1.5,5 4,7.5 8.5,2' stroke='currentColor' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>" : ""}</span>
      <img class="mana-symbol" src="${m.svg}" alt="${m.label}">
      <span class="mana-label">${m.label}</span>
    </div>
  `).join("");
  picker.querySelectorAll(".mana-option").forEach(el => {
    el.addEventListener("click", () => {
      toggleColour(el.dataset.code);
      renderManaPicker();
      const btn = document.getElementById("manaBtn");
      if (btn) {
        if (activeColour.length === 0) btn.textContent = "Mana Type ▾";
        else if (activeColour.length === 1) {
          const m = MANA_TYPES.find(m => m.code === activeColour[0]);
          btn.innerHTML = `<img class="mana-symbol-btn" src="${m.svg}" alt="${m.label}"> ${m.label} ▾`;
        } else btn.textContent = `Mana (${activeColour.length}) ▾`;
        btn.classList.toggle("active", activeColour.length > 0);
      }
      loadInitialGrid();
    });
  });
}

function renderStyleGrid() {
  const grid = document.getElementById("styleGrid");
  grid.innerHTML = ART_STYLES.map((s, i) => `
    <div class="style-pill ${activeStyles.includes(i) ? 'active' : ''}" data-idx="${i}">
      <div class="style-info">
        <span class="style-name">${s.name}</span>
        <span class="style-desc">${s.desc}</span>
      </div>
      <span class="style-check">✓</span>
    </div>
  `).join("");
  grid.querySelectorAll(".style-pill").forEach(pill => {
    pill.addEventListener("click", () => toggleStyle(parseInt(pill.dataset.idx)));
  });
}

function renderSetList(query) {
  const list = document.getElementById("setListEl");
  if (!list) return;
  const q = query.toLowerCase();
  const filtered = q ? setList.filter(s => s.name.toLowerCase().includes(q)) : setList;
  if (!filtered.length) { list.innerHTML = `<div class="dropdown-item" style="cursor:default;">No sets found</div>`; return; }
  list.innerHTML = "";
  renderDropdownChunk(list, filtered, 0, 20, (val) => {
    const s = setList.find(s => s.code === val);
    if (s) toggleSetSelection(s.code, s.name);
  }, q, true);
}

function renderDropdownChunk(list, items, start, chunkSize, onSelect, q, isSet, skipSort) {
  if (!skipSort && start === 0) {
    const getVal = item => isSet ? item.code : item;
    const isItemActive = val => isSet ? activeSets.includes(val) : (activeArtist.includes(val) || activeType.includes(val));
    const selected = items.filter(item => isItemActive(getVal(item)));
    const rest = items.filter(item => !isItemActive(getVal(item)));
    if (selected.length) {
      selected.forEach(item => appendDropdownItem(list, item, isSet, onSelect, q));
      const divider = document.createElement("div");
      divider.className = "dropdown-divider";
      list.appendChild(divider);
    }
    renderDropdownChunk(list, rest, 0, chunkSize, onSelect, q, isSet, true);
    return;
  }
  const chunk = items.slice(start, start + chunkSize);
  chunk.forEach(item => appendDropdownItem(list, item, isSet, onSelect, q));
  if (start + chunkSize < items.length) {
    const sentinel = document.createElement("div");
    sentinel.style.height = "1px";
    list.appendChild(sentinel);
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        sentinel.remove();
        renderDropdownChunk(list, items, start + chunkSize, chunkSize, onSelect, q, isSet, true);
      }
    }, { root: list, rootMargin: "40px" });
    observer.observe(sentinel);
  }
}

function appendDropdownItem(list, item, isSet, onSelect, q) {
  const val = isSet ? item.code : item;
  const label = isSet ? item.name : item;
  const isActive = isSet ? activeSets.includes(val) : (activeArtist.includes(val) || activeType.includes(val));
  const el = document.createElement("div");
  el.className = "dropdown-item" + (isActive ? " selected" : "");
  el.dataset.value = val;
  const iconHtml = isSet ? `<img class="set-icon" src="${item.icon}" alt="">` : "";
  el.innerHTML = `<span class="dropdown-checkbox">${isActive ? "<svg width='10' height='10' viewBox='0 0 10 10'><polyline points='1.5,5 4,7.5 8.5,2' stroke='currentColor' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>" : ""}</span>${iconHtml}<span>${highlightMatch(label, q)}</span>`;
  el.addEventListener("click", () => onSelect(val));
  list.appendChild(el);
}

// Select / clear handlers
function toggleArtist(name) {
  const idx = activeArtist.indexOf(name);
  if (idx === -1) activeArtist.push(name); else activeArtist.splice(idx, 1);
  const btn = document.getElementById("artistBtn");
  if (btn) {
    btn.textContent = activeArtist.length === 0 ? "All Artists ▾" : activeArtist.length === 1 ? `${activeArtist[0]} ▾` : `Artists (${activeArtist.length}) ▾`;
    btn.classList.toggle("active", activeArtist.length > 0);
  }
  updateChips(); loadInitialGrid();
}

function toggleType(type) {
  const idx = activeType.indexOf(type);
  if (idx === -1) activeType.push(type); else activeType.splice(idx, 1);
  const btn = document.getElementById("typeBtn");
  if (btn) {
    btn.textContent = activeType.length === 0 ? "Creature Type ▾" : activeType.length === 1 ? `${activeType[0]} ▾` : `Creatures (${activeType.length}) ▾`;
    btn.classList.toggle("active", activeType.length > 0);
  }
  updateChips(); loadInitialGrid();
}

function toggleCardType(type) {
  const idx = activeCardType.indexOf(type);
  if (idx === -1) activeCardType.push(type); else activeCardType.splice(idx, 1);
  updateMoreBadge(); updateChips();
}

function toggleColour(code) {
  const idx = activeColour.indexOf(code);
  if (idx === -1) activeColour.push(code); else activeColour.splice(idx, 1);
  updateMoreBadge(); updateChips();
}

function toggleSetSelection(code, name) {
  const idx = activeSets.indexOf(code);
  if (idx === -1) { activeSets.push(code); } else { activeSets.splice(idx, 1); }
  const query = document.getElementById("setSearch")?.value || "";
  renderSetList(query);
  if (activeSets.length === 0) {
    document.getElementById("setBtn").textContent = "All Sets ▾";
    document.getElementById("setBtn").classList.remove("active");
  } else if (activeSets.length === 1) {
    const s = setList.find(s => s.code === activeSets[0]);
    document.getElementById("setBtn").textContent = s ? s.name : "1 Set";
    document.getElementById("setBtn").classList.add("active");
  } else {
    document.getElementById("setBtn").textContent = `Sets (${activeSets.length}) ▾`;
    document.getElementById("setBtn").classList.add("active");
  }
  updateChips();
  loadInitialGrid();
}

function clearArtist() {
  activeArtist = [];
  const btn = document.getElementById("artistBtn");
  if (btn) { btn.textContent = "All Artists ▾"; btn.classList.remove("active"); }
  updateChips(); loadInitialGrid();
}

function clearType() {
  activeType = [];
  const btn = document.getElementById("typeBtn");
  if (btn) { btn.textContent = "Creature Type ▾"; btn.classList.remove("active"); }
  updateChips(); loadInitialGrid();
}

function clearCardType() {
  activeCardType = [];
  updateMoreBadge(); updateChips(); loadInitialGrid();
}

function clearColour() {
  activeColour = [];
  updateMoreBadge(); updateChips(); loadInitialGrid();
}

function toggleStyle(idx) {
  const i = activeStyles.indexOf(idx);
  if (i === -1) { activeStyles.push(idx); } else { activeStyles.splice(i, 1); }
  // Re-render pills to update checkmarks
  renderStyleGrid();
  // Update button label
  const btn = document.getElementById("styleBtn");
  if (activeStyles.length === 0) {
    btn.textContent = "Art Style ▾";
    btn.classList.remove("active");
  } else if (activeStyles.length === 1) {
    btn.textContent = ART_STYLES[activeStyles[0]].name + " ▾";
    btn.classList.add("active");
  } else {
    btn.textContent = `Style (${activeStyles.length}) ▾`;
    btn.classList.add("active");
  }
  updateChips();
  loadInitialGrid();
}

function clearSingleStyle(idx) {
  activeStyles = activeStyles.filter(i => i !== idx);
  const btn = document.getElementById("styleBtn");
  if (activeStyles.length === 0) {
    btn.textContent = "Art Style ▾";
    btn.classList.remove("active");
  } else if (activeStyles.length === 1) {
    btn.textContent = ART_STYLES[activeStyles[0]].name + " ▾";
  } else {
    btn.textContent = `Style (${activeStyles.length}) ▾`;
  }
  updateChips(); loadInitialGrid();
}

function clearSingleSet(code) {
  activeSets = activeSets.filter(s => s !== code);
  if (activeSets.length === 0) {
    document.getElementById("setBtn").textContent = "All Sets ▾";
    document.getElementById("setBtn").classList.remove("active");
  } else if (activeSets.length === 1) {
    const s = setList.find(s => s.code === activeSets[0]);
    document.getElementById("setBtn").textContent = s ? s.name : "1 Set";
  } else {
    document.getElementById("setBtn").textContent = `Sets (${activeSets.length}) ▾`;
  }
  updateChips(); loadInitialGrid();
}

function clearAllSets() {
  activeSets = [];
  document.getElementById("setBtn").textContent = "All Sets ▾";
  document.getElementById("setBtn").classList.remove("active");
  updateChips(); loadInitialGrid();
}

function clearYear() {
  activeYearMin = null;
  activeYearMax = null;
  document.getElementById("yearBtn").textContent = "Year Range ▾";
  document.getElementById("yearBtn").classList.remove("active");
  updateChips(); loadInitialGrid();
}

function updateChips() {
  const chipBar = document.getElementById("chipBar");
  const chipList = document.getElementById("chipList");
  const clearBtn = document.getElementById("clearFiltersBtn");
  if (!chipBar || !chipList) { updateMoreBadge(); return; }

  const chips = [];

  activeArtist.forEach(a => chips.push({
    icon: "", label: a,
    clear: () => { activeArtist = activeArtist.filter(x => x !== a); const btn = document.getElementById("artistBtn"); if (btn) { btn.textContent = activeArtist.length === 0 ? "All Artists \u25be" : activeArtist.length === 1 ? `${activeArtist[0]} \u25be` : `Artists (${activeArtist.length}) \u25be`; btn.classList.toggle("active", activeArtist.length > 0); } updateChips(); loadInitialGrid(); }
  }));

  activeType.forEach(t => chips.push({
    icon: "", label: t,
    clear: () => { activeType = activeType.filter(x => x !== t); const btn = document.getElementById("typeBtn"); if (btn) { btn.textContent = activeType.length === 0 ? "Creature Type \u25be" : activeType.length === 1 ? `${activeType[0]} \u25be` : `Creatures (${activeType.length}) \u25be`; btn.classList.toggle("active", activeType.length > 0); } updateChips(); loadInitialGrid(); }
  }));

  activeSets.forEach(code => {
    const s = setList.find(s => s.code === code);
    chips.push({
      icon: s ? `<img src="${s.icon}" style="width:13px;height:13px;filter:brightness(0) invert(0.8);flex-shrink:0;">` : "",
      label: s ? s.name : code,
      clear: () => { activeSets = activeSets.filter(x => x !== code); const btn = document.getElementById("setBtn"); if (btn) { btn.textContent = activeSets.length === 0 ? "All Sets \u25be" : activeSets.length === 1 ? (setList.find(s=>s.code===activeSets[0])?.name||"1 Set") : `Sets (${activeSets.length}) \u25be`; btn.classList.toggle("active", activeSets.length > 0); } updateChips(); loadInitialGrid(); }
    });
  });

  activeStyles.forEach(idx => chips.push({
    icon: "", label: ART_STYLES[idx].name,
    clear: () => { activeStyles = activeStyles.filter(x => x !== idx); const btn = document.getElementById("styleBtn"); if (btn) { btn.textContent = activeStyles.length === 0 ? "Art Style \u25be" : activeStyles.length === 1 ? ART_STYLES[activeStyles[0]].name + " \u25be" : `Style (${activeStyles.length}) \u25be`; btn.classList.toggle("active", activeStyles.length > 0); } updateChips(); loadInitialGrid(); }
  }));

  activeCardType.forEach(t => chips.push({
    icon: "", label: t,
    clear: () => { activeCardType = activeCardType.filter(x => x !== t); updateMoreBadge(); updateChips(); loadInitialGrid(); }
  }));

  activeColour.forEach(code => {
    const m = MANA_TYPES.find(m => m.code === code);
    chips.push({
      icon: m ? `<img src="${m.svg}" style="width:13px;height:13px;flex-shrink:0;">` : "",
      label: m ? m.label : code,
      clear: () => { activeColour = activeColour.filter(x => x !== code); updateMoreBadge(); updateChips(); loadInitialGrid(); }
    });
  });

  if (activeYearMin || activeYearMax)
    chips.push({ icon: "", label: `${activeYearMin || 1993}\u2013${activeYearMax || new Date().getFullYear()}`, clear: () => { activeYearMin = null; activeYearMax = null; updateMoreBadge(); updateChips(); loadInitialGrid(); } });

  if (activeSearch)
    chips.push({ icon: "", label: `"${activeSearch}"`, clear: () => { activeSearch = null; const sb = document.getElementById("searchBar"); if (sb) sb.value = ""; const sc = document.getElementById("searchClear"); if (sc) sc.style.display = "none"; updateChips(); loadInitialGrid(); } });

  const hasFilters = chips.length > 0;

  // Clear all — row-2, next to filter buttons
  // Clear all — row-2, desktop only, next to filter buttons
  if (clearBtn) clearBtn.style.display = (!isMobile() && hasFilters) ? "inline-flex" : "none";

  // Chip bar — row-3, desktop only
  chipBar.style.display = (!isMobile() && hasFilters) ? "flex" : "none";

  // Mobile inline clear — next to Filters button
  const mobileClear = document.getElementById("mobileClearBtn");
  if (mobileClear) mobileClear.style.display = (isMobile() && hasFilters) ? "inline-flex" : "none";

  // Remove any leftover desktop badge
  const badge = document.getElementById("desktopFilterBadge");
  if (badge) badge.remove();

  chipList.innerHTML = "";
  chips.forEach(chip => {
    const el = document.createElement("div");
    el.className = "filter-chip";
    el.innerHTML = `${chip.icon}<span>${chip.label}</span><span class="chip-remove" title="Remove"><svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="1" y1="1" x2="7" y2="7"/><line x1="7" y1="1" x2="1" y2="7"/></svg></span>`;
    el.querySelector(".chip-remove").addEventListener("click", chip.clear);
    chipList.appendChild(el);
  });

  updateMoreBadge();
  updateDrawerBadge(hasFilters ? chips.length : 0);
}

function updateDesktopBadge(count) {
  if (isMobile()) return;
  let badge = document.getElementById("desktopFilterBadge");
  if (count > 0) {
    if (!badge) {
      badge = document.createElement("span");
      badge.id = "desktopFilterBadge";
      badge.className = "mobile-badge";
      badge.style.marginLeft = "0.4rem";
      const filtersEl = document.getElementById("filters");
      if (filtersEl) filtersEl.appendChild(badge);
    }
    badge.textContent = count;
  } else {
    if (badge) badge.remove();
  }
}

function closeDropdown() {
  openDropdown = null;
  const existing = document.getElementById("activeDropdown");
  if (existing) existing.remove();
}

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return text.slice(0, idx) + `<strong style="color:var(--text-primary)">${text.slice(idx, idx + query.length)}</strong>` + text.slice(idx + query.length);
}

// Search bar
let searchTimeout = null;

function initSearch() {
  const input = document.getElementById("searchBar");
  const clearBtn = document.getElementById("searchClear");
  let highlightedIdx = -1;

  input.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    highlightedIdx = -1;
    clearBtn.style.display = input.value ? "block" : "none";
    searchTimeout = setTimeout(() => {
      const val = input.value.trim();
      if (val.length >= 2) showSearchSuggestions(val);
      else hideSearchSuggestions();
    }, 200);
  });

  input.addEventListener("keydown", (e) => {
    const items = document.querySelectorAll(".suggestion-item");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlightedIdx = Math.min(highlightedIdx + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle("highlighted", i === highlightedIdx));
      if (items[highlightedIdx]) input.value = items[highlightedIdx].dataset.label;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlightedIdx = Math.max(highlightedIdx - 1, -1);
      items.forEach((el, i) => el.classList.toggle("highlighted", i === highlightedIdx));
      if (highlightedIdx === -1) input.value = input.dataset.query || "";
      else if (items[highlightedIdx]) input.value = items[highlightedIdx].dataset.label;
    } else if (e.key === "Enter") {
      if (highlightedIdx >= 0 && items[highlightedIdx]) {
        items[highlightedIdx].dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      } else {
        hideSearchSuggestions();
        activeSearch = input.value.trim() || null;
        loadInitialGrid();
        updateChips();
      }
    } else if (e.key === "Escape") {
      hideSearchSuggestions();
      input.blur();
    }
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.style.display = "none";
    activeSearch = null;
    hideSearchSuggestions();
    updateChips();
    loadInitialGrid();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container")) hideSearchSuggestions();
  });
}

async function showSearchSuggestions(query) {
  const container = document.getElementById("searchSuggestions");
  const input = document.getElementById("searchBar");
  input.dataset.query = query;
  const q = query.toLowerCase();
  const suggestions = [];

  artistList.filter(a => a.toLowerCase().includes(q)).slice(0, 3)
    .forEach(a => suggestions.push({ label: a, tag: "Artist", action: () => { toggleArtist(a); input.value = a; input.dataset.query = a; updateChips(); } }));
  creatureTypeList.filter(t => t.toLowerCase().includes(q)).slice(0, 2)
    .forEach(t => suggestions.push({ label: t, tag: "Creature", action: () => { toggleType(t); input.value = t; input.dataset.query = t; updateChips(); } }));
  cardTypeList.filter(t => t.toLowerCase().includes(q)).slice(0, 2)
    .forEach(t => suggestions.push({ label: t, tag: "Type", action: () => { toggleCardType(t); input.value = t; input.dataset.query = t; updateMoreBadge(); updateChips(); loadInitialGrid(); } }));
  setList.filter(s => s.name.toLowerCase().includes(q)).slice(0, 3)
    .forEach(s => suggestions.push({ label: s.name, tag: "Set", action: () => { if (!activeSets.includes(s.code)) activeSets.push(s.code); input.value = s.name; input.dataset.query = s.name; updateChips(); loadInitialGrid(); } }));

  suggestions.push({ label: `Search "${query}"`, tag: "Card", action: () => { activeSearch = query; input.value = query; hideSearchSuggestions(); loadInitialGrid(); updateChips(); } });

  try {
    const res = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    (json.data || []).slice(0, 4).forEach(name => {
      suggestions.splice(suggestions.length - 1, 0, { label: name, tag: "Card", action: () => { input.value = name; activeSearch = name; hideSearchSuggestions(); loadInitialGrid(); updateChips(); } });
    });
  } catch (e) { /* ignore */ }

  if (!suggestions.length) { hideSearchSuggestions(); return; }

  container.innerHTML = suggestions.map((s, i) => `
    <div class="suggestion-item" data-idx="${i}" data-label="${s.label.replace(/"/g, '&quot;')}">
      <span class="suggestion-label">${highlightSuggestion(s.label, q)}</span>
      <span class="suggestion-tag tag-${s.tag.toLowerCase()}">${s.tag}</span>
    </div>
  `).join("");
  container.style.display = "block";

  // mousedown fires before blur — prevents suggestions closing before click registers
  container.querySelectorAll(".suggestion-item").forEach((el, i) => {
    el.addEventListener("mousedown", (e) => { e.preventDefault(); suggestions[i].action(); hideSearchSuggestions(); });
    el.addEventListener("touchend", (e) => { e.preventDefault(); suggestions[i].action(); hideSearchSuggestions(); });
  });
}

function highlightSuggestion(text, query) {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return text.slice(0, idx) + `<strong>${text.slice(idx, idx + query.length)}</strong>` + text.slice(idx + query.length);
}

function hideSearchSuggestions() {
  const container = document.getElementById("searchSuggestions");
  if (container) container.style.display = "none";
}

// Mobile flat sheet
function isMobile() { return window.innerWidth <= 768; }

function initDrawer() {
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  // Swipe down to close — only from handle
  const handle = document.querySelector(".drawer-handle");
  const drawer = document.getElementById("drawer");
  let touchStartY = 0;
  let touchCurrentY = 0;

  document.getElementById("drawer").addEventListener("touchstart", (e) => {
    // Only initiate swipe if touch starts on handle or drawer-header
    const target = e.target;
    if (!target.closest(".drawer-handle") && !target.closest(".drawer-header")) return;
    touchStartY = e.touches[0].clientY;
    touchCurrentY = touchStartY;
    drawer.style.transition = "none";
  }, { passive: true });

  document.getElementById("drawer").addEventListener("touchmove", (e) => {
    if (!touchStartY) return;
    touchCurrentY = e.touches[0].clientY;
    const delta = touchCurrentY - touchStartY;
    if (delta > 0) drawer.style.transform = `translateY(${delta}px)`;
  }, { passive: true });

  document.getElementById("drawer").addEventListener("touchend", () => {
    if (!touchStartY) return;
    drawer.style.transition = "";
    const delta = touchCurrentY - touchStartY;
    if (delta > 80) {
      closeDrawer();
    } else {
      drawer.style.transform = "";
    }
    touchStartY = 0;
    touchCurrentY = 0;
  });

  // Re-init filters when crossing the mobile breakpoint
  let wasMobile = isMobile();
  window.addEventListener("resize", () => {
    const nowMobile = isMobile();
    if (nowMobile !== wasMobile) {
      wasMobile = nowMobile;
      closeDrawer();
      initFilters();
    }
  });
}

function openDrawer() {
  document.getElementById("drawerOverlay").style.display = "block";
  document.getElementById("drawer").classList.add("open");
  document.body.style.overflow = "hidden";
  renderFlatSheet();
}

function closeDrawer() {
  const drawer = document.getElementById("drawer");
  drawer.style.transform = "";
  drawer.style.transition = "";
  drawer.classList.remove("open");
  document.getElementById("drawerOverlay").style.display = "none";
  document.body.style.overflow = "";
}

function applySheet() {
  // Read year sliders if present
  const minSlider = document.getElementById("sheetYearMin");
  const maxSlider = document.getElementById("sheetYearMax");
  if (minSlider && maxSlider) {
    const min = parseInt(minSlider.value);
    const max = parseInt(maxSlider.value);
    activeYearMin = min > 1993 ? min : null;
    activeYearMax = max < new Date().getFullYear() ? max : null;
  }
  updateChips();
  loadInitialGrid();
  closeDrawer();
}

function renderFlatSheet() {
  const minY = 1993, maxY = new Date().getFullYear();
  const curMin = activeYearMin || minY, curMax = activeYearMax || maxY;

  // Active count for badge
  const activeCount = activeArtist.length + activeType.length + activeCardType.length +
    activeColour.length + activeStyles.length + activeSets.length +
    (activeYearMin || activeYearMax ? 1 : 0);
  updateDrawerBadge(activeCount);

  document.getElementById("drawerBody").innerHTML = `

    <div class="sheet-section">
      <div class="sheet-section-label">Artist</div>
      <input class="sheet-input" id="sheetArtistInput" placeholder="Search artists..." value="${activeArtist || ''}" autocomplete="off">
      <div class="sheet-list" id="sheetArtistList"></div>
    </div>

    <div class="sheet-section">
      <div class="sheet-section-label">Sets</div>
      <input class="sheet-input" id="sheetSetInput" placeholder="Search sets..." autocomplete="off">
      <div class="sheet-list" id="sheetSetList"><div class="sheet-list-item" style="opacity:0.5;">Loading...</div></div>
    </div>

    <div class="sheet-section">
      <div class="sheet-section-label">Art Style</div>
      <div class="sheet-style-grid" id="sheetStyleGrid"></div>
    </div>

    <div class="sheet-section">
      <div class="sheet-section-label">Creature Type</div>
      <input class="sheet-input" id="sheetTypeInput" placeholder="Search creature types..." value="${activeType || ''}" autocomplete="off">
      <div class="sheet-list" id="sheetTypeList"></div>
    </div>

    <div class="sheet-section">
      <div class="sheet-section-label">Mana Type</div>
      <div class="sheet-pill-row" id="sheetManaPills"></div>
    </div>

    <div class="sheet-section">
      <div class="sheet-section-label">Card Type</div>
      <div class="sheet-pill-row" id="sheetCardTypePills"></div>
    </div>

    <div class="sheet-section">
      <div class="sheet-section-label">Year Range</div>
      <div class="sheet-year-row">
        <span>From</span>
        <input type="range" id="sheetYearMin" min="${minY}" max="${maxY}" value="${curMin}" style="flex:1;accent-color:var(--text-primary);">
        <span id="sheetYearMinVal">${curMin}</span>
      </div>
      <div class="sheet-year-row">
        <span>To</span>
        <input type="range" id="sheetYearMax" min="${minY}" max="${maxY}" value="${curMax}" style="flex:1;accent-color:var(--text-primary);">
        <span id="sheetYearMaxVal">${curMax}</span>
      </div>
    </div>
  `;

  // Artist search
  const artistInput = document.getElementById("sheetArtistInput");
  const showArtist = () => renderSheetArtistList(artistInput.value, true);
  artistInput.addEventListener("focus", showArtist);
  artistInput.addEventListener("click", showArtist);
  artistInput.addEventListener("input", (e) => renderSheetArtistList(e.target.value, true));
  artistInput.addEventListener("blur", () => setTimeout(() => {
    const list = document.getElementById("sheetArtistList");
    if (list) list.style.display = "none";
  }, 200));

  // Card type pills
  const ctPills = document.getElementById("sheetCardTypePills");
  ctPills.innerHTML = cardTypeList.map(t =>
    `<div class="sheet-pill ${activeCardType.includes(t) ? 'active' : ''}" data-val="${t}">${t}</div>`
  ).join("");
  ctPills.querySelectorAll(".sheet-pill").forEach(el => el.addEventListener("click", () => {
    const idx = activeCardType.indexOf(el.dataset.val);
    if (idx === -1) activeCardType.push(el.dataset.val); else activeCardType.splice(idx, 1);
    ctPills.querySelectorAll(".sheet-pill").forEach(p => p.classList.toggle("active", activeCardType.includes(p.dataset.val)));
  }));

  // Creature type search
  const typeInput = document.getElementById("sheetTypeInput");
  const showType = () => renderSheetTypeList(typeInput.value, true);
  typeInput.addEventListener("focus", showType);
  typeInput.addEventListener("click", showType);
  typeInput.addEventListener("input", (e) => renderSheetTypeList(e.target.value, true));
  typeInput.addEventListener("blur", () => setTimeout(() => {
    typeFocused = false;
    const list = document.getElementById("sheetTypeList");
    if (list) list.style.display = "none";
  }, 200));

  // Mana pills
  const manaPills = document.getElementById("sheetManaPills");
  manaPills.innerHTML = MANA_TYPES.map(m =>
    `<div class="sheet-pill ${activeColour.includes(m.code) ? 'active' : ''}" data-code="${m.code}">
      <img src="${m.svg}" style="width:16px;height:16px;"> ${m.label}
    </div>`
  ).join("");
  manaPills.querySelectorAll(".sheet-pill").forEach(el => el.addEventListener("click", () => {
    const idx = activeColour.indexOf(el.dataset.code);
    if (idx === -1) activeColour.push(el.dataset.code); else activeColour.splice(idx, 1);
    manaPills.querySelectorAll(".sheet-pill").forEach(p => p.classList.toggle("active", activeColour.includes(p.dataset.code)));
  }));

  // Sets — show on focus/click
  loadSetsIfNeeded().then(() => {
    renderSheetSetList("", false);
    const setInput = document.getElementById("sheetSetInput");
    const showSets = () => renderSheetSetList(setInput.value, true);
    setInput.addEventListener("focus", showSets);
    setInput.addEventListener("click", showSets);
    setInput.addEventListener("input", (e) => renderSheetSetList(e.target.value, true));
    setInput.addEventListener("blur", () => setTimeout(() => {
      const list = document.getElementById("sheetSetList");
      if (list) list.style.display = "none";
    }, 200));
  });

  // Art style grid
  renderSheetStyleGrid();

  // Year sliders
  document.getElementById("sheetYearMin").addEventListener("input", (e) => {
    if (parseInt(e.target.value) > parseInt(document.getElementById("sheetYearMax").value))
      e.target.value = document.getElementById("sheetYearMax").value;
    document.getElementById("sheetYearMinVal").textContent = e.target.value;
  });
  document.getElementById("sheetYearMax").addEventListener("input", (e) => {
    if (parseInt(e.target.value) < parseInt(document.getElementById("sheetYearMin").value))
      e.target.value = document.getElementById("sheetYearMin").value;
    document.getElementById("sheetYearMaxVal").textContent = e.target.value;
  });
}

function renderSheetArtistList(query, show = false) {
  const list = document.getElementById("sheetArtistList");
  if (!list) return;
  if (!show) { list.style.display = "none"; return; }
  const q = query.toLowerCase();
  const filtered = q ? artistList.filter(a => a.toLowerCase().includes(q)) : artistList;
  list.style.display = filtered.length ? "block" : "none";
  list.innerHTML = "";
  renderSheetListChunk(list, filtered, 0, 20, (val) => {
    const idx = activeArtist.indexOf(val);
    if (idx === -1) activeArtist.push(val); else activeArtist.splice(idx, 1);
    const input = document.getElementById("sheetArtistInput");
    if (input) input.value = activeArtist.length === 1 ? activeArtist[0] : activeArtist.length > 1 ? `${activeArtist.length} artists` : "";
    renderSheetArtistList(input?.value || "", true);
  }, q, false);
}

function renderSheetTypeList(query, show = false) {
  const list = document.getElementById("sheetTypeList");
  if (!list) return;
  if (!show) { list.style.display = "none"; return; }
  const q = query.toLowerCase();
  const filtered = q ? creatureTypeList.filter(t => t.toLowerCase().includes(q)) : creatureTypeList;
  list.style.display = filtered.length ? "block" : "none";
  list.innerHTML = "";
  renderSheetListChunk(list, filtered, 0, 20, (val) => {
    const idx = activeType.indexOf(val);
    if (idx === -1) activeType.push(val); else activeType.splice(idx, 1);
    const input = document.getElementById("sheetTypeInput");
    if (input) input.value = activeType.length === 1 ? activeType[0] : activeType.length > 1 ? `${activeType.length} types` : "";
    renderSheetTypeList(input?.value || "", true);
  }, q, false);
}

function renderSheetSetList(query, show = true) {
  const list = document.getElementById("sheetSetList");
  if (!list) return;
  if (!show) { list.style.display = "none"; list.innerHTML = ""; return; }
  const q = query.toLowerCase();
  const filtered = q ? setList.filter(s => s.name.toLowerCase().includes(q)) : setList;
  list.style.display = filtered.length ? "block" : "none";
  list.innerHTML = "";
  renderSheetListChunk(list, filtered, 0, 20, (val) => {
    const idx = activeSets.indexOf(val);
    if (idx === -1) activeSets.push(val); else activeSets.splice(idx, 1);
    renderSheetSetList(document.getElementById("sheetSetInput")?.value || "", true);
  }, q, true);
}

function renderSheetListChunk(list, items, start, chunkSize, onSelect, q, isSet, skipSort) {
  if (!skipSort && start === 0) {
    const getVal = item => isSet ? item.code : item;
    const isItemActive = val => isSet ? activeSets.includes(val) : (activeArtist.includes(val) || activeType.includes(val));
    const selected = items.filter(item => isItemActive(getVal(item)));
    const rest = items.filter(item => !isItemActive(getVal(item)));
    if (selected.length) {
      selected.forEach(item => appendSheetItem(list, item, isSet, onSelect, q));
      const divider = document.createElement("div");
      divider.className = "dropdown-divider";
      list.appendChild(divider);
    }
    renderSheetListChunk(list, rest, 0, chunkSize, onSelect, q, isSet, true);
    return;
  }
  const chunk = items.slice(start, start + chunkSize);
  chunk.forEach(item => appendSheetItem(list, item, isSet, onSelect, q));
  if (start + chunkSize < items.length) {
    const sentinel = document.createElement("div");
    sentinel.style.height = "1px";
    list.appendChild(sentinel);
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        sentinel.remove();
        renderSheetListChunk(list, items, start + chunkSize, chunkSize, onSelect, q, isSet, true);
      }
    }, { rootMargin: "40px" });
    observer.observe(sentinel);
  }
}

function appendSheetItem(list, item, isSet, onSelect, q) {
  const val = isSet ? item.code : item;
  const label = isSet ? item.name : item;
  const isActive = isSet ? activeSets.includes(val) : (activeArtist.includes(val) || activeType.includes(val));
  const el = document.createElement("div");
  el.className = "sheet-list-item" + (isActive ? " selected" : "");
  el.dataset.val = val;
  const iconHtml = isSet ? `<img class="set-icon" src="${item.icon}" alt="">` : "";
  el.innerHTML = `<span class="dropdown-checkbox">${isActive ? "<svg width='10' height='10' viewBox='0 0 10 10'><polyline points='1.5,5 4,7.5 8.5,2' stroke='currentColor' stroke-width='1.8' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>" : ""}</span>${iconHtml}<span>${highlightMatch(label, q)}</span>`;
  el.addEventListener("click", () => onSelect(val));
  list.appendChild(el);
}

function renderSheetStyleGrid() {
  const grid = document.getElementById("sheetStyleGrid");
  if (!grid) return;
  grid.innerHTML = ART_STYLES.map((s, i) => `
    <div class="sheet-style-pill ${activeStyles.includes(i) ? 'active' : ''}" data-idx="${i}">
      <span class="style-name">${s.name}</span>
      <span class="style-check">✓</span>
    </div>
  `).join("");
  grid.querySelectorAll(".sheet-style-pill").forEach(pill => pill.addEventListener("click", () => {
    const i = parseInt(pill.dataset.idx);
    const idx = activeStyles.indexOf(i);
    if (idx === -1) activeStyles.push(i); else activeStyles.splice(idx, 1);
    pill.classList.toggle("active");
  }));
}

function updateDrawerBadge(count) {
  const btn = document.getElementById("mobileFiltersBtn");
  if (!btn) return;
  const badge = btn.querySelector(".mobile-badge");
  if (count > 0) {
    if (badge) badge.textContent = count;
    else btn.insertAdjacentHTML("beforeend", `<span class="mobile-badge">${count}</span>`);
    btn.classList.add("active");
  } else {
    if (badge) badge.remove();
    btn.classList.remove("active");
  }
}

// Full state reset — called when returning to welcome page
function resetAllState() {
  activeArtist = []; activeType = []; activeCardType = [];
  activeColour = []; activeSets = []; activeStyles = [];
  activeYearMin = null; activeYearMax = null; activeSearch = null;
  sortOrder = "random";
  sortDir = "auto";

  // Reset search bar UI
  const searchBar = document.getElementById('searchBar');
  const searchClear = document.getElementById('searchClear');
  if (searchBar) searchBar.value = '';
  if (searchClear) searchClear.style.display = 'none';

  // Reset filter button labels
  const resets = [
    ['artistBtn', 'All Artists ▾'],
    ['typeBtn',   'Creature Type ▾'],
    ['setBtn',    'All Sets ▾'],
    ['styleBtn',  'Art Style ▾'],
    ['sortBtn',   'Random ⇅'],
  ];
  resets.forEach(([id, label]) => {
    const btn = document.getElementById(id);
    if (btn) { btn.textContent = label; btn.classList.remove('active'); }
  });

  updateChips();
}

function syncFilterUI() {
  if (isMobile()) return; // mobile uses chips + drawer badge, no persistent button labels

  const sortBtn = document.getElementById('sortBtn');
  if (sortBtn) {
    const opt = SORT_OPTIONS.find(o => o.order === sortOrder && o.dir === sortDir);
    if (opt) sortBtn.textContent = `${opt.label} ⇅`;
  }

  const artistBtn = document.getElementById('artistBtn');
  if (artistBtn && activeArtist.length) {
    artistBtn.textContent = activeArtist.length === 1 ? `${activeArtist[0]} ▾` : `Artists (${activeArtist.length}) ▾`;
    artistBtn.classList.add('active');
  }

  const typeBtn = document.getElementById('typeBtn');
  if (typeBtn && activeType.length) {
    typeBtn.textContent = activeType.length === 1 ? `${activeType[0]} ▾` : `Creatures (${activeType.length}) ▾`;
    typeBtn.classList.add('active');
  }

  const setBtn = document.getElementById('setBtn');
  if (setBtn && activeSets.length) {
    loadSetsIfNeeded().then(() => {
      const s = setList.find(s => s.code === activeSets[0]);
      setBtn.textContent = activeSets.length === 1 ? (s?.name || '1 Set') + ' ▾' : `Sets (${activeSets.length}) ▾`;
      setBtn.classList.add('active');
    });
  }

  const styleBtn = document.getElementById('styleBtn');
  if (styleBtn && activeStyles.length) {
    styleBtn.textContent = activeStyles.length === 1 ? ART_STYLES[activeStyles[0]].name + ' ▾' : `Style (${activeStyles.length}) ▾`;
    styleBtn.classList.add('active');
  }

  updateMoreBadge();
}

function clearAllFilters() {
  activeArtist = []; activeType = []; activeCardType = [];
  activeColour = []; activeSets = []; activeStyles = [];
  activeYearMin = null; activeYearMax = null; activeSearch = null;

  // Close any open dropdown
  closeDropdown();

  // Reset desktop filter button labels and active states
  if (!isMobile()) {
    const resets = [
      ["artistBtn",   "All Artists ▾"],
      ["typeBtn",     "Creature Type ▾"],
      ["setBtn",      "All Sets ▾"],
      ["styleBtn",    "Art Style ▾"],
    ];
    resets.forEach(([id, label]) => {
      const btn = document.getElementById(id);
      if (btn) { btn.textContent = label; btn.classList.remove("active"); btn.style.position = ""; }
    });
    // Mana button
    const manaBtn = document.getElementById("manaBtn");
    if (manaBtn) { manaBtn.textContent = "Mana Type ▾"; manaBtn.classList.remove("active"); manaBtn.style.position = ""; }
    // Remove desktop badge
    const badge = document.getElementById("desktopFilterBadge");
    if (badge) badge.remove();
  }

  // Clear search bar UI
  const searchBar = document.getElementById("searchBar");
  const searchClear = document.getElementById("searchClear");
  if (searchBar) searchBar.value = "";
  if (searchClear) searchClear.style.display = "none";
  hideSearchSuggestions();
  localStorage.removeItem("mc_filters");
  updateChips();
  loadInitialGrid();
  closeDrawer();
}

// Init
initFilters().then(() => {
  restoreFilters();
  syncFilterUI();
  updateChips();
});
initSearch();
initDrawer();
