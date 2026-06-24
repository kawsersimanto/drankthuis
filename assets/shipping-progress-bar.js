import { Component } from "@theme/component";
import { ThemeEvents } from "@theme/events";

class ShippingProgressBar extends Component {
  requiredRefs = ["message", "fill"];

  /** @type {number} */
  #minimum = 0;
  /** @type {number} */
  #threshold = 0;

  connectedCallback() {
    super.connectedCallback();
    this.#minimum = parseInt(this.dataset.minimum || "0", 10);
    this.#threshold = parseInt(this.dataset.threshold || "0", 10);
    this.#updateProgress(parseInt(this.dataset.currentTotal || "0", 10));
    document.addEventListener(ThemeEvents.cartUpdate, this.#handleCartUpdate);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(
      ThemeEvents.cartUpdate,
      this.#handleCartUpdate,
    );
  }

  #handleCartUpdate = (event) => {
    const cartTotal = event.detail.resource?.total_price;
    if (cartTotal !== undefined && typeof cartTotal === "number") {
      this.#updateProgress(cartTotal);
    }
  };

  #updateProgress(currentTotal) {
    if (!this.#threshold || this.#threshold <= 0) {
      this.classList.add("hidden");
      return;
    }

    // Determine state
    let state;
    if (currentTotal >= this.#threshold) {
      state = "free-shipping";
    } else if (this.#minimum > 0 && currentTotal >= this.#minimum) {
      state = "above-minimum";
    } else {
      state = "below-minimum";
    }

    // Single continuous progress across the full 0 → threshold range
    const progressPercentage =
      currentTotal > 0
        ? Math.min(100, (currentTotal / this.#threshold) * 100)
        : 2;

    // Update fill & track
    if (this.refs.fill) {
      const track = this.refs.fill.parentElement;
      track.style.setProperty("--progress", `${progressPercentage}%`);
      track.dataset.state = state;
      this.refs.fill.style.setProperty("--progress", `${progressPercentage}%`);
      this.refs.fill.setAttribute(
        "aria-valuenow",
        String(Math.round(progressPercentage)),
      );
    }

    // Update message
    if (this.refs.message) {
      const { text, success } = this.#getMessage(state, currentTotal);
      this.refs.message.textContent = text;
      this.refs.message.classList.toggle(
        "shipping-progress-bar__message--success",
        success,
      );
    }

    // Update host attributes
    this.dataset.state = state;
    if (state === "free-shipping") {
      this.setAttribute("data-threshold-reached", "");
    } else {
      this.removeAttribute("data-threshold-reached");
    }

    // Show/hide
    this.classList.toggle("hidden", currentTotal === 0);
  }

  #getMessage(state, currentTotal) {
    if (state === "free-shipping") {
      return { text: "You get Free Delivery!!!", success: true };
    }
    if (state === "above-minimum") {
      const remaining = this.#threshold - currentTotal;
      return {
        text: `Only ${this.#formatMoney(remaining)} away from Free Delivery`,
        success: false,
      };
    }
    // below-minimum
    const remaining =
      this.#minimum > 0
        ? this.#minimum - currentTotal
        : this.#threshold - currentTotal;
    return {
      text: `Only ${this.#formatMoney(remaining)} away from Minimum order`,
      success: false,
    };
  }

  #formatMoney(cents) {
    if (window.Shopify && typeof window.Shopify.formatMoney === "function") {
      const moneyFormat =
        window.money_format || window.Shopify.money_format || "${{amount}}";
      return window.Shopify.formatMoney(cents, moneyFormat);
    }
    return `$${(cents / 100).toFixed(2)}`;
  }
}

if (!customElements.get("shipping-progress-bar")) {
  customElements.define("shipping-progress-bar", ShippingProgressBar);
}
