export const BATTING_KEY = {
	1: 'home-run',
	2: 'ground-ball',
	3: 'fly-ball',
	4: 'fly-ball',
	5: 'triple',
	6: 'ground-ball',
	7: 'single',
	8: 'fly-ball',
	9: 'walk',
	10: 'strikeout',
	11: 'double',
	12: 'ground-ball',
	13: 'single',
	14: 'fly-ball'
}

export const RESULT_TYPES_NEEDING_KO = new Set(['single', 'fly-ball', 'ground-ball'])

export const IMMEDIATE_RESULTS = new Set(['home-run', 'triple', 'double', 'walk', 'strikeout'])

// K-O Dial outcomes: keyed by resultType, then letter
// Each entry: { batter, runners }
// batter: { base: number|null, out: boolean }
// runners: { advance: number, conditional: string|null }
export const KO_DIAL = {
	'fly-ball': {
		K: {
			batter: { base: 2, out: false },
			runners: { advance: 2 },
			description: 'Safe at 2B on error, runners advance 2 bases'
		},
		L: {
			batter: { base: null, out: true },
			runners: { scoreFrom: 3, othersHold: true },
			description: 'Flies out, runner on 3B scores, others hold'
		},
		M: {
			batter: { base: null, out: true },
			runners: { advanceFrom: [2, 3], advance: 1 },
			description: 'Flies out, runners on 2B/3B advance 1, runner on 1B holds'
		},
		N: {
			batter: { base: null, out: true },
			runners: { hold: true },
			description: 'Flies out, runners hold'
		},
		O: {
			batter: { base: null, out: true },
			runners: { leadRunnerOut: true, othersHold: true },
			description: 'Flies out, lead runner doubled off'
		}
	},
	'single': {
		K: {
			batter: { base: null, out: true },
			runners: { advance: 2 },
			description: 'Out trying for 2B, runners advance 2 bases'
		},
		L: {
			batter: { base: 1, out: false },
			runners: { advance: 1 },
			description: 'Safe at 1B, runners advance 1 base'
		},
		M: {
			batter: { base: 1, out: false },
			runners: { advance: 1 },
			description: 'Safe at 1B, runners advance 1 base'
		},
		N: {
			batter: { base: 1, out: false },
			runners: { advance: 2 },
			description: 'Safe at 1B, runners advance 2 bases'
		},
		O: {
			batter: { base: 2, out: false },
			runners: { leadRunnerOut: true, othersAdvance: 2 },
			description: 'Safe at 2B, lead runner thrown out'
		}
	},
	'ground-ball': {
		K: {
			batter: { base: 1, out: false },
			runners: { advance: 1 },
			description: 'Safe at 1B on error, runners advance 1 base'
		},
		L: {
			batter: { base: null, out: true },
			runners: { advanceIfForced: true },
			description: 'Out at 1B, forced runners advance'
		},
		M: {
			batter: { base: null, out: true },
			runners: { leadRunnerOut: true, othersAdvance: 1 },
			description: 'Out at 1B, lead runner out at 2B (DP), others advance 1'
		},
		N: {
			batter: { base: null, out: true },
			runners: { advance: 1 },
			description: 'Out at 1B, runners advance 1 base'
		},
		O: {
			batter: { base: null, out: true },
			runners: { leadRunnerOut: true, basesLoadedPlateOut: true, othersAdvance: 1 },
			description: 'Out at 1B, lead runner out at 2B (DP), bases loaded: out at plate'
		}
	}
}

// Strategy charts
// A-E plays: steal from 1B, double steal 1B+3B, hit-and-run, squeeze
// F-J plays: steal from 2B, double steal 1B+2B, sac bunt 1B, sac bunt 2B
export const STRATEGY = {
	'steal-1b': {
		A: { batter: 'takes-pitch', runners: 'safe-at-2b-hold-3b', description: 'Takes pitch, runner safe at 2B' },
		B: { batter: 'grounds-out', runners: 'advance-1', description: 'Grounds out, runners advance 1' },
		C: { batter: 'singles', runners: 'advance-2', description: 'Singles, runners advance 2' },
		D: { batter: 'takes-pitch', runners: 'out-at-2b-hold-3b', description: 'Takes pitch, runner out at 2B' },
		E: { batter: 'flies-out', runners: 'hold', description: 'Flies out, runners hold' }
	},
	'double-steal-1b-3b': {
		A: { batter: 'takes-pitch', runners: 'advance-1', description: 'Takes pitch, runners advance 1' },
		B: { batter: 'flies-out', runners: 'hold', description: 'Flies out, runners hold' },
		C: { batter: 'singles', runners: 'advance-2', description: 'Singles, runners advance 2' },
		D: { batter: 'takes-pitch', runners: 'safe-at-2b-out-at-home', description: 'Takes pitch, safe at 2B, out at home' },
		E: { batter: 'grounds-out', runners: 'advance-1', description: 'Grounds out, runners advance 1' }
	},
	'hit-and-run': {
		A: { batter: 'singles', runners: 'advance-2', description: 'Singles, runners advance 2' },
		B: { batter: 'flies-out', runners: 'hold', description: 'Flies out, runners hold' },
		C: { batter: 'misses-ball', runners: 'safe-at-2b-hold-3b', description: 'Misses ball, runner safe at 2B' },
		D: { batter: 'grounds-out', runners: 'advance-1', description: 'Grounds out, runners advance 1' },
		E: { batter: 'misses-ball', runners: 'out-at-2b-hold-3b', description: 'Misses ball, runner out at 2B' }
	},
	'squeeze': {
		A: { batter: 'grounds-out', runners: 'advance-1', description: 'Grounds out, runners advance 1 (runner scores)' },
		B: { batter: 'misses-ball', runners: 'out-at-plate-others-advance-1', description: 'Misses ball, runner out at plate' },
		C: { batter: 'beats-out-bunt', runners: 'advance-1', description: 'Beats out bunt, runners advance 1' },
		D: { batter: 'safe-at-1b', runners: 'out-at-plate-others-advance-1', description: 'Safe at 1B, runner out at plate' },
		E: { batter: 'pops-out', runners: 'caught-off-3b-dp', description: 'Pops out, runner caught off 3B (DP)' }
	},
	'steal-2b': {
		F: { batter: 'takes-pitch', runners: 'safe-at-3b', description: 'Takes pitch, runner safe at 3B' },
		G: { batter: 'singles', runners: 'runner-scores', description: 'Singles, runner scores' },
		H: { batter: 'takes-pitch', runners: 'out-at-3b', description: 'Takes pitch, runner out at 3B' },
		I: { batter: 'grounds-out', runners: 'safe-at-3b', description: 'Grounds out, runner safe at 3B' },
		J: { batter: 'lines-out', runners: 'caught-off-2b-dp', description: 'Lines out, runner caught off 2B (DP)' }
	},
	'double-steal-1b-2b': {
		F: { batter: 'takes-pitch', runners: 'advance-1', description: 'Takes pitch, runners advance 1' },
		G: { batter: 'flies-out', runners: 'hold', description: 'Flies out, runners hold' },
		H: { batter: 'takes-pitch', runners: 'out-at-3b-safe-at-2b', description: 'Takes pitch, out at 3B, safe at 2B' },
		I: { batter: 'singles', runners: 'advance-2', description: 'Singles, runners advance 2' },
		J: { batter: 'grounds-out', runners: 'out-at-2b-dp-safe-at-3b', description: 'Grounds out, out at 2B (DP), safe at 3B' }
	},
	'sac-bunt-1b': {
		F: { batter: 'grounds-out', runners: 'advance-1', description: 'Grounds out, runner advances 1' },
		G: { batter: 'safe-at-1b', runners: 'out-at-2b', description: 'Safe at 1B, runner out at 2B' },
		H: { batter: 'beats-out-bunt', runners: 'advance-1', description: 'Beats out bunt, runner advances 1' },
		I: { batter: 'pops-out', runners: 'hold', description: 'Pops out, runner holds' },
		J: { batter: 'grounds-out', runners: 'out-at-2b-dp', description: 'Grounds out, out at 2B (DP)' }
	},
	'sac-bunt-2b': {
		F: { batter: 'grounds-out', runners: 'advance-1', description: 'Grounds out, runners advance 1' },
		G: { batter: 'safe-at-1b', runners: 'out-at-3b-safe-at-2b', description: 'Safe at 1B, out at 3B, safe at 2B' },
		H: { batter: 'beats-out-bunt', runners: 'advance-1', description: 'Beats out bunt, runners advance 1' },
		I: { batter: 'pops-out', runners: 'hold', description: 'Pops out, runners hold' },
		J: { batter: 'misses-pitch', runners: 'caught-off-2b-hold-1b', description: 'Misses pitch, caught off 2B, holds 1B' }
	}
}

// Which strategies require which base states
export const STRATEGY_REQUIREMENTS = {
	'steal-1b': { first: true },
	'double-steal-1b-3b': { first: true, third: true },
	'hit-and-run': { first: true },
	'squeeze': { third: true },
	'steal-2b': { second: true },
	'double-steal-1b-2b': { first: true, second: true },
	'sac-bunt-1b': { first: true },
	'sac-bunt-2b': { second: true }
}

// Which strategy plays use which disc
export const STRATEGY_DISC = {
	'steal-1b': 'A-E',
	'double-steal-1b-3b': 'A-E',
	'hit-and-run': 'A-E',
	'squeeze': 'A-E',
	'steal-2b': 'F-J',
	'double-steal-1b-2b': 'F-J',
	'sac-bunt-1b': 'F-J',
	'sac-bunt-2b': 'F-J'
}
