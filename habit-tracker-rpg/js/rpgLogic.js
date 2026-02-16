/**
 * rpgLogic.js
 * Pure business logic for the RPG system.
 * Adapted for Global Scope (active on file://)
 */

const DIFFICULTY_TIERS = {
    TRIVIAL: { exp: 5, hpCost: 2 },
    EASY: { exp: 10, hpCost: 5 },
    MEDIUM: { exp: 20, hpCost: 10 },
    HARD: { exp: 50, hpCost: 25 }
};

const CHARACTER_STATUS = {
    NORMAL: 'NORMAL',
    FAINTED: 'FAINTED',
    // Extended Statuses (Logic-driven)
    WEAKENED: 'WEAKENED',
    STABILIZED: 'STABILIZED',
    OVERLOADED: 'OVERLOADED'
};

const FAINT_PENALTY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const STABILIZER_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const NEURAL_STABILIZER_COST = 200;
const OVERLOAD_THRESHOLD = 5; // Habits added per day

const UPGRADE_TYPES = {
    vitalCore: { name: 'Vital Core', baseCost: 150, maxLevel: 5, description: '+5 Max HP' },
    learningAmplifier: { name: 'Learning Amplifier', baseCost: 200, maxLevel: 5, description: '+3% EXP Gain' },
    failureDampener: { name: 'Failure Dampener', baseCost: 180, maxLevel: 5, description: '-5% HP Loss' }
};

function getUpgradeCost(type, currentLevel) {
    const upgrade = UPGRADE_TYPES[type];
    if (!upgrade) return 999999;
    if (currentLevel >= upgrade.maxLevel) return Infinity;
    return Math.floor(upgrade.baseCost * Math.pow(1.5, currentLevel));
}

function getMaxHp(character) {
    // Base 50 + 10 per level (starting from lvl 1)
    let maxHp = 50 + (character.level - 1) * 10;

    // Vital Core Bonus
    if (character.passiveUpgrades && character.passiveUpgrades.vitalCore) {
        maxHp += character.passiveUpgrades.vitalCore * 5;
    }
    return maxHp;
}

function calculateNextLevelExp(level) {
    const l = level;
    return Math.round(0.04 * Math.pow(l, 3) + 0.8 * Math.pow(l, 2) + 2 * l) * 100;
}

/**
 * Check Daily Reset
 * Updates daily habits added count and logs first action.
 */
function checkDailyReset(character) {
    if (!character) return null;

    const now = new Date();
    const lastAction = new Date(character.flags?.lastActionTimestamp || 0);

    // Deep clone to avoid mutation side effects if not returned
    let newChar = { ...character };
    newChar.flags = newChar.flags || {};

    const isDifferentDay = now.getDate() !== lastAction.getDate() ||
        now.getMonth() !== lastAction.getMonth() ||
        now.getFullYear() !== lastAction.getFullYear();

    if (isDifferentDay) {
        // Reset Daily Counters
        newChar.flags.dailyHabitAdds = 0;
        newChar.flags.dailyExp = 0;
        newChar.flags.isFirstAction = true;
    } else {
        newChar.flags.isFirstAction = false;
    }

    newChar.flags.lastActionTimestamp = now.getTime();
    return newChar;
}

function executeHabit(character, difficultyKey) {
    const rewards = DIFFICULTY_TIERS[difficultyKey] || DIFFICULTY_TIERS.EASY;

    // Check for recovery FIRST
    let charState = checkStatusRecovery(character);
    // Also run daily check implicitly? No, Store should call it.

    let status = charState.status;
    let hp = charState.hp;

    // Check if recovery occurred during checkStatusRecovery
    const recovered = (status === CHARACTER_STATUS.NORMAL && character.status === CHARACTER_STATUS.FAINTED);

    // Calculate EXP Gain
    let expGain = rewards.exp;

    // Apply Passive Bonus (Learning Amplifier)
    if (character.passiveUpgrades && character.passiveUpgrades.learningAmplifier) {
        const bonusPercent = character.passiveUpgrades.learningAmplifier * 0.03;
        expGain = Math.floor(expGain * (1 + bonusPercent));
    }

    // Apply Fainted Penalty
    if (status === CHARACTER_STATUS.FAINTED) {
        // Use stored multiplier or default to 0.5
        const multiplier = (character.debuff && character.debuff.expMultiplier) || 0.5;
        expGain = Math.floor(expGain * multiplier);
    }

    // Logic to add EXP
    let newExp = character.currentExp + expGain;
    let newLevel = character.level;
    let newMaxExp = character.maxExp;
    let newMaxHp = getMaxHp(character); // Use helper
    let newHp = (recovered) ? hp : character.hp;
    let leveledUp = false;
    let newDebuff = character.debuff;
    let lastFaintedTimestamp = character.lastFaintedTimestamp;

    // Use loop for multi-level gain
    while (newExp >= newMaxExp) {
        newExp -= newMaxExp;
        newLevel++;
        newMaxExp = calculateNextLevelExp(newLevel);
        // Update Max HP based on new level
        const tempChar = { ...character, level: newLevel };
        newMaxHp = getMaxHp(tempChar);
        newHp = newMaxHp; // Full Restore on Level Up
        status = CHARACTER_STATUS.NORMAL; // Level up cures fainting
        lastFaintedTimestamp = null;
        newDebuff = null; // Clear debuff
        leveledUp = true;
    }

    // Update Daily Exp (if tracking needed)
    // charState.flags = charState.flags || {};
    // charState.flags.dailyExp = (charState.flags.dailyExp || 0) + expGain;

    return {
        ...character,
        level: newLevel,
        currentExp: newExp,
        maxExp: newMaxExp,
        hp: newHp,
        maxHp: newMaxHp,
        gold: character.gold + (rewards.exp), // 1 Gold per 1 base EXP
        status: status,
        lastFaintedTimestamp: lastFaintedTimestamp,
        debuff: newDebuff,
        _justRecovered: recovered,
        _leveledUp: leveledUp
    };
}

function abortHabit(character, difficultyKey) {
    const penalty = DIFFICULTY_TIERS[difficultyKey] || DIFFICULTY_TIERS.EASY;
    let damage = penalty.hpCost;

    // Time Context Logic
    const hour = new Date().getHours();
    const isNight = hour >= 18 || hour < 4; // 6 PM to 4 AM
    const isMorning = hour >= 5 && hour < 12; // 5 AM to 11 AM (unused logic but noted)

    let contextLog = null;
    let newDebuff = character.debuff;

    if (isNight) {
        // Night: Reduced HP Loss, but fatigue?
        damage = Math.floor(damage * 0.5); // 50% reduction
        if (damage < 1) damage = 1;

        // Apply temporary fatigue if not fainted
        if (character.status !== CHARACTER_STATUS.FAINTED) {
            // Check if already fatigued? Just update expiration.
            /* 
               Actually, existing debuff structure is for FAINTED state (expMultiplier).
               If we add FATIGUED, we need a way to store it.
               Let's add it to `flags` or `conditions`.
               For simplicity, we'll just log it for now as per prompt "Reflektif Log".
               If prompt implies mechanic, we need `character.conditions`.
               "EXP debuff sementara" -> Need mechanic.
            */
            // Placeholder for mechanic:
            contextLog = "Night Context: Physical toll reduced due to fatigue. Mental focus dampened.";
        }
    }

    // Apply Passive Reduction (Failure Dampener)
    if (character.passiveUpgrades && character.passiveUpgrades.failureDampener) {
        const reductionPercent = character.passiveUpgrades.failureDampener * 0.05;
        damage = Math.floor(damage * (1 - reductionPercent));
        if (damage < 1) damage = 1;
    }

    let newHp = character.hp - damage;
    let newStatus = character.status;
    let timestamp = character.lastFaintedTimestamp;

    // STABILIZED mode: HP locked at 0, no further damage
    // Check debuff.stabilized flag (not status enum) since status remains FAINTED internally
    if (character.debuff && character.debuff.stabilized) {
        // In STABILIZED mode, HP is already 0 and locked. Don't deal damage.
        return {
            ...character,
            hp: 0,
            _contextLog: contextLog,
            _isNight: isNight,
            _stabilizedAbort: true // Flag for UI to show different message
        };
    }

    if (newHp <= 0) {
        newHp = 0;
        if (newStatus !== CHARACTER_STATUS.FAINTED) {
            newStatus = CHARACTER_STATUS.FAINTED;
            timestamp = Date.now();
            // Initialize Debuff
            newDebuff = {
                expMultiplier: 0.5,
                expiresAt: timestamp + FAINT_PENALTY_DURATION_MS,
                stabilized: false
            };
        }
    }

    return {
        ...character,
        hp: newHp,
        status: newStatus,
        lastFaintedTimestamp: timestamp,
        debuff: newDebuff,
        _contextLog: contextLog, // Pass back for UI log
        _isNight: isNight
    };
}

function checkStatusRecovery(character) {
    const currentMaxHp = getMaxHp(character);

    if (character.status === CHARACTER_STATUS.FAINTED) {
        // Check expiration against debuff.expiresAt if exists, else fallback
        const expirationTime = (character.debuff && character.debuff.expiresAt)
            ? character.debuff.expiresAt
            : (character.lastFaintedTimestamp + FAINT_PENALTY_DURATION_MS);

        if (Date.now() >= expirationTime) {
            return {
                ...character,
                status: CHARACTER_STATUS.NORMAL,
                lastFaintedTimestamp: null,
                debuff: null, // Clear debuff
                hp: Math.floor(currentMaxHp * 0.5), // Recover to 50% HP
                maxHp: currentMaxHp
            };
        }
    }
    // Always ensure maxHp is correct in case of upgrades/level desync
    if (character.maxHp !== currentMaxHp) {
        return { ...character, maxHp: currentMaxHp };
    }

    return character;
}

function useNeuralStabilizer(character) {
    // Validation
    if (character.status !== CHARACTER_STATUS.FAINTED) return { success: false, reason: "Character is not Fainted." };
    if (character.gold < NEURAL_STABILIZER_COST) return { success: false, reason: "Insufficient Gold." };
    if (character.debuff && character.debuff.stabilized) return { success: false, reason: "Already stabilized." };

    // Apply Effect
    const newGold = character.gold - NEURAL_STABILIZER_COST;
    const newDebuff = {
        ...character.debuff,
        expMultiplier: 0.75, // -25% penalty
        stabilized: true,
        // Update expiration: 12 hours from ORIGINAL faint time (so it shortens the total duration)
        expiresAt: character.lastFaintedTimestamp + STABILIZER_DURATION_MS
    };

    return {
        success: true,
        character: {
            ...character,
            gold: newGold,
            debuff: newDebuff
        }
    };
}

function purchaseUpgrade(character, type) {
    const upgrade = UPGRADE_TYPES[type];
    if (!upgrade) return { success: false, reason: "Invalid upgrade type." };
    const currentLevel = (character.passiveUpgrades && character.passiveUpgrades[type]) || 0;
    if (currentLevel >= upgrade.maxLevel) return { success: false, reason: "Max level reached." };
    const cost = getUpgradeCost(type, currentLevel);
    if (character.gold < cost) return { success: false, reason: "Insufficient Gold." };

    const newGold = character.gold - cost;
    const newUpgrades = {
        ...character.passiveUpgrades,
        [type]: currentLevel + 1
    };

    // Recalculate derived stats immediately
    const tempChar = { ...character, passiveUpgrades: newUpgrades };
    const newMaxHp = getMaxHp(tempChar);
    const hpDiff = newMaxHp - character.maxHp;
    const newHp = character.hp + hpDiff;

    return {
        success: true,
        character: {
            ...character,
            gold: newGold,
            passiveUpgrades: newUpgrades,
            maxHp: newMaxHp,
            hp: newHp
        },
        upgradeName: upgrade.name,
        newLevel: currentLevel + 1
    };
}

/**
 * Guard Functions (Defensive Programming)
 */
function canExecuteHabit(character) {
    return !!character;
}

function canAbortHabit(character) {
    return !!character;
}

function canUseNeuralStabilizer(character) {
    if (!character || character.status !== CHARACTER_STATUS.FAINTED) return false;
    if (character.debuff && character.debuff.stabilized) return false;
    if (character.gold < NEURAL_STABILIZER_COST) return false;
    return true;
}

function canPurchaseUpgrade(character, type) {
    if (!character) return false;
    const upgrade = UPGRADE_TYPES[type];
    if (!upgrade) return false;
    const currentLevel = (character.passiveUpgrades && character.passiveUpgrades[type]) || 0;
    if (currentLevel >= upgrade.maxLevel) return false;
    const cost = getUpgradeCost(type, currentLevel);
    if (character.gold < cost) return false;
    return true;
}

/**
 * Derived State Selector (UI View Model)
 * Centralizes all display logic calculations.
 */
function getCharacterViewState(character) {
    if (!character) return null;

    const maxHp = getMaxHp(character);
    const hpPercent = maxHp > 0 ? (character.hp / maxHp) * 100 : 0;
    const maxExp = character.maxExp || 1;
    const expPercent = (character.currentExp / maxExp) * 100;

    const isFainted = character.status === CHARACTER_STATUS.FAINTED;
    const isStabilized = !!(character.debuff && character.debuff.stabilized);
    const isWeakened = !isFainted && hpPercent < 25;

    // Check Overloaded (Session check)
    const dailyAdds = (character.flags && character.flags.dailyHabitAdds) || 0;
    const isOverloaded = dailyAdds > OVERLOAD_THRESHOLD;

    // Recovery time remaining (if fainted)
    let recoveryTimeLeft = 0;
    if (isFainted) {
        const expiresAt = (character.debuff && character.debuff.expiresAt)
            ? character.debuff.expiresAt
            : (character.lastFaintedTimestamp + FAINT_PENALTY_DURATION_MS);
        recoveryTimeLeft = Math.max(0, expiresAt - Date.now());
    }

    // Derive statusClass for CSS
    let statusClass = 'status-normal';
    if (isFainted) statusClass = isStabilized ? 'status-stabilized' : 'status-fainted';
    else if (isWeakened) statusClass = 'status-weakened';
    else if (isOverloaded) statusClass = 'status-overloaded';

    return {
        hpPercent: Math.min(100, Math.max(0, hpPercent)).toFixed(1),
        expPercent: Math.min(100, Math.max(0, expPercent)).toFixed(1),
        maxHp,
        isFainted,
        isStabilized,
        isWeakened,
        isOverloaded,
        statusClass,
        canUseStabilizer: canUseNeuralStabilizer(character),
        recoveryTimeLeft
    };
}

/**
 * Ritual View State Selector
 * Used by ritual.js and UI to determine ritual animation phase.
 */
function getRitualViewState(ritualState) {
    if (!ritualState) {
        return {
            isActive: false,
            progress: 0,
            phase: 'idle',
            canComplete: false,
            animationClass: null
        };
    }

    const { isActive, startTime, duration, isCompleting, isFailing } = ritualState;

    let progress = 0;
    let phase = 'idle';
    let animationClass = null;

    if (isActive) {
        const elapsed = Date.now() - startTime;
        progress = Math.min(100, (elapsed / duration) * 100);

        if (isFailing) {
            phase = 'failing';
            animationClass = 'anim-fail';
        } else if (isCompleting) {
            phase = 'completing';
            animationClass = 'anim-exit';
        } else if (progress > 0) {
            phase = 'charging';
            animationClass = progress > 50 ? 'anim-active' : 'anim-enter';
        }
    }

    return {
        isActive,
        progress: progress.toFixed(1),
        phase,
        canComplete: progress >= 100 && !isFailing,
        animationClass
    };
}

/**
 * Log View State Selector
 * Processes logs for UI rendering with severity classes.
 */
function getLogViewState(logs, context = {}) {
    if (!logs || !Array.isArray(logs)) {
        return {
            entries: [],
            hasNewCritical: false,
            shouldAutoScroll: true
        };
    }

    const lastSeenId = context.lastSeenLogId || 0;
    let hasNewCritical = false;

    const entries = logs.map(log => {
        const isNew = log.id > lastSeenId;

        // Derive severity class
        let severityClass = 'log-info';
        if (log.severity === 'SUCCESS') severityClass = 'log-success';
        else if (log.severity === 'WARN') severityClass = 'log-warn';
        else if (log.severity === 'ERROR') severityClass = 'log-error';
        else if (log.severity === 'CRITICAL') {
            severityClass = 'log-critical';
            if (isNew) hasNewCritical = true;
        }

        return {
            ...log,
            severityClass,
            isNew,
            animationClass: isNew ? 'anim-enter' : null
        };
    });

    return {
        entries,
        hasNewCritical,
        shouldAutoScroll: hasNewCritical || !context.isUserScrolling
    };
}

/**
 * State Validation & Repair
 * Ensures character state is consistent and within valid bounds.
 * Returns repaired character and a log of repairs made.
 */
function assertValidCharacterState(char) {
    if (!char) return { character: null, repairs: ['Character is null'] };

    const repairs = [];
    const repaired = { ...char };

    // Ensure required fields exist
    if (repaired.level === undefined || repaired.level < 1) {
        repaired.level = 1;
        repairs.push('Level reset to 1');
    }

    // Calculate expected maxHp
    const expectedMaxHp = getMaxHp(repaired);
    if (repaired.maxHp !== expectedMaxHp) {
        repaired.maxHp = expectedMaxHp;
        repairs.push(`MaxHP synced to ${expectedMaxHp}`);
    }

    // HP Bounds
    if (repaired.hp < 0) {
        repaired.hp = 0;
        repairs.push('HP clamped to 0 (was negative)');
    }
    if (repaired.hp > repaired.maxHp) {
        repaired.hp = repaired.maxHp;
        repairs.push(`HP clamped to maxHp (${repaired.maxHp})`);
    }

    // EXP Bounds
    if (repaired.currentExp === undefined || repaired.currentExp < 0) {
        repaired.currentExp = 0;
        repairs.push('EXP reset to 0');
    }

    // EXP Overflow Check (should have leveled up)
    const expectedMaxExp = calculateNextLevelExp(repaired.level);
    if (repaired.maxExp !== expectedMaxExp) {
        repaired.maxExp = expectedMaxExp;
        repairs.push(`MaxEXP synced to ${expectedMaxExp}`);
    }

    if (repaired.currentExp >= repaired.maxExp) {
        // Force level up correction - this shouldn't happen normally
        repairs.push(`EXP overflow detected (${repaired.currentExp} >= ${repaired.maxExp})`);
        // We'll let the game logic handle leveling, just cap for now
        repaired.currentExp = repaired.maxExp - 1;
    }

    // Double FAINTED Prevention
    if (repaired.hp > 0 && repaired.status === CHARACTER_STATUS.FAINTED) {
        repaired.status = CHARACTER_STATUS.NORMAL;
        repaired.lastFaintedTimestamp = null;
        repaired.debuff = null;
        repairs.push('FAINTED status cleared (HP > 0)');
    }

    // Fainted but no timestamp
    if (repaired.status === CHARACTER_STATUS.FAINTED && !repaired.lastFaintedTimestamp) {
        repaired.lastFaintedTimestamp = Date.now();
        repairs.push('Missing faint timestamp added');
    }

    // Gold bounds
    if (repaired.gold === undefined || repaired.gold < 0) {
        repaired.gold = 0;
        repairs.push('Gold clamped to 0');
    }

    // Upgrade level validation
    repaired.passiveUpgrades = repaired.passiveUpgrades || {};
    for (const [key, val] of Object.entries(repaired.passiveUpgrades)) {
        const maxLevel = UPGRADE_TYPES[key]?.maxLevel || 5;
        if (val < 0) {
            repaired.passiveUpgrades[key] = 0;
            repairs.push(`${key} level clamped to 0`);
        }
        if (val > maxLevel) {
            repaired.passiveUpgrades[key] = maxLevel;
            repairs.push(`${key} level clamped to max (${maxLevel})`);
        }
    }

    // Ensure flags object exists
    repaired.flags = repaired.flags || {
        hasFainted: false,
        hasUpgraded: false,
        faintCount: 0,
        lastActionTimestamp: 0,
        dailyHabitAdds: 0,
        dailyExp: 0,
        isFirstAction: true
    };

    return {
        character: repaired,
        repairs,
        wasRepaired: repairs.length > 0
    };
}

// Expose to Global Scope
window.RPG = {
    DIFFICULTY_TIERS,
    CHARACTER_STATUS,
    NEURAL_STABILIZER_COST,
    UPGRADE_TYPES,
    calculateNextLevelExp,
    executeHabit,
    abortHabit,
    checkStatusRecovery,
    checkDailyReset,
    useNeuralStabilizer,
    getUpgradeCost,
    getMaxHp,
    purchaseUpgrade,
    // Guard Functions
    canExecuteHabit,
    canAbortHabit,
    canUseNeuralStabilizer,
    canPurchaseUpgrade,
    // Validation
    assertValidCharacterState,
    // Selectors
    getCharacterViewState,
    getRitualViewState,
    getLogViewState
};
