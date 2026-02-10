(function () {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return renderError("Missing project id. Open from the home page.");
function fixDriveUrl(url) {
  if (!url) return url;

  const match = url.match(/\/d\/([^/]+)/);
  if (!match) return url;

  const id = match[1];
  return `https://drive.google.com/uc?export=download&id=${id}`;
}

  fetch("projects.json")
    .then(r => {
      if (!r.ok) throw new Error("projects.json not found: " + r.status);
      return r.json();
    })
    .then(projects => {
      const project = projects.find(p => p.id === id);
      if (!project) throw new Error("Project not found for id: " + id);

      document.title = `${project.title} — Portfolio`;

      setText("projectTitle", project.title || "");
      setText("projectSubtitle", project.subtitle || "");
      setText("projectOneLiner", project.oneLiner || "");

      // Hero media (center)
      const heroWrap = document.getElementById("projectHeroMedia");
      heroWrap.innerHTML = "";
      const heroMedia = project.heroMedia
        ? project.heroMedia
        : (project.heroImage ? { type: "image", src: project.heroImage } : null);

      if (heroMedia) heroWrap.appendChild(renderMedia(heroMedia, project.title, true));

      // Stack pills
      const stackWrap = document.getElementById("projectStack");
      stackWrap.innerHTML = "";
      (project.stack || []).forEach(t => stackWrap.appendChild(makePill(t)));

      // Links (safe even if you removed from JSON)
      const linksWrap = document.getElementById("projectLinks");
      if (linksWrap) {
        linksWrap.innerHTML = "";
        const links = project.links || {};
        addLink(linksWrap, links.play, "Play");
        addLink(linksWrap, links.code, "Code");
        addLink(linksWrap, links.video, "Video");
      }

      // FLOW (media then text)
      const flow = document.getElementById("projectFlow");
      flow.innerHTML = "";

      (project.sections || []).forEach(s => {
        // media first
        if (s.media) {
          // If you pass an array, render side-by-side row
          if (Array.isArray(s.media)) {
            const row = document.createElement("div");
            row.className = "flow-media-row";
            s.media.forEach(m => {
              if (m && m.src) row.appendChild(renderMedia(m, s.title || project.title, false));
            });
            flow.appendChild(row);
          } else if (s.media.src) {
            flow.appendChild(renderMedia(s.media, s.title || project.title, false));
          }
        }

        // text under it (+ devlog link)
        if (s.title || s.text || (s.devlog && s.devlog.url)) {
          const block = document.createElement("div");
          block.className = "flow-text";

          if (s.title) {
            const h3 = document.createElement("h3");
            h3.className = "flow-title";
            h3.textContent = s.title;
            block.appendChild(h3);
          }

          if (s.text) {
            const p = document.createElement("p");
            p.className = "flow-desc";
            p.textContent = s.text;
            block.appendChild(p);
          }

          // ✅ Devlog line: "For a detailed devlog on this project, <link>."
          if (s.devlog && s.devlog.url) {
            const dev = document.createElement("p");
            dev.className = "flow-devlog";

            dev.appendChild(document.createTextNode(""));

            const a = document.createElement("a");
            a.href = s.devlog.url;
            a.target = "_blank";
            a.rel = "noreferrer";
            a.textContent = (s.devlog.label && s.devlog.label.trim())
              ? s.devlog.label
              : "read it here";

            dev.appendChild(a);
            dev.appendChild(document.createTextNode(""));

            block.appendChild(dev);
          }

          flow.appendChild(block);
        }
      });

      // Gallery
// const gallery = document.getElementById("projectGallery");
// gallery.innerHTML = "";
// (project.gallery || []).forEach(src => {
//         const img = document.createElement("img");
//         img.src = src;
//         img.alt = `${project.title} screenshot`;
//         img.className = "gallery-img";

//         img.addEventListener("click", () => openLightbox(src, img.alt));

//         gallery.appendChild(img);
//       });
    })
    .catch(err => {
      console.error(err);
      renderError("Could not load this project. Check console + file paths.");
    });

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function renderError(msg) {
    document.body.innerHTML =
      `<div class="page"><main class="content">
        <a class="back-btn" href="index.html">← Back</a>
        <h1 style="margin-top:16px;">Error</h1>
        <p>${escapeHtml(msg)}</p>
      </main></div>`;
  }

  function makePill(text) {
    const span = document.createElement("span");
    span.className = "pill";
    span.textContent = text;
    return span;
  }

  function addLink(parent, href, label) {
    if (!href) return;
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.className = "project-link-btn";
    a.textContent = label;
    parent.appendChild(a);
  }
  function renderPlayableVideo(src, heroMode) {
  if (!src || typeof src !== "string") return document.createTextNode("");

  // Extract Drive file id if it’s a Drive "file/d/.../view" link
  const m = src.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  const isDrive = !!m;

  // 1) Google Drive: embed their player (reliable playback)
  if (isDrive) {
    const id = m[1];
    const iframe = document.createElement("iframe");
    iframe.className = heroMode ? "hero-video" : "flow-video";
    iframe.src = `https://drive.google.com/file/d/${encodeURIComponent(id)}/preview`;
    iframe.allow = "autoplay; fullscreen";
    iframe.allowFullscreen = true;
    iframe.frameBorder = "0";
    return iframe;
  }

  // 2) Normal video URL: use <video>
  const v = document.createElement("video");
  v.className = heroMode ? "hero-video" : "flow-video";
  v.src = src;
  v.controls = true;
  v.playsInline = true;
  // Optional: keep your old behaviour if you want
  v.muted = true;
  v.loop = true;
  return v;
}

  // heroMode makes it bigger + centered
  function renderMedia(media, altTitle, heroMode) {
  if (!media || !media.src) return document.createTextNode("");

  // Wrapper so we can overlay badge
  const wrap = document.createElement("div");
  wrap.className = heroMode ? "hero-media" : "flow-media";
  if(media.type === "video") wrap.classList.add("is-video");

  function toDirectVideoUrl(url) {
  if (!url || typeof url !== "string") return url;

  // Match both /file/d/ID/... and open?id=ID forms
  const m =
    url.match(/drive\.google\.com\/file\/d\/([^/]+)/) ||
    url.match(/[?&]id=([^&]+)/);

  if (!m) return url; // not a Drive link we recognize

  const id = m[1];
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
}
  let el;

  if (media.type === "video") {
    el = renderPlayableVideo(media.src, heroMode);
    // const v = document.createElement("video");
    // v.className = heroMode ? "hero-video" : "flow-video";
    // v.src = toDirectVideoUrl(media.src);
    // v.autoplay = true;
    // v.muted = true;
    // v.loop = true;
    // v.playsInline = true;
    // v.controls = false;
    // if (media.poster) v.poster = media.poster;
    // el = v;
  } else {
    const img = document.createElement("img");
    img.className = heroMode ? "hero-image" : "flow-image";
    img.src = media.src;
    img.alt = altTitle || "Project media";
    el = img;
  }

  wrap.appendChild(el);

  // Badge overlay (e.g., "In-Engine picture")
  if (media.badge) {
    const b = document.createElement("span");
    b.className = "media-badge";
    b.textContent = media.badge;
    wrap.appendChild(b);
  }

  return wrap;
}


  function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => (
    { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[s]
  ));
}
function openLightbox(src, alt) {
    // prevent duplicates
    const existing = document.getElementById("lightbox");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "lightbox";
    overlay.className = "lightbox";

    overlay.innerHTML = `
      <div class="lightbox-backdrop"></div>
      <div class="lightbox-panel" role="dialog" aria-modal="true">
        <button class="lightbox-close" aria-label="Close">×</button>
        <img class="lightbox-img" src="${src}" alt="${escapeHtml(alt)}" />
      </div>
    `;

    document.body.appendChild(overlay);

    // close interactions
    overlay.querySelector(".lightbox-backdrop").addEventListener("click", closeLightbox);
    overlay.querySelector(".lightbox-close").addEventListener("click", closeLightbox);

    document.addEventListener("keydown", onLightboxKey);
  }


function closeLightbox() {
    const overlay = document.getElementById("lightbox");
    if (overlay) overlay.remove();
    document.removeEventListener("keydown", onLightboxKey);
  }
  function onLightboxKey(e) {
    if (e.key === "Escape") closeLightbox();
  }
  // Lightbox (opens on same page)
  function openLightbox(src, alt) {
    // remove existing if any
    const existing = document.getElementById("lightboxOverlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "lightboxOverlay";

    // inline styles so it works even if CSS missing
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.75)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";
    overlay.style.padding = "24px";

    const panel = document.createElement("div");
    panel.style.position = "relative";
    panel.style.maxWidth = "1100px";
    panel.style.width = "100%";

    const img = document.createElement("img");
    img.src = src;
    img.alt = alt || "";
    img.style.width = "100%";
    img.style.height = "auto";
    img.style.borderRadius = "16px";
    img.style.display = "block";
    img.style.boxShadow = "0 20px 80px rgba(0,0,0,0.45)";

    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Close");
    close.innerHTML = "&times;";
    close.style.position = "absolute";
    close.style.top = "-10px";
    close.style.right = "0";
    close.style.width = "44px";
    close.style.height = "44px";
    close.style.borderRadius = "999px";
    close.style.border = "1px solid rgba(255,255,255,0.25)";
    close.style.background = "rgba(20,20,20,0.75)";
    close.style.color = "#fff";
    close.style.fontSize = "28px";
    close.style.cursor = "pointer";

    panel.appendChild(close);
    panel.appendChild(img);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const closeNow = () => overlay.remove();

    // click outside closes
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeNow();
    });
    close.addEventListener("click", closeNow);

    // Esc closes
    const onKey = (e) => {
      if (e.key === "Escape") {
        document.removeEventListener("keydown", onKey);
        closeNow();
      }
    };
    document.addEventListener("keydown", onKey);
  }

  // Disable “coming soon” cards (click does nothing but hover still works)
  document.querySelectorAll('a.card[data-disabled="true"]').forEach(a => {
    a.addEventListener('click', (e) => e.preventDefault());
    a.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
    });
  });
})();
