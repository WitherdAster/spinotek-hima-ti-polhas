/**
 * ui.js
 * DOM Rendering logic.
 */

const elements = {
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

export const UI = {
    render(state) {
        renderDashboard(state.character);
        renderHabits(state.habits);
        renderLogs(state.logs);
    }
};

function renderDashboard(char) {
    elements.charLevel.textContent = String(char.level).padStart(2, '0');
    elements.charGold.textContent = char.gold;
    elements.charStatus.textContent = char.status;

    elements.hpText.textContent = `${char.hp}/${char.maxHp}`;
    const hpPercent = (char.hp / char.maxHp) * 100;
    elements.hpBar.style.width = `${hpPercent}%`;

    elements.expText.textContent = `${Math.floor(char.currentExp)}/${Math.floor(char.maxExp)}`;
    const expPercent = (char.currentExp / char.maxExp) * 100;
    elements.expBar.style.width = `${expPercent}%`;

    // Visual cues
    if (char.status === 'FAINTED') {
        elements.charStatus.style.color = 'var(--color-alert)';
    } else {
        elements.charStatus.style.color = 'var(--color-primary)';
    }
}

function renderHabits(habits) {
    // Determine if we need to full re-render or patch. 
    // For Vanilla MVP, clearing innerHTML and rebuilding is acceptable for small lists.
    elements.habitList.innerHTML = '';

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

function renderLogs(logs) {
    elements.actionLog.innerHTML = logs.map(log => `
        <div class="log-entry">
            <span class="log-time">[${log.timestamp}]</span> ${log.message}
        </div>
    `).join('');
}

// Event Delegation setup helper
export function setupEventListeners(handler) {
    elements.habitList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const id = btn.dataset.id;
        const action = btn.dataset.action;

        if (id && action) {
            handler(action, id);
        }
    });
}
