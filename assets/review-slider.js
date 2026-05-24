class ReviewSlider extends HTMLElement {
  connectedCallback() {
    this.slider = this._createSlider();
    this._bindEditorEvents();
  }

  disconnectedCallback() {
    this._destroySlider();
  }

  _createSlider() {
    const swiperEl = this.querySelector(".swiper");
    if (!swiperEl) return null;

    if (typeof Swiper === "undefined") {
      console.warn("[review-slider] Swiper is not loaded.");
      return null;
    }

    const slidesMobile = parseFloat(swiperEl.dataset.slidesMobile ?? 1);
    const slidesTablet = parseFloat(swiperEl.dataset.slidesTablet ?? 2);
    const slidesDesktop = parseFloat(swiperEl.dataset.slidesDesktop ?? 3);
    const spaceBetween = parseInt(swiperEl.dataset.spaceBetween ?? 24);

    const loop = this.dataset.loop === "true";
    const autoplay = this.dataset.autoplay === "true";
    const autoplaySpeed = parseInt(this.dataset.autoplaySpeed ?? 4000);

    const slider = new Swiper(swiperEl, {
      init: false,

      slidesPerView: slidesMobile,
      spaceBetween,
      speed: 900,
      grabCursor: true,
      loop,

      autoplay: autoplay
        ? {
            delay: autoplaySpeed,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }
        : false,

      breakpoints: {
        640: { slidesPerView: slidesTablet, spaceBetween },
        1024: { slidesPerView: slidesDesktop, spaceBetween },
      },
    });

    slider.init();
    return slider;
  }

  _destroySlider() {
    if (this.slider && !this.slider.destroyed) {
      this.slider.destroy(true, true);
    }
    this.slider = null;
  }

  _reinit() {
    this._destroySlider();
    this.slider = this._createSlider();
  }

  _bindEditorEvents() {
    if (!Shopify.designMode) return;

    document.addEventListener("shopify:block:select", (e) => {
      if (!this.contains(e.target)) return;

      this.slider?.autoplay?.stop();

      const slides = [
        ...this.querySelectorAll(".swiper-slide:not(.swiper-slide-duplicate)"),
      ];
      const idx = slides.indexOf(e.target.closest(".swiper-slide"));
      if (idx !== -1) this.slider?.slideTo(idx);
    });

    document.addEventListener("shopify:block:deselect", (e) => {
      if (!this.contains(e.target)) return;
      if (this.dataset.autoplay === "true") this.slider?.autoplay?.start();
    });

    document.addEventListener("shopify:section:load", (e) => {
      if (e.target.contains(this)) this._reinit();
    });
  }
}

if (!customElements.get("review-slider")) {
  customElements.define("review-slider", ReviewSlider);
}
