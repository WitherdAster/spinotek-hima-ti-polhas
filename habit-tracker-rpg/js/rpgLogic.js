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
const STABILIZER_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const NEURAL_STABILIZER_COST = 200;

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

function executeHabit(character, difficultyKey) {
    const rewards = DIFFICULTY_TIERS[difficultyKey] || DIFFICULTY_TIERS.EASY;

    // Check for recovery FIRST
    let charState = checkStatusRecovery(character);
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

    return {
        ...character,
        level: newLevel,
        currentExp: newExp,
        maxExp: newMaxExp,
        hp: newHp,
        maxHp: newMaxHp,
        gold: character.gold + (rewards.exp), // 1 Gold per 1 base EXP (Base reward used for logic simplicity)
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

    // Apply Passive Reduction (Failure Dampener)
    if (character.passiveUpgrades && character.passiveUpgrades.failureDampener) {
        const reductionPercent = character.passiveUpgrades.failureDampener * 0.05;
        damage = Math.floor(damage * (1 - reductionPercent));
        if (damage < 1) damage = 1; // Minimum 1 damage
    }

    let newHp = character.hp - damage;
    let newStatus = character.status;
    let timestamp = character.lastFaintedTimestamp;
    let newDebuff = character.debuff;

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
        debuff: newDebuff
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
                maxHp: currentMaxHp // Ensure MaxHP is sync
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
    // If HP was full, keep it full? Or just increase cap? 
    // Usually upgrading HP heals the amount gained or keeps percentage. 
    // Let's just increase cap and keep current HP same (unless it exceeds?). 
    // Actually, widespread RPG logic: gain the diff.
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
    useNeuralStabilizer,
    getUpgradeCost,
    getMaxHp,
    purchaseUpgrade
};
