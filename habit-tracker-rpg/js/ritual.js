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
        // ... (keep existing init code logic if I could, but I need to substitute the whole block or match carefully)
        // Actually, let's just add the function to the object.
        // I will use a larger replacement to ensure I don't break init.

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
    if (window.RitualDebugLog) window.RitualDebugLog('setupHoldInteraction: Called for ' + template.name);

    // Force pointer events for safety
    element.style.pointerEvents = 'all';
    element.style.zIndex = '9999';
    element.style.position = 'relative'; // Ensure z-index works

    // Ritual Fatigue State (Closure)
    // Tracks usage within this specific ghost instance life? 
    // No, fatigue should be global or at least persistent across multiple adds? 
    // "Reset alami saat idle" -> implies global time-based tracking.
    // Let's attach it to window.Ritual for persistence across different ghost adds.
    if (!window.Ritual.fatigue) {
        window.Ritual.fatigue = { count: 0, lastTime: 0 };
    }

    // Dynamic Duration Calculation
    const BASE_DURATION = 5000;
    const now = Date.now();
    // Reset if idle for > 10 seconds
    if (now - window.Ritual.fatigue.lastTime > 10000) {
        window.Ritual.fatigue.count = 0;
    }
    const currentDuration = BASE_DURATION + (window.Ritual.fatigue.count * 500); // +0.5s per habit



    // Touch Tracking
    let touchStartY = 0;

    // State Helper
    const setState = (newState) => {
        element.dataset.ritualState = newState;
    };
    setState('IDLE');

    const startHold = (e) => {
        // Prevent default touch scrolling
        if (e.type === 'touchstart') {
            e.preventDefault();
            touchStartY = e.touches[0].clientY;
        } else if (e.type === 'mousedown') {
            touchStartY = e.clientY;
        }

        if (element.dataset.ritualState !== 'IDLE') return;

        setState('MATERIALIZING');
        let startTime = Date.now();

        // Reset classes
        element.classList.remove('ritual-glow', 'ritual-shake', 'ritual-spike');

        const tick = () => {
            if (element.dataset.ritualState !== 'MATERIALIZING') return;

            const elapsed = Date.now() - startTime;
            progress = Math.min((elapsed / currentDuration) * 100, 100);

            // Visual Update
            element.style.setProperty('--progress', `${progress}%`);

            // Feedback Thresholds
            // 95% -> Spike (Critical Mass)
            if (progress > 95) {
                element.classList.add('ritual-spike');
                element.classList.remove('ritual-shake');
            }
            // 80% -> Shake (Instability)
            else if (progress > 80) {
                element.classList.add('ritual-shake');
                element.classList.remove('ritual-glow');
            }
            // 60% -> Glow (Energy building)
            else if (progress > 60) {
                element.classList.add('ritual-glow');
            }

            if (progress >= 100) {
                // Success
                setState('COMMITTED');
                // Increment Fatigue
                window.Ritual.fatigue.count++;
                window.Ritual.fatigue.lastTime = Date.now();

                completeRitual(element, template);
            } else {
                holdTimer = requestAnimationFrame(tick);
            }
        };

        holdTimer = requestAnimationFrame(tick);
    };

    const detectSwipe = (e) => {
        if (element.dataset.ritualState !== 'MATERIALIZING') return;

        let clientY;
        if (e.type === 'touchmove') {
            clientY = e.touches[0].clientY;
        } else if (e.type === 'mousemove') {
            // Only tracking if holding
            if (e.buttons !== 1) return;
            clientY = e.clientY;
        } else {
            return;
        }

        const diff = clientY - touchStartY;

        // Swipe Threshold (50px to trigger abort)
        if (Math.abs(diff) > 50) {
            cancelAnimationFrame(holdTimer);
            abortRitual(element);
        }
    };

    const cancelHold = (e) => {
        if (element.dataset.ritualState !== 'MATERIALIZING') return;

        if (holdTimer) cancelAnimationFrame(holdTimer);

        // Fail Logic (Release too early = Disintegrate)
        if (progress > 5 && progress < 100) {
            setState('DISINTEGRATING');
            disintegrate(element);
        } else {
            // Clean reset if practically 0 progress
            setState('IDLE');
            element.style.setProperty('--progress', '0%');
            element.classList.remove('ritual-glow', 'ritual-shake', 'ritual-spike');
        }
        progress = 0;
    };

    // Event Binding
    element.addEventListener('mousedown', startHold);
    element.addEventListener('mouseup', cancelHold);
    element.addEventListener('mouseleave', cancelHold);
    element.addEventListener('mousemove', detectSwipe);

    element.addEventListener('touchstart', startHold, { passive: false });
    element.addEventListener('touchend', cancelHold);
    element.addEventListener('touchcancel', cancelHold);
    element.addEventListener('touchmove', detectSwipe, { passive: false });
}

function abortRitual(element) {
    element.dataset.ritualState = 'ABORTED';
    element.style.setProperty('--progress', '0%');
    element.classList.remove('ritual-glow', 'ritual-shake', 'ritual-spike');

    // Add visual feedback for abort (slide out)
    element.classList.add('ritual-abort');

    // Reset after animation
    setTimeout(() => {
        element.classList.remove('ritual-abort');
        element.style.opacity = '1';
        element.style.transform = 'none';
        element.dataset.ritualState = 'IDLE';
    }, 300);
}

function disintegrate(element) {
    if (!element.parentElement) return; // Already gone

    // 1. Get Coordinates
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 2. Add Decay Effect (Visual Freeze)
    element.classList.add('disintegrating');

    // 3. Spawn Particles (Enhanced "Glass" Scatter)
    const PARTICLE_COUNT = 32;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = document.createElement('div');
        p.className = 'ritual-fragment';

        // Randomize shard type
        const type = Math.random();
        if (type > 0.7) p.classList.add('shard-lg');
        else if (type > 0.3) p.classList.add('shard-md');
        else p.classList.add('shard-sm');

        // Random spread
        const angle = Math.random() * Math.PI * 2;
        const distance = 60 + Math.random() * 120; // Widen scatter
        const tx = Math.cos(angle) * distance + 'px';
        const ty = Math.sin(angle) * distance + 'px';
        const rot = (Math.random() - 0.5) * 720 + 'deg'; // Spin

        p.style.setProperty('--tx', tx);
        p.style.setProperty('--ty', ty);
        p.style.setProperty('--rot', rot);

        // Start position (distributed across element, not just center)
        const jitterX = (Math.random() - 0.5) * rect.width * 0.8;
        const jitterY = (Math.random() - 0.5) * rect.height * 0.8;

        p.style.left = (centerX + jitterX) + 'px';
        p.style.top = (centerY + jitterY) + 'px';

        document.body.appendChild(p);

        // Cleanup particle independently
        setTimeout(() => {
            if (p.parentNode) p.remove();
        }, 800);
    }

    // 4. Delayed Removal (Wait for animation)
    setTimeout(() => {
        if (element.parentElement) element.remove();
    }, 600);

    // 5. Delayed Log (Dramatic pause)
    setTimeout(() => {
        const habitName = element.querySelector('.habit-name')?.innerText || 'Unknown Protocol';
        // USE NEW NARRATIVE LOGGING
        if (window.Store && window.Store.logRitualResult) {
            window.Store.logRitualResult(false, { type: 'disintegration', name: habitName });
        } else {
            window.Store.addLogEntry(`SYSTEM: '${habitName}' disintegrated. Commitment failed.`, 'failure');
        }
    }, 800);
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

    // Narrative Logging
    if (window.Store && window.Store.logRitualResult) {
        window.Store.logRitualResult(true, { name: template.name });
    } else {
        window.Store.addLogEntry(`Ritual complete. '${template.name}' materialized.`, 'success');
    }

    if (window.Store && window.Store.addHabit) {
        window.Store.addHabit(newHabit);
    }
}
