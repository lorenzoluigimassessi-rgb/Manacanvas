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
    `;
    document.getElementById("row2Right").innerHTML = `
      <button class="filter-btn" id="viewBtn">⊞ View ▾</button>
      <button class="filter-btn" id="sortBtn">Shuffle ⇅</button>
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
    <button class="filter-btn" id="cardTypeBtn">Card Type ▾</button>
    <button class="filter-btn" id="typeBtn">Creature Type ▾</button>
    <button class="filter-btn" id="manaBtn">Mana Type ▾</button>
    <button class="filter-btn" id="setBtn">All Sets ▾</button>
    <button class="filter-btn" id="styleBtn">Art Style ▾</button>
    <button class="filter-btn" id="yearBtn">Year Range ▾</button>
  `;

  document.getElementById("row2Right").innerHTML = `
    <button class="filter-btn" id="viewBtn">⊞ View ▾</button>
    <button class="filter-btn" id="sortBtn">Shuffle ⇅</button>
    <button class="shuffle-again-btn" id="shuffleAgainBtn" onclick="shuffleAgain()"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> Shuffle</button>
  `;

  document.getElementById("artistBtn").addEventListener("click",   (e) => { e.stopPropagation(); toggleDropdown("artist"); });
  document.getElementById("typeBtn").addEventListener("click",     (e) => { e.stopPropagation(); toggleDropdown("type"); });
  document.getElementById("cardTypeBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleDropdown("cardType"); });
  document.getElementById("manaBtn").addEventListener("click",     (e) => { e.stopPropagation(); toggleDropdown("mana"); });
  document.getElementById("styleBtn").addEventListener("click",    (e) => { e.stopPropagation(); toggleDropdown("style"); });
  document.getElementById("setBtn").addEventListener("click",      (e) => { e.stopPropagation(); toggleDropdown("set"); });
  document.getElementById("yearBtn").addEventListener("click",     (e) => { e.stopPropagation(); toggleDropdown("year"); });
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

// Sort dropdown
let sortDropdownOpen = false;

function toggleSort() {
  if (sortDropdownOpen) { closeSortDropdown(); return; }
  closeSortDropdown();
  sortDropdownOpen = true;
  const container = document.getElementById("row2Right");
  const dropdown = document.createElement("div");
  dropdown.className = "view-dropdown";
  dropdown.id = "sortDropdown";
  dropdown.addEventListener("click", (e) => e.stopPropagation());
  dropdown.innerHTML = SORT_OPTIONS.map((opt, i) => `
    <div class="view-dropdown-item ${sortOrder === opt.order && sortDir === opt.dir ? 'active' : ''}" data-idx="${i}">
      ${opt.label}${sortOrder === opt.order && sortDir === opt.dir ? ' ✓' : ''}
    </div>
  `).join("");
  container.appendChild(dropdown);
  dropdown.querySelectorAll(".view-dropdown-item").forEach(el => {
    el.addEventListener("click", () => {
      const opt = SORT_OPTIONS[parseInt(el.dataset.idx)];
      sortOrder = opt.order;
      sortDir = opt.dir;
      document.getElementById("sortBtn").textContent = `${opt.label} ⇅`;
      closeSortDropdown();
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
  if (sortBtn) sortBtn.textContent = "Shuffle ⇅";
  loadInitialGrid();
}

// View dropdown
function toggleViewDropdown() {
  if (viewDropdownOpen) { closeViewDropdown(); return; }
  closeDropdown();
  viewDropdownOpen = true;
  const container = document.getElementById("row2Right");
  const dropdown = document.createElement("div");
  dropdown.className = "view-dropdown";
  dropdown.id = "viewDropdown";
  dropdown.addEventListener("click", (e) => e.stopPropagation());
  dropdown.innerHTML = `
    <div class="view-dropdown-item ${currentGridSize === 'sm' ? 'active' : ''}" onclick="setGridSize('sm')">Small Grid</div>
    <div class="view-dropdown-item ${currentGridSize === 'md' ? 'active' : ''}" onclick="setGridSize('md')">Medium Grid</div>
    <div class="view-dropdown-item ${currentGridSize === 'lg' ? 'active' : ''}" onclick="setGridSize('lg')">Large Grid</div>
  `;
  container.appendChild(dropdown);
}

function closeViewDropdown() {
  viewDropdownOpen = false;
  const existing = document.getElementById("viewDropdown");
  if (existing) existing.remove();
}

function setGridSize(size) {
  currentGridSize = size;
  const grid = document.getElementById("grid");
  grid.classList.remove("grid-sm", "grid-md", "grid-lg");
  grid.classList.add(`grid-${size}`);
  closeViewDropdown();
}

// Filter dropdowns
function toggleDropdown(type) {
  if (openDropdown === type) { closeDropdown(); return; }
  closeDropdown();
  closeViewDropdown();
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
  renderDropdownChunk(list, filtered, 0, 20, (val) => selectArtist(val), q, false);
}

function renderTypeList(query = "") {
  const list = document.getElementById("typeList");
  if (!list) return;
  const q = query.toLowerCase();
  const filtered = q ? creatureTypeList.filter(t => t.toLowerCase().includes(q)) : creatureTypeList;
  if (!filtered.length) { list.innerHTML = `<div class="dropdown-item" style="cursor:default;">No types found</div>`; return; }
  list.innerHTML = "";
  renderDropdownChunk(list, filtered, 0, 20, (val) => selectType(val), q, false);
}

function renderCardTypeList() {
  const list = document.getElementById("cardTypeList");
  if (!list) return;
  list.innerHTML = "";
  renderDropdownChunk(list, cardTypeList, 0, 20, (val) => selectCardType(val), "", false);
}

function renderManaPicker() {
  const picker = document.getElementById("manaPicker");
  picker.innerHTML = MANA_TYPES.map(m => `
    <div class="mana-option ${activeColour === m.code ? 'active' : ''}" data-code="${m.code}" data-label="${m.label}">
      <img class="mana-symbol" src="${m.svg}" alt="${m.label}">
      <span class="mana-label">${m.label}</span>
    </div>
  `).join("");
  picker.querySelectorAll(".mana-option").forEach(el => {
    el.addEventListener("click", () => selectMana(el.dataset.code, el.dataset.label));
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

function renderDropdownChunk(list, items, start, chunkSize, onSelect, q, isSet) {
  const chunk = items.slice(start, start + chunkSize);
  chunk.forEach(item => {
    const val = isSet ? item.code : item;
    const label = isSet ? item.name : item;
    const el = document.createElement("div");
    el.className = isSet
      ? `dropdown-item set-item${activeSets.includes(val) ? ' selected' : ''}`
      : "dropdown-item";
    el.dataset.value = val;
    if (isSet) {
      el.innerHTML = `<input type="checkbox" class="set-checkbox" ${activeSets.includes(val) ? 'checked' : ''} onclick="event.stopPropagation()"><img class="set-icon" src="${item.icon}" alt="">${highlightMatch(label, q)}`;
    } else {
      el.innerHTML = highlightMatch(label, q);
    }
    el.addEventListener("click", () => onSelect(val));
    list.appendChild(el);
  });
  if (start + chunkSize < items.length) {
    const sentinel = document.createElement("div");
    sentinel.style.height = "1px";
    list.appendChild(sentinel);
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        sentinel.remove();
        renderDropdownChunk(list, items, start + chunkSize, chunkSize, onSelect, q, isSet);
      }
    }, { root: list, rootMargin: "40px" });
    observer.observe(sentinel);
  }
}

// Select / clear handlers
function selectArtist(name) {
  activeArtist = name;
  closeDropdown();
  document.getElementById("artistBtn").textContent = name;
  document.getElementById("artistBtn").classList.add("active");
  updateChips();
  loadInitialGrid();
}

function selectType(type) {
  activeType = type;
  closeDropdown();
  document.getElementById("typeBtn").textContent = type;
  document.getElementById("typeBtn").classList.add("active");
  updateChips();
  loadInitialGrid();
}

function selectCardType(type) {
  activeCardType = type;
  closeDropdown();
  document.getElementById("cardTypeBtn").textContent = type;
  document.getElementById("cardTypeBtn").classList.add("active");
  updateChips();
  loadInitialGrid();
}

function selectMana(code, label) {
  if (activeColour === code) { clearMana(); return; }
  activeColour = code;
  closeDropdown();
  const mana = MANA_TYPES.find(m => m.code === code);
  const btn = document.getElementById("manaBtn");
  btn.innerHTML = `<img class="mana-symbol-btn" src="${mana.svg}" alt="${mana.label}"> ${mana.label} ▾`;
  btn.classList.add("active");
  updateChips();
  loadInitialGrid();
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
  activeArtist = null;
  document.getElementById("artistBtn").textContent = "All Artists ▾";
  document.getElementById("artistBtn").classList.remove("active");
  updateChips(); loadInitialGrid();
}

function clearType() {
  activeType = null;
  document.getElementById("typeBtn").textContent = "Creature Type ▾";
  document.getElementById("typeBtn").classList.remove("active");
  updateChips(); loadInitialGrid();
}

function clearCardType() {
  activeCardType = null;
  document.getElementById("cardTypeBtn").textContent = "Card Type ▾";
  document.getElementById("cardTypeBtn").classList.remove("active");
  updateChips(); loadInitialGrid();
}

function clearMana() {
  activeColour = null;
  document.getElementById("manaBtn").textContent = "Mana Type ▾";
  document.getElementById("manaBtn").classList.remove("active");
  updateChips(); loadInitialGrid();
}

let activeStyles = [];

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
  const activeCount = [activeArtist, activeType, activeCardType, activeColour]
    .filter(Boolean).length + activeStyles.length + activeSets.length +
    (activeYearMin || activeYearMax ? 1 : 0);

  // Clear button — show when any filter OR search is active
  const clearBtn = document.getElementById("clearFiltersBtn");
  if (clearBtn) clearBtn.style.display = (activeCount > 0 || activeSearch) ? "inline-flex" : "none";

  // Desktop: update count badge on filter area
  updateDesktopBadge(activeCount);

  // Mobile: update drawer badge
  updateDrawerBadge(activeCount);
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

  input.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    clearBtn.style.display = input.value ? "block" : "none";
    searchTimeout = setTimeout(() => {
      const val = input.value.trim();
      if (val.length >= 2) showSearchSuggestions(val);
      else hideSearchSuggestions();
    }, 200);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { hideSearchSuggestions(); activeSearch = input.value.trim() || null; loadInitialGrid(); updateChips(); }
    if (e.key === "Escape") { hideSearchSuggestions(); input.blur(); }
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
  const q = query.toLowerCase();
  const suggestions = [];

  artistList.filter(a => a.toLowerCase().includes(q)).slice(0, 3)
    .forEach(a => suggestions.push({ label: a, tag: "Artist", action: () => selectArtist(a) }));
  creatureTypeList.filter(t => t.toLowerCase().includes(q)).slice(0, 2)
    .forEach(t => suggestions.push({ label: t, tag: "Creature", action: () => selectType(t) }));
  cardTypeList.filter(t => t.toLowerCase().includes(q)).slice(0, 2)
    .forEach(t => suggestions.push({ label: t, tag: "Type", action: () => selectCardType(t) }));
  setList.filter(s => s.name.toLowerCase().includes(q)).slice(0, 3)
    .forEach(s => suggestions.push({ label: s.name, tag: "Set", action: () => { activeSets = [s.code]; toggleSetSelection(s.code, s.name); } }));

  suggestions.push({ label: `Search "${query}"`, tag: "Card", action: () => { activeSearch = query; hideSearchSuggestions(); loadInitialGrid(); } });

  try {
    const res = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    (json.data || []).slice(0, 4).forEach(name => {
      suggestions.splice(suggestions.length - 1, 0, { label: name, tag: "Card", action: () => { document.getElementById("searchBar").value = name; activeSearch = name; hideSearchSuggestions(); loadInitialGrid(); } });
    });
  } catch (e) { /* ignore */ }

  if (!suggestions.length) { hideSearchSuggestions(); return; }

  container.innerHTML = suggestions.map((s, i) => `
    <div class="suggestion-item" data-idx="${i}">
      <span class="suggestion-label">${highlightSuggestion(s.label, q)}</span>
      <span class="suggestion-tag tag-${s.tag.toLowerCase()}">${s.tag}</span>
    </div>
  `).join("");
  container.style.display = "block";

  container.querySelectorAll(".suggestion-item").forEach((el, i) => {
    el.addEventListener("click", (e) => { e.stopPropagation(); suggestions[i].action(); hideSearchSuggestions(); });
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
  const activeCount = [activeArtist, activeType, activeCardType, activeColour]
    .filter(Boolean).length + activeStyles.length + activeSets.length +
    (activeYearMin || activeYearMax ? 1 : 0);
  updateDrawerBadge(activeCount);

  document.getElementById("drawerBody").innerHTML = `

    <div class="sheet-section">
      <div class="sheet-section-label">Artist</div>
      <input class="sheet-input" id="sheetArtistInput" placeholder="Search artists..." value="${activeArtist || ''}" autocomplete="off">
      <div class="sheet-list" id="sheetArtistList"></div>
    </div>

    <div class="sheet-section">
      <div class="sheet-section-label">Card Type</div>
      <div class="sheet-pill-row" id="sheetCardTypePills"></div>
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
      <div class="sheet-section-label">Sets</div>
      <input class="sheet-input" id="sheetSetInput" placeholder="Search sets..." autocomplete="off">
      <div class="sheet-list" id="sheetSetList"><div class="sheet-list-item" style="opacity:0.5;">Loading...</div></div>
    </div>

    <div class="sheet-section">
      <div class="sheet-section-label">Art Style</div>
      <div class="sheet-style-grid" id="sheetStyleGrid"></div>
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
    `<div class="sheet-pill ${activeCardType === t ? 'active' : ''}" data-val="${t}">${t}</div>`
  ).join("");
  ctPills.querySelectorAll(".sheet-pill").forEach(el => el.addEventListener("click", () => {
    activeCardType = activeCardType === el.dataset.val ? null : el.dataset.val;
    ctPills.querySelectorAll(".sheet-pill").forEach(p => p.classList.toggle("active", p.dataset.val === activeCardType));
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
    `<div class="sheet-pill ${activeColour === m.code ? 'active' : ''}" data-code="${m.code}">
      <img src="${m.svg}" style="width:16px;height:16px;"> ${m.label}
    </div>`
  ).join("");
  manaPills.querySelectorAll(".sheet-pill").forEach(el => el.addEventListener("click", () => {
    activeColour = activeColour === el.dataset.code ? null : el.dataset.code;
    manaPills.querySelectorAll(".sheet-pill").forEach(p => p.classList.toggle("active", p.dataset.code === activeColour));
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
    activeArtist = activeArtist === val ? null : val;
    document.getElementById("sheetArtistInput").value = activeArtist || "";
    list.style.display = "none";
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
    activeType = activeType === val ? null : val;
    document.getElementById("sheetTypeInput").value = activeType || "";
    list.style.display = "none";
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

function renderSheetListChunk(list, items, start, chunkSize, onSelect, q, isSet) {
  const chunk = items.slice(start, start + chunkSize);
  chunk.forEach(item => {
    const val = isSet ? item.code : item;
    const label = isSet ? item.name : item;
    const isActive = isSet ? activeSets.includes(val) : (activeArtist === val || activeType === val);
    const el = document.createElement("div");
    el.className = "sheet-list-item" + (isActive ? " selected" : "");
    el.dataset.val = val;
    el.innerHTML = (isSet ? `<img class="set-icon" src="${item.icon}" alt="">` : "") +
      highlightMatch(label, q) +
      (isActive ? '<span class="sheet-check">✓</span>' : "");
    el.addEventListener("click", () => onSelect(val));
    list.appendChild(el);
  });
  if (start + chunkSize < items.length) {
    const sentinel = document.createElement("div");
    sentinel.style.height = "1px";
    list.appendChild(sentinel);
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        sentinel.remove();
        renderSheetListChunk(list, items, start + chunkSize, chunkSize, onSelect, q, isSet);
      }
    }, { rootMargin: "40px" });
    observer.observe(sentinel);
  }
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

function clearAllFilters() {
  activeArtist = null; activeType = null; activeCardType = null;
  activeColour = null; activeSets = []; activeStyles = [];
  activeYearMin = null; activeYearMax = null; activeSearch = null;

  // Close any open dropdown
  closeDropdown();

  // Reset desktop filter button labels and active states
  if (!isMobile()) {
    const resets = [
      ["artistBtn",   "All Artists ▾"],
      ["typeBtn",     "Creature Type ▾"],
      ["cardTypeBtn", "Card Type ▾"],
      ["setBtn",      "All Sets ▾"],
      ["styleBtn",    "Art Style ▾"],
      ["yearBtn",     "Year Range ▾"],
    ];
    resets.forEach(([id, label]) => {
      const btn = document.getElementById(id);
      if (btn) { btn.textContent = label; btn.classList.remove("active"); btn.style.position = ""; }
    });
    // Mana button uses innerHTML (has SVG)
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
  updateChips();
  loadInitialGrid();
  closeDrawer();
}

// Init
initFilters();
initSearch();
initDrawer();
