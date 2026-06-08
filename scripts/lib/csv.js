/**
 * Minimal CSV parser for Lahman database files.
 * Handles quoted fields, embedded commas, escaped quotes, and newlines within quotes.
 */

const parseLine = (text, start) => {
  const fields = []
  let i = start
  const len = text.length

  while (i < len) {
    if (text[i] === '"') {
      // quoted field
      i++ // skip opening quote
      let value = ''
      while (i < len) {
        if (text[i] === '"') {
          if (i + 1 < len && text[i + 1] === '"') {
            value += '"'
            i += 2
          } else {
            i++ // skip closing quote
            break
          }
        } else {
          value += text[i]
          i++
        }
      }
      fields.push(value)
      // skip comma or move to line end
      if (i < len && text[i] === ',') i++
    } else {
      // unquoted field - find next comma or line ending
      let end = i
      while (end < len && text[end] !== ',' && text[end] !== '\n' && text[end] !== '\r') {
        end++
      }
      fields.push(text.slice(i, end))
      i = end
      if (i < len && text[i] === ',') {
        i++
      } else {
        break
      }
    }
  }

  // skip line ending
  if (i < len && text[i] === '\r') i++
  if (i < len && text[i] === '\n') i++

  return { fields, next: i }
}

export const parseCSV = (text) => {
  if (!text || !text.trim()) return []

  // parse header row
  const { fields: headers, next } = parseLine(text, 0)
  const rows = []
  let pos = next

  while (pos < text.length) {
    // skip trailing newlines
    if (text[pos] === '\n' || text[pos] === '\r') {
      pos++
      continue
    }
    const { fields, next: nextPos } = parseLine(text, pos)
    if (fields.length === 1 && fields[0] === '') {
      pos = nextPos
      continue
    }
    const row = {}
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = i < fields.length ? fields[i] : ''
    }
    rows.push(row)
    pos = nextPos
  }

  return rows
}
