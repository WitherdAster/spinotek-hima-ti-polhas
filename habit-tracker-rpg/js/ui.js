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
    }
};

function renderDashboard(char) {
    if (!elements.charLevel) return; // Guard

    elements.charLevel.textContent = String(char.level).padStart(2, '0');
    elements.charGold.innerHTML = `${char.gold} <button onclick="window.UI.toggleAugmentationPanel(true)" style="background:none; border:none; color:var(--cy-neon-gold); cursor:pointer; font-weight:bold; font-size:1.2em; vertical-align:middle;">+</button>`;
    elements.charStatus.textContent = char.status;

    // HP Bar
    elements.hpText.textContent = `${char.hp}/${char.maxHp}`;
    const hpPercent = (char.hp / char.maxHp) * 100;
    elements.hpBar.style.width = `${hpPercent}%`;

    // EXP Bar
    const expPercent = (char.currentExp / char.maxExp) * 100;
    elements.expBar.style.width = `${expPercent}%`;

    // Fainted State Handling
    const isFainted = char.status === 'FAINTED';

    // Toggle Global State
    document.body.classList.toggle('is-fainted', isFainted);
    document.querySelector('.dashboard').classList.toggle('is-fainted', isFainted);

    if (isFainted) {
        const isStabilized = char.debuff && char.debuff.stabilized;
        const penaltyText = isStabilized ? '[-25% GAIN]' : '[-50% GAIN]';
        const color = isStabilized ? 'var(--cy-neon-gold)' : 'var(--cy-neon-red)';
        const statusText = isStabilized ? 'STABILIZED' : 'FAILURE';

        elements.charStatus.className = isStabilized ? 'cy-badge stabilized' : 'cy-badge fainted';
        elements.charStatus.textContent = statusText;
        elements.charStatus.style.borderColor = color;
        elements.charStatus.style.color = color;

        elements.expText.innerHTML = `${Math.floor(char.currentExp)}/${Math.floor(char.maxExp)} <span style="color:${color}; font-size:0.6em;">${penaltyText}</span>`;

        // Inject Stabilizer Button if not stabilized
        // We'll use the char-info area or append to dashboard header if cleaner
        // Let's replace the Char Status badge area with the button if affordable? 
        // Or simply append it to the panel header if it fits.
        // Better: Append to char-info container as a new row or overlay.
        let stabilizerBtn = document.getElementById('btn-stabilizer');
        if (!isStabilized) {
            if (!stabilizerBtn) {
                // Create Button
                stabilizerBtn = document.createElement('button');
                stabilizerBtn.id = 'btn-stabilizer';
                stabilizerBtn.className = 'cy-btn cy-btn-stabilizer';
                stabilizerBtn.innerHTML = 'ACTIVATE STABILIZER [200G]';
                stabilizerBtn.style.width = '100%';
                stabilizerBtn.style.marginTop = '10px';
                stabilizerBtn.style.borderColor = 'var(--cy-neon-gold)';
                stabilizerBtn.style.color = 'var(--cy-neon-gold)';
                stabilizerBtn.onclick = () => window.Store.triggerStabilizer();

                // Append to char-info (dashboard body)
                document.querySelector('.char-info').appendChild(stabilizerBtn);
            }
        } else {
            // Remove if stabilized
            if (stabilizerBtn) stabilizerBtn.remove();
        }

    } else {
        elements.charStatus.className = 'cy-badge';
        elements.charStatus.textContent = 'NORMAL';
        elements.charStatus.removeAttribute('style'); // Clear inline styles
        elements.expText.textContent = `${Math.floor(char.currentExp)}/${Math.floor(char.maxExp)}`;

        // Cleanup Button if exists
        const btn = document.getElementById('btn-stabilizer');
        if (btn) btn.remove();
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

let lastLogCount = 0;
let isUserScrolling = false;

function renderLogs(logs) {
    if (!elements.actionLog) return;

    // Auto-scroll Detection Setup (One-time)
    if (!elements.actionLog._scrollListenerAttached) {
        elements.actionLog.addEventListener('scroll', () => {
            // Logic: If user is close to bottom (within 20px), auto-scroll is ON.
            // If user scrolls up, auto-scroll is OFF.
            const { scrollTop, scrollHeight, clientHeight } = elements.actionLog;
            const distanceToBottom = scrollHeight - (scrollTop + clientHeight);
            isUserScrolling = distanceToBottom > 20;
        });
        elements.actionLog._scrollListenerAttached = true;
    }

    // Incremental Update
    // Only append NEW logs. If log count reset (reset system), clear all.
    if (logs.length < lastLogCount) {
        elements.actionLog.innerHTML = '';
        lastLogCount = 0;
    }

    const newLogs = logs.slice(lastLogCount);
    if (newLogs.length === 0) return; // No changes

    const fragment = document.createDocumentFragment();
    newLogs.forEach(log => {
        const div = document.createElement('div');
        div.className = 'log-entry';
        // Add specific class for failure/success if present (e.g. type='failure')
        if (log.type === 'failure') div.style.color = 'var(--cy-neon-red)';

        div.innerHTML = `<span class="log-time">[${log.timestamp}]</span> ${log.message}`;
        fragment.appendChild(div);
    });

    elements.actionLog.appendChild(fragment);
    lastLogCount = logs.length;

    // Auto-Scroll Logic
    if (!isUserScrolling) {
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
                onclick="window.Store.purchaseUpgrade('${type}'); window.UI.refreshAugmentations()"
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
