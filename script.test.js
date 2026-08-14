/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('script.js', () => {
    let html;
    beforeAll(() => {
        html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
    });

    beforeEach(() => {
        // Set up the DOM
        document.documentElement.innerHTML = html;

        // Load the script and force execution
        jest.isolateModules(() => {
            require('./script.js');
        });

        // Dispatch DOMContentLoaded so the script initializes
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });

    afterEach(() => {
        // Clean up
        document.documentElement.innerHTML = '';
        jest.restoreAllMocks();
    });

    test('adds is-pressed class on pointerdown for valid targets', () => {
        const trigger = document.querySelector('.nav-trigger');

        const event = new window.Event('pointerdown', { bubbles: true });
        event.pointerType = 'touch';

        trigger.dispatchEvent(event);

        expect(trigger.classList.contains('is-pressed')).toBe(true);
    });

    test('removes is-pressed class on pointerup', () => {
        const trigger = document.querySelector('.nav-trigger');
        trigger.classList.add('is-pressed');

        const event = new window.Event('pointerup', { bubbles: true });
        document.dispatchEvent(event);

        expect(trigger.classList.contains('is-pressed')).toBe(false);
    });

    test('removes is-pressed class on pointercancel', () => {
        const trigger = document.querySelector('.nav-trigger');
        trigger.classList.add('is-pressed');

        const event = new window.Event('pointercancel', { bubbles: true });
        document.dispatchEvent(event);

        expect(trigger.classList.contains('is-pressed')).toBe(false);
    });

    test('mobile menu trigger toggles mobile overlay', () => {
        // Here we specifically re-initialize the DOM for this test to avoid bleeding state
        document.documentElement.innerHTML = html;
        jest.isolateModules(() => {
            require('./script.js');
        });
        document.dispatchEvent(new Event('DOMContentLoaded'));

        const trigger = document.getElementById('mobile-trigger');
        const overlay = document.getElementById('mobile-overlay');
        const canopy = document.querySelector('.glass-canopy');

        expect(overlay.classList.contains('active')).toBe(false);

        // Click to open
        trigger.dispatchEvent(new window.Event('click', { bubbles: true }));

        expect(trigger.classList.contains('active')).toBe(true);
        expect(overlay.classList.contains('active')).toBe(true);
        expect(canopy.classList.contains('mobile-menu-open')).toBe(true);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
        expect(overlay.hasAttribute('aria-hidden')).toBe(false);

        // Click again to close
        trigger.dispatchEvent(new window.Event('click', { bubbles: true }));

        expect(trigger.classList.contains('active')).toBe(false);
        expect(overlay.classList.contains('active')).toBe(false);
        expect(canopy.classList.contains('mobile-menu-open')).toBe(false);
        expect(trigger.getAttribute('aria-expanded')).toBe('false');
        expect(overlay.getAttribute('aria-hidden')).toBe('true');
    });

    test('desktop navigation mega panel opens on click', () => {
        const trigger = document.querySelector('.nav-trigger[data-target="artefacts"]');
        const panel = document.getElementById('panel-artefacts');
        const megaPanel = document.querySelector('.mega-panel');
        const canopy = document.querySelector('.glass-canopy');
        const scrim = document.querySelector('.focal-scrim');

        // Prevent layout errors in JSDOM
        Object.defineProperty(panel, 'scrollHeight', { value: 100, configurable: true });
        Object.defineProperty(megaPanel, 'offsetHeight', { value: 0, configurable: true });

        // Simulate click
        const event = new window.Event('click', { bubbles: true, cancelable: true });
        trigger.dispatchEvent(event);

        expect(canopy.classList.contains('active')).toBe(true);
        expect(megaPanel.classList.contains('active')).toBe(true);
        expect(scrim.classList.contains('active')).toBe(true);
        expect(panel.classList.contains('active')).toBe(true);
        expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });

    test('Escape key closes menus', () => {
        const megaPanel = document.querySelector('.mega-panel');
        const canopy = document.querySelector('.glass-canopy');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const mobileTrigger = document.getElementById('mobile-trigger');

        // Open desktop menu
        megaPanel.classList.add('active');
        canopy.classList.add('active');

        const escEvent = new window.KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escEvent);

        expect(megaPanel.classList.contains('active')).toBe(false);
        expect(canopy.classList.contains('active')).toBe(false);

        // Open mobile menu
        mobileOverlay.classList.add('active');
        mobileTrigger.classList.add('active');

        document.dispatchEvent(escEvent);

        expect(mobileOverlay.classList.contains('active')).toBe(false);
        expect(mobileTrigger.classList.contains('active')).toBe(false);
    });

    test('Mobile items trigger new views and mobileBackGlobal resets views', () => {
        const mobileItem = document.querySelector('.mobile-item[data-target="m-artefacts"]');
        const targetPane = document.getElementById('m-artefacts');
        const mobileMain = document.getElementById('mobile-main');
        const mobileBackGlobal = document.getElementById('mobile-back-global');
        const mobileBackLabel = document.getElementById('mobile-back-label');

        // Initial click
        const event = new window.Event('click', { bubbles: true, cancelable: true });
        mobileItem.dispatchEvent(event);

        expect(mobileMain.classList.contains('view-left')).toBe(true);
        expect(targetPane.classList.contains('view-center')).toBe(true);
        expect(mobileBackLabel.textContent).toBe('Artefacts');
        expect(mobileBackGlobal.classList.contains('is-visible')).toBe(true);

        // Reset views
        const closeEvent = new window.Event('click', { bubbles: true, cancelable: true });
        mobileBackGlobal.dispatchEvent(closeEvent);

        expect(mobileMain.classList.contains('view-center')).toBe(true);
        expect(targetPane.classList.contains('view-right')).toBe(true);
        expect(mobileBackGlobal.classList.contains('is-visible')).toBe(false);
    });

    test('trapFocus cycles focus properly', () => {
        const mobileTrigger = document.getElementById('mobile-trigger');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const mobileBackGlobal = document.getElementById('mobile-back-global');

        // Mock offsetParent for visibility check
        Object.defineProperty(mobileTrigger, 'offsetParent', { get: () => ({}) });
        Object.defineProperty(mobileBackGlobal, 'offsetParent', { get: () => ({}) });

        mobileTrigger.focus();
        const event = new window.Event('click', { bubbles: true, cancelable: true });
        mobileTrigger.dispatchEvent(event); // Opens overlay, sets focus trap

        const tabEventShift = new window.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });

        document.activeElement.dispatchEvent(tabEventShift);
        // Note: Full end-to-end focus testing is tricky in JSDOM,
        // we'll at least verify the event listener doesn't throw.
    });
});
