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
    FAINTED: 'FAINTED'
};

const FAINT_PENALTY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function calculateNextLevelExp(level) {
    const l = level;
    return Math.round(0.04 * Math.pow(l, 3) + 0.8 * Math.pow(l, 2) + 2 * l) * 100;
}

function executeHabit(character, difficultyKey) {
    const rewards = DIFFICULTY_TIERS[difficultyKey] || DIFFICULTY_TIERS.EASY;

    // Check for recovery FIRST
    let status = character.status;
    let hp = character.hp;
    let lastFaintedTimestamp = character.lastFaintedTimestamp;
    let recovered = false;

    if (status === CHARACTER_STATUS.FAINTED) {
        if (Date.now() - lastFaintedTimestamp >= FAINT_PENALTY_DURATION_MS) {
            // Auto Recover
            status = CHARACTER_STATUS.NORMAL;
            lastFaintedTimestamp = null;
            hp = Math.floor(character.maxHp * 0.5);
            recovered = true;
        } else {
            // Apply Penalty
            // If already penalized in rewards, this might be double dipping? 
            // Better to modify the gain directly
        }
    }

    // Apply penalty to gain if fainted and not just recovered
    let expGain = rewards.exp;
    if (status === CHARACTER_STATUS.FAINTED && !recovered) {
        expGain = Math.floor(expGain / 2);
    }

    // Logic to add EXP
    let newExp = character.currentExp + expGain;
    let newLevel = character.level;
    let newMaxExp = character.maxExp;
    let newMaxHp = character.maxHp;
    let newHp = (recovered) ? hp : character.hp; // Use recovered HP if recovered, else current
    let leveledUp = false;

    // Use loop for multi-level gain
    while (newExp >= newMaxExp) {
        newExp -= newMaxExp;
        newLevel++;
        newMaxExp = calculateNextLevelExp(newLevel);
        newMaxHp += 10;
        newHp = newMaxHp; // Full Restore on Level Up
        status = CHARACTER_STATUS.NORMAL; // Level up cures fainting
        lastFaintedTimestamp = null;
        leveledUp = true;
        recovered = false; // Reset recovered flag since level up overrides it
    }

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
        _justRecovered: recovered, // Internal flag for UI logging
        _leveledUp: leveledUp
    };
}

function abortHabit(character, difficultyKey) {
    const penalty = DIFFICULTY_TIERS[difficultyKey] || DIFFICULTY_TIERS.EASY;

    let newHp = character.hp - penalty.hpCost;
    let newStatus = character.status;
    let timestamp = character.lastFaintedTimestamp;

    if (newHp <= 0) {
        newHp = 0;
        if (newStatus !== CHARACTER_STATUS.FAINTED) {
            newStatus = CHARACTER_STATUS.FAINTED;
            timestamp = Date.now();
        }
    }

    return {
        ...character,
        hp: newHp,
        status: newStatus,
        lastFaintedTimestamp: timestamp
    };
}

function checkStatusRecovery(character) {
    if (character.status === CHARACTER_STATUS.FAINTED) {
        if (Date.now() - character.lastFaintedTimestamp >= FAINT_PENALTY_DURATION_MS) {
            return {
                ...character,
                status: CHARACTER_STATUS.NORMAL,
                lastFaintedTimestamp: null,
                hp: Math.floor(character.maxHp * 0.5) // Recover to 50% HP
            };
        }
    }
    return character;
}

// Expose to Global Scope
window.RPG = {
    DIFFICULTY_TIERS,
    CHARACTER_STATUS,
    calculateNextLevelExp,
    executeHabit,
    abortHabit,
    checkStatusRecovery
};
