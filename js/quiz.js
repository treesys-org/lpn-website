/**
 * Guía LPN, español neutro, una pregunta a la vez,
 * tarjetas visuales, máx. 3 opciones.
 */

function $(sel, root = document) {
  return root.querySelector(sel);
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const REDDIT_URL = "https://www.reddit.com/r/linuxparanoobs/";

/** Opción extra: abre el Reddit oficial (sin avanzar la guía). */
function redditOpt(hint = "Comunidad oficial") {
  return {
    prop: "reddit",
    label: "Preguntar en Reddit",
    hint,
    href: REDDIT_URL,
  };
}

function videoByN(n) {
  return window.LPN?.byN?.(n) || null;
}

function thumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function renderVideoPicks(nums, title = "Mira estos videos") {
  const items = (nums || []).map(videoByN).filter(Boolean).slice(0, 3);
  if (!items.length) return el(`<div hidden></div>`);

  const box = el(`<div class="assist-videos">
    <p class="assist-videos-label">▣ CINTAS DE VIDEO, ${escapeHtml(title)}</p>
    <div class="vid-picks"></div>
  </div>`);
  const rel = $(".vid-picks", box);
  items.forEach((v, i) => {
    const id = v.id;
    const b = el(`<button type="button" class="vid-pick">
      <span class="vid-pick-num">${i + 1}</span>
      <img src="${thumb(id)}" alt="" width="120" height="68" loading="lazy" />
      <span class="vid-pick-text">
        <strong>${escapeHtml(v.title)}</strong>
        <small>${escapeHtml(v.tip || "")}</small>
      </span>
    </button>`);
    b.onclick = () => window.LPN?.openPlayer?.(v);
    rel.appendChild(b);
  });
  return box;
}

/** Videos: acepta [n, ...] o [{ n, why }, ...]. El why es de ESTA escena. */
function normalizeVideoList(list) {
  return (list || [])
    .map((item) => {
      if (typeof item === "number") return { n: item, why: null };
      if (item && typeof item.n === "number") return { n: item.n, why: item.why || null };
      return null;
    })
    .filter(Boolean)
    .slice(0, 3);
}

function renderRoomTapes(list) {
  const refs = normalizeVideoList(list);
  const items = refs
    .map((r) => {
      const v = videoByN(r.n);
      if (!v) return null;
      return {
        video: v,
        why: r.why || v.tip || "Te aclara este paso sin rodeos.",
      };
    })
    .filter(Boolean);
  if (!items.length) return el(`<div class="pnk-tapes" hidden></div>`);

  const box = el(`<div class="pnk-tapes" aria-label="Videos sugeridos">
    <p class="pnk-tapes-label">Videos que te ayudan</p>
    <div class="pnk-tapes-row"></div>
  </div>`);
  const row = $(".pnk-tapes-row", box);
  items.forEach(({ video: v, why }) => {
    const card = el(`<button type="button" class="pnk-tape">
      <img class="pnk-tape-thumb" src="${thumb(v.id)}" alt="" width="320" height="180" loading="lazy" />
      <span class="pnk-tape-body">
        <strong class="pnk-tape-title">${escapeHtml(v.title)}</strong>
        <small class="pnk-tape-why"><em>Por qué sirve aquí:</em> ${escapeHtml(why)}</small>
      </span>
    </button>`);
    card.onclick = () => window.LPN?.openPlayer?.(v);
    row.appendChild(card);
  });
  return box;
}

/** Solo una frase corta: los botones ya cargan el significado */
function composeCoachLines(scene) {
  const line = (scene?.speech || "").trim();
  return line ? [line] : [];
}

function fillCoachSpeech(sayEl, lines) {
  const full = (lines || []).filter(Boolean);
  sayEl.innerHTML = "";
  if (!full.length) return;

  const head = full[0];
  const headP = document.createElement("p");
  headP.className = "pnk-say-line pnk-say-main";
  sayEl.appendChild(headP);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    headP.textContent = head;
    return;
  }

  let i = 0;
  const tick = () => {
    i += 1;
    headP.textContent = head.slice(0, i);
    if (i < head.length) requestAnimationFrame(() => setTimeout(tick, 10));
  };
  tick();
  sayEl.onclick = () => {
    headP.textContent = head;
    sayEl.onclick = null;
  };
}

/**
 * Objetos con sentido Linux/PC (no carrito/mapa genéricos).
 * Cada id = metáfora concreta de la decisión.
 */
const PROPS = {
  /* Hub */
  power_on: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="8" width="44" height="36" rx="3" fill="#2a3340" stroke="#0a1018" stroke-width="2"/><rect x="14" y="12" width="36" height="24" fill="#0a1828"/><circle cx="32" cy="24" r="7" fill="none" stroke="#5dffb0" stroke-width="3"/><path d="M32 14v8" stroke="#5dffb0" stroke-width="3" stroke-linecap="round"/><path d="M8 48h48l-3 8H11z" fill="#3a4450" stroke="#0a1018" stroke-width="2"/><text x="32" y="40" text-anchor="middle" font-size="7" fill="#3ecfff" font-family="monospace">1º boot</text></svg>`,
  distros: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="4" y="14" width="18" height="36" rx="2" fill="#3d8c5a" stroke="#1a4030" stroke-width="1.5"/><rect x="7" y="18" width="12" height="8" fill="#8dff9a" opacity=".5"/><text x="13" y="44" text-anchor="middle" font-size="6" fill="#041018" font-weight="700">Mint</text><rect x="23" y="10" width="18" height="40" rx="2" fill="#3ecfff" stroke="#0a4060" stroke-width="1.5"/><rect x="26" y="14" width="12" height="8" fill="#fff" opacity=".35"/><text x="32" y="44" text-anchor="middle" font-size="6" fill="#041018" font-weight="700">Zorin</text><rect x="42" y="16" width="18" height="34" rx="2" fill="#e95420" stroke="#5a2010" stroke-width="1.5"/><rect x="45" y="20" width="12" height="8" fill="#ffb080" opacity=".45"/><text x="51" y="44" text-anchor="middle" font-size="5.5" fill="#041018" font-weight="700">Ubun</text></svg>`,
  broken_pc: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="10" width="40" height="28" rx="2" fill="#2a3340" stroke="#0a1018" stroke-width="2"/><rect x="12" y="14" width="32" height="18" fill="#1a0808"/><path d="M18 20l8 8m0-8l-8 8" stroke="#ff5fa8" stroke-width="2.5" stroke-linecap="round"/><path d="M6 42h44l-3 8H9z" fill="#3a4450"/><path d="M44 36l12 4-4 12-6-8z" fill="#c0c8d0" stroke="#404850" stroke-width="1.5"/><path d="M48 44l4 2" stroke="#ffb020" stroke-width="2"/><circle cx="52" cy="50" r="3" fill="#5a6068"/></svg>`,

  /* Miedos / mitos */
  whatis: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="12" width="24" height="20" rx="2" fill="#2a60a0" stroke="#0a2038" stroke-width="1.5"/><text x="18" y="25" text-anchor="middle" font-size="8" fill="#fff" font-family="sans-serif">Win</text><path d="M34 22h6" stroke="#ffb020" stroke-width="2"/><rect x="42" y="12" width="16" height="20" rx="2" fill="#1a2830" stroke="#3ecfff" stroke-width="1.5"/><text x="50" y="26" text-anchor="middle" font-size="14" fill="#3ecfff" font-weight="700">?</text><ellipse cx="32" cy="48" rx="22" ry="10" fill="#152028" stroke="#3a5570" stroke-width="1.5"/><text x="32" y="51" text-anchor="middle" font-size="7" fill="#a8bdd0" font-family="sans-serif">¿sistema?</text></svg>`,
  filesafe: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="22" width="36" height="28" rx="3" fill="#3ecfff" stroke="#0a4060" stroke-width="2"/><path d="M18 22v-6a10 10 0 0 1 20 0v6" fill="none" stroke="#8a9aa8" stroke-width="3.5" stroke-linecap="round"/><rect x="14" y="28" width="28" height="16" rx="1" fill="#0a2840"/><path d="M20 34h16M20 40h10" stroke="#5dffb0" stroke-width="2"/><circle cx="50" cy="44" r="10" fill="#5dffb0" stroke="#1a6040" stroke-width="2"/><path d="M45 44l3 3 7-8" fill="none" stroke="#0a2818" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  myth: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="8" width="48" height="40" rx="3" fill="#0a1018" stroke="#3a5570" stroke-width="2"/><text x="14" y="20" font-size="7" fill="#5dffb0" font-family="monospace">$</text><text x="20" y="20" font-size="6" fill="#7a9bb0" font-family="monospace">sudo rm -rf</text><text x="14" y="30" font-size="6" fill="#7a9bb0" font-family="monospace">¿imposible?</text><path d="M12 12l40 36M52 12L12 48" stroke="#ff5fa8" stroke-width="3" stroke-linecap="round" opacity=".9"/><text x="32" y="58" text-anchor="middle" font-size="7" fill="#ffb020" font-weight="700">mito</text></svg>`,

  /* Acciones */
  usb: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="22" y="4" width="20" height="12" rx="2" fill="#c0c8d0" stroke="#404850" stroke-width="2"/><rect x="26" y="7" width="4" height="6" fill="#606870"/><rect x="34" y="7" width="4" height="6" fill="#606870"/><rect x="18" y="14" width="28" height="38" rx="4" fill="#3ecfff" stroke="#0a4060" stroke-width="2"/><text x="32" y="32" text-anchor="middle" font-size="7" fill="#041018" font-weight="700">LIVE</text><circle cx="32" cy="42" r="6" fill="#0a4060"/><path d="M32 38v8M28 42h8" stroke="#3ecfff" stroke-width="1.8"/></svg>`,
  door: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="6" width="36" height="52" rx="2" fill="#8b5a2b" stroke="#3a2010" stroke-width="2"/><rect x="18" y="10" width="28" height="44" fill="#a06838"/><circle cx="40" cy="34" r="3" fill="#ffb020"/><path d="M22 8v48" stroke="#5a3818" stroke-width="1" opacity=".4"/></svg>`,
  back: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="#3a2e10" stroke="#ffb020" stroke-width="3"/><path d="M38 20L24 32l14 12" fill="none" stroke="#ffb020" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 32h18" stroke="#ffb020" stroke-width="4" stroke-linecap="round"/></svg>`,

  /* Máquinas */
  laptop_old: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="12" width="44" height="28" rx="2" fill="#6a7078" stroke="#303438" stroke-width="2"/><rect x="14" y="16" width="36" height="20" fill="#1a2830"/><circle cx="32" cy="26" r="6" fill="none" stroke="#ffb020" stroke-width="2"/><path d="M32 20v6l4 2" stroke="#ffb020" stroke-width="2" stroke-linecap="round"/><path d="M6 44h52l-4 8H10z" fill="#8a9098" stroke="#303438" stroke-width="2"/><path d="M48 8l4-4m0 4l-4-4" stroke="#a8bdd0" stroke-width="1.5" opacity=".6"/></svg>`,
  laptop: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="10" width="44" height="32" rx="2" fill="#2a3340" stroke="#0a1018" stroke-width="2"/><rect x="14" y="14" width="36" height="24" fill="#1a4058"/><rect x="18" y="18" width="14" height="10" rx="1" fill="#3ecfff" opacity=".75"/><circle cx="44" cy="22" r="4" fill="#5dffb0" opacity=".7"/><rect x="36" y="28" width="10" height="3" fill="#ffb020" opacity=".5"/><path d="M6 44h52l-4 8H10z" fill="#3a4450" stroke="#0a1018" stroke-width="2"/></svg>`,
  gaming: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="20" y="6" width="24" height="32" rx="2" fill="#1a1e28" stroke="#0a0c10" stroke-width="2"/><rect x="24" y="10" width="16" height="12" fill="#1b2838"/><rect x="24" y="10" width="16" height="12" fill="#2a60a0" opacity=".5"/><rect x="26" y="26" width="5" height="3" fill="#3ecfff"/><rect x="34" y="26" width="5" height="3" fill="#ff5fa8"/><path d="M10 46c6-8 14-6 18 0h8c4-6 12-8 18 0" fill="#2a3348" stroke="#0a1018" stroke-width="2"/><circle cx="18" cy="50" r="3" fill="#3ecfff"/><circle cx="46" cy="50" r="2.5" fill="#ff5fa8"/><circle cx="52" cy="50" r="2.5" fill="#ffb020"/></svg>`,

  /* Prioridades */
  easy_desk: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="8" width="52" height="40" rx="2" fill="#1a2838" stroke="#3ecfff" stroke-width="2"/><rect x="6" y="8" width="52" height="8" fill="#2a4060"/><rect x="10" y="20" width="10" height="10" rx="1" fill="#3ecfff" opacity=".5"/><rect x="24" y="20" width="10" height="10" rx="1" fill="#5dffb0" opacity=".5"/><rect x="38" y="20" width="10" height="10" rx="1" fill="#ffb020" opacity=".5"/><rect x="10" y="40" width="28" height="4" rx="1" fill="#8b98ab"/><text x="32" y="58" text-anchor="middle" font-size="7" fill="#a8bdd0">menú · fácil</text></svg>`,
  gamepad: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 28c0-6 4-10 10-10h24c6 0 10 4 10 10v12c0 8-6 14-14 14h-4l-4-6h-4l-4 6h-4c-8 0-14-6-14-14z" fill="#2a3348" stroke="#0a1018" stroke-width="2"/><circle cx="22" cy="34" r="5" fill="#1a2030"/><path d="M22 31v6M19 34h6" stroke="#3ecfff" stroke-width="2"/><circle cx="42" cy="30" r="3" fill="#ff5fa8"/><circle cx="48" cy="36" r="3" fill="#ffb020"/><rect x="28" y="30" width="6" height="3" rx="1" fill="#5dffb0"/></svg>`,
  restore: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6l20 8v14c0 14-8 22-20 26C20 50 12 42 12 28V14z" fill="#3ecfff" stroke="#0a4060" stroke-width="2"/><path d="M24 30a10 10 0 1 0 2-6" fill="none" stroke="#041018" stroke-width="3" stroke-linecap="round"/><path d="M22 18v8h8" fill="none" stroke="#041018" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

  /* Apps Windows */
  apps_ok: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="12" width="20" height="20" rx="3" fill="#3ecfff"/><rect x="36" y="12" width="20" height="20" rx="3" fill="#5dffb0"/><rect x="8" y="38" width="20" height="16" rx="3" fill="#ffb020"/><circle cx="46" cy="46" r="10" fill="#1a6040"/><path d="M41 46l3 3 7-8" fill="none" stroke="#5dffb0" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  wine: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="14" width="28" height="36" rx="2" fill="#1a2838" stroke="#3ecfff" stroke-width="2"/><rect x="12" y="20" width="20" height="14" fill="#0a1828"/><text x="22" y="30" text-anchor="middle" font-size="7" fill="#8b98ab">app.exe</text><path d="M40 20h14v8c0 10-4 16-7 18h0c-3-2-7-8-7-18z" fill="#7a4a18" stroke="#3a2010" stroke-width="1.5"/><rect x="44" y="12" width="6" height="10" fill="#c4a574"/><text x="47" y="52" text-anchor="middle" font-size="6" fill="#ffb020">Wine</text></svg>`,
  critical: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="10" width="44" height="36" rx="2" fill="#2a2030" stroke="#ff5fa8" stroke-width="2"/><rect x="14" y="16" width="36" height="22" fill="#1a1018"/><rect x="18" y="20" width="16" height="12" fill="#4a3050"/><path d="M32 6l8 14H24z" fill="#ffb020" stroke="#5a4008" stroke-width="1.5"/><text x="32" y="16" text-anchor="middle" font-size="9" font-weight="700" fill="#5a4008">!</text><text x="32" y="56" text-anchor="middle" font-size="7" fill="#ff9ec8">imprescindible</text></svg>`,

  /* Tienda / VM */
  appstore: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="6" width="48" height="52" rx="4" fill="#1a2838" stroke="#3ecfff" stroke-width="2"/><rect x="8" y="6" width="48" height="12" fill="#2a4060"/><circle cx="14" cy="12" r="2" fill="#ff5fa8"/><circle cx="20" cy="12" r="2" fill="#ffb020"/><circle cx="26" cy="12" r="2" fill="#5dffb0"/><rect x="14" y="24" width="14" height="14" rx="2" fill="#3ecfff" opacity=".55"/><rect x="36" y="24" width="14" height="14" rx="2" fill="#5dffb0" opacity=".55"/><rect x="14" y="42" width="14" height="10" rx="2" fill="#ffb020" opacity=".45"/><rect x="36" y="42" width="14" height="10" rx="2" fill="#ff5fa8" opacity=".45"/></svg>`,
  winbox: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="4" y="16" width="36" height="36" rx="2" fill="#152028" stroke="#3ecfff" stroke-width="2"/><rect x="8" y="24" width="28" height="22" fill="#0a1828"/><rect x="22" y="6" width="36" height="28" rx="2" fill="#2a4060" stroke="#ffb020" stroke-width="2"/><rect x="26" y="12" width="28" height="16" fill="#1a3050"/><rect x="28" y="14" width="8" height="8" fill="#2a60a0"/><rect x="38" y="14" width="8" height="8" fill="#2a60a0"/><rect x="28" y="24" width="8" height="2" fill="#8b98ab"/><text x="40" y="48" text-anchor="middle" font-size="6" fill="#ffb020">VM</text></svg>`,

  /* Fallos / GPU */
  blackout: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="8" width="48" height="36" rx="2" fill="#0a0c10" stroke="#5a6068" stroke-width="2"/><rect x="12" y="12" width="40" height="28" fill="#050608"/><path d="M24 22h16M28 30h8" stroke="#2a3038" stroke-width="2"/><text x="32" y="28" text-anchor="middle" font-size="7" fill="#3a4048" font-family="monospace">BIOS</text><rect x="24" y="48" width="16" height="4" fill="#5a6068"/><rect x="18" y="52" width="28" height="3" fill="#3a4048"/></svg>`,
  gpu: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="14" width="52" height="32" rx="3" fill="#1a2838" stroke="#76b900" stroke-width="2"/><rect x="10" y="18" width="28" height="18" rx="1" fill="#0a1820"/><text x="24" y="30" text-anchor="middle" font-size="7" fill="#76b900" font-weight="700">GPU</text><circle cx="48" cy="24" r="5" fill="#3ecfff" opacity=".7"/><circle cx="48" cy="36" r="5" fill="#ffb020" opacity=".7"/><path d="M14 52h36" stroke="#5a7088" stroke-width="3" stroke-linecap="round"/><text x="32" y="60" text-anchor="middle" font-size="6" fill="#a8bdd0">NVIDIA · AMD · Intel</text></svg>`,

  /* Comunidad */
  /* Dos pingüinos bebé chocándose las aletas (comunidad) */
  reddit: `<svg viewBox="0 0 64 64" aria-hidden="true">
    <ellipse cx="32" cy="58" rx="22" ry="3" fill="#0a1018" opacity=".35"/>
    <!-- izquierda -->
    <ellipse cx="20" cy="42" rx="12" ry="14" fill="#1a1e28"/>
    <ellipse cx="20" cy="46" rx="7" ry="8" fill="#f4f0e8"/>
    <circle cx="20" cy="24" r="9" fill="#1a1e28"/>
    <ellipse cx="17.5" cy="23" rx="2.2" ry="2.6" fill="#fff"/><circle cx="17.8" cy="23.2" r="1.1" fill="#2a6aa0"/>
    <ellipse cx="22.5" cy="23" rx="2.2" ry="2.6" fill="#fff"/><circle cx="22.8" cy="23.2" r="1.1" fill="#2a6aa0"/>
    <ellipse cx="20" cy="27" rx="2.2" ry="1.5" fill="#ffb020"/>
    <ellipse cx="20" cy="29.2" rx="2.4" ry="1.8" fill="#ff5fa8"/>
    <ellipse cx="12" cy="50" rx="4" ry="2.2" fill="#ff9a3c"/>
    <ellipse cx="26" cy="50" rx="4" ry="2.2" fill="#ff9a3c"/>
    <!-- derecha -->
    <ellipse cx="44" cy="42" rx="12" ry="14" fill="#1a1e28"/>
    <ellipse cx="44" cy="46" rx="7" ry="8" fill="#f4f0e8"/>
    <circle cx="44" cy="24" r="9" fill="#1a1e28"/>
    <ellipse cx="41.5" cy="23" rx="2.2" ry="2.6" fill="#fff"/><circle cx="41.8" cy="23.2" r="1.1" fill="#2a6aa0"/>
    <ellipse cx="46.5" cy="23" rx="2.2" ry="2.6" fill="#fff"/><circle cx="46.8" cy="23.2" r="1.1" fill="#2a6aa0"/>
    <ellipse cx="44" cy="27" rx="2.2" ry="1.5" fill="#ffb020"/>
    <ellipse cx="44" cy="29.2" rx="2.4" ry="1.8" fill="#ff5fa8"/>
    <ellipse cx="38" cy="50" rx="4" ry="2.2" fill="#ff9a3c"/>
    <ellipse cx="52" cy="50" rx="4" ry="2.2" fill="#ff9a3c"/>
    <!-- aletas chocando arriba al centro -->
    <path d="M28 34c2-6 4-10 4-10s2 4 4 10" fill="none" stroke="#2a3348" stroke-width="5" stroke-linecap="round"/>
    <path d="M28 34c2-6 4-10 4-10s2 4 4 10" fill="none" stroke="#3a4458" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="32" cy="24" r="3.2" fill="#ffb020" opacity=".85"/>
    <path d="M32 20v-4M29 21l-2-3M35 21l2-3" stroke="#ffb020" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,
};

function propSvg(id) {
  return PROPS[id] || PROPS.whatis;
}

function optionButton(opt) {
  const label = escapeHtml(opt.label);
  const hint = opt.hint ? `<span class="pnk-prop-hint">${escapeHtml(opt.hint)}</span>` : "";
  const inner = `
    <span class="pnk-prop" data-prop="${escapeHtml(opt.prop || "whatis")}" aria-hidden="true">${propSvg(opt.prop)}</span>
    <span class="pnk-prop-text">
      <span class="pnk-prop-label">${label}</span>
      ${hint}
    </span>`;
  if (opt.href) {
    const a = el(`<a class="pnk-hotspot pnk-hotspot--link" href="${escapeHtml(opt.href)}" target="_blank" rel="noopener noreferrer" aria-label="${label}">${inner}</a>`);
    return a;
  }
  const btn = el(`<button type="button" class="pnk-hotspot" aria-label="${label}">${inner}</button>`);
  return btn;
}

function roomForScene(sceneId, scene) {
  if (scene?.room) return scene.room;
  if (!sceneId || sceneId === "hub") return "inicio";
  if (sceneId.startsWith("start")) return "empezar";
  if (
    sceneId === "result" ||
    sceneId === "machine" ||
    sceneId === "goal" ||
    sceneId === "pc_year" ||
    sceneId === "windows"
  ) {
    return "elegir";
  }
  if (sceneId.startsWith("p_") || sceneId === "problems") return "problemas";
  return "inicio";
}

/** Árbol guiado. Máx. 3 opciones de contenido + Atrás (historial). */
const SCENES = {
  hub: {
    pixel: "GUÍA LPN",
    speech: "Toca un objeto y te guío.",
    step: "Inicio",
    question: "¿Qué te trae por aquí?",
    options: [
      { prop: "power_on", label: "Empezar de cero", hint: "Aún no sé casi nada", next: "start_fear" },
      { prop: "distros", label: "Elegir mi Linux", hint: "Quiero saber qué instalar", next: "machine" },
      { prop: "broken_pc", label: "Tengo un problema", hint: "Juegos, apps, fallos…", next: "problems" },
    ],
  },

  start_fear: {
    pixel: "DE CERO",
    speech: "¿Qué es lo que más te frena?",
    step: "Empezar",
    question: "Elige la duda que más pesa",
    options: [
      { prop: "whatis", label: "No sé qué es Linux", hint: "¿Programa? ¿Otro Windows?", next: "start_what" },
      { prop: "filesafe", label: "Me da miedo romper la PC", hint: "No quiero perder archivos", next: "start_safe" },
      { prop: "myth", label: "Me dijeron que es muy difícil", hint: "Terminal, comandos…", next: "start_easy" },
    ],
  },

  start_what: {
    pixel: "¿QUÉ ES?",
    speech: "Linux es el sistema de la PC, como Windows. Hay varios; yo te digo cuál te conviene y cuáles se usan más.",
    step: "Empezar · idea",
    question: "Mira estos videos si quieres aterrizar la idea",
    videos: [
      { n: 2, why: "Aclara mitos (virus, “imposible”, juegos)." },
      { n: 13, why: "Se ve distinto según el Linux, pero la idea es la misma." },
      { n: 3, why: "Un Linux fácil, parecido a Windows." },
    ],
    options: [
      { prop: "usb", label: "¿Se puede probar sin instalar?", hint: "DistroSea en el navegador", next: "start_try" },
      { prop: "distros", label: "Ya entendí, ¿cuál me conviene?", hint: "Te hago unas preguntas", next: "machine" },
      redditOpt("Sigo con dudas"),
    ],
  },

  start_safe: {
    pixel: "SIN RIESGO",
    speech: "Puedes mirar sin tocar tu Windows. ¿Qué hacemos?",
    step: "Empezar · calma",
    question: "Elige cómo seguir",
    videos: [
      { n: 17, why: "Prueba en el navegador: tu disco sigue igual." },
    ],
    options: [
      { prop: "usb", label: "Probar ya, sin riesgo", hint: "DistroSea en el navegador", next: "start_try" },
      { prop: "distros", label: "Ya quiero elegir uno", hint: "Me siento listo", next: "machine" },
      redditOpt("Pregunta antes de tocar nada"),
    ],
  },

  start_easy: {
    pixel: "NO ES TAN DIFÍCIL",
    speech: "Si eliges bien, se parece a Windows. Mira y decide.",
    step: "Empezar · facilidad",
    question: "Elige cómo seguir",
    videos: [
      { n: 2, why: "No hace falta ser experto." },
      { n: 3, why: "Zorin: se siente familiar desde el primer día." },
      { n: 23, why: "Errores típicos del primer día, para no asustarte." },
    ],
    options: [
      { prop: "easy_desk", label: "Muéstrame uno fácil", hint: "Parecido a Windows", next: "machine", set: { goal: "easy" } },
      { prop: "usb", label: "Antes quiero probarlo", hint: "DistroSea en el navegador", next: "start_try" },
      redditOpt("Aún me da miedo"),
    ],
  },

  start_try: {
    pixel: "PROBAR",
    speech: "En DistroSea ves Mint o Zorin en el navegador: no puedes instalar programas y va más lento; es solo un vistazo. Dale a Iniciar. Más adelante, en un video, te muestro cómo probarlo en tu PC sin instalar.",
    step: "Probar online",
    question: "Abre una demo o sigue con la guía",
    videos: [],
    options: [
      {
        prop: "laptop_old",
        label: "Probar Linux Mint",
        hint: "DistroSea · dale a Iniciar",
        href: "https://distrosea.com/es/start/linuxmint-22.3-cinnamon/",
        next: "machine",
      },
      {
        prop: "easy_desk",
        label: "Probar Zorin OS",
        hint: "DistroSea · dale a Iniciar",
        href: "https://distrosea.com/es/start/zorin-18-core64/",
        next: "machine",
      },
      { prop: "distros", label: "Seguir eligiendo el mío", hint: "Te hago unas preguntas", next: "machine" },
    ],
  },

  machine: {
    pixel: "TU PC",
    speech: "Cuéntame cómo es tu PC.",
    step: "Elegir · PC",
    question: "Elige tu máquina",
    options: [
      /* vieja también pregunta año: “vieja” a veces son solo 5 años */
      { prop: "laptop_old", label: "Vieja o lenta", hint: "Windows ya va pesado", next: "pc_year", set: { machine: "old" } },
      { prop: "laptop", label: "Normal de todos los días", hint: "Estudio, trabajo, navegar", next: "goal", set: { machine: "normal" } },
      { prop: "gaming", label: "Para jugar", hint: "Steam / juegos", next: "pc_year", set: { machine: "gaming", goal: "game" } },
    ],
  },

  goal: {
    pixel: "PRIORIDAD",
    speech: "¿Qué te importa más ahora?",
    step: "Elegir · prioridad",
    question: "Elige una prioridad",
    options: [
      { prop: "easy_desk", label: "Que sea fácil", hint: "Menú claro, poco drama", next: "result", set: { goal: "easy" } },
      { prop: "gamepad", label: "Jugar", hint: "Steam / juegos", next: "pc_year", set: { goal: "game" } },
      { prop: "restore", label: "Que no se rompa", hint: "Actualizar con calma", next: "result", set: { goal: "stable" } },
    ],
  },

  pc_year: {
    pixel: "¿DE QUÉ AÑO?",
    speech: "Aunque digas que es vieja, el año importa. ¿Más o menos de cuándo es?",
    step: "Elegir · año",
    question: "¿De qué época es tu PC?",
    videos: [
      { n: 59, why: "Si la gráfica es vieja, conviene un Linux estable (Mint)." },
      { n: 81, why: "Si la PC es gamer moderna, Bazzite encaja mejor." },
    ],
    options: [
      { prop: "laptop_old", label: "2014 o antes", hint: "Muy cansada", next: "after_year", set: { age: "old" } },
      { prop: "laptop", label: "2015 a 2019", hint: "Tiene unos años", next: "after_year", set: { age: "mid" } },
      { prop: "gaming", label: "2020 o más nueva", hint: "Bastante reciente", next: "after_year", set: { age: "new" } },
      { prop: "whatis", label: "No sé", hint: "Te mando a lo seguro: Mint", next: "after_year", set: { age: "unknown" } },
    ],
  },

  /* Opcional: solo si después del resultado hay duda con apps de Windows */
  windows: {
    pixel: "APPS",
    speech: "¿Usas algún programa que solo existe en Windows?",
    step: "Apps de Windows",
    question: "Elige tu caso",
    options: [
      { prop: "apps_ok", label: "No, voy bien", hint: "Sigo con mi Linux", next: "result", set: { windows: "no" } },
      { prop: "wine", label: "A veces", hint: "Una o dos, no críticas", next: "p_apps_win", set: { windows: "sometimes" } },
      { prop: "critical", label: "Sí, una crítica", hint: "Sin ella no trabajo", next: "p_apps_win", set: { windows: "critical" } },
    ],
  },

  result: { kind: "result" },

  problems: {
    pixel: "PROBLEMAS",
    speech: "¿Qué te está pasando?",
    step: "Problemas",
    question: "Elige el tipo de lío",
    options: [
      { prop: "gamepad", label: "Quiero jugar", hint: "Te pregunto el año de la PC", next: "pc_year", set: { goal: "game", machine: "gaming" } },
      { prop: "appstore", label: "Programas y Windows", hint: "Instalar o traer un .exe", next: "p_apps" },
      { prop: "broken_pc", label: "Fallos o PC vieja", hint: "Lentitud, pantalla negra, gráfica", next: "p_hw" },
    ],
  },

  p_game: {
    pixel: "JUEGOS",
    speech: "Según el año de tu PC te digo Mint, Zorin o Bazzite.",
    step: "Juegos",
    question: "Sigue cuando quieras",
    videos: [
      { n: 59, why: "Si la PC es vieja, Mint; si es gamer moderna, Bazzite o Zorin." },
      { n: 81, why: "Bazzite cuando la PC aguanta juegos de verdad." },
      { n: 33, why: "Mint cuando la PC ya va cansada." },
    ],
    options: [
      { prop: "distros", label: "Recomiéndame", hint: "Te pregunto el año", next: "pc_year", set: { goal: "game", machine: "gaming" } },
      redditOpt("Un juego no corre / anticheat"),
    ],
  },

  p_apps: {
    pixel: "PROGRAMAS",
    speech: "¿Quieres instalar en Linux o traer algo de Windows?",
    step: "Apps",
    question: "Elige lo que necesitas",
    options: [
      { prop: "appstore", label: "Instalar programas en Linux", hint: "Tienda, Flatpak, Snap", next: "p_apps_install" },
      { prop: "winbox", label: "Usar algo de Windows", hint: "Bottles, Wine o VM", next: "p_apps_win" },
      redditOpt("Me sale un error raro"),
    ],
  },

  p_apps_install: {
    pixel: "TIENDAS",
    speech: "Si la tienda te lía, mira un video. Si el error no cuadra, pregunta en Reddit.",
    step: "Apps · instalar",
    question: "Mira un video o pregunta a la comunidad",
    videos: [
      { n: 12, why: "Instalar apps con un clic." },
      { n: 84, why: "Flatpak: qué es y cuándo usarlo." },
      { n: 16, why: "Snap en Ubuntu y alternativas." },
    ],
    options: [redditOpt("La tienda falla o no entiendo el mensaje")],
  },

  p_apps_win: {
    pixel: "WINDOWS EN LINUX",
    speech: "A veces hay alternativa; si no, Bottles o una máquina virtual. Si te atascas, la comunidad ayuda.",
    step: "Apps · Windows",
    question: "Mira un video o pregunta a la comunidad",
    videos: [
      { n: 44, why: "Photoshop y Office: sin milagros, con opciones reales." },
      { n: 34, why: "Correr la app de Windows dentro de Linux." },
      { n: 57, why: "Windows en una ventana (máquina virtual)." },
    ],
    options: [redditOpt("Esta app no me funciona")],
  },

  p_hw: {
    pixel: "HARDWARE",
    speech: "¿Qué te falla?",
    step: "Hardware",
    question: "Elige tu caso",
    options: [
      { prop: "laptop_old", label: "PC o laptop vieja", hint: "Quiero darle vida", next: "p_old" },
      { prop: "blackout", label: "No arranca / pantalla negra", hint: "Drivers, BIOS…", next: "p_broke" },
      { prop: "gpu", label: "NVIDIA / gráfica", hint: "Drivers y Wayland", next: "p_gpu" },
    ],
  },

  p_old: {
    pixel: "PC VIEJA",
    speech: "En PCs cansadas Mint suele ir muy bien. Mejor en la PC de verdad que en una VM.",
    step: "PC vieja",
    question: "Elige cómo seguir",
    videos: [
      { n: 33, why: "Mint Cinnamon en hardware cansado." },
      { n: 22, why: "PCs que vuelven a servir." },
      { n: 68, why: "Laptops: qué esperar." },
    ],
    options: [
      /* ya sabemos que es vieja: no volver a preguntar la máquina */
      { prop: "distros", label: "Elegir con la guía", hint: "Solo te falta la prioridad", next: "goal", set: { machine: "old" } },
    ],
  },

  p_broke: {
    pixel: "FALLOS",
    speech: "Tranquilo. Muchas veces es la gráfica. Mira el video; si el error sigue raro, pregunta en Reddit.",
    step: "Fallos",
    question: "Elige cómo seguir",
    videos: [
      { n: 63, why: "Pantalla negra: qué significa." },
      { n: 59, why: "Drivers: Intel y AMD fáciles; NVIDIA es otro cantar." },
      { n: 72, why: "El error que hace volver a Windows derrotado." },
    ],
    options: [
      { prop: "gpu", label: "Es tema de NVIDIA / gráfica", hint: "Más detalle", next: "p_gpu" },
      { prop: "restore", label: "Quiero más estabilidad", hint: "Que se rompa menos", next: "goal", set: { goal: "stable" } },
      redditOpt("Sigo con un error raro"),
    ],
  },

  p_gpu: {
    pixel: "GRÁFICA",
    speech: "Intel y AMD suelen ir solos. NVIDIA pide drivers propios. Mira los videos; si no arranca, pregunta en Reddit.",
    step: "Gráfica",
    question: "Cuando termines, elige",
    videos: [
      { n: 59, why: "Cómo se lleva Linux con cada marca." },
      { n: 74, why: "Wayland y PCs antiguas: cuándo conviene Mint." },
      { n: 18, why: "Por qué NVIDIA fue tan complicada en Linux." },
    ],
    options: [
      { prop: "gaming", label: "Quiero jugar", hint: "Te pregunto el año", next: "pc_year", set: { machine: "gaming", goal: "game" } },
      { prop: "restore", label: "Quiero estabilidad", hint: "Menos drama al actualizar", next: "goal", set: { goal: "stable" } },
      redditOpt("Drivers / pantalla negra"),
    ],
  },
};


function decide(answers, forcedAlt = null) {
  const { machine = "normal", goal = "easy", windows = "no", age = null } = answers;
  const wantsGame = machine === "gaming" || goal === "game";
  /* Guión #59: GPU/PC vieja + Fedora/Bazzite = riesgo. Gamer moderna: Bazzite/Zorin.
     Guión #74: PC “de museo” (≈14+ años): Mint. */
  const ageOld = age === "old" || age === "unknown" || (!age && machine === "old");
  const ageMid = age === "mid";

  const pack = {
    zorin: {
      distro: "Zorin OS",
      tagline: "Fácil si vienes de Windows",
      why: "Menú familiar y tienda clara. Core si la PC es moderna, Lite si tiene muchos años. Steam listo; un .exe a menudo sugiere alternativa o Bottles.",
      videos: [
        { n: 56, why: "Zorin 18: apariencia, .exe, Steam y oficina." },
        { n: 3, why: "Core vs Lite e instalación con USB." },
        { n: 23, why: "Errores de novato a evitar." },
      ],
    },
    mint: {
      distro: "Linux Mint (Cinnamon)",
      tagline: "Claro, estable, bueno en PCs cansadas",
      why: "Menú sencillo y estable. Suele ir muy bien cuando Windows ya va pesado. Pruébalo en la PC de verdad, no solo en una VM.",
      videos: [
        { n: 33, why: "Mint Cinnamon en PCs cansadas." },
        { n: 22, why: "Hardware viejo que vuelve a la vida." },
        { n: 68, why: "Laptops: qué esperar con Linux." },
      ],
    },
    mintGame: {
      distro: "Linux Mint (Cinnamon) + Steam",
      tagline: "Jugar en PC vieja con calma",
      why: "Con PC o gráfica antigua, un Linux que se actualiza muy rápido puede dar fallos. Mint detecta drivers, se lleva mejor con NVIDIA antigua, y puedes instalar Steam. Juegas lo que tu hardware aguante, sin pelearte con el sistema.",
      videos: [
        { n: 33, why: "Mint: la base estable para PCs cansadas." },
        { n: 59, why: "Por qué Mint y no Fedora/Bazzite si la GPU es vieja." },
        { n: 74, why: "PC “de museo”: Mint con soporte largo." },
      ],
    },
    zorinGame: {
      distro: "Zorin OS + Steam",
      tagline: "Jugar fácil en una PC de unos años",
      why: "Zorin trae Steam listo y un escritorio sencillo. Bazzite encaja mejor si la PC es gamer moderna; si la gráfica es NVIDIA antigua, Mint suele ser más seguro.",
      videos: [
        { n: 56, why: "Zorin 18: Steam activado y listo para jugar." },
        { n: 59, why: "Drivers: cuándo Mint gana a distros rápidas." },
        { n: 81, why: "Bazzite actual: conviene si tu PC es más nueva de lo que pensabas." },
      ],
    },
    bazzite: {
      distro: "Bazzite (Linux gamer)",
      tagline: "Jugar primero: atómico y fácil",
      why: "Bazzite también es atómico (inmutable): el sistema se actualiza entero y se rompe menos, pero viene listo para Steam. Más fácil que Fedora Atómico puro. Si tienes NVIDIA, elige la edición Desktop. Algunos online fallan por anticheat (areweanticheatyet.com).",
      videos: [
        { n: 81, why: "Bazzite 2026: instalación, Desktop vs consola y NVIDIA." },
        { n: 20, why: "Cómo jugar casi de todo en Linux (Steam, Proton…)." },
        { n: 61, why: "Anticheats: el límite de algunos online." },
      ],
    },
    atomic: {
      distro: "Fedora Atómico / inmutable",
      tagline: "Actualizar con menos drama",
      why: "El sistema se actualiza entero y se puede volver atrás. Si también juegas y la PC es moderna, mira Bazzite.",
      videos: [
        { n: 50, why: "Qué es un Linux inmutable." },
        { n: 52, why: "Fedora Atómico en la práctica." },
        { n: 19, why: "PC que casi no se rompe al actualizar." },
      ],
    },
  };

  if (forcedAlt && pack[forcedAlt]) {
    const p = pack[forcedAlt];
    return {
      ...p,
      altId: forcedAlt,
      notes: [
        {
          t: "Volver a tu recomendación",
          d: "Regresa al Linux que salió de tus respuestas.",
          clearAlt: true,
        },
      ],
    };
  }

  if (wantsGame) {
    if (ageOld) {
      return {
        ...pack.mintGame,
        notes: [
          { t: "Plan B", d: "Zorin Lite, fácil en PCs de muchos años.", alt: "zorin" },
          { t: "No Bazzite (aún)", d: "Es para PC gamer moderna; en vieja arriesgas fallos (guión drivers)." },
          { t: "NVIDIA / Wayland", d: "Más detalle de gráfica.", go: "p_gpu" },
        ],
      };
    }
    if (ageMid) {
      return {
        ...pack.zorinGame,
        notes: [
          { t: "Plan B", d: "Mint + Steam, si la gráfica es vieja o NVIDIA delicada.", alt: "mintGame" },
          { t: "Plan B", d: "Bazzite, solo si la PC rinde como gamer moderna.", alt: "bazzite" },
          { t: "Ojo", d: "Anticheats duros pueden fallar en cualquier Linux." },
        ],
      };
    }
    return {
      ...pack.bazzite,
      notes: [
        { t: "Plan B", d: "Zorin, escritorio fácil + Steam.", alt: "zorin" },
        { t: "PC más vieja de lo pensado?", d: "Entonces Mint + Steam.", alt: "mintGame" },
        { t: "NVIDIA", d: "Drivers y Wayland.", go: "p_gpu" },
        { t: "Ojo", d: "Algunos online fallan por anticheat." },
      ],
    };
  }

  /* El año manda: “vieja” de hace 5 años no es lo mismo que una de 2012 */
  if (age === "old" || age === "unknown") {
    return {
      ...pack.mint,
      notes: [
        { t: "Plan B", d: "Zorin Lite, otra puerta fácil en PCs antiguas.", alt: "zorin" },
        { t: "Tip", d: "Edición Cinnamon. Si luego quieres jugar: Steam en Mint." },
      ],
    };
  }
  if (age === "mid") {
    return {
      ...pack.zorin,
      notes: [
        { t: "Plan B", d: "Linux Mint, si quieres máxima calma.", alt: "mint" },
        { t: "Juegos (PC moderna)", d: "Bazzite.", alt: "bazzite" },
      ],
    };
  }
  if (age === "new" && machine === "old") {
    return {
      ...pack.zorin,
      notes: [
        { t: "Tip", d: "Aunque se sienta lenta, si es reciente Zorin Core suele ir bien." },
        { t: "Plan B", d: "Mint, si prefieres lo más estable.", alt: "mint" },
      ],
    };
  }
  if (machine === "old") {
    return {
      ...pack.mint,
      notes: [
        { t: "Plan B", d: "Zorin Lite, otra puerta fácil en PCs antiguas.", alt: "zorin" },
        { t: "Tip", d: "Edición Cinnamon. Si luego quieres jugar: Steam en Mint." },
      ],
    };
  }

  if (goal === "stable") {
    return {
      ...pack.mint,
      tagline: "Estable y fácil, sin complicaciones",
      why: "Si quieres que se rompa poco y sin líos, Mint es claro y fácil de cuidar. Bazzite también es atómico (se rompe menos), pero está pensado sobre todo para jugar en PC moderna.",
      notes: [
        { t: "Plan B", d: "Zorin OS, amigable desde Windows.", alt: "zorin" },
        { t: "Juegos + atómico", d: "Bazzite (inmutable gamer, más fácil que Fedora Atómico).", alt: "bazzite" },
      ],
    };
  }

  const base = {
    ...pack.zorin,
    notes: [
      { t: "Plan B", d: "Linux Mint, amigable y muy estable.", alt: "mint" },
      { t: "Juegos (PC moderna)", d: "Bazzite.", alt: "bazzite" },
    ],
  };

  if (windows === "critical") {
    base.why +=
      " Con app crítica: Windows en máquina virtual dentro de Linux.";
    base.videos = [
      { n: 57, why: "Windows en una VM (app crítica)." },
      { n: 56, why: "Zorin como base fácil." },
      { n: 34, why: "Probar primero Bottles/Wine." },
    ];
    base.notes.unshift({
      t: "App crítica",
      d: "Bottles/Wine o máquina virtual.",
      go: "p_apps_win",
    });
  } else if (windows === "sometimes") {
    base.why +=
      " Un .exe: tienda, Bottles, o Adobe en la nube / GIMP-Krita.";
    base.videos = [
      { n: 56, why: "Zorin detecta .exe y te orienta." },
      { n: 34, why: "Bottles/Wine." },
      { n: 44, why: "Photoshop/Office: realidad vs mito." },
    ];
    base.notes.unshift({
      t: "Apps de vez en cuando",
      d: "Bottles, alternativas y VM.",
      go: "p_apps_win",
    });
  }

  return base;
}



function mountGuide(root) {
  const answers = {};
  const history = [];
  let sceneId = "hub";
  let resultAlt = null;

  function paint(panel, pct, scene, coach) {
    const s = scene || SCENES[sceneId] || SCENES.hub;
    const room = roomForScene(sceneId, s);
    const lines = coach?.lines || composeCoachLines(s);
    const videos = coach?.videos || s.videos || [];
    const prompt = coach?.prompt || "▼ HAZ CLIC EN UN OBJETO";
    const canBack = history.length > 0;

    root.innerHTML = "";
    root.classList.add("pnk-game");
    const shell = el(`<div class="pnk-root">
      <div class="pnk-chrome">
        <span class="pnk-chrome-left">
          ${canBack ? `<button type="button" class="pnk-back" id="pnk-back">← Atrás</button>` : ""}
          <span class="pnk-chrome-tagline">Ayudo a empezar con Linux y resolver dudas</span>
        </span>
        <span class="pnk-save">${escapeHtml(s.step || "—")}</span>
      </div>
      <div class="pnk-stage" data-room="${escapeHtml(room)}" style="--pnk-room:url('assets/room-${escapeHtml(room)}.png')">
        <div class="pnk-room">
          <div class="pnk-room-label">${escapeHtml(s.pixel || "SALA")}</div>
          <div class="pnk-coach">
            <div class="pnk-actor">
              <img src="assets/mascota-guia.png" alt="" width="168" height="168" />
            </div>
            <div class="pnk-speech">
              <span class="pnk-dialog-name">Tu guía experto</span>
              <div class="pnk-dialog-text" id="pnk-say"></div>
              <div class="pnk-tapes-slot" id="pnk-tapes-slot"></div>
              <p class="pnk-dialog-prompt">${escapeHtml(prompt)}</p>
            </div>
          </div>
        </div>
        <div class="pnk-hotspots" id="pnk-hotspots"></div>
      </div>
      <div class="pnk-progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
      <div class="pnk-lower" id="pnk-lower"></div>
    </div>`);
    root.appendChild(shell);

    fillCoachSpeech($("#pnk-say", shell), lines);
    const tapesSlot = $("#pnk-tapes-slot", shell);
    const tapes = renderRoomTapes(videos);
    if (!tapes.hidden) tapesSlot.appendChild(tapes);
    else tapesSlot.hidden = true;

    const backBtn = $("#pnk-back", shell);
    if (backBtn) backBtn.onclick = () => goBack();

    $("#pnk-lower", shell).appendChild(panel);
    return shell;
  }

  function appendBackHotspot(hot) {
    if (!hot || history.length === 0) return;
    const btn = optionButton({
      prop: "back",
      label: "Atrás",
      hint: "Escena anterior",
    });
    btn.classList.add("pnk-hotspot--back");
    btn.onclick = () => goBack();
    hot.appendChild(btn);
  }

  function goBack() {
    const prev = history.pop();
    if (!prev) {
      sceneId = "hub";
      Object.keys(answers).forEach((k) => delete answers[k]);
      resultAlt = null;
    } else {
      sceneId = prev;
      resultAlt = null;
    }
    render();
    root.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function go(next, set) {
    if (set) Object.assign(answers, set);
    if (next === "hub") {
      Object.keys(answers).forEach((k) => delete answers[k]);
      resultAlt = null;
      history.length = 0;
      sceneId = "hub";
      render();
      root.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const wantsGame = answers.machine === "gaming" || answers.goal === "game";

    /* Compat: la pregunta de apps ya no va en el camino principal */
    if (next === "windows" && sceneId !== "result") {
      next = "result";
    }

    /* Después del año: si aún falta prioridad (PC vieja), preguntarla; si ya juega, al resultado */
    if (next === "after_year") {
      if (wantsGame || answers.goal) next = "result";
      else next = "goal";
    }

    /* Ya dijo que es para jugar: no preguntar otra vez la prioridad */
    if (next === "goal" && answers.machine === "gaming") {
      answers.goal = answers.goal || "game";
      next = answers.age ? "result" : "pc_year";
    }

    /* Quiere jugar y aún no hay año */
    if (next === "result" && wantsGame && !answers.age) {
      next = "pc_year";
    }

    /* PC marcada vieja/lenta: igual preguntamos año (puede ser de hace 5 años) */
    if (next === "result" && answers.machine === "old" && !answers.age) {
      next = "pc_year";
    }

    /* Ya fijamos machine=old: no volver a preguntar la PC */
    if (next === "machine" && answers.machine === "old") {
      next = answers.age ? "goal" : "pc_year";
    }

    if (sceneId && sceneId !== next) history.push(sceneId);
    sceneId = next;
    render();
    root.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function renderResult() {
    const r = decide(answers, resultAlt);
    const isAlt = Boolean(resultAlt);
    const scene = {
      pixel: "FINAL",
      speech: isAlt
        ? `Plan B: ${r.distro}.`
        : `Te va bien con ${r.distro}.`,
      step: isAlt ? "PLAN B" : "CAPÍTULO COMPLETO",
      videos: r.videos,
    };
    const panel = el(`<div class="quiz-result">
      <p class="pnk-quest">${isAlt ? "PLAN B" : "OBJETIVO CUMPLIDO"}</p>
      <div class="quiz-result-card">
        <p class="eyebrow-res">TU LINUX</p>
        <p class="distro">${escapeHtml(r.distro)}</p>
        <p>${escapeHtml(r.tagline)}</p>
        <p class="quiz-why"><strong>Por qué:</strong> ${escapeHtml(r.why)}</p>
      </div>
      <ul class="quiz-alts"></ul>
      <div class="quiz-actions">
        <button type="button" class="btn btn-primary" data-n="hub">NUEVA PARTIDA</button>
        <a class="btn btn-ghost" href="#temas">MAPA DE TEMAS</a>
      </div>
    </div>`);

    const ul = $(".quiz-alts", panel);
    (r.notes || []).forEach((n) => {
      const clickable = n.alt || n.go || n.clearAlt;
      if (clickable) {
        const btn = el(`<button type="button" class="quiz-alt-btn">
          <strong>${escapeHtml(n.t)}</strong>
          <span>${escapeHtml(n.d)}</span>
          <em>Toca para que te guíe →</em>
        </button>`);
        btn.onclick = () => {
          if (n.clearAlt) {
            resultAlt = null;
            renderResult();
            return;
          }
          if (n.alt) {
            resultAlt = n.alt;
            renderResult();
            return;
          }
          if (n.go) go(n.go, n.set);
        };
        ul.appendChild(btn);
      } else {
        ul.appendChild(
          el(`<li><strong>${escapeHtml(n.t)}:</strong> ${escapeHtml(n.d)}</li>`)
        );
      }
    });
    /* Duda opcional con apps de Windows (no bloquea la elección) */
    if (!resultAlt) {
      const winBtn = el(`<button type="button" class="quiz-alt-btn">
        <strong>¿Duda con apps de Windows?</strong>
        <span>Office, Photoshop u otra app que solo tienes ahí.</span>
        <em>Opcional, si te queda esa duda →</em>
      </button>`);
      winBtn.onclick = () => go("windows");
      ul.appendChild(winBtn);
    }
    /* Reddit oficial: dudas o errores que la guía no cubre */
    const redditBtn = el(`<a class="quiz-alt-btn" href="${escapeHtml(REDDIT_URL)}" target="_blank" rel="noopener noreferrer">
      <strong>¿Dudas o un error raro?</strong>
      <span>Pregunta en el Reddit oficial de la comunidad.</span>
      <em>Abre r/linuxparanoobs →</em>
    </a>`);
    ul.appendChild(redditBtn);

    $("[data-n]", panel).onclick = () => go("hub");
    paint(panel, 100, scene, {
      lines: composeCoachLines(scene),
      videos: r.videos,
      prompt: "▼ FIN, toca un video, Plan B o Atrás",
    });
    appendBackHotspot($("#pnk-hotspots", root));
  }

  function render() {
    if (sceneId === "result") {
      renderResult();
      return;
    }

    const scene = SCENES[sceneId] || SCENES.hub;
    const chooseFlow = ["hub", "machine", "goal", "pc_year", "result"];
    let pct = 12;
    if (chooseFlow.includes(sceneId)) {
      pct = Math.round(((chooseFlow.indexOf(sceneId) + 1) / chooseFlow.length) * 100);
    } else if (sceneId.startsWith("start")) {
      pct = sceneId === "start_fear" ? 25 : sceneId === "start_try" ? 70 : 45;
    } else {
      pct = 40;
    }

    const panel = el(`<div>
      <p class="pnk-quest">${escapeHtml(scene.question || "")}</p>
    </div>`);

    const hasOpts = (scene.options || []).length > 0;
    const canBack = history.length > 0;
    paint(panel, Math.min(pct, 95), scene, {
      lines: composeCoachLines(scene),
      videos: scene.videos || [],
      prompt: scene.videos?.length
        ? hasOpts
          ? "▼ ELIGE UN OBJETO · o un video"
          : "▼ MIRA UN VIDEO · o Atrás"
        : canBack
          ? "▼ HAZ CLIC EN UN OBJETO · o Atrás"
          : "▼ HAZ CLIC EN UN OBJETO",
    });

    const hot = $("#pnk-hotspots", root);
    (scene.options || []).forEach((opt) => {
      const btn = optionButton(opt);
      if (opt.href) {
        btn.addEventListener("click", () => {
          if (opt.next) go(opt.next, opt.set);
        });
      } else {
        btn.onclick = () => go(opt.next, opt.set);
      }
      hot.appendChild(btn);
    });
    appendBackHotspot(hot);
  }

  render();
}

function boot() {
  const root = document.getElementById("quiz-root");
  if (!root) return;
  const start = () => mountGuide(root);
  if (window.LPN?.getData?.()) start();
  else window.addEventListener("lpn:ready", start, { once: true });
}

boot();
