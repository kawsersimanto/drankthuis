function debounce(fn, wait) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), wait);
  };
}

class SearchForm extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input[type="search"]');
    this.resetButton = this.querySelector('button[type="reset"]');

    if (this.input) {
      this.input.form.addEventListener("reset", this.onFormReset.bind(this));
    }
  }

  toggleResetButton() {
    const resetIsHidden = this.resetButton.classList.contains("hidden");
    if (this.input.value.length > 0 && resetIsHidden) {
      this.resetButton.classList.remove("hidden");
    } else if (this.input.value.length === 0 && !resetIsHidden) {
      this.resetButton.classList.add("hidden");
    }
  }

  onChange() {
    this.toggleResetButton();
  }

  shouldResetForm() {
    return !document.querySelector('[aria-selected="true"] a');
  }

  onFormReset(event) {
    event.preventDefault();
    if (this.shouldResetForm()) {
      this.input.value = "";
      this.input.focus();
      this.toggleResetButton();
    }
  }
}

customElements.define("search-form", SearchForm);

class NavbarSearch extends SearchForm {
  constructor() {
    super();
    this.cachedResults = {};
    this.predictiveSearchResults = this.querySelector("[data-navbar-search]");
    this.allPredictiveSearchInstances =
      document.querySelectorAll("navbar-search");
    this.isOpen = false;
    this.abortController = new AbortController();

    this.setupEventListeners();
  }

  setupEventListeners() {
    const form = this.querySelector("form.search");
    form.addEventListener("submit", this.onFormSubmit.bind(this));

    this.input.addEventListener(
      "input",
      debounce((event) => {
        this.onChange(event);
      }, 300),
    );
    this.input.addEventListener("focus", this.onFocus.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.addEventListener("keyup", this.onKeyup.bind(this));
    this.addEventListener("keydown", this.onKeydown.bind(this));
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    this.toggleResetButton();
    const searchTerm = this.getQuery();

    if (!searchTerm.length) {
      this.close(true);
      return;
    }

    this.getSearchResults(searchTerm);
  }

  onFormSubmit(event) {
    if (
      !this.getQuery().length ||
      this.querySelector('[aria-selected="true"] a')
    ) {
      event.preventDefault();
    }
  }

  onFocus() {
    const searchTerm = this.getQuery();
    if (!searchTerm.length) return;

    if (this.getAttribute("results") === "true") {
      this.open();
    } else {
      this.getSearchResults(searchTerm);
    }
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onKeyup(event) {
    if (!this.getQuery().length) this.close(true);

    switch (event.code) {
      case "ArrowUp":
        event.preventDefault();
        this.switchOption("up");
        break;
      case "ArrowDown":
        event.preventDefault();
        this.switchOption("down");
        break;
      case "Enter":
        this.selectOption();
        break;
    }
  }

  onKeydown(event) {
    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
      event.preventDefault();
    }
  }

  switchOption(direction) {
    if (!this.getAttribute("open")) return;

    const moveUp = direction === "up";
    const selectedElement = this.querySelector('[aria-selected="true"]');
    const allElements = this.querySelectorAll("li");
    let activeElement = this.querySelector("li");

    if (moveUp && !selectedElement) return;
    if (!allElements.length) return;

    if (this.statusElement) this.statusElement.textContent = "";

    if (!moveUp && selectedElement) {
      activeElement = selectedElement.nextElementSibling || allElements[0];
    } else if (moveUp) {
      activeElement =
        selectedElement.previousElementSibling ||
        allElements[allElements.length - 1];
    }

    if (activeElement === selectedElement) return;

    activeElement.setAttribute("aria-selected", true);
    if (selectedElement) selectedElement.setAttribute("aria-selected", false);

    this.setLiveRegionText(activeElement.textContent);
    this.input.setAttribute("aria-activedescendant", activeElement.id);
  }

  selectOption() {
    const selectedProduct = this.querySelector(
      '[aria-selected="true"] a, [aria-selected="true"] button',
    );
    if (selectedProduct) selectedProduct.click();
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(" ", "-").toLowerCase();
    this.setLiveRegionLoadingState();

    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey]);
      return;
    }

    const params = new URLSearchParams({
      q: searchTerm,
      section_id: "navbar-search",
      "resources[type]": "query,product",
      "resources[limit]": "4",
      "resources[limit_scope]": "each",
      "resources[options][unavailable_products]": "last",
    });

    fetch(`${window.Shopify.routes.root}search/suggest?${params.toString()}`, {
      signal: this.abortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
          const error = new Error(response.status);
          this.close();
          throw error;
        }
        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser()
          .parseFromString(text, "text/html")
          .querySelector("#shopify-section-navbar-search").innerHTML;

        this.allPredictiveSearchInstances.forEach((instance) => {
          instance.cachedResults[queryKey] = resultsMarkup;
        });

        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        this.close();
        console.error(error);
      });
  }

  setLiveRegionLoadingState() {
    this.statusElement =
      this.statusElement || this.querySelector(".navbar-search-status");
    this.loadingText =
      this.loadingText || this.getAttribute("data-loading-text");

    this.setLiveRegionText(this.loadingText);
    this.setAttribute("loading", true);
  }

  setLiveRegionText(statusText) {
    if (!this.statusElement) return;
    this.statusElement.setAttribute("aria-hidden", "false");
    this.statusElement.textContent = statusText;

    setTimeout(() => {
      this.statusElement.setAttribute("aria-hidden", "true");
    }, 1000);
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;
    this.setAttribute("results", true);

    this.setLiveRegionResults();
    this.open();
  }

  setLiveRegionResults() {
    this.removeAttribute("loading");
    const countEl = this.querySelector(
      "[data-navbar-search-live-region-count-value]",
    );
    this.setLiveRegionText(countEl ? countEl.textContent : "");
  }

  getResultsMaxHeight() {
    const headerEl = document.querySelector(".section-header");
    const bottom = headerEl ? headerEl.getBoundingClientRect().bottom : 0;
    this.resultsMaxHeight = window.innerHeight - bottom;
    return this.resultsMaxHeight;
  }

  open() {
    this.predictiveSearchResults.style.maxHeight =
      this.resultsMaxHeight || `${this.getResultsMaxHeight()}px`;
    this.setAttribute("open", true);
    this.input.setAttribute("aria-expanded", true);
    this.isOpen = true;
  }

  close(clearSearchTerm = false) {
    this.closeResults(clearSearchTerm);
    this.isOpen = false;
  }

  closeResults(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = "";
      this.removeAttribute("results");
    }
    const selected = this.querySelector('[aria-selected="true"]');
    if (selected) selected.setAttribute("aria-selected", false);

    this.input.setAttribute("aria-activedescendant", "");
    this.removeAttribute("loading");
    this.removeAttribute("open");
    this.input.setAttribute("aria-expanded", false);
    this.resultsMaxHeight = false;
    this.predictiveSearchResults.removeAttribute("style");
  }
}

customElements.define("navbar-search", NavbarSearch);
