document.addEventListener("DOMContentLoaded", () => {
    const canopy = document.querySelector(".glass-canopy");
    const deskTriggers = document.querySelectorAll(".nav-trigger");
    const megaPanel = document.querySelector(".mega-panel");
    const deskContents = document.querySelectorAll(".panel-content");
    const scrim = document.querySelector(".focal-scrim");
    const MENU_DEBOUNCE = 100;
    let timeoutId;

    document.addEventListener("touchstart", () => {}, { passive: true });

    if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
        document.body.classList.add("can-hover");
    }
    document.addEventListener("pointerdown", (e) => {
        document.body.classList.toggle("can-hover", e.pointerType !== "touch");
    }, { passive: true });
    document.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "touch" && !document.body.classList.contains("can-hover")) {
            document.body.classList.add("can-hover");
        }
    }, { passive: true });

    document.addEventListener("click", (e) => {
        const link = e.target.closest('a[href="#"]');
        if (link) e.preventDefault();
    });

    const updateAriaTriggers = (activeTargetId = null) => {
        deskTriggers.forEach(trigger => {
            const isExpanded = trigger.getAttribute("data-target") === activeTargetId;
            trigger.setAttribute("aria-expanded", isExpanded ? "true" : "false");
        });
    };

    const performDeskClose = () => {
        canopy.classList.remove("active");
        megaPanel.classList.remove("active");
        megaPanel.style.height = "0px";
        scrim.classList.remove("active");
        updateAriaTriggers(null);
    };

    megaPanel.addEventListener('transitionend', (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.propertyName === 'opacity' && !megaPanel.classList.contains('active')) {
            deskContents.forEach(c => c.classList.remove("active"));
        }
    });

    const openDeskMenu = (targetId) => {
        clearTimeout(timeoutId);
        canopy.classList.add("active");
        megaPanel.classList.add("active");
        scrim.classList.add("active");
        updateAriaTriggers(targetId);

        let targetContent;
        deskContents.forEach(content => {
            const isActive = content.id === `panel-${targetId}`;
            content.classList.toggle("active", isActive);
            if (isActive) targetContent = content;
        });

        if (targetContent) {
            megaPanel.style.height = targetContent.scrollHeight + "px";
        }
    };

    const closeDeskMenu = () => {
        timeoutId = setTimeout(performDeskClose, MENU_DEBOUNCE);
    };

    const closeDeskMenuNow = () => {
        clearTimeout(timeoutId);
        performDeskClose();
    };

    deskTriggers.forEach(trigger => {
        trigger.addEventListener("pointerenter", (e) => {
            if (e.pointerType === 'touch') return;
            openDeskMenu(trigger.getAttribute("data-target"));
        });

        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const target = trigger.getAttribute("data-target");
            const panel = document.getElementById(`panel-${target}`);
            if (!panel) return;
            const isActive = canopy.classList.contains("active") && panel.classList.contains("active");
            if (isActive) {
                closeDeskMenuNow();
            } else {
                openDeskMenu(target);
            }
        });
    });

    megaPanel.addEventListener("pointerenter", (e) => {
        if (e.pointerType === 'touch') return;
        clearTimeout(timeoutId);
    });

    canopy.addEventListener("pointerleave", (e) => {
        if (e.pointerType === 'touch') return;
        closeDeskMenu();
    });

    scrim.addEventListener("click", closeDeskMenuNow);

    const mobileTrigger = document.getElementById("mobile-trigger");
    const mobileOverlay = document.getElementById("mobile-overlay");
    const mobileMain = document.getElementById("mobile-main");
    const mobileItems = document.querySelectorAll(".mobile-item");
    const mobileBackGlobal = document.getElementById("mobile-back-global");
    const mobileBackLabel = document.getElementById("mobile-back-label");
    const mobileViews = document.querySelectorAll(".mobile-view");

    let activeSubView = null;

    const trapFocus = (e) => {
        if (e.key !== "Tab") return;
        const focusable = [
            mobileTrigger,
            mobileBackGlobal,
            ...mobileOverlay.querySelectorAll("button, a[href]")
        ].filter(el => {
            return el.offsetParent !== null &&
                   getComputedStyle(el).visibility !== "hidden" &&
                   getComputedStyle(el).pointerEvents !== "none";
        });
        if (focusable.length < 2) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    const closeMobileMenu = () => {
        mobileTrigger.classList.remove("active");
        mobileOverlay.classList.remove("active");
        canopy.classList.remove("mobile-menu-open");
        mobileTrigger.setAttribute("aria-expanded", "false");
        mobileOverlay.setAttribute("aria-hidden", "true");
        mobileBackGlobal.classList.remove("is-visible");
        document.removeEventListener("keydown", trapFocus);
    };

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (megaPanel.classList.contains("active")) {
                closeDeskMenuNow();
            }
            if (mobileOverlay.classList.contains("active")) {
                closeMobileMenu();
                mobileTrigger.focus();
            }
        }
    });

    mobileOverlay.addEventListener('transitionend', (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.propertyName === 'opacity' && !mobileOverlay.classList.contains('active')) {
            mobileViews.forEach(view => {
                view.classList.remove("view-left", "view-center");
                view.classList.add("view-right");
            });
            mobileMain.classList.remove("view-left", "view-right");
            mobileMain.classList.add("view-center");
            activeSubView = null;
            mobileItems.forEach(i => i.setAttribute("aria-expanded", "false"));
        }
    });

    mobileTrigger.addEventListener("click", () => {
        const opening = !mobileOverlay.classList.contains("active");

        if (opening) {
            mobileTrigger.classList.add("active");
            mobileOverlay.classList.add("active");
            canopy.classList.add("mobile-menu-open");
            mobileTrigger.setAttribute("aria-expanded", "true");
            mobileOverlay.removeAttribute("aria-hidden");
            document.addEventListener("keydown", trapFocus);
        } else {
            closeMobileMenu();
        }
    });

    mobileItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetId = item.getAttribute("data-target");
            const targetPane = document.getElementById(targetId);
            if (!targetPane) return;

            mobileItems.forEach(i => i.setAttribute("aria-expanded", i === item ? "true" : "false"));

            activeSubView = targetPane;

            mobileMain.classList.remove("view-center");
            mobileMain.classList.add("view-left");

            targetPane.classList.remove("view-right");
            targetPane.classList.add("view-center");

            mobileBackLabel.textContent = item.textContent;
            mobileBackGlobal.classList.add("is-visible");
        });
    });

    mobileBackGlobal.addEventListener("click", () => {
        if (!activeSubView) return;

        activeSubView.classList.remove("view-center");
        activeSubView.classList.add("view-right");

        mobileMain.classList.remove("view-left");
        mobileMain.classList.add("view-center");

        mobileBackGlobal.classList.remove("is-visible");
        activeSubView = null;

        mobileItems.forEach(i => i.setAttribute("aria-expanded", "false"));
    });
});
