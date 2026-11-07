const state = {
  data: null,
  filter: "primeros-pasos",
  query: "",
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function ytId(v) {
  return v.id || (v.url || "").split("v=")[1] || "";
}

function thumb(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function byN(data, n) {
  return data?.videos?.find((v) => v.n === n);
}

function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sortedCategories(data) {
  return Object.entries(data.categories)
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => a.order - b.order);
}

/** Parse `m:ss` / `mm:ss` / `h:mm:ss` → seconds. */
function timeToSeconds(stamp) {
  const parts = String(stamp)
    .trim()
    .split(":")
    .map((n) => Number(n));
  if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

const CHAPTER_LINE_RE =
  /^\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:[–—\-·•:]\s*)?(.+?)\s*$/;
const CHAPTER_HEADER_RE = /^\s*(?:[⏱🕐⏱️]\s*)?cap[ií]tulos(?:\s+del\s+video)?\s*:?\s*$/i;

/**
 * Extract YouTube-style chapter lines from a description.
 * Returns { chapters: [{seconds, stamp, title}], body }.
 */
function extractChapters(desc) {
  const raw = String(desc || "");
  if (!raw.trim()) return { chapters: [], body: "" };

  const lines = raw.split(/\r?\n/);
  const parsed = lines.map((line, index) => {
    if (/https?:\/\//i.test(line)) return null;
    const m = line.match(CHAPTER_LINE_RE);
    if (!m) return null;
    const stamp = m[1];
    const title = (m[2] || "").trim();
    if (!title || /^https?:\/\//i.test(title)) return null;
    const seconds = timeToSeconds(stamp);
    if (seconds == null) return null;
    return { index, seconds, stamp, title };
  });

  const headerIdx = lines.findIndex((l) => CHAPTER_HEADER_RE.test(l));
  let chosen = [];

  if (headerIdx >= 0) {
    for (let i = headerIdx + 1; i < parsed.length; i++) {
      if (parsed[i]) chosen.push(parsed[i]);
      else if (chosen.length && String(lines[i] || "").trim() === "") continue;
      else if (chosen.length) break;
    }
  }

  if (chosen.length < 2) {
    // Longest consecutive run of timestamp lines (tolerate blank lines).
    let best = [];
    let run = [];
    for (let i = 0; i < parsed.length; i++) {
      if (parsed[i]) {
        run.push(parsed[i]);
      } else if (String(lines[i] || "").trim() === "") {
        continue;
      } else {
        if (run.length > best.length) best = run;
        run = [];
      }
    }
    if (run.length > best.length) best = run;
    chosen = best;
  }

  // Need a real list (not a stray time in prose).
  if (chosen.length < 2) return { chapters: [], body: raw.trim() };

  // Prefer non-decreasing times; drop obvious outliers at the end.
  const chapters = [];
  let last = -1;
  for (const ch of chosen) {
    if (ch.seconds < last) break;
    chapters.push(ch);
    last = ch.seconds;
  }
  if (chapters.length < 2) return { chapters: [], body: raw.trim() };

  const skip = new Set(chapters.map((c) => c.index));
  if (headerIdx >= 0) skip.add(headerIdx);
  // Drop a lone "Capítulos" label right above the block if not already matched.
  const firstIdx = chapters[0].index;
  if (firstIdx > 0 && /cap[ií]tulos/i.test(lines[firstIdx - 1] || "")) {
    skip.add(firstIdx - 1);
  }

  const body = lines
    .filter((_, i) => !skip.has(i))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { chapters, body };
}

function formatStamp(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function embedSrc(id, startSec = 0, autoplay = false) {
  const params = new URLSearchParams();
  if (startSec > 0) params.set("start", String(Math.floor(startSec)));
  if (autoplay) params.set("autoplay", "1");
  const q = params.toString();
  return `https://www.youtube.com/embed/${id}${q ? `?${q}` : ""}`;
}

function watchUrl(id, startSec = 0) {
  const base = `https://www.youtube.com/watch?v=${id}`;
  return startSec > 0 ? `${base}&t=${Math.floor(startSec)}s` : base;
}

function renderChapters(chapters, activeSec = null) {
  const root = $("#modal-chapters");
  if (!root) return;
  if (!chapters.length) {
    root.hidden = true;
    root.innerHTML = "";
    return;
  }
  root.hidden = false;
  root.innerHTML = `<p class="modal-chapters-label">Capítulos</p><ul class="modal-chapters-list">${chapters
    .map((ch) => {
      const active =
        activeSec != null && Number(activeSec) === ch.seconds ? " is-active" : "";
      return `<li>
        <button type="button" class="modal-chapter${active}" data-seek="${ch.seconds}">
          <span class="modal-chapter-time">${escapeHtml(formatStamp(ch.seconds))}</span>
          <span class="modal-chapter-title">${escapeHtml(ch.title)}</span>
        </button>
      </li>`;
    })
    .join("")}</ul>`;
}

function seekPlayer(seconds) {
  const iframe = $("#modal-embed iframe");
  if (!iframe) return;
  const id = iframe.dataset.ytid;
  if (!id) return;
  const sec = Math.max(0, Math.floor(Number(seconds) || 0));
  iframe.src = embedSrc(id, sec, true);
  const yt = $("#modal-yt");
  if (yt) yt.href = watchUrl(id, sec);
  $$(".modal-chapter").forEach((btn) => {
    btn.classList.toggle("is-active", Number(btn.dataset.seek) === sec);
  });
}

function openPlayer(video, startSec = 0) {
  const modal = $("#player-modal");
  const id = ytId(video);
  const { chapters, body } = extractChapters(video.desc || "");
  const descText = body || video.tip || "";
  const start = Math.max(0, Math.floor(Number(startSec) || 0));

  $("#modal-title").textContent = video.title;
  $("#modal-desc").textContent = descText;
  $("#modal-desc").hidden = !descText;
  $("#modal-yt").href = watchUrl(id, start) || video.url || "#";
  $("#modal-embed").innerHTML = id
    ? `<iframe data-ytid="${escapeAttr(id)}" src="${escapeAttr(embedSrc(id, start, start > 0))}" title="${escapeAttr(video.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`
    : `<p>Video no disponible.</p>`;
  renderChapters(chapters, start > 0 ? start : chapters[0]?.seconds ?? null);
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closePlayer() {
  $("#player-modal").hidden = true;
  $("#modal-embed").innerHTML = "";
  const chapters = $("#modal-chapters");
  if (chapters) {
    chapters.hidden = true;
    chapters.innerHTML = "";
  }
  document.body.style.overflow = "";
}

/** Contacto del operador: no literal en HTML; se arma en runtime (técnica Treesys). */
function publisherEmail() {
  const c = [115, 117, 112, 112, 111, 114, 116, 64, 116, 114, 101, 101, 115, 121, 115, 46, 111, 114, 103];
  return c.map((n) => String.fromCharCode(n)).join("");
}

function obfuscatedEmailHtml(eml) {
  const reversed = String(eml || "")
    .split("")
    .reverse()
    .join("");
  let b64 = "";
  try {
    b64 = btoa(unescape(encodeURIComponent(eml || "")));
  } catch {
    /* ignore */
  }
  return `<span class="obf-email" data-eml-b64="${escapeAttr(b64)}" role="button" tabindex="0" aria-label="Copiar dirección de correo" title="Copiar dirección de correo">${escapeHtml(reversed)}</span>`;
}

function publisherDetailsHtml() {
  const lines = ["E-Mail: {EMAIL}"];
  const parts = lines.join("\n").split("{EMAIL}");
  return parts.map(escapeHtml).join(obfuscatedEmailHtml(publisherEmail()));
}

function bindObfuscatedEmail(root) {
  if (!root) return;
  root.querySelectorAll(".obf-email").forEach((el) => {
    if (el.__obfBound) return;
    el.__obfBound = true;
    const decode = () => {
      const b = el.getAttribute("data-eml-b64") || "";
      try {
        return decodeURIComponent(escape(atob(b)));
      } catch {
        return "";
      }
    };
    const copy = async () => {
      const v = decode();
      if (!v) return;
      let done = false;
      try {
        await navigator.clipboard.writeText(v);
        done = true;
      } catch {
        /* ignore */
      }
      if (!done) {
        try {
          const ta = document.createElement("textarea");
          ta.value = v;
          ta.setAttribute("readonly", "");
          ta.style.position = "absolute";
          ta.style.left = "-9999px";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          done = true;
        } catch {
          /* ignore */
        }
      }
      if (!done) {
        try {
          window.open(`mailto:${v}`, "_blank", "noopener");
        } catch {
          /* ignore */
        }
        return;
      }
      const original = el.textContent;
      el.textContent = "✓ Copiado";
      el.classList.add("is-copied");
      setTimeout(() => {
        if (el.classList.contains("is-copied")) {
          el.textContent = original;
          el.classList.remove("is-copied");
        }
      }, 1400);
    };
    el.addEventListener("click", (ev) => {
      ev.preventDefault();
      copy();
    });
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        copy();
      }
    });
  });
}

function openImpressum() {
  const modal = $("#impressum-modal");
  const pre = $("#impressum-details");
  if (!modal || !pre) return;
  pre.innerHTML = publisherDetailsHtml();
  bindObfuscatedEmail(pre);
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeImpressum() {
  const modal = $("#impressum-modal");
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}

function renderTopics(data) {
  const root = $("#topic-grid");
  if (!root) return;
  root.innerHTML = sortedCategories(data)
    .map((c) => {
      const count = data.videos.filter((v) => v.category === c.id).length;
      const active = state.filter === c.id ? " is-active" : "";
      return `<button class="topic-card${active}" type="button" data-topic="${c.id}">
        <span class="topic-emoji" aria-hidden="true">${c.emoji || "📁"}</span>
        <span class="topic-body">
          <strong>${escapeHtml(c.title)}</strong>
          <span>${escapeHtml(c.blurb)}</span>
        </span>
        <span class="topic-count">${count}</span>
      </button>`;
    })
    .join("");
}

function renderCategoryTags(data) {
  const root = $("#category-tags");
  if (!root) return;
  root.innerHTML = sortedCategories(data)
    .map((c) => {
      const active = state.filter === c.id ? " is-active" : "";
      return `<button type="button" class="chip category-tag${active}" data-topic="${c.id}">
        <span aria-hidden="true">${c.emoji || "📁"}</span> ${escapeHtml(c.title)}
      </button>`;
    })
    .join("");
}

function filteredVideos(data) {
  return data.videos
    .filter((v) => (state.filter === "all" ? true : v.category === state.filter))
    .filter((v) => {
      if (!state.query) return true;
      const hay = [v.title, v.desc, v.tip, ...(v.tags || []), v.category]
        .join(" ")
        .toLowerCase();
      return state.query.split(/\s+/).every((t) => hay.includes(t));
    })
    .sort((a, b) => a.n - b.n);
}

function renderVideos(data) {
  const list = filteredVideos(data);
  const cat =
    state.filter === "all" ? null : data.categories[state.filter];
  const sub = $("#videos-subtitle");
  if (sub) {
    sub.textContent = cat
      ? `Tema: ${cat.emoji || ""} ${cat.title}`
      : "Elige un tema arriba, o busca por palabra.";
  }
  const clear = $("#clear-filter");
  if (clear) clear.hidden = state.filter === "all";

  $("#result-meta").textContent = `${list.length} video${list.length === 1 ? "" : "s"}`;
  $("#video-list").innerHTML = list
    .map((v) => {
      const id = ytId(v);
      const c = data.categories[v.category];
      return `<article class="video-card" id="video-${v.n}">
        <button class="video-thumb" type="button" data-open="${v.n}" aria-label="Reproducir ${escapeAttr(v.title)}">
          <img src="${thumb(id)}" alt="" loading="lazy" width="480" height="360" />
        </button>
        <div class="video-body">
          <div class="video-cat">${escapeHtml((c?.emoji || "") + " " + (c?.title || ""))}</div>
          <h3>${escapeHtml(v.title)}</h3>
          <p class="video-tip">${escapeHtml(v.tip || "")}</p>
          <div class="video-actions">
            <button class="btn btn-primary" type="button" data-open="${v.n}">Ver</button>
            <a class="btn btn-ghost" href="${escapeAttr(v.url)}" target="_blank" rel="noopener noreferrer">YouTube</a>
          </div>
        </div>
      </article>`;
    })
    .join("");

  renderTopics(data);
  renderCategoryTags(data);
}

function setFilter(id) {
  state.filter = id;
  renderVideos(state.data);
  if (id !== "all") {
    $("#videos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function initReveal() {
  const nodes = $$(".reveal");
  if (!nodes.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((n) => n.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  nodes.forEach((n) => io.observe(n));
}

function bindUi() {
  const header = $(".site-header");
  const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  $("#search")?.addEventListener("input", (e) => {
    state.query = e.target.value.trim().toLowerCase();
    renderVideos(state.data);
  });

  $("#clear-filter")?.addEventListener("click", () => setFilter("all"));

  $("#open-impressum")?.addEventListener("click", openImpressum);

  document.addEventListener("click", (e) => {
    const topic = e.target.closest("[data-topic]");
    if (topic) {
      const id = topic.dataset.topic;
      setFilter(state.filter === id ? "all" : id);
      return;
    }
    const seekBtn = e.target.closest("[data-seek]");
    if (seekBtn && !seekBtn.closest("[data-open]")) {
      e.preventDefault();
      seekPlayer(seekBtn.dataset.seek);
      return;
    }
    const openBtn = e.target.closest("[data-open]");
    if (openBtn) {
      e.preventDefault();
      const video = byN(state.data, Number(openBtn.dataset.open));
      if (video) openPlayer(video);
      return;
    }
    if (e.target.closest("[data-close]")) closePlayer();
    if (e.target.closest("[data-close-impressum]")) closeImpressum();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closePlayer();
      closeImpressum();
    }
  });

  window.LPN = {
    openPlayer,
    byN: (n) => byN(state.data, n),
    getData: () => state.data,
  };
}

async function main() {
  bindUi();
  initReveal();
  const res = await fetch("data/videos.json");
  state.data = await res.json();
  renderVideos(state.data);
  window.dispatchEvent(new CustomEvent("lpn:ready", { detail: state.data }));
}

main().catch((err) => {
  console.error(err);
  const list = $("#video-list");
  if (list) {
    list.innerHTML =
      `<p style="color:#ff6b6b;text-align:center">No se pudo cargar el catálogo. Usa un servidor local.</p>`;
  }
});
