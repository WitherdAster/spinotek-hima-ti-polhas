/**
 * ritual.js
 * Handles the "Add Habit" Ritual interactions.
 * - Drag & Drop from Memory Core
 * - Hold to Materialize logic
 */

window.Ritual = {
    init() {
        const templates = document.querySelectorAll('.ghost-template');
        const dropZone = document.getElementById('habit-list');

        // Drag Source Logic
        templates.forEach(drag => {
            drag.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('application/json', drag.getAttribute('data-template'));
                e.dataTransfer.effectAllowed = 'copy';
                drag.classList.add('dragging');
            });
            drag.addEventListener('dragend', () => {
                drag.classList.remove('dragging');
            });
        });

        // Drop Zone Logic
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault(); // Necessary to allow dropping
                dropZone.classList.add('drag-over');
                e.dataTransfer.dropEffect = 'copy';
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const data = e.dataTransfer.getData('application/json');
                if (data) {
                    try {
                        const template = JSON.parse(data);
                        createGhostHabit(template, dropZone);
                    } catch (err) {
                        console.error('Ritual Failed: Corrupt Template Data', err);
                    }
                }
            });
        }
    }
};

// Internal Logic to Create and Manage Ghost Habit
function createGhostHabit(template, container) {
    const ghostId = 'ghost-' + Date.now();
    const el = document.createElement('div');
    el.className = 'habit-item is-ghost';
    el.dataset.ghostId = ghostId;

    // Render standard habit structure but in ghost mode
    el.innerHTML = `
        <div class="habit-info">
            <span class="habit-name">${template.name}</span>
            <span class="habit-meta">[${template.difficulty}] NOT_MATERIALIZED</span>
        </div>
        <div class="habit-actions">
            <!-- No buttons yet, interaction is purely 'HOLD' on body -->
        </div>
    `;

    // Prepend to list (Ritual always starts at top)
    container.insertBefore(el, container.firstChild);

    // Setup Hold Interaction
    setupHoldInteraction(el, template);
}

function setupHoldInteraction(element, template) {
    // CLOSURE STATE: Strictly isolated to this element instance
    let holdTimer = null;
    let progress = 0;

    // Explicit State Machine
    const setState = (newState) => {
        element.dataset.ritualState = newState;
        // Keep class sync for existing CSS, or migrate CSS to use [data-ritual-state]
        if (newState === 'MATERIALIZING') element.classList.add('is-materializing');
        else element.classList.remove('is-materializing');

        if (newState === 'COMMITTED') element.classList.add('is-born');
    };

    // Initialize State
    setState('IDLE');
    const HOLD_DURATION_MS = 1000;

    const startHold = (e) => {
        // Prevent default touch scrolling or selection
        if (e.type === 'touchstart') e.preventDefault();

        // Only allow start if IDLE
        if (element.dataset.ritualState !== 'IDLE') return;

        setState('MATERIALIZING');
        let startTime = Date.now();

        const tick = () => {
            // Safety check: if state changed externally (e.g. disintegrated), stop
            if (element.dataset.ritualState !== 'MATERIALIZING') return;

            const elapsed = Date.now() - startTime;
            progress = Math.min((elapsed / HOLD_DURATION_MS) * 100, 100);

            // Visual Update
            element.style.setProperty('--progress', `${progress}%`);

            if (progress >= 100) {
                // Success!
                setState('COMMITTED');
                completeRitual(element, template);
            } else {
                holdTimer = requestAnimationFrame(tick);
            }
        };

        holdTimer = requestAnimationFrame(tick);
    };

    const cancelHold = () => {
        // Only intervene if currently materializing
        if (element.dataset.ritualState !== 'MATERIALIZING') return;

        // Stop the timer
        if (holdTimer) cancelAnimationFrame(holdTimer);

        // Decision: Click or Fail?
        // If progress is very low (e.g. < 5%) treat as click/mistake?
        // Requirement says: "Release hold before full -> Disintegrate".
        // Let's be strict but forgive instant clicks (< 50ms isn't visibly holding).
        // Actually, logic said "If progress > 0 and < 100".

        if (progress > 5 && progress < 100) {
            setState('DISINTEGRATING');
            disintegrate(element);
        } else {
            // Just reset (too fast to be a hold attempt, or safety fallback)
            setState('IDLE');
            element.style.setProperty('--progress', '0%');
        }

        progress = 0;
    };

    // Event Binding - Scoped to this element
    // Desktop
    element.addEventListener('mousedown', startHold);
    element.addEventListener('mouseup', cancelHold);
    element.addEventListener('mouseleave', cancelHold);

    // Mobile
    element.addEventListener('touchstart', startHold);
    element.addEventListener('touchend', cancelHold);
    element.addEventListener('touchcancel', cancelHold);
}

function disintegrate(element) {
    if (!element.parentElement) return; // Already gone

    // 1. Get Coordinates
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 2. Remove Element immediately (The Void consumes it)
    element.remove();

    // 3. Log Failure (Use Template ID or Name if available, otherwise Generic)
    const habitName = element.querySelector('.habit-name')?.innerText || 'Unknown Protocol';
    window.Store.addLogEntry(`SYSTEM: '${habitName}' disintegrated. Commitment failed.`, 'failure');

    // 4. Spawn Particles
    const PARTICLE_COUNT = 15;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = document.createElement('div');
        p.className = 'ritual-fragment';

        // Random spread
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100; // Scatter distance
        const tx = Math.cos(angle) * distance + 'px';
        const ty = Math.sin(angle) * distance + 'px';

        p.style.setProperty('--tx', tx);
        p.style.setProperty('--ty', ty);

        // Start position (center of destroyed element)
        const jitterX = (Math.random() - 0.5) * rect.width;
        const jitterY = (Math.random() - 0.5) * rect.height;

        p.style.left = (centerX + jitterX) + 'px';
        p.style.top = (centerY + jitterY) + 'px';

        document.body.appendChild(p);

        // Cleanup particle
        setTimeout(() => {
            p.remove();
        }, 600); // Match animation duration
    }
}

function completeRitual(element, template) {
    // 1. Finalize Visuals
    // element.classList.add('is-born'); // Handled by setState('COMMITTED') now
    element.classList.remove('is-ghost');

    // 2. Add to Store (Real Persistence)
    const newHabit = {
        id: 'h-' + Date.now(),
        name: template.name,
        difficulty: template.difficulty,
        streak: 0
    };

    window.Store.addLogEntry(`SYSTEM: Ritual complete. '${template.name}' materialized.`, 'success');
    window.Store.addHabit(newHabit);
}
