class ProductSlider extends HTMLElement {
  connectedCallback() {
    this.slider = this.createSlider();
  }

  disconnectedCallback() {
    this.destroySlider();
  }

  createSlider() {
    const sliderEl = this.querySelector(".product-slider");
    if (!sliderEl) return null;

    const spaceBetween = parseInt(sliderEl.dataset.spaceBetween ?? 16);
    const spaceBetweenDesktop = parseInt(
      sliderEl.dataset.spaceBetweenDesktop ?? 16,
    );
    const slidesMobile = parseFloat(sliderEl.dataset.slidesMobile ?? 1.5);
    const slidesTablet = parseFloat(sliderEl.dataset.slidesTablet ?? 2.5);
    const slidesDesktop = parseFloat(sliderEl.dataset.slidesDesktop ?? 4);

    const slider = new Swiper(sliderEl, {
      init: false,
      slidesPerView: slidesMobile,
      spaceBetween,
      speed: 900,
      navigation: {
        nextEl: this.querySelector('[data-product="next"]'),
        prevEl: this.querySelector('[data-product="prev"]'),
      },
      scrollbar: {
        el: this.querySelector("[data-product-scrollbar]"),
        draggable: true,
        snapOnRelease: true,
      },
      breakpoints: {
        1200: {
          slidesPerView: slidesDesktop,
          spaceBetween: spaceBetweenDesktop,
        },
        768: { slidesPerView: slidesTablet, spaceBetween: spaceBetweenDesktop },
      },
    });

    slider.init();
    return slider;
  }

  destroySlider() {
    if (this.slider && !this.slider.destroyed) {
      this.slider.destroy(true, true);
    }
    this.slider = null;
  }
}

customElements.define("product-slider", ProductSlider);
