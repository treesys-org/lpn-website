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

function openPlayer(video) {
  const modal = $("#player-modal");
  const id = ytId(video);
  $("#modal-title").textContent = video.title;
  $("#modal-desc").textContent = video.desc || video.tip || "";
  $("#modal-yt").href = video.url || `https://www.youtube.com/watch?v=${id}`;
  $("#modal-embed").innerHTML = id
    ? `<iframe src="https://www.youtube.com/embed/${id}" title="${escapeAttr(video.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>`
    : `<p>Video no disponible.</p>`;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closePlayer() {
  $("#player-modal").hidden = true;
  $("#modal-embed").innerHTML = "";
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
  const lines = [
    "linuxparanoobs.com",
    "Inhaber: Carlos Valin",
    "Geschäftsadresse: Oberstr. 3, 47829 Krefeld",
    "Tel: 0 21 51 / 97 18 727",
    "E-Mail: {EMAIL}",
    "",
    "Diensteanbieter nach § 5 DDG",
    "Verantwortlich nach § 18 Abs. 2 MStV: Carlos Valin",
    "",
    "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.",
  ];
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
