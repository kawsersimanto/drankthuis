document.addEventListener("DOMContentLoaded", () => {
  const triggers = document.querySelectorAll("[data-mega-menu-trigger]");

  let activeTrigger = null;
  let closeTimeout = null;

  triggers.forEach((trigger) => {
    const content = trigger.querySelector("[data-mega-menu-content]");
    if (!content) return;

    // --- Setup initial state ---
    gsap.set(content, {
      y: -10,
      pointerEvents: "none",
      position: "absolute",
    });

    // --- Open ---
    const openMenu = () => {
      clearTimeout(closeTimeout);

      // Close any previously open menu
      if (activeTrigger && activeTrigger !== trigger) {
        closeMenu(activeTrigger);
      }

      activeTrigger = trigger;

      gsap.killTweensOf(content);
      gsap.to(content, {
        autoAlpha: 1,
        y: 0,
        duration: 0.25,
        ease: "power2.out",
        pointerEvents: "auto",
      });

      // Stagger children in
      const items = content.querySelectorAll("li");
      gsap.fromTo(
        items,
        { opacity: 0, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.2,
          stagger: 0.04,
          ease: "power1.out",
          delay: 0.05,
        },
      );
    };

    // --- Close ---
    const closeMenu = (targetTrigger = trigger) => {
      const targetContent = targetTrigger.querySelector(
        "[data-mega-menu-content]",
      );
      if (!targetContent) return;

      gsap.killTweensOf(targetContent);
      gsap.to(targetContent, {
        autoAlpha: 0,
        y: -10,
        duration: 0.18,
        ease: "power2.in",
        pointerEvents: "none",
      });

      if (activeTrigger === targetTrigger) activeTrigger = null;
    };

    // --- Events ---
    trigger.addEventListener("mouseenter", openMenu);

    trigger.addEventListener("mouseleave", () => {
      closeTimeout = setTimeout(() => {
        closeMenu();
      }, 100); // small delay so moving to child doesn't flicker
    });

    content.addEventListener("mouseenter", () => {
      clearTimeout(closeTimeout);
    });

    content.addEventListener("mouseleave", () => {
      closeTimeout = setTimeout(() => {
        closeMenu();
      }, 100);
    });
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-mega-menu-trigger]") && activeTrigger) {
      const content = activeTrigger.querySelector("[data-mega-menu-content]");
      if (content) {
        gsap.to(content, {
          autoAlpha: 0,
          y: -10,
          duration: 0.18,
          ease: "power2.in",
          pointerEvents: "none",
        });
      }
      activeTrigger = null;
    }
  });
});
