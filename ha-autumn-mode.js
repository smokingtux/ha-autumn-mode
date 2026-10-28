/**
 * Autumn mode for Home Assistant 🎃🍂
 *
 * Falling autumn leaves and pumpkins across the whole frontend.
 * Modeled after the official Labs winter mode
 * (home-assistant/frontend: src/components/ha-snowflakes.ts).
 *
 * Toggled via a helper (input_boolean). If the helper does not exist,
 * autumn mode is always on.
 */

const AUTUMN_ENTITY = "input_boolean.autumn_mode";
const MAX_ITEMS = 40;
const MAX_ITEMS_NARROW = 24;
const PUMPKIN_SHARE = 0.2; // share of pumpkins, the rest are leaves

const LEAF_COLORS = ["#e67e22", "#d35400", "#c0392b", "#f1c40f", "#a0522d"];
const PUMPKIN_COLORS = ["#f07f1a", "#d35400", "#e67e22", "#ff9933"];
const TOUCH_SLOP = 14; // extra hit area in px so taps on phones actually land

const mapleSvg = (color) => `
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="${color}" d="M12 1l1.5 4.5L16 4l-.5 4.5L20 6.5l-1.5 4L22 11l-4 3 1 2.5-4.5-1L13 19l-.4 4h-1.2l-.4-4-1.5-3.5-4.5 1 1-2.5-4-3 3.5-.5-1.5-4 4.5 2L8 4l2.5 1.5z"/>
    <path fill="none" stroke="rgba(0,0,0,.25)" stroke-width=".7" stroke-linecap="round"
      d="M12 5v14M12 13 7 9M12 13l5-4M12 15.5l-4.5-.5M12 15.5l4.5-.5"/>
  </svg>`;

const leafSvg = (color) => `
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="${color}" d="M12 1.5C6 6.5 5 12.5 8 16.8c1.3 1.8 2.6 2.6 4 2.8 1.4-.2 2.7-1 4-2.8 3-4.3 2-10.3-4-15.3z"/>
    <path fill="none" stroke="rgba(0,0,0,.28)" stroke-width=".8" stroke-linecap="round"
      d="M12 4v19M12 9l-2.5-2M12 9l2.5-2M12 12.5l-3.5-2.5M12 12.5l3.5-2.5M12 16l-3-2M12 16l3-2"/>
  </svg>`;

const pumpkinSvg = () => `
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" stroke="#6b4226" stroke-width="2" stroke-linecap="round" d="M12 8c0-2 .8-3.6 2.6-4.6"/>
    <path fill="#4caf50" d="M13 6.2c1.6-1.8 3.8-2 5-1.2-1 1.6-3 2.4-5 1.2z"/>
    <ellipse cx="7.6" cy="14.5" rx="4.6" ry="6.3" fill="#d35400"/>
    <ellipse cx="16.4" cy="14.5" rx="4.6" ry="6.3" fill="#d35400"/>
    <ellipse cx="12" cy="14.5" rx="4.4" ry="6.8" fill="#f07f1a"/>
    <path fill="none" stroke="rgba(0,0,0,.18)" stroke-width=".7" d="M9.8 8.4c-1 3.6-1 8.6 0 12.1M14.2 8.4c1 3.6 1 8.6 0 12.1"/>
  </svg>`;

class HaAutumnMode extends HTMLElement {
  constructor() {
    super();
    this._enabled = false;
    this._dark = undefined;
    this._narrow = undefined;
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this._tick();
    // hass is replaced on every state change, a quick poll is plenty
    this._interval = window.setInterval(() => this._tick(), 1000);
    this._onResize = () => this._tick();
    window.addEventListener("resize", this._onResize);
    // Only observe clicks/taps, never intercept them: the dashboard below stays usable
    this._onPointerDown = (ev) => this._hitTest(ev);
    window.addEventListener("pointerdown", this._onPointerDown, {
      capture: true,
      passive: true,
    });
  }

  disconnectedCallback() {
    window.clearInterval(this._interval);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("pointerdown", this._onPointerDown, {
      capture: true,
    });
  }

  _tick() {
    const hass = document.querySelector("home-assistant")?.hass;
    if (!hass) {
      return;
    }
    const entity = hass.states[AUTUMN_ENTITY];
    const enabled = entity ? entity.state === "on" : true;
    const dark = hass.themes?.darkMode ?? false;
    const narrow = window.innerWidth < 870;

    if (enabled === this._enabled && dark === this._dark && narrow === this._narrow) {
      return;
    }
    const regenerate = enabled !== this._enabled || narrow !== this._narrow;
    this._enabled = enabled;
    this._dark = dark;
    this._narrow = narrow;
    if (regenerate) {
      this._render();
    } else {
      this._container?.classList.toggle("dark", dark);
    }
  }

  _render() {
    if (!this._enabled) {
      this.shadowRoot.innerHTML = "";
      this._container = undefined;
      return;
    }

    const count = this._narrow ? MAX_ITEMS_NARROW : MAX_ITEMS;
    const items = [];
    for (let i = 0; i < count; i++) {
      const pumpkin = Math.random() < PUMPKIN_SHARE;
      const color = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
      const size = pumpkin
        ? Math.random() * 10 + 20 // pumpkins 20-30px
        : Math.random() * 14 + 18; // leaves 18-32px
      const duration = pumpkin
        ? Math.random() * 6 + 10 // pumpkins fall leisurely: 10-16s
        : Math.random() * 8 + 10; // leaves sail: 10-18s
      const style = [
        `left:${Math.random() * 100}%`,
        `width:${size}px`,
        `height:${size}px`,
        `animation-duration:${duration}s`,
        `animation-delay:-${Math.random() * duration}s`,
        `--rotation:${Math.random() * 720 - 360}deg`,
        `--drift:${Math.random() * 60 + 20}px`,
        `--spin:${pumpkin ? 40 : Math.random() * 360 + 180}deg`,
      ].join(";");
      items.push(
        `<div class="item ${pumpkin ? "pumpkin" : "leaf"}" data-color="${color}" style="${style}">${
          pumpkin
            ? pumpkinSvg()
            : (Math.random() < 0.5 ? mapleSvg : leafSvg)(color)
        }</div>`
      );
    }

    this.shadowRoot.innerHTML = `
      <style>${HaAutumnMode.styles}</style>
      <div class="autumn ${this._dark ? "dark" : ""}" aria-hidden="true">${items.join("")}</div>
      <div class="fx" aria-hidden="true"></div>
    `;
    this._fx = this.shadowRoot.querySelector(".fx");
    this._container = this.shadowRoot.querySelector(".autumn");
  }

  _hitTest(ev) {
    if (!this._container) {
      return;
    }
    for (const item of this._container.querySelectorAll(".item:not(.gone)")) {
      const r = item.getBoundingClientRect();
      if (
        ev.clientX >= r.left - TOUCH_SLOP &&
        ev.clientX <= r.right + TOUCH_SLOP &&
        ev.clientY >= r.top - TOUCH_SLOP &&
        ev.clientY <= r.bottom + TOUCH_SLOP
      ) {
        this._smash(item, r);
        return;
      }
    }
  }

  _smash(item, rect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const size = rect.width;
    if (item.classList.contains("pumpkin")) {
      this._burst(cx, cy, size);
    } else {
      this._crumble(cx, cy, size, item.dataset.color);
    }
    // Hide it; it re-enters from the top on the next iteration of the fall animation
    item.classList.add("gone");
    item.addEventListener(
      "animationiteration",
      () => item.classList.remove("gone"),
      { once: true }
    );
  }

  _particle(cx, cy, w, h, color, radius, keyframes, duration) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.cssText = `left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px;background:${color};border-radius:${radius}`;
    this._fx.appendChild(p);
    p.animate(keyframes, { duration, easing: "linear", fill: "forwards" }).onfinish =
      () => p.remove();
  }

  /* Leaf crumbles: small crumbs drift apart and trickle down */
  _crumble(cx, cy, size, color) {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const s = Math.random() * size * 0.25 + size * 0.12;
      const dx = (Math.random() - 0.5) * size * 2.5;
      const dy = Math.random() * size * 2 + size * 1.5;
      const rot = Math.random() * 540 - 270;
      const shard = `${Math.random() * 40 + 10}% ${Math.random() * 40 + 10}%`;
      this._particle(cx, cy, s, s * (Math.random() * 0.6 + 0.6), color, shard, [
        { transform: "translate(0,0) rotate(0deg) scale(1)", opacity: 1 },
        {
          transform: `translate(${dx * 0.6}px,${dy * 0.3}px) rotate(${rot * 0.5}deg) scale(.9)`,
          opacity: 0.9,
          offset: 0.4,
        },
        {
          transform: `translate(${dx}px,${dy}px) rotate(${rot}deg) scale(.4)`,
          opacity: 0,
        },
      ], Math.random() * 500 + 900);
    }
  }

  /* Pumpkin bursts: chunks and seeds fly in all directions and fall down */
  _burst(cx, cy, size) {
    this._particle(cx, cy, size * 1.4, size * 1.4, "rgba(255,170,60,.55)", "50%", [
      { transform: "scale(.3)", opacity: 1 },
      { transform: "scale(1.6)", opacity: 0 },
    ], 260);

    const pieces = 14;
    for (let i = 0; i < pieces; i++) {
      const seed = i >= 10;
      const angle = (i / pieces) * Math.PI * 2 + Math.random() * 0.5;
      const dist = Math.random() * size * 1.8 + size * 1.2;
      const dx = Math.cos(angle) * dist;
      const up = Math.sin(angle) * dist - size; // blown slightly upwards
      const fall = size * 3 + Math.random() * size * 2;
      const rot = Math.random() * 900 - 450;
      const w = seed ? size * 0.14 : Math.random() * size * 0.25 + size * 0.2;
      const h = seed ? size * 0.24 : w * (Math.random() * 0.5 + 0.7);
      const color = seed
        ? "#f5e6c4"
        : PUMPKIN_COLORS[Math.floor(Math.random() * PUMPKIN_COLORS.length)];
      this._particle(cx, cy, w, h, color, seed ? "50%" : "30% 60% 40% 50%", [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1, easing: "ease-out" },
        {
          transform: `translate(${dx * 0.7}px,${up}px) rotate(${rot * 0.4}deg)`,
          opacity: 1,
          offset: 0.35,
          easing: "ease-in",
        },
        {
          transform: `translate(${dx}px,${up + fall}px) rotate(${rot}deg)`,
          opacity: 0,
        },
      ], Math.random() * 400 + 1000);
    }
  }

  static styles = `
    :host {
      display: block;
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    }

    .autumn {
      position: absolute;
      top: -10%;
      left: 0;
      width: 100%;
      height: 110%;
      pointer-events: none;
    }

    .item {
      position: absolute;
      top: -10%;
      opacity: 0.85;
      user-select: none;
      pointer-events: none;
      animation: sail linear infinite;
      will-change: transform;
    }

    .item svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .item.pumpkin {
      animation-name: tumble;
    }

    .item.gone {
      visibility: hidden;
    }

    .fx {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .particle {
      position: absolute;
      pointer-events: none;
      will-change: transform, opacity;
    }

    .dark .item {
      opacity: 0.75;
    }

    /* Leaves swing back and forth while spinning */
    @keyframes sail {
      0% {
        transform: translateY(-10vh) translateX(0) rotate(var(--rotation));
      }
      20% {
        transform: translateY(15vh) translateX(var(--drift))
          rotate(calc(var(--rotation) + var(--spin) * 0.2));
      }
      40% {
        transform: translateY(40vh) translateX(calc(var(--drift) * -1))
          rotate(calc(var(--rotation) + var(--spin) * 0.4));
      }
      60% {
        transform: translateY(65vh) translateX(var(--drift))
          rotate(calc(var(--rotation) + var(--spin) * 0.6));
      }
      80% {
        transform: translateY(90vh) translateX(calc(var(--drift) * -1))
          rotate(calc(var(--rotation) + var(--spin) * 0.8));
      }
      100% {
        transform: translateY(120vh) translateX(0)
          rotate(calc(var(--rotation) + var(--spin)));
      }
    }

    /* Pumpkins drop fairly straight and only wobble slightly */
    @keyframes tumble {
      0% {
        transform: translateY(-10vh) rotate(-15deg);
      }
      25% {
        transform: translateY(25vh) rotate(15deg);
      }
      50% {
        transform: translateY(55vh) rotate(-15deg);
      }
      75% {
        transform: translateY(85vh) rotate(15deg);
      }
      100% {
        transform: translateY(120vh) rotate(-15deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .item {
        animation: none;
        display: none;
      }
    }
  `;
}

if (!customElements.get("ha-autumn-mode")) {
  customElements.define("ha-autumn-mode", HaAutumnMode);
}
if (!document.querySelector("ha-autumn-mode")) {
  document.body.appendChild(document.createElement("ha-autumn-mode"));
}
