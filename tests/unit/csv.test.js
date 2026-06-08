import { describe, it, expect } from 'vitest'
import { parseCSV } from '../../scripts/lib/csv.js'

describe('parseCSV', () => {
  it('parses simple CSV into array of objects', () => {
    const text = 'name,age\nAlice,30\nBob,25'
    const result = parseCSV(text)
    expect(result).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' }
    ])
  })

  it('handles empty fields', () => {
    const text = 'playerID,HR,RBI\nfoo01,,10\nbar02,5,'
    const result = parseCSV(text)
    expect(result).toEqual([
      { playerID: 'foo01', HR: '', RBI: '10' },
      { playerID: 'bar02', HR: '5', RBI: '' }
    ])
  })

  it('handles quoted fields containing commas', () => {
    const text = 'name,note\nAlice,"hit, run"\nBob,ok'
    const result = parseCSV(text)
    expect(result).toEqual([
      { name: 'Alice', note: 'hit, run' },
      { name: 'Bob', note: 'ok' }
    ])
  })

  it('handles escaped quotes inside quoted fields', () => {
    const text = 'name,note\nAlice,"said ""hello"""\nBob,fine'
    const result = parseCSV(text)
    expect(result).toEqual([
      { name: 'Alice', note: 'said "hello"' },
      { name: 'Bob', note: 'fine' }
    ])
  })

  it('handles quoted fields containing newlines', () => {
    const text = 'name,note\nAlice,"line1\nline2"\nBob,ok'
    const result = parseCSV(text)
    expect(result).toEqual([
      { name: 'Alice', note: 'line1\nline2' },
      { name: 'Bob', note: 'ok' }
    ])
  })

  it('parses real Lahman batting data', () => {
    const text = [
      'playerID,yearID,stint,teamID,lgID,G,AB,R,H,2B,3B,HR,RBI,SB,CS,BB,SO,IBB,HBP,SH,SF,GIDP',
      'ortMDa01,2007,1,BOS,AL,149,497,116,171,52,1,35,117,3,1,73,103,18,6,0,9,10'
    ].join('\n')
    const result = parseCSV(text)
    expect(result).toHaveLength(1)
    expect(result[0].playerID).toBe('ortMDa01')
    expect(result[0].yearID).toBe('2007')
    expect(result[0].HR).toBe('35')
    expect(result[0]['2B']).toBe('52')
  })

  it('returns empty array for header-only input', () => {
    const text = 'name,age'
    expect(parseCSV(text)).toEqual([])
  })

  it('handles Windows-style line endings', () => {
    const text = 'name,age\r\nAlice,30\r\nBob,25'
    const result = parseCSV(text)
    expect(result).toEqual([
      { name: 'Alice', age: '30' },
      { name: 'Bob', age: '25' }
    ])
  })

  it('handles trailing newline', () => {
    const text = 'name,age\nAlice,30\n'
    const result = parseCSV(text)
    expect(result).toEqual([{ name: 'Alice', age: '30' }])
  })
})
