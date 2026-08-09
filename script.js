// Chrome on Android reports S-Pen (and similar styluses) as hover-capable,
// so CSS :hover fires on pen proximity before contact, then :active fires on
// touch-down — two stages instead of one, which reads as a hold delay.
// Edge apparently routes pen through the touch path instead, skipping that
// hover stage. To make behavior consistent across browsers, we track the
// real pointer type ourselves and gate the CSS :hover rules (see style.css)
// behind a class that's only absent for genuine mouse input.
const setPointerMode = (pointerType) => {
    document.documentElement.classList.toggle("pen-touch-mode", pointerType !== "mouse");
};
document.addEventListener("pointerdown", (e) => setPointerMode(e.pointerType), { passive: true });
document.addEventListener("pointermove", (e) => setPointerMode(e.pointerType), { passive: true });

// Separately: native :active timing is controlled by Chrome's own tap-vs-hold
// gesture disambiguation, which can require a "hold" once the browser has
// seen a hover-capable pointer (a pen) — and that slower mode can persist for
// later finger input too, until the page reloads. That's a browser-engine
// heuristic no CSS can override. So for touch/pen we skip native :active
// entirely and drive the press-dim effect ourselves via Pointer Events,
// which fire immediately regardless of Chrome's internal gesture state.
// Mouse continues to rely on native :hover/:active, untouched — this only
// applies to touch and pen. The companion CSS lives in style.css and uses
// :has(.is-pressed) so the same dim/highlight pattern (group dims, pressed
// item stays full opacity) applies as it does for :active.
const PRESS_TARGETS = ".nav-trigger, .social-icon, .mobile-trigger, .panel-content a, .mobile-item, .mobile-view a";
document.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    const el = e.target.closest(PRESS_TARGETS);
    if (el) el.classList.add("is-pressed");
}, { passive: true });
const clearPressed = () => {
    document.querySelectorAll(".is-pressed").forEach((el) => el.classList.remove("is-pressed"));
};
document.addEventListener("pointerup", clearPressed, { passive: true });
document.addEventListener("pointercancel", clearPressed, { passive: true });

document.addEventListener("DOMContentLoaded", () => {
    const canopy = document.querySelector(".glass-canopy");
    const deskTriggers = document.querySelectorAll(".nav-trigger");
    const megaPanel = document.querySelector(".mega-panel");
    const deskContents = document.querySelectorAll(".panel-content");
    const scrim = document.querySelector(".focal-scrim");
    const MENU_DEBOUNCE = 100;
    let timeoutId;
    let pinnedOpen = false;
    const cloneNavigation = () => {
        ['artefacts', 'trajectory', 'signals'].forEach(panel => {
            const deskContent = document.getElementById(`panel-${panel}`);
            const mobileContent = document.getElementById(`m-${panel}`);
            if (deskContent && mobileContent) {
                mobileContent.innerHTML = deskContent.innerHTML;
            }
        });
    };
    cloneNavigation();
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
    const getActiveTrigger = () =>
        Array.from(deskTriggers).find(t => t.getAttribute("aria-expanded") === "true") || null;
    const performDeskClose = () => {
        canopy.classList.remove("active");
        megaPanel.classList.remove("active");
        megaPanel.style.transitionDuration = "";
        megaPanel.style.height = "0px";
        scrim.classList.remove("active");
        updateAriaTriggers(null);
    };
    const closeDeskMenu = (immediate = false) => {
        clearTimeout(timeoutId);
        if (immediate) {
            performDeskClose();
        } else {
            timeoutId = setTimeout(performDeskClose, MENU_DEBOUNCE);
        }
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
            const targetHeight = targetContent.scrollHeight + 48;
            const currentHeight = megaPanel.offsetHeight;
            const distanceToTravel = Math.abs(currentHeight - targetHeight);
            const dynamicTime = Math.min(0.8, 0.2 + (Math.sqrt(distanceToTravel) * 0.015));
            megaPanel.style.transitionDuration = `${dynamicTime}s, ${dynamicTime}s, ${dynamicTime}s, ${dynamicTime}s`;
            megaPanel.style.height = targetHeight + "px";
        }
    };
    deskTriggers.forEach(trigger => {
        trigger.addEventListener("pointerenter", (e) => {
            if (e.pointerType !== 'mouse') return;
            openDeskMenu(trigger.getAttribute("data-target"));
        });
        trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const target = trigger.getAttribute("data-target");
            const panel = document.getElementById(`panel-${target}`);
            if (!panel) return;
            const isActive = canopy.classList.contains("active") && panel.classList.contains("active");
            if (isActive) {
                pinnedOpen = false;
                closeDeskMenu(true);
            } else {
                pinnedOpen = true;
                openDeskMenu(target);
            }
        });
    });
    megaPanel.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(timeoutId);
    });
    canopy.addEventListener("pointerleave", (e) => {
        if (e.pointerType !== 'mouse') return;
        if (pinnedOpen) return;
        closeDeskMenu();
    });
    document.addEventListener("click", (e) => {
        if (!pinnedOpen) return;
        if (canopy.contains(e.target)) return;
        pinnedOpen = false;
        closeDeskMenu(true);
    });
    scrim.addEventListener("click", () => {
        pinnedOpen = false;
        closeDeskMenu(true);
    });
    const mobileTrigger = document.getElementById("mobile-trigger");
    const mobileOverlay = document.getElementById("mobile-overlay");
    const mobileMain = document.getElementById("mobile-main");
    const mobileItems = document.querySelectorAll(".mobile-item");
    const mobileBackGlobal = document.getElementById("mobile-back-global");
    const mobileBackLabel = document.getElementById("mobile-back-label");
    const mobileViews = document.querySelectorAll(".mobile-view");
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
    const resetMobileViews = () => {
        mobileViews.forEach(view => {
            view.classList.remove("view-left", "view-center");
            view.classList.add("view-right");
        });
        mobileMain.classList.remove("view-left", "view-right");
        mobileMain.classList.add("view-center");
        mobileItems.forEach(i => i.setAttribute("aria-expanded", "false"));
        mobileBackGlobal.classList.remove("is-visible");
    };
    const closeMobileMenu = () => {
        mobileTrigger.classList.remove("active");
        mobileOverlay.classList.remove("active");
        canopy.classList.remove("mobile-menu-open");
        mobileTrigger.setAttribute("aria-expanded", "false");
        mobileOverlay.setAttribute("aria-hidden", "true");
        document.removeEventListener("keydown", trapFocus);
    };
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (megaPanel.classList.contains("active")) {
                const trigger = getActiveTrigger();
                pinnedOpen = false;
                closeDeskMenu(true);
                if (trigger) trigger.focus();
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
            resetMobileViews();
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
            mobileMain.classList.remove("view-center");
            mobileMain.classList.add("view-left");
            targetPane.classList.remove("view-right");
            targetPane.classList.add("view-center");
            mobileBackLabel.textContent = item.textContent;
            mobileBackGlobal.classList.add("is-visible");
        });
    });
    mobileBackGlobal.addEventListener("click", resetMobileViews);
});
