const { updateAriaTriggers } = require('./script');

describe('updateAriaTriggers', () => {
    let triggers;

    beforeEach(() => {
        // Setup mock DOM elements
        const trigger1 = document.createElement('button');
        trigger1.setAttribute('data-target', 'target1');
        trigger1.setAttribute('aria-expanded', 'false');

        const trigger2 = document.createElement('button');
        trigger2.setAttribute('data-target', 'target2');
        trigger2.setAttribute('aria-expanded', 'false');

        const trigger3 = document.createElement('button');
        trigger3.setAttribute('data-target', 'target3');
        trigger3.setAttribute('aria-expanded', 'false');

        triggers = [trigger1, trigger2, trigger3];
    });

    it('sets aria-expanded to "true" for the active target and "false" for others', () => {
        updateAriaTriggers(triggers, 'target2');

        expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
        expect(triggers[1].getAttribute('aria-expanded')).toBe('true');
        expect(triggers[2].getAttribute('aria-expanded')).toBe('false');
    });

    it('sets aria-expanded to "false" for all triggers when activeTargetId is null', () => {
        // Set one to true initially to verify it gets updated
        triggers[0].setAttribute('aria-expanded', 'true');

        updateAriaTriggers(triggers, null);

        expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
        expect(triggers[1].getAttribute('aria-expanded')).toBe('false');
        expect(triggers[2].getAttribute('aria-expanded')).toBe('false');
    });

    it('sets aria-expanded to "false" for all triggers when activeTargetId does not match any target', () => {
        // Set one to true initially to verify it gets updated
        triggers[1].setAttribute('aria-expanded', 'true');

        updateAriaTriggers(triggers, 'nonexistent-target');

        expect(triggers[0].getAttribute('aria-expanded')).toBe('false');
        expect(triggers[1].getAttribute('aria-expanded')).toBe('false');
        expect(triggers[2].getAttribute('aria-expanded')).toBe('false');
    });

    it('handles an empty triggers array gracefully', () => {
        expect(() => updateAriaTriggers([], 'target1')).not.toThrow();
    });
});
