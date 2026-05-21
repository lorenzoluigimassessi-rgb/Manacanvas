// Filters — artist, creature type, set, year range, sort, view
const filtersContainer = document.getElementById("filters");

let artistList = [];
let creatureTypeList = [];
let setList = [];
let openDropdown = null;
let currentGridSize = "md";
let viewDropdownOpen = false;

async function initFilters() {
  filtersContainer.innerHTML = `
    <button class="filter-btn" id="artistBtn">All Artists ▾</button>
    <button class="filter-btn" id="typeBtn">All Creatures ▾</button>
    <button class="filter-btn" id="setBtn">All Sets ▾</button>
    <button class="filter-btn" id="yearBtn">Year Range ▾</button>
  `;

  // Sort + View (row 2, right side)
  document.getElementById("row2Right").innerHTML = `
    <button class="filter-btn active" id="sortBtn">Newest First ⇅</button>
    <button class="filter-btn" id="viewBtn">⊞ View ▾</button>
  `;

  document.getElementById("artistBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleDropdown("artist"); });
  document.getElementById("typeBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleDropdown("type"); });
  document.getElementById("setBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleDropdown("set"); });
  document.getElementById("yearBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleDropdown("year"); });
  document.getElementById("sortBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleSort(); });
  document.getElementById("viewBtn").addEventListener("click", (e) => { e.stopPropagation(); toggleViewDropdown(); });

  // Load catalogs
  [artistList, creatureTypeList] = await Promise.all([fetchArtistNames(), fetchCreatureTypes()]);
  try {
    const res = await fetch("https://api.scryfall.com/sets");
    const json = await res.json();
    setList = (json.data || []).filter(s => s.set_type === "expansion" || s.set_type === "core" || s.set_type === "draft_innovation").map(s => ({ code: s.code, name: s.name, icon: s.icon_svg_uri }));
  } catch (e) { setList = []; }

  document.addEventListener("click", () => { closeDropdown(); closeViewDropdown(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDropdown(); closeViewDropdown(); } });
}

// Sort
function toggleSort() {
  sortOrder = sortOrder === "desc" ? "asc" : "desc";
  document.getElementById("sortBtn").textContent = sortOrder === "desc" ? "Newest First ⇅" : "Oldest First ⇅";
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
    dropdown.innerHTML = `<div class="dropdown-list" id="typeList"></div>`;
    filtersContainer.appendChild(dropdown);
    renderTypeList();
  } else if (type === "set") {
    dropdown.innerHTML = `<input type="text" placeholder="Search sets..." id="setSearch"><div class="dropdown-list" id="setListEl"></div>`;
    filtersContainer.appendChild(dropdown);
    renderSetList("");
    document.getElementById("setSearch").addEventListener("input", (e) => renderSetList(e.target.value));
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

function renderArtistList(query) {
  const list = document.getElementById("artistList");
  const q = query.toLowerCase();
  const filtered = q ? artistList.filter(a => a.toLowerCase().includes(q)).slice(0, 50) : artistList.slice(0, 50);
  if (!filtered.length) { list.innerHTML = `<div class="dropdown-item" style="cursor:default;">No artists found</div>`; return; }
  list.innerHTML = filtered.map(a => `<div class="dropdown-item" data-value="${a}">${highlightMatch(a, q)}</div>`).join("");
  list.querySelectorAll(".dropdown-item").forEach(item => item.addEventListener("click", () => selectArtist(item.dataset.value)));
}

function renderTypeList() {
  const list = document.getElementById("typeList");
  list.innerHTML = creatureTypeList.map(t => `<div class="dropdown-item" data-value="${t}">${t}</div>`).join("");
  list.querySelectorAll(".dropdown-item").forEach(item => item.addEventListener("click", () => selectType(item.dataset.value)));
}

function renderSetList(query) {
  const list = document.getElementById("setListEl");
  const q = query.toLowerCase();
  const filtered = q ? setList.filter(s => s.name.toLowerCase().includes(q)).slice(0, 50) : setList.slice(0, 50);
  if (!filtered.length) { list.innerHTML = `<div class="dropdown-item" style="cursor:default;">No sets found</div>`; return; }
  list.innerHTML = filtered.map(s => `<div class="dropdown-item" data-value="${s.code}"><img class="set-icon" src="${s.icon}" alt="">${s.name}</div>`).join("");
  list.querySelectorAll(".dropdown-item").forEach(item => item.addEventListener("click", () => selectSet(item.dataset.value, item.textContent)));
}

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return text.slice(0, idx) + `<strong style="color:var(--text-primary)">${text.slice(idx, idx + query.length)}</strong>` + text.slice(idx + query.length);
}

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

function selectSet(code, name) {
  activeSet = code;
  closeDropdown();
  document.getElementById("setBtn").textContent = name;
  document.getElementById("setBtn").classList.add("active");
  updateChips();
  loadInitialGrid();
}

function clearArtist() {
  activeArtist = null;
  document.getElementById("artistBtn").textContent = "All Artists ▾";
  document.getElementById("artistBtn").classList.remove("active");
  updateChips();
  loadInitialGrid();
}

function clearType() {
  activeType = null;
  document.getElementById("typeBtn").textContent = "All Creatures ▾";
  document.getElementById("typeBtn").classList.remove("active");
  updateChips();
  loadInitialGrid();
}

function clearSet() {
  activeSet = null;
  document.getElementById("setBtn").textContent = "All Sets ▾";
  document.getElementById("setBtn").classList.remove("active");
  updateChips();
  loadInitialGrid();
}

function clearYear() {
  activeYearMin = null;
  activeYearMax = null;
  document.getElementById("yearBtn").textContent = "Year Range ▾";
  document.getElementById("yearBtn").classList.remove("active");
  updateChips();
  loadInitialGrid();
}

function updateChips() {
  const chipBar = document.getElementById("chipBar");
  let html = "";
  if (activeArtist) html += `<span class="filter-chip">${activeArtist} <span class="clear" onclick="clearArtist()">✕</span></span>`;
  if (activeType) html += `<span class="filter-chip">${activeType} <span class="clear" onclick="clearType()">✕</span></span>`;
  if (activeSet) html += `<span class="filter-chip">${document.getElementById("setBtn").textContent} <span class="clear" onclick="clearSet()">✕</span></span>`;
  if (activeYearMin || activeYearMax) html += `<span class="filter-chip">${activeYearMin || 1993}–${activeYearMax || new Date().getFullYear()} <span class="clear" onclick="clearYear()">✕</span></span>`;
  chipBar.innerHTML = html ? `<div style="display:flex;gap:0.4rem;flex-wrap:wrap;margin-left:0.5rem;">${html}</div>` : "";
}

function closeDropdown() {
  openDropdown = null;
  const existing = document.getElementById("activeDropdown");
  if (existing) existing.remove();
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
      if (val.length >= 2) {
        showSearchSuggestions(val);
      } else {
        hideSearchSuggestions();
      }
    }, 200);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      hideSearchSuggestions();
      activeSearch = input.value.trim() || null;
      loadInitialGrid();
    }
    if (e.key === "Escape") {
      hideSearchSuggestions();
      input.blur();
    }
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

  const artistMatches = artistList.filter(a => a.toLowerCase().includes(q)).slice(0, 3);
  artistMatches.forEach(a => suggestions.push({ label: a, tag: "Artist", action: () => selectArtist(a) }));

  const typeMatches = creatureTypeList.filter(t => t.toLowerCase().includes(q)).slice(0, 3);
  typeMatches.forEach(t => suggestions.push({ label: t, tag: "Creature", action: () => selectType(t) }));

  const setMatches = setList.filter(s => s.name.toLowerCase().includes(q)).slice(0, 3);
  setMatches.forEach(s => suggestions.push({ label: s.name, tag: "Set", action: () => selectSet(s.code, s.name) }));

  suggestions.push({ label: `Search "${query}"`, tag: "Card", action: () => { activeSearch = query; hideSearchSuggestions(); loadInitialGrid(); } });

  try {
    const res = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    const cardNames = (json.data || []).slice(0, 4);
    cardNames.forEach(name => {
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
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      suggestions[i].action();
      hideSearchSuggestions();
    });
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
