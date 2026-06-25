class LanguageSwitcher extends HTMLElement {
  connectedCallback() {
    this.trigger = this.querySelector(".ls-trigger");
    this.dropdown = this.querySelector(".ls-dropdown");
    this.localeInput = this.querySelector('input[name="locale_code"]');
    this.form = this.querySelector("form");

    if (!this.trigger || !this.dropdown || !this.localeInput) return;

    this.isOpen = false;

    gsap.set(this.dropdown, {
      opacity: 0,
      y: -8,
      display: "none",
    });

    this.handleOutsideClick = this.handleOutsideClick.bind(this);

    this.trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });

    this.querySelectorAll(".ls-option").forEach((option) => {
      option.addEventListener("click", () => {
        const locale = option.dataset.value;

        if (!locale) return;

        this.localeInput.value = locale;
        this.form.submit();
      });
    });
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.handleOutsideClick);
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.isOpen = true;

    this.trigger.setAttribute("aria-expanded", "true");
    this.trigger.classList.add("is-open");

    gsap.killTweensOf(this.dropdown);

    gsap.set(this.dropdown, {
      display: "block",
    });

    gsap.to(this.dropdown, {
      opacity: 1,
      y: 0,
      duration: 0.2,
      ease: "power2.out",
    });

    document.addEventListener("click", this.handleOutsideClick);
  }

  close() {
    this.isOpen = false;

    this.trigger.setAttribute("aria-expanded", "false");
    this.trigger.classList.remove("is-open");

    gsap.killTweensOf(this.dropdown);

    gsap.to(this.dropdown, {
      opacity: 0,
      y: -8,
      duration: 0.15,
      ease: "power2.in",
      onComplete: () => {
        gsap.set(this.dropdown, {
          display: "none",
        });
      },
    });

    document.removeEventListener("click", this.handleOutsideClick);
  }

  handleOutsideClick(event) {
    if (this.contains(event.target)) return;
    this.close();
  }
}

if (!customElements.get("language-switcher")) {
  customElements.define("language-switcher", LanguageSwitcher);
}
