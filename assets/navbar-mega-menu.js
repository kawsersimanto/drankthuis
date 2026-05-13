document.addEventListener("DOMContentLoaded", () => {
  const triggers = document.querySelectorAll("[data-mega-menu-trigger]");

  let activeTrigger = null;

  const menuMap = new WeakMap();

  triggers.forEach((trigger) => {
    const content = trigger.querySelector("[data-mega-menu-content]");
    if (!content) return;

    const items = content.querySelectorAll("li");

    gsap.set(content, {
      autoAlpha: 0,
      y: -10,
      pointerEvents: "none",
    });

    const tl = gsap.timeline({
      paused: true,
      defaults: {
        ease: "power2.out",
      },

      onStart: () => {
        gsap.set(content, {
          pointerEvents: "auto",
        });
      },

      onReverseComplete: () => {
        gsap.set(content, {
          pointerEvents: "none",
        });
      },
    });

    tl.to(content, {
      autoAlpha: 1,
      y: 0,
      duration: 0.25,
    });

    if (items.length) {
      tl.fromTo(
        items,
        {
          opacity: 0,
          y: 6,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.25,
          stagger: 0.04,
          ease: "power1.out",
        },
        "-=0.1",
      );
    }

    menuMap.set(trigger, {
      content,
      tl,
    });
  });

  const openMenu = (trigger) => {
    if (activeTrigger && activeTrigger !== trigger) {
      closeMenu(activeTrigger, true);
    }

    activeTrigger = trigger;

    const data = menuMap.get(trigger);
    if (!data) return;

    data.tl.timeScale(1).play();
  };

  const closeMenu = (trigger = activeTrigger, instant = false) => {
    if (!trigger) return;

    const data = menuMap.get(trigger);
    if (!data) return;

    const { tl, content } = data;

    if (instant) {
      tl.pause().progress(0);

      gsap.set(content, {
        autoAlpha: 0,
        y: -10,
        pointerEvents: "none",
      });
    } else {
      tl.timeScale(1.5).reverse();
    }

    if (activeTrigger === trigger) {
      activeTrigger = null;
    }
  };

  triggers.forEach((trigger) => {
    if (!menuMap.has(trigger)) return;

    // ONLY wrapper events
    trigger.addEventListener("pointerenter", () => {
      openMenu(trigger);
    });

    trigger.addEventListener("pointerleave", () => {
      closeMenu(trigger);
    });
  });
});
