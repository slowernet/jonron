import { describe, it, expect } from 'vitest'
import { qualifyPlayers } from '../../scripts/lib/qualify.js'

// Helper to create a batting row with defaults
const bat = (overrides = {}) => ({
  playerID: 'player01', yearID: '1980', stint: '1', teamID: 'NYA',
  lgID: 'AL', G: '162', AB: '500', R: '80', H: '150',
  '2B': '30', '3B': '5', HR: '20', RBI: '80', SB: '10', CS: '5',
  BB: '50', SO: '100', IBB: '5', HBP: '5', SH: '2', SF: '5', GIDP: '10',
  ...overrides
})

// Helper to create an appearances row
const app = (overrides = {}) => ({
  yearID: '1980', teamID: 'NYA', lgID: 'AL', playerID: 'player01',
  G_all: '162', GS: '160', G_batting: '162', G_defense: '160',
  G_p: '0', G_c: '0', G_1b: '0', G_2b: '0', G_3b: '0', G_ss: '0',
  G_lf: '0', G_cf: '0', G_rf: '0', G_of: '0', G_dh: '0', G_ph: '0', G_pr: '0',
  ...overrides
})

// Helper to create a pitching row
const pitch = (overrides = {}) => ({
  playerID: 'pitcher01', yearID: '1980', stint: '1', teamID: 'NYA',
  lgID: 'AL', IPouts: '600',
  ...overrides
})

// Generate N distinct qualified batters with appearances
const makeQualifiedBatters = (n, teamID = 'NYA', extras = {}) => {
  const batting = []
  const appearances = []
  for (let i = 0; i < n; i++) {
    const id = `batter${String(i + 1).padStart(2, '0')}`
    batting.push(bat({
      playerID: id, teamID, AB: String(520 - i * 5), ...extras
    }))
    appearances.push(app({
      playerID: id, teamID,
      G_1b: String(100 - i), G_cf: '30'
    }))
  }
  return { batting, appearances }
}

describe('qualifyPlayers', () => {
  describe('position player qualification by PA threshold', () => {
    it('includes players above the 3.1 * teamGames PA threshold', () => {
      // teamGames=162 -> threshold=502.2 -> need PA>502
      // PA = AB + BB + HBP + SF + SH = 500 + 50 + 5 + 5 + 2 = 562
      const batting = [bat({ playerID: 'above01' })]
      const appearances = [app({ playerID: 'above01', G_1b: '100' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers).toHaveLength(1)
      expect(result.positionPlayers[0].playerID).toBe('above01')
    })

    it('excludes players below the PA threshold when enough qualify', () => {
      const positions = ['G_c', 'G_1b', 'G_2b', 'G_3b', 'G_ss', 'G_dh',
        'G_lf', 'G_cf', 'G_rf', 'G_rf', 'G_1b', 'G_2b', 'G_3b', 'G_ss', 'G_dh']
      const batting = []
      const appearances = []
      for (let i = 0; i < 15; i++) {
        const id = `batter${String(i + 1).padStart(2, '0')}`
        batting.push(bat({ playerID: id, AB: String(520 - i * 5) }))
        appearances.push(app({ playerID: id, [positions[i]]: '100' }))
      }
      // Unqualified player at a position already filled
      batting.push(bat({
        playerID: 'below01', AB: '100', BB: '10', HBP: '1', SF: '1', SH: '0'
      }))
      appearances.push(app({ playerID: 'below01', G_1b: '50' }))

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers.map(p => p.playerID)).not.toContain('below01')
    })
  })

  describe('stats aggregation across multiple stints', () => {
    it('aggregates batting stats for multiple stints on the same team', () => {
      const batting = [
        bat({ playerID: 'multi01', stint: '1', AB: '300', H: '80', HR: '10', BB: '30', HBP: '3', SF: '3', SH: '1', '2B': '15', '3B': '2', SO: '50', GIDP: '5' }),
        bat({ playerID: 'multi01', stint: '2', AB: '250', H: '70', HR: '12', BB: '25', HBP: '2', SF: '2', SH: '1', '2B': '10', '3B': '3', SO: '40', GIDP: '4' })
      ]
      const appearances = [app({ playerID: 'multi01', G_c: '120' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers).toHaveLength(1)

      const stats = result.positionPlayers[0].stats
      expect(stats.AB).toBe(550)
      expect(stats.H).toBe(150)
      expect(stats.HR).toBe(22)
      expect(stats.BB).toBe(55)
      expect(stats.HBP).toBe(5)
      expect(stats.SF).toBe(5)
      expect(stats.SH).toBe(2)
      expect(stats['2B']).toBe(25)
      expect(stats['3B']).toBe(5)
      expect(stats.SO).toBe(90)
      expect(stats.GIDP).toBe(9)
    })
  })

  describe('pitcher qualification by IP threshold', () => {
    it('includes pitchers above 1.0 * teamGames IP threshold for NL', () => {
      // IP = IPouts / 3 = 600 / 3 = 200 >= 162
      const pitching = [pitch({ playerID: 'nlpitch01', teamID: 'NYN', lgID: 'NL' })]
      const batting = [bat({ playerID: 'nlpitch01', teamID: 'NYN', lgID: 'NL' })]
      const appearances = [app({ playerID: 'nlpitch01', teamID: 'NYN', lgID: 'NL', G_p: '35' })]

      const result = qualifyPlayers(batting, appearances, pitching, 162, 'NL', 1980)
      expect(result.pitchers).toHaveLength(1)
      expect(result.pitchers[0].playerID).toBe('nlpitch01')
    })

    it('excludes pitchers below the IP threshold when enough qualify', () => {
      const pitching = [
        pitch({ playerID: 'nlpitch01', teamID: 'NYN', lgID: 'NL', IPouts: '600' }),
        pitch({ playerID: 'nlpitch02', teamID: 'NYN', lgID: 'NL', IPouts: '550' }),
        pitch({ playerID: 'nlpitch03', teamID: 'NYN', lgID: 'NL', IPouts: '100' }) // below threshold
      ]
      const batting = pitching.map(p => bat({ playerID: p.playerID, teamID: 'NYN', lgID: 'NL' }))
      const appearances = pitching.map(p => app({ playerID: p.playerID, teamID: 'NYN', lgID: 'NL', G_p: '30' }))

      const result = qualifyPlayers(batting, appearances, pitching, 162, 'NL', 1980)
      expect(result.pitchers).toHaveLength(2)
      expect(result.pitchers.map(p => p.playerID)).not.toContain('nlpitch03')
    })
  })

  describe('AL pitchers post-1973', () => {
    it('returns empty array for AL post-1973', () => {
      const pitching = [pitch({ playerID: 'alpitch01', IPouts: '600' })]
      const batting = [bat({ playerID: 'alpitch01' })]
      const appearances = [app({ playerID: 'alpitch01', G_p: '35' })]

      const result = qualifyPlayers(batting, appearances, pitching, 162, 'AL', 1974)
      expect(result.pitchers).toEqual([])
    })

    it('returns pitchers for AL pre-1974', () => {
      const pitching = [pitch({ playerID: 'alpitch01', IPouts: '600' })]
      const batting = [bat({ playerID: 'alpitch01' })]
      const appearances = [app({ playerID: 'alpitch01', G_p: '35' })]

      const result = qualifyPlayers(batting, appearances, pitching, 162, 'AL', 1973)
      expect(result.pitchers).toHaveLength(1)
    })
  })

  describe('NL pitchers post-1973', () => {
    it('returns pitchers with batting stats for NL', () => {
      const pitching = [pitch({ playerID: 'nlpitch01', teamID: 'NYN', lgID: 'NL', IPouts: '600' })]
      const batting = [bat({ playerID: 'nlpitch01', teamID: 'NYN', lgID: 'NL', AB: '60', H: '15', HR: '1', BB: '5', HBP: '0', SF: '0', SH: '10', '2B': '3', '3B': '0', SO: '20', GIDP: '1' })]
      const appearances = [app({ playerID: 'nlpitch01', teamID: 'NYN', lgID: 'NL', G_p: '35' })]

      const result = qualifyPlayers(batting, appearances, pitching, 162, 'NL', 1980)
      expect(result.pitchers).toHaveLength(1)

      const p = result.pitchers[0]
      expect(p.playerID).toBe('nlpitch01')
      expect(p.position).toBe('pitcher')
      expect(p.stats.AB).toBe(60)
      expect(p.stats.H).toBe(15)
      expect(p.stats.HR).toBe(1)
    })
  })

  describe('position assignment from appearances data', () => {
    it('assigns catcher for G_c majority', () => {
      const batting = [bat({ playerID: 'cat01' })]
      const appearances = [app({ playerID: 'cat01', G_c: '120', G_1b: '10' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers[0].position).toBe('catcher')
    })

    it('assigns outfield for G_lf majority', () => {
      const batting = [bat({ playerID: 'lf01' })]
      const appearances = [app({ playerID: 'lf01', G_lf: '120', G_cf: '10' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers[0].position).toBe('outfield')
    })

    it('assigns outfield for G_cf majority', () => {
      const batting = [bat({ playerID: 'cf01' })]
      const appearances = [app({ playerID: 'cf01', G_cf: '140' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers[0].position).toBe('outfield')
    })

    it('assigns outfield for G_rf majority', () => {
      const batting = [bat({ playerID: 'rf01' })]
      const appearances = [app({ playerID: 'rf01', G_rf: '130' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers[0].position).toBe('outfield')
    })

    it('assigns designated-hitter for G_dh majority', () => {
      const batting = [bat({ playerID: 'dh01' })]
      const appearances = [app({ playerID: 'dh01', G_dh: '150' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers[0].position).toBe('designated-hitter')
    })

    it('assigns shortstop for G_ss majority', () => {
      const batting = [bat({ playerID: 'ss01' })]
      const appearances = [app({ playerID: 'ss01', G_ss: '155' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers[0].position).toBe('shortstop')
    })

    it('assigns second-base for G_2b majority', () => {
      const batting = [bat({ playerID: '2b01' })]
      const appearances = [app({ playerID: '2b01', G_2b: '140' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers[0].position).toBe('second-base')
    })

    it('assigns third-base for G_3b majority', () => {
      const batting = [bat({ playerID: '3b01' })]
      const appearances = [app({ playerID: '3b01', G_3b: '145' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers[0].position).toBe('third-base')
    })

    it('assigns first-base for G_1b majority', () => {
      const batting = [bat({ playerID: '1b01' })]
      const appearances = [app({ playerID: '1b01', G_1b: '150' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers[0].position).toBe('first-base')
    })

    it('assigns pitcher for G_p majority', () => {
      const batting = [bat({ playerID: 'pit01' })]
      const appearances = [app({ playerID: 'pit01', G_p: '35' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers[0].position).toBe('pitcher')
    })
  })

  describe('fallback ensures at least 13 position players with position minimums', () => {
    it('fills to 13 from top PA players when few qualify by threshold', () => {
      const batting = []
      const appearances = []
      for (let i = 0; i < 18; i++) {
        const id = `batter${String(i + 1).padStart(2, '0')}`
        const ab = i < 5 ? '500' : String(400 - i * 10)
        batting.push(bat({ playerID: id, AB: ab }))
        appearances.push(app({ playerID: id, G_1b: '100' }))
      }

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers.length).toBeGreaterThanOrEqual(13)
    })

    it('fills position minimums even if player is below threshold', () => {
      const batting = []
      const appearances = []
      // 12 qualified first basemen
      for (let i = 0; i < 12; i++) {
        const id = `batter${String(i + 1).padStart(2, '0')}`
        batting.push(bat({ playerID: id, AB: '500' }))
        appearances.push(app({ playerID: id, G_1b: '100' }))
      }
      // 1 catcher with low PA
      batting.push(bat({ playerID: 'catcher01', AB: '200', BB: '10', HBP: '1', SF: '1', SH: '0' }))
      appearances.push(app({ playerID: 'catcher01', G_c: '80' }))

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      const catchers = result.positionPlayers.filter(p => p.position === 'catcher')
      expect(catchers.length).toBeGreaterThanOrEqual(1)
    })

    it('ensures at least 4 outfielders', () => {
      const batting = []
      const appearances = []
      // 9 qualified infielders
      for (let i = 0; i < 9; i++) {
        const id = `inf${String(i + 1).padStart(2, '0')}`
        batting.push(bat({ playerID: id, AB: '500' }))
        appearances.push(app({ playerID: id, G_ss: '100' }))
      }
      // 5 outfielders with lower PA
      for (let i = 0; i < 5; i++) {
        const id = `of${String(i + 1).padStart(2, '0')}`
        batting.push(bat({ playerID: id, AB: String(300 - i * 20), BB: '10', HBP: '1', SF: '1', SH: '0' }))
        appearances.push(app({ playerID: id, G_cf: '100' }))
      }

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      const outfielders = result.positionPlayers.filter(p => p.position === 'outfield')
      expect(outfielders.length).toBeGreaterThanOrEqual(4)
    })

    it('does not require DH for pre-DH era NL teams', () => {
      const batting = []
      const appearances = []
      // 13 qualified players, none at DH
      const positions = ['G_c', 'G_1b', 'G_2b', 'G_3b', 'G_ss',
        'G_lf', 'G_cf', 'G_rf', 'G_rf', 'G_1b', 'G_2b', 'G_3b', 'G_ss']
      for (let i = 0; i < 13; i++) {
        const id = `batter${String(i + 1).padStart(2, '0')}`
        batting.push(bat({ playerID: id, AB: '500' }))
        appearances.push(app({ playerID: id, [positions[i]]: '100' }))
      }

      const result = qualifyPlayers(batting, appearances, [], 162, 'NL', 1970)
      // Should not pull in a non-existent DH player
      expect(result.positionPlayers.length).toBe(13)
      const dhPlayers = result.positionPlayers.filter(p => p.position === 'designated-hitter')
      expect(dhPlayers).toHaveLength(0)
    })

    it('returns all players if fewer than 13 exist', () => {
      const batting = []
      const appearances = []
      for (let i = 0; i < 6; i++) {
        const id = `batter${String(i + 1).padStart(2, '0')}`
        batting.push(bat({ playerID: id, AB: '100', BB: '5', HBP: '1', SF: '1', SH: '0' }))
        appearances.push(app({ playerID: id, G_1b: '50' }))
      }

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      expect(result.positionPlayers).toHaveLength(6)
    })
  })

  describe('fallback when fewer than 2 pitchers qualify', () => {
    it('takes top 2 by IP when fewer than 2 qualify', () => {
      const pitching = [
        pitch({ playerID: 'nlpitch01', teamID: 'NYN', lgID: 'NL', IPouts: '300' }), // 100 IP, below 162
        pitch({ playerID: 'nlpitch02', teamID: 'NYN', lgID: 'NL', IPouts: '250' }), // ~83 IP
        pitch({ playerID: 'nlpitch03', teamID: 'NYN', lgID: 'NL', IPouts: '100' })  // ~33 IP
      ]
      const batting = pitching.map(p => bat({ playerID: p.playerID, teamID: 'NYN', lgID: 'NL' }))
      const appearances = pitching.map(p => app({ playerID: p.playerID, teamID: 'NYN', lgID: 'NL', G_p: '30' }))

      const result = qualifyPlayers(batting, appearances, pitching, 162, 'NL', 1980)
      expect(result.pitchers).toHaveLength(2)
      expect(result.pitchers[0].playerID).toBe('nlpitch01')
      expect(result.pitchers[1].playerID).toBe('nlpitch02')
    })

    it('returns 1 pitcher if only 1 exists', () => {
      const pitching = [pitch({ playerID: 'nlpitch01', teamID: 'NYN', lgID: 'NL', IPouts: '100' })]
      const batting = [bat({ playerID: 'nlpitch01', teamID: 'NYN', lgID: 'NL' })]
      const appearances = [app({ playerID: 'nlpitch01', teamID: 'NYN', lgID: 'NL', G_p: '30' })]

      const result = qualifyPlayers(batting, appearances, pitching, 162, 'NL', 1980)
      expect(result.pitchers).toHaveLength(1)
    })
  })

  describe('output shape', () => {
    it('returns correct stats shape for position players', () => {
      const batting = [bat({ playerID: 'shape01', AB: '500', H: '150', '2B': '30', '3B': '5', HR: '20', BB: '50', SO: '100', HBP: '5', SF: '5', SH: '2', GIDP: '10' })]
      const appearances = [app({ playerID: 'shape01', G_ss: '150' })]

      const result = qualifyPlayers(batting, appearances, [], 162, 'AL', 1980)
      const player = result.positionPlayers[0]

      expect(player).toEqual({
        playerID: 'shape01',
        position: 'shortstop',
        stats: {
          AB: 500, H: 150, '2B': 30, '3B': 5, HR: 20,
          BB: 50, SO: 100, HBP: 5, SF: 5, SH: 2, GIDP: 10
        }
      })
    })

    it('returns correct stats shape for pitchers', () => {
      const pitching = [pitch({ playerID: 'pshape01', teamID: 'NYN', lgID: 'NL', IPouts: '600' })]
      const batting = [bat({ playerID: 'pshape01', teamID: 'NYN', lgID: 'NL', AB: '60', H: '12', '2B': '2', '3B': '0', HR: '1', BB: '3', SO: '25', HBP: '0', SF: '1', SH: '8', GIDP: '0' })]
      const appearances = [app({ playerID: 'pshape01', teamID: 'NYN', lgID: 'NL', G_p: '35' })]

      const result = qualifyPlayers(batting, appearances, pitching, 162, 'NL', 1980)
      const p = result.pitchers[0]

      expect(p).toEqual({
        playerID: 'pshape01',
        position: 'pitcher',
        stats: {
          AB: 60, H: 12, '2B': 2, '3B': 0, HR: 1,
          BB: 3, SO: 25, HBP: 0, SF: 1, SH: 8, GIDP: 0
        }
      })
    })
  })
})
