// A 3D "wheel" carousel: cards sit on a circle, the front one is big and bright,
// the ones around the back are small and faint. Spin it with the mouse wheel, drag, arrow keys, or buttons.

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class Carousel {
  /**
   * @param {HTMLElement} stage  element the cards are placed in
   * @param {Array} items        data for each card
   * @param {{ renderCard: (item, index) => HTMLElement, onSelect: (item, index) => void, onFrontChange?: (item, index) => void }} options
   */
  constructor(stage, items, { renderCard, onSelect, onFrontChange }) {
    this.stage = stage;
    this.items = items;
    this.onSelect = onSelect;
    this.onFrontChange = onFrontChange;
    this.position = 0; // current rotation, in "cards" (0 = first card at front)
    this.target = 0;   // where we're animating to
    this.frontIndex = -1;
    this.frame = null;

    this.cards = items.map((item, i) => {
      const card = renderCard(item, i);
      card.dataset.index = i;
      card.setAttribute("role", "option");
      card.setAttribute("aria-selected", "false");
      card.tabIndex = -1;
      stage.appendChild(card);
      return card;
    });

    this.measure();
    this.bindEvents();
    this.render();
  }

  get count() {
    return this.items.length;
  }

  measure() {
    const width = this.stage.clientWidth;
    this.radius = Math.max(170, Math.min(width * 0.46, 600));
    this.tilt = Math.min(150, this.radius * 0.32);
  }

  /** Index of the card closest to the front. */
  indexAt(position) {
    return ((Math.round(position) % this.count) + this.count) % this.count;
  }

  /** Spin to a card by the shortest direction. */
  goTo(index) {
    const n = this.count;
    const diff = ((((index - this.target) % n) + n + n / 2) % n) - n / 2;
    this.target = Math.round(this.target + diff);
    this.animate();
  }

  step(delta) {
    this.target = Math.round(this.target) + delta;
    this.animate();
  }

  animate() {
    if (this.frame) return;
    const tick = () => {
      const diff = this.target - this.position;
      if (reducedMotion || Math.abs(diff) < 0.001) {
        this.position = this.target;
        this.frame = null;
        this.render();
        return;
      }
      this.position += diff * 0.14;
      this.render();
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  render() {
    // Cards are at least 30° apart, so the ring shows up to 12 at once; with more games, the rest wait out of sight.
    const angleStep = Math.max((Math.PI * 2) / this.count, Math.PI / 6);
    const n = this.count;
    this.cards.forEach((card, i) => {
      const offset = ((((i - this.position) % n) + n + n / 2) % n) - n / 2; // cards from the front, -n/2..n/2
      const angle = offset * angleStep;
      if (Math.abs(angle) > Math.PI) {
        card.style.opacity = "0";
        card.style.pointerEvents = "none";
        return;
      }
      const depth = (Math.cos(angle) + 1) / 2; // 1 = front, 0 = back
      const x = Math.sin(angle) * this.radius;
      const y = (1 - depth) * -this.tilt; // tilted ring: cards rise toward the back so they peek over the front
      const z = (depth - 1) * this.radius * 1.1;
      card.style.transform =
        `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${(Math.sin(angle) * 0.6).toFixed(3)}rad)`; // angled at the sides, facing us front and back
      const fade = Math.min(1, (Math.PI - Math.abs(angle)) / angleStep); // ease cards in/out at the very back
      card.style.opacity = ((0.22 + 0.78 * depth ** 2) * fade).toFixed(3);
      card.style.zIndex = String(Math.round(depth * 100));
      card.style.filter = depth < 0.98 ? `blur(${((1 - depth) * 2.5).toFixed(2)}px) saturate(${(0.4 + depth * 0.6).toFixed(2)})` : "none";
      card.style.pointerEvents = depth > 0.35 ? "auto" : "none";
    });

    const front = this.indexAt(this.position);
    if (front !== this.frontIndex) {
      this.cards[this.frontIndex]?.classList.remove("is-front");
      this.cards[this.frontIndex]?.setAttribute("aria-selected", "false");
      this.cards[front].classList.add("is-front");
      this.cards[front].setAttribute("aria-selected", "true");
      this.frontIndex = front;
      this.stage.setAttribute("aria-activedescendant", this.cards[front].id);
      this.onFrontChange?.(this.items[front], front);
    }
  }

  bindEvents() {
    // Mouse wheel / trackpad: spin freely, then snap to the nearest card.
    let snapTimer;
    this.stage.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        this.target += delta / 350;
        this.animate();
        clearTimeout(snapTimer);
        snapTimer = setTimeout(() => {
          this.target = Math.round(this.target);
          this.animate();
        }, 140);
      },
      { passive: false }
    );

    // Drag / swipe.
    let drag = null;
    this.stage.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      drag = { startX: e.clientX, startTarget: this.target, moved: false, id: e.pointerId };
    });
    this.stage.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) > 6) {
        drag.moved = true;
        this.stage.setPointerCapture(e.pointerId);
        this.stage.classList.add("is-dragging");
      }
      if (drag.moved) {
        this.target = drag.startTarget - dx / (this.radius * 0.9);
        this.animate();
      }
    });
    const endDrag = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const wasDrag = drag.moved;
      drag = null;
      this.stage.classList.remove("is-dragging");
      if (wasDrag) {
        this.target = Math.round(this.target);
        this.animate();
        return;
      }
      // A click, not a drag: select the card that was clicked.
      const card = e.target.closest?.("[data-index]");
      if (card) this.select(Number(card.dataset.index));
    };
    this.stage.addEventListener("pointerup", endDrag);
    this.stage.addEventListener("pointercancel", () => {
      drag = null;
      this.stage.classList.remove("is-dragging");
      this.target = Math.round(this.target);
      this.animate();
    });

    // Keyboard.
    this.stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") this.step(1);
      else if (e.key === "ArrowLeft") this.step(-1);
      else if (e.key === "Enter" || e.key === " ") this.select(this.indexAt(this.target));
      else return;
      e.preventDefault();
    });

    window.addEventListener("resize", () => {
      this.measure();
      this.render();
    });
  }

  select(index) {
    this.goTo(index);
    this.onSelect(this.items[index], index);
  }
}
