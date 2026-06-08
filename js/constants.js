export const POSITION_ABBREV = {
	pitcher: 'P', catcher: 'C', 'first-base': '1B', 'second-base': '2B',
	'third-base': '3B', shortstop: 'SS', outfield: 'OF',
	'designated-hitter': 'DH',
	'left-field': 'LF', 'center-field': 'CF', 'right-field': 'RF'
}

export const BATTERY = new Set(['pitcher', 'catcher'])
export const OUTFIELD = new Set(['outfield', 'left-field', 'center-field', 'right-field', 'lf', 'cf', 'rf'])

const AE_WIDE = 360 / 11
const AE_NARROW = AE_WIDE * 2 / 3
export const STRATEGY_SECTORS_AE = [
	{ letter: 'E', angle: AE_NARROW }, { letter: 'C', angle: AE_WIDE },
	{ letter: 'D', angle: AE_WIDE }, { letter: 'A', angle: AE_WIDE },
	{ letter: 'E', angle: AE_NARROW }, { letter: 'B', angle: AE_WIDE },
	{ letter: 'D', angle: AE_WIDE }, { letter: 'C', angle: AE_WIDE },
	{ letter: 'E', angle: AE_NARROW }, { letter: 'B', angle: AE_WIDE },
	{ letter: 'D', angle: AE_WIDE }, { letter: 'A', angle: AE_WIDE }
]
export const STRATEGY_SECTORS_FJ = [
	{ letter: 'H', angle: 25 }, { letter: 'G', angle: 25 }, { letter: 'F', angle: 40 },
	{ letter: 'J', angle: 25 }, { letter: 'F', angle: 40 }, { letter: 'I', angle: 25 },
	{ letter: 'H', angle: 25 }, { letter: 'G', angle: 25 }, { letter: 'F', angle: 40 },
	{ letter: 'J', angle: 25 }, { letter: 'F', angle: 40 }, { letter: 'I', angle: 25 }
]

export const REGULATION_INNINGS = 9
export const LINEUP_SIZE = 9
export const MAX_NARRATOR_LINES = 60
