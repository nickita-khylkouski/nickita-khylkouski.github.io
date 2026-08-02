(() => {
  const targets = document.querySelectorAll("[data-photo]");
  const popover = document.querySelector(".photo-popover");
  const image = popover.querySelector("img");
  const caption = popover.querySelector("figcaption");
  const gap = 12;
  const edge = 16;

  const overlapArea = (first, second) => {
    const width = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left));
    const height = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top));
    return width * height;
  };

  const overflow = (box) =>
    Math.max(0, edge - box.left) +
    Math.max(0, edge - box.top) +
    Math.max(0, box.right - window.innerWidth + edge) +
    Math.max(0, box.bottom - window.innerHeight + edge);

  const position = (target) => {
    const targetBox = target.getBoundingClientRect();
    const popoverBox = popover.getBoundingClientRect();

    if (window.innerWidth <= 760) {
      popover.style.left = `${edge}px`;
      popover.style.top = `${Math.max(edge, window.innerHeight - popoverBox.height - edge)}px`;
      return;
    }

    const candidates = [
      { left: targetBox.right + gap, top: targetBox.top },
      { left: targetBox.left - popoverBox.width - gap, top: targetBox.top },
      { left: targetBox.left, top: targetBox.bottom + gap },
      { left: targetBox.left, top: targetBox.top - popoverBox.height - gap },
    ];

    const score = (candidate) => {
      const box = {
        left: candidate.left,
        top: candidate.top,
        right: candidate.left + popoverBox.width,
        bottom: candidate.top + popoverBox.height,
      };
      return overflow(box) * 100 + overlapArea(box, targetBox) * 10000;
    };

    const best = candidates.sort((first, second) => score(first) - score(second))[0];
    const left = Math.min(window.innerWidth - popoverBox.width - edge, Math.max(edge, best.left));
    const top = Math.min(window.innerHeight - popoverBox.height - edge, Math.max(edge, best.top));
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  };

  const show = (target) => {
    image.src = target.dataset.photo;
    image.alt = target.dataset.caption || "Photo";
    caption.textContent = target.dataset.caption || "";
    popover.setAttribute("aria-hidden", "false");
    popover.classList.add("is-visible");
    position(target);
    const decoded = image.decode ? image.decode() : Promise.resolve();
    decoded.catch(() => {}).finally(() => position(target));
  };

  const hide = () => {
    popover.classList.remove("is-visible");
    popover.setAttribute("aria-hidden", "true");
  };

  targets.forEach((target) => {
    if (!target.matches("a")) target.tabIndex = 0;
    target.addEventListener("mouseenter", () => show(target));
    target.addEventListener("mouseleave", hide);
    target.addEventListener("focus", () => show(target));
    target.addEventListener("blur", hide);
  });

  window.addEventListener("scroll", hide, { passive: true });
  window.addEventListener("resize", hide);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide();
  });
})();
