/**
 * ui.js
 * DOM Rendering logic.
 * Adapted for Global Scope.
 */

let elements = {};

window.UI = {
    init() {
        elements = {
            charLevel: document.getElementById('char-level'),
            charGold: document.getElementById('char-gold'),
            charStatus: document.getElementById('char-status'),
            hpText: document.getElementById('hp-text'),
            hpBar: document.getElementById('hp-bar'),
            expText: document.getElementById('exp-text'),
            expBar: document.getElementById('exp-bar'),
            habitList: document.getElementById('habit-list'),
            actionLog: document.getElementById('action-log')
        };
        console.log('UI Initialized. Elements found:', !!elements.habitList);
    },

    render(state) {
        if (!state) return;
        renderDashboard(state.character);
        renderHabits(state.habits);
        renderLogs(state.logs);
    },

    toggleMemoryCore() {
        const core = document.getElementById('memory-core');
        if (core) {
            core.classList.toggle('collapsed');
            core.classList.toggle('active');
        }
    },

    /**
     * Transaction Safety Wrapper
     * Prevents accidental purchases.
     */
    safeTransaction(btn, callback) {
        if (btn.dataset.confirming) {
            // Confirmed execute
            callback();
            // Reset UI state (though re-render usually wipes it)
            btn.removeAttribute('data-confirming');
            btn.innerHTML = btn.dataset.originalText;
            btn.classList.remove('cy-btn-warn');
        } else {
            // First click - Ask confirmation
            btn.dataset.confirming = 'true';
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = 'CONFIRM?';
            btn.classList.add('cy-btn-warn'); // Assumes we add this CSS or reuse existing

            // Auto-reset after 3s
            setTimeout(() => {
                if (btn && btn.parentNode) { // Check if still in DOM
                    btn.removeAttribute('data-confirming');
                    btn.innerHTML = btn.dataset.originalText;
                    btn.classList.remove('cy-btn-warn');
                }
            }, 3000);
        }
    },

    /**
     * Micro-Feedback Trigger
     * @param {string} elementId - ID of element to animate
     * @param {string} animationClass - 'anim-shake', 'anim-glow', 'anim-pulse'
     */
    triggerEffect(elementId, animationClass) {
        const el = document.getElementById(elementId);
        if (!el) return;

        // Reset animation logic
        el.classList.remove(animationClass);
        void el.offsetWidth; // Force reflow
        el.classList.add(animationClass);

        // Cleanup
        setTimeout(() => {
            if (el) el.classList.remove(animationClass);
        }, 1000);
    }
};

// Render functions
function renderDashboard(char) {
    if (!elements.charLevel) return; // Guard

    // Use Derived State Selector
    const viewState = window.RPG.getCharacterViewState(char);

    // Basic Info
    elements.charLevel.textContent = String(char.level).padStart(2, '0');
    elements.charGold.innerHTML = `${char.gold} <button onclick="window.UI.toggleAugmentationPanel(true)" class="cy-btn-gold-inline">+</button>`;

    // Status Logic - use viewState.statusClass (from selector)
    let statusText = char.status;
    if (viewState.isStabilized) statusText = "STABILIZED";
    else if (viewState.isWeakened) statusText = "WEAKENED";
    else if (viewState.isOverloaded) statusText = "OVERLOADED";
    elements.charStatus.textContent = statusText;

    // Status Style - use CSS class from selector
    elements.charStatus.className = `cy-badge ${viewState.statusClass}`;

    // HP Bar (width still needs inline for dynamic value)
    elements.hpBar.style.width = `${viewState.hpPercent}%`;
    elements.hpText.textContent = `${char.hp} / ${viewState.maxHp}`;

    // Apply critical class if low HP
    elements.hpBar.classList.toggle('critical', char.hp < (viewState.maxHp * 0.2));

    // EXP Bar
    elements.expBar.style.width = `${viewState.expPercent}%`;

    // Penalty indicator using class instead of inline style
    let penaltyHtml = '';
    if (viewState.isFainted) {
        const penaltyClass = viewState.isStabilized ? 'penalty-stabilized' : 'penalty-fainted';
        const penaltyText = viewState.isStabilized ? '[-25% GAIN]' : '[-50% GAIN]';
        penaltyHtml = ` <span class="exp-penalty ${penaltyClass}">${penaltyText}</span>`;
    }
    elements.expText.innerHTML = `${Math.floor(char.currentExp)}/${Math.floor(char.maxExp)}${penaltyHtml}`;

    // Global Visual Feedback
    document.body.classList.toggle('is-fainted', viewState.isFainted);
    const dashboard = document.querySelector('.dashboard');
    if (dashboard) dashboard.classList.toggle('is-fainted', viewState.isFainted);

    // Conditional UI for Stabilizer
    let stabilizerBtn = document.getElementById('btn-stabilizer');

    if (viewState.canUseStabilizer) {
        if (!stabilizerBtn) {
            stabilizerBtn = document.createElement('button');
            stabilizerBtn.id = 'btn-stabilizer';
            stabilizerBtn.className = 'cy-btn cy-btn-stabilizer status-stabilized';
            stabilizerBtn.innerHTML = 'ACTIVATE STABILIZER [200G]';
            stabilizerBtn.onclick = (e) => window.UI.safeTransaction(e.target, () => window.Store.triggerStabilizer());

            // Append to char-info
            const container = document.querySelector('.char-info');
            if (container) container.appendChild(stabilizerBtn);
        }
    } else {
        if (stabilizerBtn) stabilizerBtn.remove();
    }
}

function renderHabits(habits) {
    if (!elements.habitList) return;

    // PRESERVE GHOSTS:
    // Identify any existing elements with .is-ghost class.
    // Detach them from DOM to prevent destruction during innerHTML = ''
    const ghosts = Array.from(elements.habitList.querySelectorAll('.is-ghost'));

    // Clear List (Wipes standard habits)
    elements.habitList.innerHTML = '';

    // RE-ATTACH GHOSTS (At the top)
    ghosts.forEach(ghost => {
        elements.habitList.appendChild(ghost);
    });

    // Render Stored Habits
    habits.forEach(habit => {
        const el = document.createElement('div');
        el.className = 'habit-item';
        el.innerHTML = `
            <div class="habit-info">
                <span class="habit-name">${habit.name}</span>
                <span class="habit-meta">[${habit.difficulty}] Streak: ${habit.streak}</span>
            </div>
            <div class="habit-actions">
                <button class="cy-btn cy-btn-abort" data-id="${habit.id}" data-action="abort">ABORT</button>
                <button class="cy-btn cy-btn-exec" data-id="${habit.id}" data-action="exec">EXECUTE</button>
            </div>
        `;
        elements.habitList.appendChild(el);
    });
}

let lastRenderedLogId = 0;
let isUserScrolling = false;

function renderLogs(logs) {
    if (!elements.actionLog) return;

    // Auto-scroll Detection Setup (One-time)
    if (!elements.actionLog._scrollListenerAttached) {
        elements.actionLog.addEventListener('scroll', () => {
            const { scrollTop, scrollHeight, clientHeight } = elements.actionLog;
            const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
            isUserScrolling = distanceToBottom > 20;
        });
        elements.actionLog._scrollListenerAttached = true;
    }

    // Find new logs (ID-based)
    const newLogs = logs.filter(log => log.id > lastRenderedLogId);

    // Check if we need to clear (e.g. game reset)
    // If we have no new logs, but the total logs count is small and our last ID is huge, 
    // it implies a reset. Or if logs array is empty.
    if (logs.length === 0 && lastRenderedLogId > 0) {
        elements.actionLog.innerHTML = '';
        lastRenderedLogId = 0;
        return;
    }

    if (newLogs.length === 0) return;

    const fragment = document.createDocumentFragment();
    let hasCritical = false;

    newLogs.forEach(log => {
        const div = document.createElement('div');

        // Derive severity class
        let severityClass = 'log-info';
        if (log.severity === 'SUCCESS') severityClass = 'log-success';
        else if (log.severity === 'WARN') severityClass = 'log-warn';
        else if (log.severity === 'ERROR') severityClass = 'log-error';
        else if (log.severity === 'CRITICAL') {
            severityClass = 'log-critical';
            hasCritical = true;
        }

        div.className = `log-entry ${severityClass} anim-enter`;

        // Handle Legacy Logs vs New Structure
        const time = log.time || log.timestamp;
        const msg = log.message;
        const category = log.category || 'SYSTEM';

        div.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-category">[${category}]</span> ${msg}`;

        fragment.appendChild(div);

        // Update tracker
        if (log.id > lastRenderedLogId) {
            lastRenderedLogId = log.id;
        }
    });

    elements.actionLog.appendChild(fragment);

    // Auto-Scroll Logic
    if (hasCritical || !isUserScrolling) {
        elements.actionLog.scrollTop = elements.actionLog.scrollHeight;
    }
}

// Event Delegation setup helper
window.setupEventListeners = function (handler) {
    if (!elements.habitList) return;
    elements.habitList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;
        const action = btn.dataset.action;

        if (id && action) {
            handler(action, id);
        }
    });

    // Add Global Listeners for Modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.UI.toggleAugmentationPanel(false);
    });
}

// Augmentation UI Logic
window.UI.toggleAugmentationPanel = function (show) {
    let modal = document.getElementById('augmentation-modal');

    if (show) {
        if (!modal) {
            modal = createAugmentationModal();
            document.body.appendChild(modal);
        }
        renderAugmentations(window.Store.getState().character);
        modal.style.display = 'flex';
    } else {
        if (modal) modal.style.display = 'none';
    }
};

function createAugmentationModal() {
    const div = document.createElement('div');
    div.id = 'augmentation-modal';
    div.className = 'modal-overlay';
    div.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <span>:: CORE AUGMENTATIONS</span>
                <button class="close-btn" onclick="window.UI.toggleAugmentationPanel(false)">×</button>
            </div>
            <div class="modal-body" id="augmentation-list">
                <!-- Items injected here -->
            </div>
        </div>
    `;
    return div;
}

function renderAugmentations(character) {
    const list = document.getElementById('augmentation-list');
    if (!list) return;

    const { UPGRADE_TYPES, getUpgradeCost } = window.RPG;
    list.innerHTML = '';

    Object.keys(UPGRADE_TYPES).forEach(type => {
        const upgrade = UPGRADE_TYPES[type];
        const currentLevel = (character.passiveUpgrades && character.passiveUpgrades[type]) || 0;
        const cost = getUpgradeCost(type, currentLevel);
        const canAfford = character.gold >= cost;
        const isMaxed = currentLevel >= upgrade.maxLevel;

        const el = document.createElement('div');
        el.className = 'upgrade-item';

        // Dynamic Label logic
        let costLabel = isMaxed ? 'MAXED' : `${cost} G`;
        let btnDisabled = isMaxed || !canAfford;

        el.innerHTML = `
            <div class="upgrade-info">
                <span class="upgrade-name">${upgrade.name}</span>
                <span class="upgrade-desc">${upgrade.description}</span>
                <span class="upgrade-meta">Lvl ${currentLevel}/${upgrade.maxLevel}</span>
            </div>
            <button class="upgrade-btn" 
                onclick="window.UI.safeTransaction(this, () => { window.Store.purchaseUpgrade('${type}'); window.UI.refreshAugmentations(); })"
                ${btnDisabled ? 'disabled' : ''}>
                ${costLabel}
            </button>
        `;
        list.appendChild(el);
    });
}

// Helper to refresh panel without closing it
window.UI.refreshAugmentations = function () {
    renderAugmentations(window.Store.getState().character);
    // Also refresh dashboard to show Gold change
    renderDashboard(window.Store.getState().character);
};
