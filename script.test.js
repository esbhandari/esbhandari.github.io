const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf8');

describe('trapFocus edge cases', () => {
    beforeEach(() => {
        document.documentElement.innerHTML = html.toString();
        // Mock getComputedStyle
        const originalGetComputedStyle = window.getComputedStyle;
        window.getComputedStyle = (el) => {
            if (el.hasAttribute('hidden')) {
                return { visibility: 'hidden', pointerEvents: 'none', ...originalGetComputedStyle(el) };
            }
            return { visibility: 'visible', pointerEvents: 'auto', ...originalGetComputedStyle(el) };
        };

        // Mock offsetParent
        Object.defineProperty(window.HTMLElement.prototype, 'offsetParent', {
            get() { return this.hasAttribute('hidden') ? null : this.parentNode; },
            configurable: true
        });

        const scriptContent = fs.readFileSync(path.resolve(__dirname, 'script.js'), 'utf8');
        // Eval the script directly in this context to avoid CommonJS / ES module issues in tests
        eval(scriptContent);

        document.dispatchEvent(new window.Event("DOMContentLoaded", {
            bubbles: true,
            cancelable: true
        }));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should trap focus backwards on Shift+Tab from first element', () => {
        const mobileTrigger = document.getElementById("mobile-trigger");
        const mobileOverlay = document.getElementById("mobile-overlay");

        mobileTrigger.click(); // Open menu to bind the event

        mobileTrigger.focus();

        const event = new window.KeyboardEvent("keydown", {
            key: "Tab",
            shiftKey: true,
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(event);

        const mobileBackGlobal = document.getElementById("mobile-back-global");
        const focusable = [
            mobileTrigger,
            mobileBackGlobal,
            ...mobileOverlay.querySelectorAll("button, a[href]")
        ].filter(el => {
            if (el.offsetParent === null) return false;
            const style = window.getComputedStyle(el);
            return style.visibility !== "hidden" &&
                   style.pointerEvents !== "none";
        });

        const last = focusable[focusable.length - 1];
        expect(document.activeElement).toBe(last);
    });

    test('should trap focus forwards on Tab from last element', () => {
        const mobileTrigger = document.getElementById("mobile-trigger");
        const mobileOverlay = document.getElementById("mobile-overlay");

        mobileTrigger.click(); // Open menu to bind the event

        const mobileBackGlobal = document.getElementById("mobile-back-global");
        const focusable = [
            mobileTrigger,
            mobileBackGlobal,
            ...mobileOverlay.querySelectorAll("button, a[href]")
        ].filter(el => {
            if (el.offsetParent === null) return false;
            const style = window.getComputedStyle(el);
            return style.visibility !== "hidden" &&
                   style.pointerEvents !== "none";
        });

        const last = focusable[focusable.length - 1];
        const first = focusable[0];
        last.focus();

        const event = new window.KeyboardEvent("keydown", {
            key: "Tab",
            shiftKey: false,
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(event);

        expect(document.activeElement).toBe(first);
    });

    test('should do nothing if key is not Tab', () => {
        const mobileTrigger = document.getElementById("mobile-trigger");

        mobileTrigger.click(); // Open menu to bind the event
        mobileTrigger.focus();

        const event = new window.KeyboardEvent("keydown", {
            key: "Enter",
            bubbles: true,
            cancelable: true
        });

        const defaultPrevented = !document.dispatchEvent(event);

        expect(document.activeElement).toBe(mobileTrigger); // Focus shouldn't move
        expect(defaultPrevented).toBe(false); // Default should not be prevented
    });

    test('should do nothing if focusable elements are less than 2', () => {
        const mobileTrigger = document.getElementById("mobile-trigger");
        const mobileOverlay = document.getElementById("mobile-overlay");
        const mobileBackGlobal = document.getElementById("mobile-back-global");

        mobileTrigger.click(); // Open menu to bind the event

        // Hide elements to make focusable length < 2
        mobileBackGlobal.setAttribute('hidden', 'true');
        mobileOverlay.querySelectorAll("button, a[href]").forEach(el => el.setAttribute('hidden', 'true'));

        mobileTrigger.focus();

        const event = new window.KeyboardEvent("keydown", {
            key: "Tab",
            shiftKey: true,
            bubbles: true,
            cancelable: true
        });

        const defaultPrevented = !document.dispatchEvent(event);

        expect(document.activeElement).toBe(mobileTrigger);
        expect(defaultPrevented).toBe(false);
    });
});
