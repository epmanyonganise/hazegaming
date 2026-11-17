/* ==========================================================================
   HAZE Gaming — SITE LOGIC
   --------------------------------------------------------------------------
   You normally DON'T need to edit this file. Content lives in /data:
     data/config.json   Discord link, games, social links
     data/members.json  Member list
     data/events.json   Events & tournaments

   Contents
     1. Helpers
     2. Header + mobile menu + active link
     3. Scroll reveal ("out of the mist")
     4. Hero smoke (canvas)
     5. Load the data files
     6. Apply settings (Discord links, games, socials)
     7. Members grid
     8. Events list
     9. Name forge (HAZE name generator)
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* 1. HELPERS ============================================================= */

  // Make text safe to put inside HTML (stops a stray < or & breaking the page)
  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function icon(id) { return '<svg aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }

  // Fetch a JSON file from /data (no-cache so edits show up straight away)
  function loadJSON(path) {
    return fetch(path, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error(path + " → HTTP " + res.status);
      return res.json();
    });
  }


  /* 2. HEADER, MOBILE MENU, ACTIVE LINK ==================================== */

  var header = $("#header");
  var nav = $("#nav");
  var toggle = $("#navToggle");

  // Solid header background once you scroll down
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 20); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Open / close the mobile menu
  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
  $all("a", nav).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // Highlight the nav link for the section on screen
  if ("IntersectionObserver" in window) {
    var navLinks = $all('.nav a[href^="#"]:not(.btn)');
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = "#" + entry.target.id;
        navLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $all("main section[id]").forEach(function (s) { sectionObserver.observe(s); });
  }


  /* 3. SCROLL REVEAL ======================================================= */
  // Anything with class="reveal" drifts in out of a blur when scrolled to.

  var revealObserver = ("IntersectionObserver" in window && !reduceMotion)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" })
    : null;

  function watchReveal(els) {
    els.forEach(function (el, i) {
      el.style.transitionDelay = (i % 6) * 80 + "ms"; // small stagger within a group
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add("is-visible");
    });
  }
  watchReveal($all("section .reveal"));


  /* 4. HERO SMOKE ========================================================== */
  // Soft mint/teal puffs drift slowly upward and fade, drawn on a <canvas>.
  // Kept light: few particles, capped resolution, pauses when off screen.

  (function smoke() {
    var canvas = $("#smoke");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = 0, h = 0, particles = [], running = false, rafId = 0, last = 0;

    // Pre-render one soft puff per colour (much faster than gradients every frame)
    function makePuff(r, g, b, strength) {
      var size = 256, c = document.createElement("canvas");
      c.width = c.height = size;
      var x = c.getContext("2d");
      var grad = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, "rgba(" + r + "," + g + "," + b + "," + strength + ")");
      grad.addColorStop(0.45, "rgba(" + r + "," + g + "," + b + "," + strength * 0.4 + ")");
      grad.addColorStop(1, "rgba(" + r + "," + g + "," + b + ",0)");
      x.fillStyle = grad;
      x.fillRect(0, 0, size, size);
      return c;
    }
    var puffs = [
      makePuff(46, 143, 116, 0.6),   // Smoke Teal
      makePuff(46, 143, 116, 0.6),
      makePuff(46, 143, 116, 0.45),
      makePuff(94, 245, 200, 0.22),  // Haze Mint (subtle)
    ];

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = w < 600 ? 14 : 26;
      while (particles.length < count) particles.push(spawn(true));
      particles.length = count;
    }

    function spawn(anywhere) {
      var base = Math.min(Math.max(w, h), 1400);
      return {
        x: Math.random() * w,
        // smoke gathers low in the frame, like the poster
        y: anywhere ? h * (0.35 + Math.random() * 0.75) : h + 60,
        r: base * (0.14 + Math.random() * 0.16),
        vx: (Math.random() - 0.5) * 10,
        vy: -(5 + Math.random() * 14),
        grow: 3 + Math.random() * 7,
        life: anywhere ? Math.random() : 0,
        speed: 1 / (16 + Math.random() * 14),     // lifetime ~16–30s
        puff: puffs[(Math.random() * puffs.length) | 0],
        sway: Math.random() * Math.PI * 2,
      };
    }

    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.life += p.speed * dt;
        if (p.life >= 1) { particles[i] = p = spawn(false); }
        p.sway += dt * 0.35;
        p.x += (p.vx + Math.sin(p.sway) * 6) * dt;
        p.y += p.vy * dt;
        p.r += p.grow * dt;
        ctx.globalAlpha = Math.sin(p.life * Math.PI) * 0.55; // fade in, then out
        ctx.drawImage(p.puff, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      ctx.globalAlpha = 1;
    }

    function frame(t) {
      var dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      draw(dt);
      if (running) rafId = requestAnimationFrame(frame);
    }
    function start() {
      if (running || reduceMotion) return;
      running = true; last = performance.now();
      rafId = requestAnimationFrame(frame);
    }
    function stop() { running = false; cancelAnimationFrame(rafId); }

    resize();
    draw(0); // one still frame straight away (also used for reduced motion)

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resize(); if (!running) draw(0); }, 150);
    });

    // Only animate while the hero is visible and the tab is open (saves battery)
    var heroVisible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible && !document.hidden) start(); else stop();
      }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden || !heroVisible) stop(); else start();
    });
    start();
  })();


  /* 5. LOAD THE DATA FILES ================================================= */

  var config = {};

  // Each file loads on its own, so one mistake doesn't break everything else.
  loadJSON("data/config.json")
    .then(function (data) { config = data || {}; applyConfig(); })
    .catch(dataError("config.json", null))
    .then(function () {
      loadJSON("data/members.json")
        .then(function (data) { renderMembers((data && data.members) || []); })
        .catch(dataError("members.json", "#membersGrid"));
      loadJSON("data/events.json")
        .then(function (data) { renderEvents((data && data.events) || []); })
        .catch(dataError("events.json", "#eventsList"));
    });

  // Explain what went wrong instead of showing an empty space
  function dataError(file, target) {
    return function (err) {
      console.error("[HAZE] Could not load data/" + file + ":", err);
      if (!target) return;
      var msg = location.protocol === "file:"
        ? "Preview note: the " + file + " list can't load when you open index.html straight from your computer. Use a local server (see README), or view the live site."
        : "Couldn't load " + file + ". Check it for a missing comma or quote.";
      $(target).innerHTML = '<p class="empty">' + esc(msg) + "</p>";
    };
  }


  /* 6. APPLY SETTINGS ====================================================== */

  var SOCIAL_ICONS = {
    discord: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-discord"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.4 6.4 0 1 0 5.4 6.3V8.7a8.1 8.1 0 0 0 4.7 1.5V6.8a4.8 4.8 0 0 1-4.7-4.8Z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15V9l5.8 3-5.8 3Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></g><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z"/></svg>',
    twitch: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.3 2 3 5.4v13.8h4.7V22h2.6l2.7-2.8h3.9l5.1-5.2V2H4.3Zm15.9 11.1-2.9 3h-4.7l-2.6 2.6v-2.6H6V3.8h14.2v9.3ZM17.4 7h-1.8v5.4h1.8V7Zm-4.8 0h-1.8v5.4h1.8V7Z"/></svg>',
  };

  function applyConfig() {
    // Every element with data-discord gets the invite link from config.json
    if (config.discordInvite) {
      $all("[data-discord]").forEach(function (a) { a.href = config.discordInvite; });
    }

    // Games played (About section)
    var gamesList = $("#gamesList");
    if (gamesList && config.games && config.games.length) {
      gamesList.innerHTML = config.games.map(function (g) {
        return "<li>" + icon("controller") + esc(g) + "</li>";
      }).join("");
    }

    // Footer: Discord + any social links that have a url
    var ul = $("#socials");
    if (ul) {
      var links = [{ name: "Discord", url: config.discordInvite }].concat(config.socials || []);
      var html = links
        .filter(function (s) { return s && s.url; })
        .map(function (s) {
          // Unknown network? Fall back to its first letter.
          var svg = SOCIAL_ICONS[String(s.name).toLowerCase()] || "<strong>" + esc(String(s.name).charAt(0)) + "</strong>";
          return '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener" aria-label="HAZE Gaming on ' + esc(s.name) + '">' + svg + "</a></li>";
        }).join("");
      if (html) ul.innerHTML = html;
    }
  }


  /* 7. MEMBERS ============================================================= */

  // Roles that get the glowing "leader" card
  var LEAD_ROLES = /leader|founder|owner/i;

  function renderMembers(members) {
    var grid = $("#membersGrid");
    if (!grid) return;
    $("#memberCount").textContent = members.length;

    if (!members.length) {
      grid.innerHTML = '<p class="empty">No members listed yet.</p>';
      return;
    }

    grid.innerHTML = members.map(function (m) {
      // Strip "HAZE" if someone typed it in the data file; we add it ourselves
      var name = String(m.name || "").replace(/^\s*haze\s*/i, "").trim() || "Unknown";
      var isLead = LEAD_ROLES.test(m.role || "");
      var avatar = m.avatar
        ? '<img src="' + esc(m.avatar) + '" alt="" loading="lazy" width="80" height="80">'
        : esc(name.charAt(0).toUpperCase());

      return (
        '<article class="card member reveal' + (isLead ? " member--lead" : "") + '">' +
          '<div class="member__avatar">' + avatar + "</div>" +
          '<span class="member__tag">HAZE</span>' +
          '<h3 class="member__name">' + esc(name) + "</h3>" +
          (m.role ? '<span class="member__role">' + esc(m.role) + "</span>" : "") +
          (m.game ? '<p class="member__game">' + icon("controller") + esc(m.game) + "</p>" : "") +
        "</article>"
      );
    }).join("");

    var cards = $all(".member", grid);
    watchReveal(cards);

    // Mint light follows the pointer on desktop
    cards.forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }


  /* 8. EVENTS ============================================================== */

  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  function renderEvents(events) {
    var list = $("#eventsList");
    if (!list) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = events
      .map(function (ev) {
        // "2026-12-05" → local date (avoids a timezone off-by-one)
        var parts = String(ev.date || "").split("-").map(Number);
        return { ev: ev, date: new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1) };
      })
      .filter(function (x) { return !isNaN(x.date) && x.date >= today; })
      .sort(function (a, b) { return a.date - b.date; });

    if (!upcoming.length) {
      list.innerHTML = '<p class="empty">No events scheduled right now. Watch the Discord for the next drop.</p>';
      return;
    }

    list.innerHTML = upcoming.map(function (x) {
      var ev = x.ev, d = x.date;
      var days = Math.round((d - today) / 86400000);
      var soon = days === 0 ? "Today" : days === 1 ? "Tomorrow" : days <= 7 ? "In " + days + " days" : "";
      var link = ev.link || config.discordInvite || "https://discord.gg/KtDGEysHZ7";

      return (
        '<article class="card event reveal">' +
          '<div class="event__date" aria-hidden="true">' +
            '<span class="event__day">' + d.getDate() + "</span>" +
            '<span class="event__month">' + MONTHS[d.getMonth()] + "</span>" +
          "</div>" +
          '<div class="event__body">' +
            '<div class="event__meta">' +
              (ev.game ? '<span class="event__game">' + icon("controller") + esc(ev.game) + "</span>" : "") +
              (ev.time ? "<span>" + icon("clock") + esc(ev.time) + "</span>" : "") +
              (soon ? '<span class="event__soon">' + soon + "</span>" : "") +
            "</div>" +
            "<h3>" + esc(ev.title) + "</h3>" +
            '<p><span class="sr-only">' + esc(d.toDateString()) + ". </span>" + esc(ev.description) + "</p>" +
            '<a class="btn btn--small btn--ghost" href="' + esc(link) + '" target="_blank" rel="noopener">Sign up</a>' +
          "</div>" +
        "</article>"
      );
    }).join("");

    watchReveal($all(".event", list));
  }


  /* 9. NAME FORGE ========================================================== */
  // Turns "Raven" into ideas like "Rxven", "Ravxn", "Rxvn".

  function hazeNames(raw) {
    var name = String(raw).replace(/^\s*haze\s*/i, "").replace(/[^a-z0-9]/gi, "");
    if (!name) return [];

    var vowel = /[aeiou]/i;
    var ideas = [];
    function add(n) {
      n = n.charAt(0).toUpperCase() + n.slice(1);
      if (ideas.indexOf(n) === -1) ideas.push(n);
    }

    // a) swap each single vowel for x
    for (var i = 0; i < name.length; i++) {
      if (vowel.test(name[i])) add(name.slice(0, i) + "x" + name.slice(i + 1));
    }
    // b) swap the first vowel and drop the rest (Viper → Vxpr)
    var first = name.search(vowel);
    if (first !== -1) {
      var dropped = name.slice(0, first) + "x" + name.slice(first + 1).replace(/[aeiou]/gi, "");
      if (dropped.length >= 3) add(dropped);
    }
    return ideas.slice(0, 4);
  }

  // Wrap the x's we added in <b> so they glow
  function highlightX(original, result) {
    var out = "";
    for (var i = 0; i < result.length; i++) {
      var ch = esc(result[i]);
      out += (result[i].toLowerCase() === "x" && (original[i] || "").toLowerCase() !== "x") ? "<b>" + ch + "</b>" : ch;
    }
    return out;
  }

  (function forge() {
    var form = $("#nameForge"), input = $("#forgeInput"), out = $("#forgeResults");
    if (!form) return;

    function hint(text) { out.innerHTML = '<li class="forge__hint">' + text + "</li>"; }

    function update() {
      var clean = input.value.replace(/^\s*haze\s*/i, "").replace(/[^a-z0-9]/gi, "");
      if (!clean) { hint("Your HAZE name ideas will appear here."); return; }

      var ideas = hazeNames(input.value);
      if (!ideas.length) {
        hint("No vowels to swap, so <strong>HAZE " + esc(clean) + "</strong> already fits the vibe.");
        return;
      }
      var original = clean.charAt(0).toUpperCase() + clean.slice(1);
      out.innerHTML = ideas.map(function (n) {
        return '<li><span class="tag">HAZE</span>' + highlightX(original, n) + "</li>";
      }).join("");
    }

    input.addEventListener("input", update);
    form.addEventListener("submit", function (e) { e.preventDefault(); update(); });
    update();
  })();
})();
