/**
 * store.js
 * State Management & Persistence using Module Pattern.
 * Adapted for Global Scope.
 */

const STORAGE_KEY = 'habit_rpg_data_v4';

// Initial state factory to allow lazy access to window.RPG
function getInitialState() {
    const { calculateNextLevelExp, CHARACTER_STATUS } = window.RPG;
    return {
        character: {
            level: 1,
            currentExp: 0,
            maxExp: calculateNextLevelExp(1),
            hp: 50,
            maxHp: 50,
            gold: 0, // Will need to cheat this for testing
            status: CHARACTER_STATUS.NORMAL,
            lastFaintedTimestamp: null,
            debuff: null, // { expMultiplier: 0.5, expiresAt: <ts>, stabilized: false }
            passiveUpgrades: {
                vitalCore: 0,
                learningAmplifier: 0,
                failureDampener: 0
            },
            flags: {
                hasFainted: false,
                hasUpgraded: false,
                faintCount: 0,
                lastActionTimestamp: 0,
                dailyHabitAdds: 0,
                dailyExp: 0,
                isFirstAction: true
            }
        },
        habits: [
            { id: 'h1', name: 'Code for 1 hour', difficulty: 'HARD', streak: 0 },
            { id: 'h2', name: 'Drink Water', difficulty: 'TRIVIAL', streak: 0 },
            { id: 'h3', name: 'Read Documentation', difficulty: 'MEDIUM', streak: 0 }
        ],
        logs: [
            { id: Date.now(), timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), message: 'SYSTEM: Welcome to Habit-Core RPG v4.0. Core Augmentation Online.', type: 'system' }
        ],
        logContext: {
            lastFailureType: null,
            lastRitualSuccess: false,
            failureCount: 0,
            consecutiveSuccessCount: 0
        }
    };
}

let state = null;
let listeners = [];

/**
 * Atomic Transaction Wrapper
 * Provides rollback capability for critical operations.
 */
function atomicTransaction(actionFn) {
    const snapshot = JSON.parse(JSON.stringify(state));
    try {
        const result = actionFn();

        // Validate state after action
        const validation = window.RPG.assertValidCharacterState(state.character);
        if (validation.wasRepaired) {
            console.warn('Transaction made repairs:', validation.repairs);
            state.character = validation.character;
        }

        save();
        return { success: true, result };
    } catch (error) {
        // Rollback on error
        state = snapshot;
        console.error('Transaction failed, rolled back:', error);
        return { success: false, error: error.message };
    }
}

function load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    const defaults = getInitialState();

    if (raw) {
        try {
            state = JSON.parse(raw);
            // Ensure data integrity (merge with defaults)
            if (!state.character) state.character = { ...defaults.character };
            if (state.character.debuff === undefined) state.character.debuff = null;
            if (!state.character.passiveUpgrades) state.character.passiveUpgrades = { ...defaults.character.passiveUpgrades };

            if (!state.habits) state.habits = [...defaults.habits];
            if (!state.logs) state.logs = [...defaults.logs];
            if (!state.logContext) state.logContext = { ...defaults.logContext };

            // RECOVERY: Validate and repair character state
            const validation = window.RPG.assertValidCharacterState(state.character);
            if (validation.wasRepaired) {
                console.warn('Load recovery made repairs:', validation.repairs);
                state.character = validation.character;
                // Log repairs to user
                validation.repairs.forEach(repair => {
                    state.logs.push({
                        id: Date.now(),
                        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                        message: `SYSTEM: Auto-repair: ${repair}`,
                        category: 'SYSTEM',
                        severity: 'WARN'
                    });
                });
            }

        } catch (e) {
            console.error('Failed to parse save data', e);
            state = JSON.parse(JSON.stringify(defaults));
        }
    } else {
        state = JSON.parse(JSON.stringify(defaults));
    }

    // Check for passive recovery on load
    const { checkStatusRecovery } = window.RPG;
    const recoveredChar = checkStatusRecovery(state.character);
    if (recoveredChar !== state.character) {
        state.character = recoveredChar;
        addLog('SYSTEM: You have recovered from fainting.', 'system');
        save();
    }
}

function save() {
    // Final validation before save
    const validation = window.RPG.assertValidCharacterState(state.character);
    if (validation.wasRepaired) {
        console.warn('Save validation made repairs:', validation.repairs);
        state.character = validation.character;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    notify();
}

function notify() {
    listeners.forEach(cb => cb(state));
}

/**
 * Public API
 */
// Internal helper (Hoisted or defined before use)
function addLog(msg, type) {
    if (window.Store && window.Store.addLogEntry) {
        // MAP LEGACY TYPES
        let category = 'SYSTEM';
        let severity = 'INFO';

        if (type === 'success') severity = 'SUCCESS';
        else if (type === 'failure') severity = 'ERROR';
        else if (type === 'warn') severity = 'WARN';
        else if (type === 'system') severity = 'INFO';

        window.Store.addLogEntry(msg, category, severity);
    }
}

/**
 * Public API
 */
window.Store = {
    // ... (init, getState, subscribe, etc.)
    init() {
        // Ensure RPG is loaded
        if (!window.RPG) {
            console.error('FATAL: window.RPG not found during Store init');
            return null;
        }
        load();

        // Check Daily Reset on init
        const { checkDailyReset } = window.RPG;
        const resetChar = checkDailyReset(state.character);
        if (resetChar !== state.character) {
            state.character = resetChar;
            if (resetChar.flags && resetChar.flags.isFirstAction) {
                this.addLogEntry('SYSTEM: New day detected. Daily counters reset. Welcome back.', 'SYSTEM', 'INFO');
            }
            save();
        }

        // Bind visibility change to auto-validate
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                window.Store.validateState();
            }
        });

        // Validate immediately on init just in case
        this.validateState();

        return state;
    },

    getState() {
        return state;
    },

    subscribe(callback) {
        listeners.push(callback);
        if (state) callback(state);
        return () => {
            listeners = listeners.filter(l => l !== callback);
        }
    },

    updateCharacter(newCharacterState) {
        state.character = newCharacterState;
        save();
    },

    // NEW: Contextual Logging Logic
    logRitualResult(success, details = {}) {
        const ctx = state.logContext;
        const name = details.name || 'Unknown Protocol';

        let message = '';
        let severity = 'INFO';
        let category = 'RITUAL';

        if (success) {
            if (ctx.lastFailureType === 'disintegration') {
                message = `Protocol '${name}' Stabilized. Redemption achieved.`;
                severity = 'SUCCESS';
            } else if (ctx.consecutiveSuccessCount > 2) {
                message = `Ritual complete. '${name}' materialized (Stream Stable).`;
            } else {
                message = `Ritual complete. '${name}' materialized.`;
            }

            // Update Context
            ctx.lastRitualSuccess = true;
            ctx.lastFailureType = null;
            ctx.failureCount = 0;
            ctx.consecutiveSuccessCount++;

            this.addLogEntry(message, category, 'SUCCESS');

        } else {
            // Failure
            const type = details.type || 'generic';

            if (ctx.lastFailureType === type) {
                ctx.failureCount++;
                message = `Recurring instability detected (${ctx.failureCount}x). Check mental vectors.`;
                severity = 'WARN';
            } else {
                ctx.failureCount = 1;
                if (type === 'disintegration') {
                    message = `SYSTEM: '${name}' disintegrated. Commitment failed.`;
                } else if (type === 'abort') {
                    message = `Ritual '${name}' aborted.`;
                } else {
                    message = `Ritual '${name}' failed.`;
                }
            }

            if (ctx.failureCount > 2) severity = 'CRITICAL';

            // Update Context
            ctx.lastRitualSuccess = false;
            ctx.lastFailureType = type;
            ctx.consecutiveSuccessCount = 0;

            this.addLogEntry(message, category, severity);
        }
        save();
    },

    triggerStabilizer() {
        this.validateState();

        const char = state.character;

        // Check conditions BEFORE transaction (so logs aren't rolled back)
        if (!window.RPG.canUseNeuralStabilizer(char)) {
            if (char.status !== window.RPG.CHARACTER_STATUS.FAINTED) {
                this.addLogEntry(`SYSTEM: Stabilizer aborted. Neural patterns already normalized.`, 'SYSTEM', 'INFO');
            } else if (char.debuff && char.debuff.stabilized) {
                this.addLogEntry(`SYSTEM: Stabilizer aborted. Already active.`, 'SYSTEM', 'INFO');
            } else if (char.gold < window.RPG.NEURAL_STABILIZER_COST) {
                this.addLogEntry(`SYSTEM: Stabilizer aborted. Insufficient resources.`, 'SYSTEM', 'ERROR');
            }
            return { success: false };
        }

        // Execute in transaction
        return atomicTransaction(() => {
            const result = window.RPG.useNeuralStabilizer(state.character);
            if (!result.success) {
                throw new Error(result.reason);
            }

            state.character = result.character;
            this.addLogEntry(`SYSTEM: Neural Stabilizer activated. EXP penalty reduced.`, 'SYSTEM', 'SUCCESS');
            return result;
        });
    },

    purchaseUpgrade(type) {
        this.validateState();

        const char = state.character;

        // Check conditions BEFORE transaction (so logs aren't rolled back)
        if (!window.RPG.canPurchaseUpgrade(char, type)) {
            this.addLogEntry(`SYSTEM: Authorization denied. Criteria met for ${type}? [NEGATIVE]`, 'SYSTEM', 'ERROR');
            return { success: false };
        }

        // Execute in transaction
        return atomicTransaction(() => {
            const result = window.RPG.purchaseUpgrade(state.character, type);
            if (!result.success) {
                throw new Error(result.reason);
            }

            // Narrative Flag
            if (!state.character.flags) state.character.flags = { hasUpgraded: false };
            if (!state.character.flags.hasUpgraded) {
                this.addLogEntry('HARDWARE DETECTED: Initialization of first augmentation successful.', 'UPGRADE', 'SUCCESS');
                state.character.flags.hasUpgraded = true;
            }

            state.character = result.character;
            state.character.flags = state.character.flags || {};
            state.character.flags.hasUpgraded = true;

            this.addLogEntry(`Augmentation installed: ${result.upgradeName} (Lvl ${result.newLevel})`, 'UPGRADE', 'SUCCESS');
            window.UI.triggerEffect('char-gold', 'anim-pulse');
            return result;
        });
    },

    /**
     * Centralized State Validation
     */
    validateState() {
        if (!state || !state.character) return false;

        const { checkStatusRecovery } = window.RPG;
        const oldChar = state.character;
        const newChar = checkStatusRecovery(oldChar);

        if (newChar !== oldChar) {
            state.character = newChar;
            addLog('SYSTEM: Temporal synchronization complete. Biological functions restored.', 'system');
            save();
            return true;
        }
        return false;
    },

    addLogEntry(message, category = 'SYSTEM', severity = 'INFO') {
        const entry = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
            message,
            category,
            severity
        };
        state.logs.push(entry);
        if (state.logs.length > 50) state.logs.shift(); // Remove oldest (from front)
        save();
    },

    addHabit(habitData) {
        state.habits.push(habitData);

        // Track daily adds for OVERLOADED status
        if (!state.character.flags) state.character.flags = {};
        state.character.flags.dailyHabitAdds = (state.character.flags.dailyHabitAdds || 0) + 1;

        // Check for Overload Warning
        const OVERLOAD_THRESHOLD = 5;
        if (state.character.flags.dailyHabitAdds > OVERLOAD_THRESHOLD) {
            this.addLogEntry('WARNING: Protocol overload detected. Mental fatigue accumulating.', 'SYSTEM', 'WARN');
        }

        save();
        notify(); // Triggers UI re-render
    },

    reset() {
        state = JSON.parse(JSON.stringify(getInitialState()));
        save();
    },

    /**
     * Core Action: Execute Habit
     */
    executeHabit(habitId) {
        this.validateState();
        const habit = state.habits.find(h => h.id === habitId);
        if (!habit) return;

        // RPG Logic
        const result = window.RPG.executeHabit(state.character, habit.difficulty);

        // Narrative & Logging
        if (result._justRecovered) {
            this.addLogEntry(`SYSTEM: Recovery complete. Character stabilized.`, 'SYSTEM', 'SUCCESS');
        }

        let msg = `+${result.currentExp - state.character.currentExp} EXP from '${habit.name}'`;
        let severity = 'SUCCESS';

        if (state.character.status === window.RPG.CHARACTER_STATUS.FAINTED && !result._justRecovered) {
            msg += ` (PENALTY APPLIED)`;
            severity = 'WARN';
        }

        if (result._leveledUp) {
            msg += ` | LEVEL UP! Now Level ${result.level}.`;
            // Milestone Narrative
            if (result.level % 5 === 0) {
                this.addLogEntry(`MILESTONE: Level ${result.level} Reached. Performance limits broken.`, 'SYSTEM', 'SUCCESS');
            } else {
                this.addLogEntry(`LEVEL UP: You have reached Level ${result.level}!`, 'SYSTEM', 'SUCCESS');
            }
        }

        this.addLogEntry(msg, 'HABIT', severity);

        // Update State
        state.character = result;
        habit.streak = (habit.streak || 0) + 1;
        save();
    },

    /**
     * Core Action: Abort Habit
     */
    abortHabit(habitId) {
        this.validateState();
        const habit = state.habits.find(h => h.id === habitId);
        if (!habit) return;

        // RPG Logic (Now includes time context)
        const result = window.RPG.abortHabit(state.character, habit.difficulty);
        const hpLost = state.character.hp - result.hp;

        // Time Context Log (from RPG logic)
        if (result._contextLog) {
            this.addLogEntry(result._contextLog, 'SYSTEM', 'INFO');
        }

        // Narrative Logic
        if (result._stabilizedAbort) {
            // STABILIZED mode abort - just log without HP damage
            this.addLogEntry(`STABILIZED: '${habit.name}' aborted. System protected.`, 'COMBAT', 'INFO');
        } else if (result.status === window.RPG.CHARACTER_STATUS.FAINTED && state.character.status !== window.RPG.CHARACTER_STATUS.FAINTED) {
            // Just Fainted
            const flags = state.character.flags || { faintCount: 0 };
            flags.faintCount = (flags.faintCount || 0) + 1;
            flags.hasFainted = true;
            result.flags = flags;

            if (flags.faintCount === 1) {
                this.addLogEntry(`CRITICAL ALERT: Life Signs Critical. First shutdown imminent.`, 'SYSTEM', 'CRITICAL');
            } else {
                this.addLogEntry(`SYSTEM FAILURE. Reboot sequence initiated. (Occurrence #${flags.faintCount})`, 'SYSTEM', 'ERROR');
            }

            this.addLogEntry(`[SYSTEM WARNING] Vital core depleted. EXP gain reduced for 24h.`, 'COMBAT', 'ERROR');
        } else {
            // Night context modifier in message
            const nightSuffix = result._isNight ? ' [NIGHT: Reduced Toll]' : '';
            this.addLogEntry(`FAILED '${habit.name}'. -${hpLost} HP.${nightSuffix}`, 'COMBAT', 'WARN');
        }

        // Reset Streak
        habit.streak = 0;

        state.character = result;
        save();
    }
};
