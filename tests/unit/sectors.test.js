import { describe, it, expect } from 'vitest'
import { computeSectors } from '../../scripts/lib/sectors.js'

const ortiz2007 = {
  AB: 497, H: 171, '2B': 52, '3B': 1, HR: 35,
  BB: 73, SO: 103, HBP: 6, SF: 9, SH: 0
}

const leagueAvgSlg = 0.423

describe('computeSectors', () => {
  it('converts rates to degrees for David Ortiz 2007', () => {
    const sectors = computeSectors(ortiz2007, leagueAvgSlg)

    // PA = 497 + 73 + 6 + 9 + 0 = 585
    // 1B = 171 - 52 - 1 - 35 = 83
    // hr_rate = 35/585 ≈ 0.05983 → ~21.5°
    // 3b_rate = 1/585 ≈ 0.00171 → ~0.6° (floored to 2)
    // 2b_rate = 52/585 ≈ 0.08889 → ~32.0°
    // 1b_rate = 83/585 ≈ 0.14188 → ~51.1°
    // bb_rate = 79/585 ≈ 0.13504 → ~48.6°
    // so_rate = 103/585 ≈ 0.17607 → ~63.4°
    // out_rate ≈ 0.39658 → ~142.8°
    const sectorMap = Object.fromEntries(sectors.map(s => [s.number, s.size]))

    // HR sector 1
    expect(sectorMap[1]).toBeGreaterThanOrEqual(20)
    expect(sectorMap[1]).toBeLessThanOrEqual(24)

    // Double sector 11
    expect(sectorMap[11]).toBeGreaterThanOrEqual(30)
    expect(sectorMap[11]).toBeLessThanOrEqual(34)

    // Strikeout sector 10
    expect(sectorMap[10]).toBeGreaterThanOrEqual(61)
    expect(sectorMap[10]).toBeLessThanOrEqual(66)
  })

  it('applies minimum floor of 2 degrees for non-zero outcomes', () => {
    const sectors = computeSectors(ortiz2007, leagueAvgSlg)
    const sectorMap = Object.fromEntries(sectors.map(s => [s.number, s.size]))

    // Triples rate is tiny (~0.6°) but should be floored to 2
    expect(sectorMap[5]).toBeGreaterThanOrEqual(2)
  })

  it('total degrees always equals 360', () => {
    const sectors = computeSectors(ortiz2007, leagueAvgSlg)
    const total = sectors.reduce((sum, s) => sum + s.size, 0)
    expect(total).toBe(360)
  })

  it('splits singles 60/40 across sectors 7 and 13', () => {
    const sectors = computeSectors(ortiz2007, leagueAvgSlg)
    const sectorMap = Object.fromEntries(sectors.map(s => [s.number, s.size]))

    const totalSingles = sectorMap[7] + sectorMap[13]

    // Sector 7 should be ~60% of total singles
    expect(sectorMap[7]).toBe(Math.round(totalSingles * 0.6))

    // They must sum to the original single allocation
    expect(sectorMap[7] + sectorMap[13]).toBe(totalSingles)
  })

  it('distributes GB/FB outs using SLG-normalized estimation', () => {
    const sectors = computeSectors(ortiz2007, leagueAvgSlg)
    const sectorMap = Object.fromEntries(sectors.map(s => [s.number, s.size]))

    const gbSectors = [2, 6, 12]
    const fbSectors = [3, 4, 8, 14]

    const gbTotal = gbSectors.reduce((sum, n) => sum + sectorMap[n], 0)
    const fbTotal = fbSectors.reduce((sum, n) => sum + sectorMap[n], 0)

    // player_slg = (83 + 2*52 + 3*1 + 4*35) / 497 ≈ 0.621
    // slg_ratio = 0.621 / 0.423 ≈ 1.468
    // adjusted_gb_pct = 0.43 / 1.468 ≈ 0.293 → clamped to 0.30
    // fb_pct = 0.70
    // So FB should be more than GB for a power hitter like Ortiz
    expect(fbTotal).toBeGreaterThan(gbTotal)

    // GB sectors should be roughly even
    const gbSizes = gbSectors.map(n => sectorMap[n])
    const gbDiff = Math.max(...gbSizes) - Math.min(...gbSizes)
    expect(gbDiff).toBeLessThanOrEqual(1)

    // FB sectors should be roughly even
    const fbSizes = fbSectors.map(n => sectorMap[n])
    const fbDiff = Math.max(...fbSizes) - Math.min(...fbSizes)
    expect(fbDiff).toBeLessThanOrEqual(1)
  })

  it('omits sector 5 when player has zero triples', () => {
    const noTriples = { ...ortiz2007, '3B': 0 }
    const sectors = computeSectors(noTriples, leagueAvgSlg)
    const sectorNumbers = sectors.map(s => s.number)

    expect(sectorNumbers).not.toContain(5)

    // Total should still be 360
    const total = sectors.reduce((sum, s) => sum + s.size, 0)
    expect(total).toBe(360)
  })

  it('all sector sizes are positive integers', () => {
    const sectors = computeSectors(ortiz2007, leagueAvgSlg)
    for (const sector of sectors) {
      expect(Number.isInteger(sector.size)).toBe(true)
      expect(sector.size).toBeGreaterThan(0)
    }
  })

  it('returns sectors sorted by sector number', () => {
    const sectors = computeSectors(ortiz2007, leagueAvgSlg)
    for (let i = 1; i < sectors.length; i++) {
      expect(sectors[i].number).toBeGreaterThan(sectors[i - 1].number)
    }
  })

  it('handles a player with high triples and low power', () => {
    const speedster = {
      AB: 600, H: 180, '2B': 20, '3B': 15, HR: 3,
      BB: 40, SO: 80, HBP: 2, SF: 5, SH: 8
    }
    const sectors = computeSectors(speedster, leagueAvgSlg)
    const total = sectors.reduce((sum, s) => sum + s.size, 0)
    expect(total).toBe(360)

    const sectorMap = Object.fromEntries(sectors.map(s => [s.number, s.size]))
    // Should have a non-trivial triples sector
    expect(sectorMap[5]).toBeGreaterThanOrEqual(8)
  })
})
