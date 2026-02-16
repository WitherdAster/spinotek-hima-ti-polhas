# Habit-Core RPG - Features

A gamified habit tracker with a cyberpunk overlay, focusing on "stabilizing neural patterns" (habits) through RPG mechanics.

## 🧬 Core Mechanics

### RPG Progression
- **Leveling System**: Non-linear experience curve. Leveling up fully restores HP and status.
- **Resource Management**:
  - **HP (Integrity)**: Lost by aborting habits. Reaching 0 causes a "Fainted" state.
  - **EXP (Data Sync)**: Gained by completing habits. Affected by current status (penalties).
  - **Gold**: Currency gained from completion, used for upgrades and recovery.

### Status System
The character state dictates performance penalties:
- **NORMAL**: Standard operation.
- **WEAKENED**: HP < 25%. Visual warning.
- **FAINTED**: HP = 0.
  - **Effect**: 50% EXP penalty on all actions.
  - **Duration**: 24 hours (real-time).
- **STABILIZED**: Activated via **Neural Stabilizer**.
  - **Effect**: Reduces penalty to 25%. HP is locked at 0 (immune to further damage).
  - **Duration**: 12 hours.
- **OVERLOADED**: Adding > 5 habits/day triggers a mental fatigue warning.

### Contextual Logic
- **Night Mode (18:00 - 04:00)**: Aborting habits during night hours incurs **50% less damage** logistically, simulating reduced "social pressure" or urgency.

## 🔮 The "Ritual" Interaction
A unique, tactile method for committing to new habits.

- **Drag & Drop Protocol**:
  - Drag "Ghost Templates" from the **Memory Core** sidebar into the active list.
- **Hold-to-Materialize**:
  - Habits start as "Ghosts" (not active).
  - **Interaction**: User must Click & Hold the ghost to "materialize" it.
  - **Visual Feedback**: The element glows, shakes, and spikes in intensity as progress builds.
  - **Fatigue System**: Repeating rituals quickly increases the required hold time (+0.5s per attempt).
  - **Disintegration**: Releasing too early causes the element to shatter into particle effects.

## 🛠️ Upgrades (Augmentations)

Purchase cybernetic enhancements with Gold:
1.  **Vital Core**: Increases Max HP (+5 per level).
2.  **Learning Amplifier**: Bonus EXP gain (+3% per level).
3.  **Failure Dampener**: Reduces HP damage from aborts (-5% per level).

*Cost scales dynamically (1.5x) with each level.*

## 💻 UX/UI Features

- **Cyberpunk Aesthetic**: Neon styling, scanlines, and terminal-like typography.
- **Dynamic Dashboard**:
  - Real-time HP/EXP bars.
  - Status badges update immediately based on logic.
- **System Logs**:
  - Color-coded event log (Success/Warn/Critical).
  - Auto-scrolling (pauses if user is reading history).
  - Independent ID-based rendering logic allowing unlimited log history display.
- **Safe Transactions**:
  - "Double-click" confirmation for spending Gold or critical actions.
- **Responsive Layout**: Collapsible Sidebar ("Memory Core") for habit templates.

## ⚙️ Technical Features

- **Local Persistence**: All data is saved automatically to `localStorage`.
- **Atomic Transactions**: Critical actions (upgrades, stabilizer) use a transactional wrapper to ensure state consistency or rollback on error.
- **Auto-Repair**: On load, the system validates specific bounds (HP < Max, Level > 1) and repairs corrupted data.
- **Offline Capable**: Runs entirely client-side without external dependencies.
