// Platinum Road — GTA VI trophy guide and tracker.
// Data: app/data/trophies.json, the official 55 PS5 trophies frozen 2026-11-18.
// Progress lives in this browser only (localStorage); export/import move it as JSON.
const KEY = 'platinum-road-earned-v1';
const SPOILER_KEY = 'platinum-road-spoilers-v1';
const view = document.getElementById('view');
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

// Earned set: trophy ids. Import also accepts the starter's name list.
let earned = new Set();
try {
  const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
  if (Array.isArray(raw)) {
    for (const v of raw) {
      if (typeof v === 'number' && byId.has(v)) earned.add(v);
      else if (typeof v === 'string') {
        const hit = trophies.find((t) => t.name === v);
        if (hit) earned.add(hit.id);
      }
    }
  }
} catch { earned = new Set(); }
function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

// Spoilers: hidden trophies (28 story/secret ones) stay masked until revealed.
// Default is hidden; the toggle is remembered, per-trophy reveals last for the session.
let hideSpoilers = localStorage.getItem(SPOILER_KEY) !== 'off';
const revealed = new Set();
function saveSpoilers() {
  localStorage.setItem(SPOILER_KEY, hideSpoilers ? 'on' : 'off');
}

const KIND_LABELS = {
  story: 'Story', activity: 'Activity', collectible: 'Collectible', combat: 'Combat',
  money: 'Money', exploration: 'Exploration', choice: 'Choice', completion: '100%', platinum: 'Platinum',
};

const ROADMAP = [
  { n: 1, title: 'Play the story', text: 'Story first, in order. Chapters 1–4, the named missions and the finale — these trophies only come from playing the story, so don’t skip missions.', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
  { n: 2, title: 'Strangers', text: 'Finish the stranger mission strands as they appear. The five named finales count toward the 8 strands Strangers & Freaks needs.', ids: [22, 23, 24, 26, 27, 25] },
  { n: 3, title: 'Activities & skills', text: 'The skill grinds: stunts, the shooting range, races, fishing, meditation, challenges and combat. Do them in batches between story beats.', ids: [15, 16, 17, 18, 19, 20, 21, 28, 29, 32, 36, 39, 46] },
  { n: 4, title: 'Collect & explore', text: 'Cards, WAiNK check-ins, vehicles and the whole map of Leonida. Fold these into every trip — explore a new area, WAiNK there, grab the cards.', ids: [30, 31, 35, 42] },
  { n: 5, title: 'Money & heists', text: 'Vaults, armored trucks, gang operations, laundering, spending and garages. Rob and launder in parallel so the money counters climb together.', ids: [33, 34, 40, 41, 43, 52, 53, 54, 55] },
  { n: 6, title: 'Secrets & cleanup', text: 'The odd jobs, the one-off events and the choices — then 100% completion and the platinum. Save the long grinds for last.', ids: [37, 38, 44, 45, 47, 48, 49, 50, 51, 14, 1] },
];

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmt(n) { return n.toLocaleString('en-US'); }
function rarityLabel(t) {
  if (t.rarity === undefined) return '';
  return t.rarity === 0 ? 'Rarity: under 0.01% on PSNProfiles' : `Rarity: ${t.rarity}% on PSNProfiles`;
}
function targetLabel(t) {
  if (t.target === undefined) return '';
  if (t.id === 14) return `Target: ${t.target}% completion`;
  if (t.id === 52 || t.id === 53) return `Target: $${fmt(t.target)}`;
  return `Target: ${t.target}`;
}
function sourcesLine(t) {
  const parts = ['Official description: the official PS5 list (Exophase)'];
  if (t.target !== undefined) parts.push(`PSN target ${targetLabel(t).replace('Target: ', '')} (PSNProfiles)`);
  parts.push('Guide: our own advice from the official description, not yet checked in the game');
  return parts.join(' · ');
}

function updateHeader() {
  const total = trophies.length;
  const got = earned.size;
  const pct = Math.round((got / total) * 100);
  document.getElementById('progressText').textContent = `${got} of ${total} earned`;
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressBar').style.width = `${pct}%`;
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = trophies.filter((t) => t.grade === g).length;
    const have = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    return `${g}: ${have}/${all}`;
  }).join(' · ');
  document.getElementById('gradeCounts').textContent = counts;
  const next = ROADMAP.flatMap((p) => p.ids).map((id) => byId.get(id)).find((t) => t && !earned.has(t.id));
  document.getElementById('nextUp').innerHTML = next
    ? `Next up: <strong>${esc(next.name)}</strong> — ${esc(next.description)}`
    : 'All 55 earned — the platinum is yours.';
}

function setActiveTab(route) {
  for (const a of document.querySelectorAll('.tabs a')) {
    a.classList.toggle('active', a.dataset.route === route);
  }
}

// ---------- Guide (checklist) view ----------
let filters = { q: '', grade: 'all', status: 'all', kind: 'all', missableOnly: false };

function trophyCard(t) {
  const isEarned = earned.has(t.id);
  const masked = t.hidden && hideSpoilers && !revealed.has(t.id) && !isEarned;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'card' + (isEarned ? ' earned' : '');
  const top = document.createElement('div');
  top.className = 'card-top';
  const badge = document.createElement('span');
  badge.className = `badge ${t.grade}`;
  badge.textContent = t.grade;
  top.append(badge);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'miss';
    m.textContent = 'Missable';
    top.append(m);
  }
  if (isEarned) {
    const tick = document.createElement('span');
    tick.className = 'tick';
    tick.textContent = '✓ Earned';
    top.append(tick);
  }
  b.append(top);
  const h = document.createElement('h3');
  h.textContent = masked ? 'Hidden trophy' : t.name;
  b.append(h);
  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = masked ? 'A story trophy — its name and description are hidden until you reveal it.' : t.description;
  b.append(desc);
  if (!masked) {
    const meta = document.createElement('div');
    meta.className = 'meta';
    const parts = [];
    if (t.target !== undefined) parts.push(targetLabel(t));
    if (t.rarity !== undefined) parts.push(rarityLabel(t));
    parts.push(KIND_LABELS[t.kind] || t.kind);
    meta.textContent = parts.join(' · ');
    b.append(meta);
    const peek = document.createElement('p');
    peek.className = 'guide-peek';
    peek.textContent = t.guide;
    b.append(peek);
  } else {
    const r = document.createElement('span');
    r.className = 'spoiler-hidden';
    r.textContent = 'Spoilers are hidden. ';
    b.append(r);
  }
  b.addEventListener('click', (e) => {
    if (masked && e.target.closest('.reveal-btn')) return;
    location.hash = `#/trophy/${t.id}`;
  });
  if (masked) {
    const rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'reveal-btn';
    rb.textContent = 'Reveal this trophy';
    rb.addEventListener('click', (e) => {
      e.stopPropagation();
      revealed.add(t.id);
      renderGuide();
    });
    b.append(rb);
  }
  return b;
}

function renderGuide() {
  setActiveTab('guide');
  view.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = 'The guide';
  view.append(h);
  const lede = document.createElement('p');
  lede.className = 'lede';
  lede.textContent = 'Every trophy, with its own guide. Tick one off when you earn it — your progress is saved in this browser. Click any trophy for its full guide, its sources and its missable note.';
  view.append(lede);

  const controls = document.createElement('div');
  controls.className = 'controls';
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search trophies…';
  search.value = filters.q;
  search.setAttribute('aria-label', 'Search trophies');
  search.addEventListener('input', () => { filters.q = search.value; renderGuide(); });
  controls.append(search);
  const mkSelect = (label, options, value, onChange) => {
    const lab = document.createElement('label');
    lab.textContent = label + ' ';
    const sel = document.createElement('select');
    for (const [v, text] of options) {
      const o = document.createElement('option');
      o.value = v;
      o.textContent = text;
      sel.append(o);
    }
    sel.value = value;
    sel.addEventListener('change', () => onChange(sel.value));
    lab.append(sel);
    return lab;
  };
  controls.append(mkSelect('Grade', [['all', 'All grades'], ['platinum', 'Platinum'], ['gold', 'Gold'], ['silver', 'Silver'], ['bronze', 'Bronze']], filters.grade, (v) => { filters.grade = v; renderGuide(); }));
  controls.append(mkSelect('Status', [['all', 'All'], ['earned', 'Earned'], ['missing', 'Missing']], filters.status, (v) => { filters.status = v; renderGuide(); }));
  controls.append(mkSelect('Kind', [['all', 'All kinds'], ...Object.entries(KIND_LABELS).map(([k, v]) => [k, v])], filters.kind, (v) => { filters.kind = v; renderGuide(); }));
  const missLab = document.createElement('label');
  const missBox = document.createElement('input');
  missBox.type = 'checkbox';
  missBox.checked = filters.missableOnly;
  missBox.addEventListener('change', () => { filters.missableOnly = missBox.checked; renderGuide(); });
  missLab.append(missBox, document.createTextNode(' Missable only'));
  controls.append(missLab);
  const spoilLab = document.createElement('label');
  const spoilBox = document.createElement('input');
  spoilBox.type = 'checkbox';
  spoilBox.checked = hideSpoilers;
  spoilBox.addEventListener('change', () => { hideSpoilers = spoilBox.checked; saveSpoilers(); renderGuide(); });
  spoilLab.append(spoilBox, document.createTextNode(' Hide spoilers'));
  controls.append(spoilLab);
  const exp = document.createElement('button');
  exp.type = 'button';
  exp.textContent = 'Export progress';
  exp.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify([...earned].sort((a, b) => a - b))], { type: 'application/json' }));
    a.download = 'platinum-road-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  controls.append(exp);
  const impLab = document.createElement('label');
  impLab.className = 'import-label';
  impLab.textContent = 'Import progress ';
  const imp = document.createElement('input');
  imp.type = 'file';
  imp.accept = 'application/json';
  imp.addEventListener('change', async () => {
    const file = imp.files[0];
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const next = new Set();
      if (Array.isArray(raw)) {
        for (const v of raw) {
          if (typeof v === 'number' && byId.has(v)) next.add(v);
          else if (typeof v === 'string') {
            const hit = trophies.find((t) => t.name === v);
            if (hit) next.add(hit.id);
          }
        }
      }
      earned = next;
      save();
      updateHeader();
      renderGuide();
    } catch { alert('That file could not be read as progress.'); }
    imp.value = '';
  });
  impLab.append(imp);
  controls.append(impLab);
  view.append(controls);

  const q = filters.q.trim().toLowerCase();
  const list = trophies.filter((t) => {
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.status === 'earned' && !earned.has(t.id)) return false;
    if (filters.status === 'missing' && earned.has(t.id)) return false;
    if (filters.kind !== 'all' && t.kind !== filters.kind) return false;
    if (filters.missableOnly && !t.missable) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
  const count = document.createElement('p');
  count.className = 'result-count';
  count.textContent = `Showing ${list.length} of 55 trophies · ${earned.size} earned`;
  view.append(count);
  if (!list.length) {
    const e = document.createElement('p');
    e.className = 'empty';
    e.textContent = 'Nothing matches those filters. Clear the search or widen the filters.';
    view.append(e);
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'cards';
  for (const t of list) grid.append(trophyCard(t));
  view.append(grid);
}

// ---------- Detail view ----------
function renderDetail(id) {
  setActiveTab('guide');
  const t = byId.get(id);
  view.replaceChildren();
  if (!t) {
    const e = document.createElement('p');
    e.className = 'empty';
    e.textContent = 'No trophy with that number.';
    view.append(e);
    return;
  }
  const d = document.createElement('article');
  d.className = 'detail';
  const back = document.createElement('a');
  back.className = 'back';
  back.href = '#/';
  back.textContent = '← Back to the guide';
  d.append(back);
  const masked = t.hidden && hideSpoilers && !revealed.has(t.id) && !earned.has(t.id);
  if (masked) {
    const h = document.createElement('h2');
    h.textContent = 'Hidden trophy';
    d.append(h);
    const p = document.createElement('p');
    p.className = 'spoiler-hidden';
    p.textContent = 'This is a story trophy. Its name, description and guide stay hidden while spoilers are hidden — reveal it here, or turn “Hide spoilers” off in the Guide.';
    d.append(p);
    const rb = document.createElement('button');
    rb.type = 'button';
    rb.className = 'reveal-btn';
    rb.textContent = 'Reveal this trophy';
    rb.addEventListener('click', () => { revealed.add(t.id); renderDetail(id); });
    d.append(rb);
    view.append(d);
    return;
  }
  const top = document.createElement('div');
  top.className = 'card-top';
  const badge = document.createElement('span');
  badge.className = `badge ${t.grade}`;
  badge.textContent = t.grade;
  top.append(badge);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'miss';
    m.textContent = 'Missable';
    top.append(m);
  }
  d.append(top);
  const h = document.createElement('h2');
  h.textContent = t.name;
  d.append(h);
  const off = document.createElement('p');
  off.className = 'official';
  off.textContent = `Official description: “${t.description}”`;
  d.append(off);
  const facts = document.createElement('div');
  facts.className = 'facts';
  const fact = (label, value) => {
    const s = document.createElement('span');
    s.innerHTML = `${esc(label)}: <b>${esc(value)}</b>`;
    return s;
  };
  facts.append(fact('Kind', KIND_LABELS[t.kind] || t.kind));
  if (t.target !== undefined) facts.append(fact('PSN target', targetLabel(t).replace('Target: ', '')));
  if (t.rarity !== undefined) facts.append(fact('Rarity', t.rarity === 0 ? 'under 0.01% on PSNProfiles' : `${t.rarity}% on PSNProfiles`));
  facts.append(fact('Trophy', `${t.id} of 55`));
  d.append(facts);
  const gh = document.createElement('h3');
  gh.textContent = 'How to get it';
  d.append(gh);
  const g = document.createElement('p');
  g.className = 'guide-text';
  g.textContent = t.guide;
  d.append(g);
  if (t.missable && t.missable_note) {
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = 'Missable: ' + t.missable_note;
    d.append(note);
  }
  const src = document.createElement('p');
  src.className = 'sources';
  src.textContent = 'Sources: ' + sourcesLine(t) + '.';
  d.append(src);
  const row = document.createElement('label');
  row.className = 'earn-row';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id);
    else earned.delete(t.id);
    save();
    updateHeader();
  });
  row.append(box, document.createTextNode(' I earned this trophy'));
  d.append(row);
  const pager = document.createElement('div');
  pager.className = 'pager';
  const prev = t.id > 1 ? byId.get(t.id - 1) : null;
  const next = t.id < 55 ? byId.get(t.id + 1) : null;
  const pl = document.createElement('span');
  if (prev) {
    const a = document.createElement('a');
    a.href = `#/trophy/${prev.id}`;
    a.textContent = `← ${prev.name}`;
    pl.append(a);
  }
  const nx = document.createElement('span');
  if (next) {
    const a = document.createElement('a');
    a.href = `#/trophy/${next.id}`;
    a.textContent = `${next.name} →`;
    nx.append(a);
  }
  pager.append(pl, nx);
  d.append(pager);
  view.append(d);
}

// ---------- Roadmap view ----------
function renderRoadmap() {
  setActiveTab('roadmap');
  view.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = 'Roadmap to the platinum';
  view.append(h);
  const lede = document.createElement('p');
  lede.className = 'lede';
  lede.textContent = 'Six phases, in order. Story first, then strangers, then the activity grinds, then collectibles and money, and finally the secrets and 100% completion. Tick trophies off in the Guide as you earn them — the phases track your progress here.';
  view.append(lede);
  for (const phase of ROADMAP) {
    const sec = document.createElement('section');
    sec.className = 'phase';
    const done = phase.ids.filter((id) => earned.has(id)).length;
    const ph = document.createElement('h3');
    ph.textContent = `Phase ${phase.n} — ${phase.title}`;
    sec.append(ph);
    const pp = document.createElement('p');
    pp.className = 'phase-progress';
    pp.textContent = `${done} of ${phase.ids.length} earned`;
    sec.append(pp);
    const pt = document.createElement('p');
    pt.textContent = phase.text;
    sec.append(pt);
    const ul = document.createElement('ul');
    for (const id of phase.ids) {
      const t = byId.get(id);
      const li = document.createElement('li');
      if (earned.has(id)) li.className = 'done';
      const a = document.createElement('a');
      a.href = `#/trophy/${id}`;
      a.textContent = `${t.name} (${t.grade})`;
      li.append(a);
      if (t.missable) {
        const m = document.createElement('span');
        m.textContent = ' — missable';
        li.append(m);
      }
      ul.append(li);
    }
    sec.append(ul);
    view.append(sec);
  }
}

// ---------- Missables view ----------
function renderMissables() {
  setActiveTab('missables');
  view.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = 'Missables — don’t let these pass you by';
  view.append(h);
  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = 'Built from the official descriptions. The game is not out yet, so no missable is confirmed in play — these are the trophies tied to story beats and one-time choices. The safe rule: do them as they come up, don’t rush past a story mission, and think before you pick a choice.';
  view.append(note);
  const list = trophies.filter((t) => t.missable);
  const grid = document.createElement('div');
  grid.className = 'cards';
  for (const t of list) grid.append(trophyCard(t));
  view.append(grid);
}

// ---------- Sources view ----------
function renderSources() {
  setActiveTab('sources');
  view.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = 'Sources & how this works';
  view.append(h);
  const list = document.createElement('div');
  list.className = 'sources-list';
  list.innerHTML = `
    <h3>Where the data comes from</h3>
    <p>Names, descriptions and grades: the official PlayStation 5 trophy list, frozen 18 Nov 2026, as published on <a href="https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/">Exophase</a> — 55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden story trophies.</p>
    <p>Progress targets (the 0/N counters) and rarity: <a href="https://psnprofiles.com/trophies/43531-grand-theft-auto-vi">PSNProfiles</a>, checked 20 Nov 2026. Rarity figures are the pre-release sample and will move once the game is out.</p>
    <p>Guides: this guide's own words, written from the official descriptions. Nothing is copied from another guide. Where a place or a step is not pinned down, the guide says so plainly — the game is not out yet, so no guide here has been checked in the game.</p>
    <h3>How the tracker works</h3>
    <p>Tick a trophy off and it is saved in this browser (localStorage) — nothing is sent anywhere. Export downloads your progress as a JSON file; import reads that file back, or a name list from the starter checklist. Your progress never leaves your device.</p>
    <h3>Spoilers</h3>
    <p>28 trophies are story or secret beats. With “Hide spoilers” on, their names and descriptions stay masked in the Guide list until you reveal them or earn them. The Roadmap and Missables views show names by design — they are the plan itself, so open them knowing they spoil the story.</p>`;
  view.append(list);
}

// ---------- Router ----------
function route() {
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\/?/, '').split('/');
  if (parts[0] === 'trophy' && parts[1]) renderDetail(Number(parts[1]));
  else if (parts[0] === 'roadmap') renderRoadmap();
  else if (parts[0] === 'missables') renderMissables();
  else if (parts[0] === 'sources') renderSources();
  else renderGuide();
  updateHeader();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
