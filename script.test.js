/**
 * @jest-environment jsdom
 */

const { cloneNavigation } = require('./script.js');

describe('cloneNavigation', () => {
    beforeEach(() => {
        // Reset the document body before each test
        document.body.innerHTML = '';
    });

    it('clones desktop panel contents to corresponding mobile panel contents', () => {
        // Arrange
        document.body.innerHTML = `
            <div id="panel-1" class="panel-content">
                <a href="#">Link 1</a>
                <span>Text 1</span>
            </div>
            <div id="m-1">
                <!-- Original mobile content to be replaced -->
                <div>Old Mobile Content</div>
            </div>
        `;

        // Act
        cloneNavigation();

        // Assert
        const mobilePanel = document.getElementById('m-1');
        expect(mobilePanel.children.length).toBe(2);
        expect(mobilePanel.children[0].tagName).toBe('A');
        expect(mobilePanel.children[0].textContent).toBe('Link 1');
        expect(mobilePanel.children[1].tagName).toBe('SPAN');
        expect(mobilePanel.children[1].textContent).toBe('Text 1');

        // Original content should be removed
        expect(mobilePanel.textContent).not.toContain('Old Mobile Content');
    });

    it('clones desktop social icons to the mobile socials container', () => {
        // Arrange
        document.body.innerHTML = `
            <div class="social-links">
                <a href="#" class="social-icon">Icon 1</a>
                <a href="#" class="social-icon">Icon 2</a>
            </div>
            <div class="mobile-socials"></div>
        `;

        // Act
        cloneNavigation();

        // Assert
        const mobileSocialsContainer = document.querySelector('.mobile-socials');
        expect(mobileSocialsContainer.children.length).toBe(2);
        expect(mobileSocialsContainer.children[0].textContent).toBe('Icon 1');
        expect(mobileSocialsContainer.children[1].textContent).toBe('Icon 2');
    });

    it('does nothing if the corresponding mobile container does not exist', () => {
        // Arrange
        document.body.innerHTML = `
            <div id="panel-missing" class="panel-content">
                <a href="#">Link Missing</a>
            </div>
        `;

        // Act
        // Should not throw an error
        expect(() => cloneNavigation()).not.toThrow();

        // Assert
        const mobilePanel = document.getElementById('m-missing');
        expect(mobilePanel).toBeNull();
    });

    it('ignores desk content elements that do not start with "panel-" id', () => {
         // Arrange
         document.body.innerHTML = `
            <div id="notpanel-1" class="panel-content">
                <a href="#">Link Not Panel</a>
            </div>
            <div id="m-1"></div>
        `;

        // Act
        cloneNavigation();

        // Assert
        const mobilePanel = document.getElementById('m-1');
        // Mobile panel should remain empty because 'notpanel-1' does not start with 'panel-'
        expect(mobilePanel.children.length).toBe(0);
    });

    it('handles absence of desktop social icons gracefully', () => {
        // Arrange
        document.body.innerHTML = `
            <div class="social-links">
                <!-- No social icons -->
            </div>
            <div class="mobile-socials"></div>
        `;

        // Act
        cloneNavigation();

        // Assert
        const mobileSocialsContainer = document.querySelector('.mobile-socials');
        expect(mobileSocialsContainer.children.length).toBe(0);
    });

    it('handles absence of mobile socials container gracefully', () => {
        // Arrange
        document.body.innerHTML = `
            <div class="social-links">
                <a href="#" class="social-icon">Icon 1</a>
            </div>
            <!-- Missing mobile-socials container -->
        `;

        // Act
        // Should not throw an error
        expect(() => cloneNavigation()).not.toThrow();
    });
});
