const {rotationPermutationTable} = require('../cube/center')

const twistString = [
  '', 'U', 'U2', "U'",
  '', 'D', 'D2', "D'",
  '', 'R', 'R2', "R'",
  '', 'L', 'L2', "L'",
  '', 'F', 'F2', "F'",
  '', 'B', 'B2', "B'"
]

const twistStringNormalizeTable = {
  '2Uw': 'Uw',
  '2Uw2': 'Uw2',
  "2Uw'": "Uw'",
  '2Dw': 'Dw',
  '2Dw2': 'Dw2',
  "2Dw'": "Dw'",
  '2Rw': 'Rw',
  '2Rw2': 'Rw2',
  "2Rw'": "Rw'",
  '2Lw': 'Lw',
  '2Lw2': 'Lw2',
  "2Lw'": "Lw'",
  '2Fw': 'Fw',
  '2Fw2': 'Fw2',
  "2Fw'": "Fw'",
  '2Bw': 'Bw',
  '2Bw2': 'Bw2',
  "2Bw'": "Bw'"
}

const patternTable = {
  x: {transform: [4, 2, 1]},
  x2: {transform: [1, 2, 5]},
  "x'": {transform: [5, 2, 0]},
  y: {transform: [0, 5, 2]},
  y2: {transform: [0, 3, 5]},
  "y'": {transform: [0, 4, 3]},
  z: {transform: [3, 0, 4]},
  z2: {transform: [1, 3, 4]},
  "z'": {transform: [2, 1, 4]},
  Uw: {transform: [0, 5, 2], additionalTwist: 5},
  Uw2: {transform: [0, 3, 5], additionalTwist: 6},
  "Uw'": {transform: [0, 4, 3], additionalTwist: 7},
  Dw: {transform: [0, 4, 3], additionalTwist: 1},
  Dw2: {transform: [0, 3, 5], additionalTwist: 2},
  "Dw'": {transform: [0, 5, 2], additionalTwist: 3},
  Rw: {transform: [4, 2, 1], additionalTwist: 13},
  Rw2: {transform: [1, 2, 5], additionalTwist: 14},
  "Rw'": {transform: [5, 2, 0], additionalTwist: 15},
  Lw: {transform: [5, 2, 0], additionalTwist: 9},
  Lw2: {transform: [1, 2, 5], additionalTwist: 10},
  "Lw'": {transform: [4, 2, 1], additionalTwist: 11},
  Fw: {transform: [3, 0, 4], additionalTwist: 21},
  Fw2: {transform: [1, 3, 4], additionalTwist: 22},
  "Fw'": {transform: [2, 1, 4], additionalTwist: 23},
  Bw: {transform: [2, 1, 4], additionalTwist: 17},
  Bw2: {transform: [1, 3, 4], additionalTwist: 18},
  "Bw'": {transform: [3, 0, 4], additionalTwist: 19}
}

function transformTwist(transform, twist) {
  return transform[twist >> 3] << 2 ^ twist & 7
}

function parseString(string) {
  const regex = /(?:\s*((?:2?[UDRLFB]w|[UDRLFB])[2']?|[xyz][2']?)\s*)/
  string = string.trim()
  const twists = []
  while (string) {
    const result = regex.exec(string)
    if (!result || result.index) {
      return null
    }
    twists.push(twistStringNormalizeTable[result[1]] || result[1])
    string = string.slice(result[0].length)
  }
  return twists
}

function parseTwists(twists) {
  const result = []
  let transform = [0, 2, 4]
  for (const s of twists) {
    const pattern = patternTable[s]
    if (pattern) {
      if (pattern.additionalTwist) {
        result.push(transformTwist(transform, pattern.additionalTwist))
      }
      const newTransform = new Array(3)
      for (let i = 0; i < 3; ++i) {
        const temp = pattern.transform[i]
        newTransform[i] = transform[temp >>> 1] ^ temp & 1
      }
      transform = newTransform
    } else {
      const twist = twistString.indexOf(s)
      result.push(transformTwist(transform, twist))
    }
  }
  const rotation = rotationPermutationTable.findIndex(table => table[transform[0]] === 0 && table[transform[1]] === 2)
  return {twists: result, rotation}
}

function parseAlgorithmString(string) {
  let twists; let inverseTwists; let inversed
  if (string.includes('(')) {
    const result = parseBrackets(string)
    if (!result) {
      return null
    }
    twists = result.twists
    inverseTwists = result.inverseTwists
    inversed = string.trim().slice(-1) === ')'
  } else {
    const result = parseNISS(string)
    if (!result) {
      return null
    }
    twists = result.twists
    inverseTwists = result.inverseTwists
    inversed = string.split(/NISS/i).length % 2 === 0
  }
  const result = parseTwists(twists)
  const inverseResult = parseTwists(inverseTwists)
  return {
    twists: result.twists,
    rotation: result.rotation,
    inverseTwists: inverseResult.twists,
    inverseRotation: inverseResult.rotation,
    inversed
  }
}

function parseNISS(string) {
  const twists = []
  const inverseTwists = []
  const splits = string.split(/NISS/i)
  for (let index = 0; index < splits.length; ++index) {
    const parseResult = parseString(splits[index])
    if (!parseResult) {
      return null
    }
    if (index & 1) {
      inverseTwists.push(...parseResult)
    } else {
      twists.push(...parseResult)
    }
  }
  return {twists, inverseTwists}
}

function parseBrackets(string) {
  const twists = []
  const inverseTwists = []
  while (string) {
    const begin = string.indexOf('(')
    if (begin === -1) {
      const parseResult = parseString(string)
      if (!parseResult) {
        return null
      }
      twists.push(...parseResult)
      break
    } else {
      let parseResult = parseString(string.slice(0, begin))
      if (!parseResult) {
        return null
      }
      twists.push(...parseResult)
      string = string.slice(begin + 1)
      const end = string.indexOf(')')
      if (end === -1) {
        return null
      }
      parseResult = parseString(string.slice(0, end))
      if (!parseResult) {
        return null
      }
      inverseTwists.push(...parseResult)
      string = string.slice(end + 1)
    }
  }
  return {twists, inverseTwists}
}

Object.assign(exports, {
  twistString, transformTwist,
  parseAlgorithmString
})
