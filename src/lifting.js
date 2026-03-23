export const BAR = 20

// One entry per pair of plates available
const PLATE_PAIRS = [0.5, 1.25, 2.5, 2.5, 5, 10, 15, 20, 20]

export function buildAvailableWeights() {
  const weights = new Set()
  const n = PLATE_PAIRS.length
  for (let mask = 0; mask < (1 << n); mask++) {
    let total = BAR
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) total += PLATE_PAIRS[i] * 2
    }
    weights.add(Math.round(total * 100) / 100)
  }
  return Array.from(weights).sort((a, b) => a - b)
}

export const ALL_WEIGHTS = buildAvailableWeights()

export function nearestWeight(target) {
  return ALL_WEIGHTS.reduce((best, w) =>
    Math.abs(w - target) < Math.abs(best - target) ? w : best, ALL_WEIGHTS[0])
}

export function nextWeightUp(current, minStep) {
  const target = current + minStep
  return ALL_WEIGHTS.find(w => w >= target) ?? current
}

export function smallestIncrement(current) {
  return ALL_WEIGHTS.find(w => w > current) ?? current
}

export function warmupSets(working) {
  const targets = [
    BAR,
    BAR + (working - BAR) * 0.25,
    BAR + (working - BAR) * 0.50,
    BAR + (working - BAR) * 0.75,
  ]
  return targets.map(t => nearestWeight(t))
}

export const SESSION_A = ['Squat', 'Bench press', 'Barbell row']
export const SESSION_B = ['Squat', 'Overhead press', 'Deadlift']
export const ALL_EXERCISES = [...new Set([...SESSION_A, ...SESSION_B])]

export const DEFAULT_WEIGHTS = {
  'Squat': 20, 'Bench press': 20, 'Barbell row': 20,
  'Overhead press': 20, 'Deadlift': 20,
}

export function getSets(exercise) {
  return exercise === 'Deadlift' ? 1 : 5
}

export function computeNextWeight(currentWeight, difficulty) {
  if (difficulty === 'easy' || difficulty === 'neutral') return nextWeightUp(currentWeight, 2.5)
  if (difficulty === 'hard') return smallestIncrement(currentWeight)
  return currentWeight
}

export function getStallCount(history, exercise) {
  const recent = history
    .filter(h => h.exercise === exercise)
    .slice(-3)
  if (recent.length < 3) return 0
  if (recent[0].weight === recent[1].weight && recent[1].weight === recent[2].weight) return 3
  let stalls = 0
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].weight <= recent[i - 1].weight) stalls++
    else stalls = 0
  }
  return stalls
}

export const DIFFICULTY = {
  easy:    { label: 'Easy',    emoji: '😌' },
  neutral: { label: 'OK',      emoji: '😐' },
  hard:    { label: 'Hard',    emoji: '😤' },
}
