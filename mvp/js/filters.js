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

async function initFilters() {
  filtersContainer.innerHTML = `
    <button class="filter-btn" id="artistBtn">All Artists ▾</button>
    <button class="filter-btn" id="cardTypeBtn">Card Type ▾</button>
    <button class="filter-btn" id="typeBtn">Creature Type ▾</button>
    <button class="filter-btn" id="manaBtn">Mana Type ▾</button>
    <button class="filter-btn" id="setBtn">All Sets ▾</button>
    <button class="filter-btn" id="yearBtn">Year Range ▾</button>
  `;

  document.getElementById("row2Right").innerHTML = `
    <button class="filter-btn" id="sortBtn">Oldest First ⇅</button>
    <button class="filter-btn" id="viewBtn">⊞ View ▾</button>
  `;

  document.getElementById("artistBtn").addEventListener("click",   (e) => { e.stopPropagation(); toggleDropdown("artist"); });
  document.getElementById("typeBtn").addEventListener("click",     (e) => { e.stopPropagation(); toggleDropdown("type"); });
  document.getElementById("cardTypeBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleDropdown("cardType"); });
  document.getElementById("manaBtn").addEventListener("click",     (e) => { e.stopPropagation(); toggleDropdown("mana"); });
  document.getElementById("setBtn").addEventListener("click",      (e) => { e.stopPropagation(); toggleDropdown("set"); });
  document.getElementById("yearBtn").addEventListener("click",     (e) => { e.stopPropagation(); toggleDropdown("year"); });
  document.getElementById("sortBtn").addEventListener("click",     (e) => { e.stopPropagation(); toggleSort(); });
  document.getElementById("viewBtn").addEventListener("click",     (e) => { e.stopPropagation(); toggleViewDropdown(); });

  [artistList, creatureTypeList, cardTypeList] = await Promise.all([
    fetchArtistNames(),
    fetchCreatureTypes(),
    fetchCardTypes(),
  ]);

  document.addEventListener("click", () => { closeDropdown(); closeViewDropdown(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDropdown(); closeViewDropdown(); } });
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

// Sort
function toggleSort() {
  sortOrder = sortOrder === "asc" ? "desc" : "asc";
  const label = sortOrder === "asc" ? "Oldest First" : "Newest First";
  document.getElementById("sortBtn").textContent = `${label} ⇅`;
  document.getElementById("sortBtn").classList.toggle("active", sortOrder === "desc");
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

  const dropdown = document.createElement("div");
  dropdown.className = "dropdown";
  dropdown.id = "activeDropdown";
  dropdown.addEventListener("click", (e) => e.stopPropagation());

  if (type === "artist") {
    dropdown.innerHTML = `<input type="text" placeholder="Search artists..." id="artistSearch"><div class="dropdown-list" id="artistList"></div>`;
    filtersContainer.appendChild(dropdown);
    renderArtistList("");
    document.getElementById("artistSearch").addEventListener("input", (e) => renderArtistList(e.target.value));
    document.getElementById("artistSearch").focus();

  } else if (type === "type") {
    dropdown.innerHTML = `<input type="text" placeholder="Search creature types..." id="typeSearch"><div class="dropdown-list" id="typeList"></div>`;
    filtersContainer.appendChild(dropdown);
    renderTypeList("");
    document.getElementById("typeSearch").addEventListener("input", (e) => renderTypeList(e.target.value));
    document.getElementById("typeSearch").focus();

  } else if (type === "cardType") {
    dropdown.innerHTML = `<div class="dropdown-list" id="cardTypeList"></div>`;
    filtersContainer.appendChild(dropdown);
    renderCardTypeList();

  } else if (type === "mana") {
    dropdown.innerHTML = `<div class="mana-picker" id="manaPicker"></div>`;
    filtersContainer.appendChild(dropdown);
    renderManaPicker();

  } else if (type === "set") {
    dropdown.innerHTML = `<input type="text" placeholder="Search sets..." id="setSearch"><div class="dropdown-list" id="setListEl"><div class="dropdown-item" style="cursor:default;">Loading sets...</div></div>`;
    filtersContainer.appendChild(dropdown);
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
    filtersContainer.appendChild(dropdown);
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
  const q = query.toLowerCase();
  const filtered = q ? artistList.filter(a => a.toLowerCase().includes(q)).slice(0, 50) : artistList.slice(0, 50);
  if (!filtered.length) { list.innerHTML = `<div class="dropdown-item" style="cursor:default;">No artists found</div>`; return; }
  list.innerHTML = filtered.map(a => `<div class="dropdown-item" data-value="${a}">${highlightMatch(a, q)}</div>`).join("");
  list.querySelectorAll(".dropdown-item").forEach(item => item.addEventListener("click", () => selectArtist(item.dataset.value)));
}

function renderTypeList(query = "") {
  const list = document.getElementById("typeList");
  const q = query.toLowerCase();
  const filtered = q ? creatureTypeList.filter(t => t.toLowerCase().includes(q)).slice(0, 50) : creatureTypeList.slice(0, 50);
  if (!filtered.length) { list.innerHTML = `<div class="dropdown-item" style="cursor:default;">No types found</div>`; return; }
  list.innerHTML = filtered.map(t => `<div class="dropdown-item" data-value="${t}">${highlightMatch(t, q)}</div>`).join("");
  list.querySelectorAll(".dropdown-item").forEach(item => item.addEventListener("click", () => selectType(item.dataset.value)));
}

function renderCardTypeList() {
  const list = document.getElementById("cardTypeList");
  list.innerHTML = cardTypeList.map(t => `<div class="dropdown-item" data-value="${t}">${t}</div>`).join("");
  list.querySelectorAll(".dropdown-item").forEach(item => item.addEventListener("click", () => selectCardType(item.dataset.value)));
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

function renderSetList(query) {
  const list = document.getElementById("setListEl");
  const q = query.toLowerCase();
  const filtered = q ? setList.filter(s => s.name.toLowerCase().includes(q)).slice(0, 50) : setList.slice(0, 50);
  if (!filtered.length) { list.innerHTML = `<div class="dropdown-item" style="cursor:default;">No sets found</div>`; return; }
  list.innerHTML = filtered.map(s => {
    const checked = activeSets.includes(s.code);
    return `<div class="dropdown-item set-item ${checked ? 'selected' : ''}" data-code="${s.code}" data-name="${s.name}">
      <input type="checkbox" class="set-checkbox" ${checked ? 'checked' : ''} onclick="event.stopPropagation()">
      <img class="set-icon" src="${s.icon}" alt="">
      ${s.name}
    </div>`;
  }).join("");
  list.querySelectorAll(".set-item").forEach(item => {
    item.addEventListener("click", () => toggleSetSelection(item.dataset.code, item.dataset.name));
  });
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
  let html = "";
  if (activeArtist)   html += `<span class="filter-chip">${activeArtist} <span class="clear" onclick="clearArtist()">✕</span></span>`;
  if (activeType)     html += `<span class="filter-chip">${activeType} <span class="clear" onclick="clearType()">✕</span></span>`;
  if (activeCardType) html += `<span class="filter-chip">${activeCardType} <span class="clear" onclick="clearCardType()">✕</span></span>`;
  if (activeColour) {
    const m = MANA_TYPES.find(m => m.code === activeColour);
    html += `<span class="filter-chip"><img class="mana-symbol-chip" src="${m.svg}" alt="${m.label}">${m.label} <span class="clear" onclick="clearMana()">✕</span></span>`;
  }
  if (activeSets.length === 1) {
    const s = setList.find(s => s.code === activeSets[0]);
    html += `<span class="filter-chip">${s ? s.name : activeSets[0]} <span class="clear" onclick="clearSingleSet('${activeSets[0]}')">✕</span></span>`;
  } else if (activeSets.length > 1) {
    activeSets.forEach(code => {
      const s = setList.find(s => s.code === code);
      html += `<span class="filter-chip">${s ? s.name : code} <span class="clear" onclick="clearSingleSet('${code}')">✕</span></span>`;
    });
    html += `<span class="filter-chip" onclick="clearAllSets()" style="cursor:pointer;opacity:0.7;">Clear all sets</span>`;
  }
  if (activeYearMin || activeYearMax) html += `<span class="filter-chip">${activeYearMin || 1993}–${activeYearMax || new Date().getFullYear()} <span class="clear" onclick="clearYear()">✕</span></span>`;
  chipBar.innerHTML = html ? `<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-left:0.5rem;">${html}</div>` : "";
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
    if (e.key === "Enter") { hideSearchSuggestions(); activeSearch = input.value.trim() || null; loadInitialGrid(); }
    if (e.key === "Escape") { hideSearchSuggestions(); input.blur(); }
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.style.display = "none";
    activeSearch = null;
    hideSearchSuggestions();
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

// Init
initFilters();
initSearch();
