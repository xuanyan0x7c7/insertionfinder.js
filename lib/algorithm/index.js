const {twistString, transformTwist, parseAlgorithmString} = require('./pattern')
const {rotationPermutationTable, inverseCenterTable, centerTransformTable} = require('../cube/center')

const inverseTwistTable = [
  0, 3, 2, 1,
  4, 7, 6, 5,
  8, 11, 10, 9,
  12, 15, 14, 13,
  16, 19, 18, 17,
  20, 23, 22, 21
]

const rotationString = [
  '', 'y', 'y2', "y'",
  'x', 'x y', 'x y2', "x y'",
  'x2', 'x2 y', 'z2', "x2 y'",
  "x'", "x' y", "x' y2", "x' y'",
  'z', 'z y', 'z y2', "z y'",
  "z'", "z' y", "z' y2", "z' y'"
]

class InvalidAlgorithmStringError extends Error {
  constructor(...args) {
    super(...args)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  get name() {
    return this.constructor.name
  }
}

class Algorithm {
  constructor(string) {
    const result = parseAlgorithmString(string)
    if (!result) {
      throw new InvalidAlgorithmStringError(string)
    }
    this.twists = result.twists
    this.rotation = result.rotation
    this.inverseTwists = result.inverseTwists
    this.inverseRotation = result.inverseRotation
    this.inversed = result.inversed
  }

  get length() {
    return this.twists.length
  }

  toString() {
    return [
      ...this.twists.map(twist => twistString[twist]),
      ...this.rotation ? [rotationString[this.rotation]] : []
    ].join(' ')
  }

  clearFlags(placement = 0) {
    const rotation = this.inversed ? this.rotation : this.inverseRotation
    const permutation = rotationPermutationTable[
      centerTransformTable[centerTransformTable[rotation][placement]][inverseCenterTable[rotation]]
    ]
    const transform = [permutation[0], permutation[2], permutation[4]]
    this.twists.push(...this.inverseTwists.map(
      twist => transformTwist(transform, inverseTwistTable[twist])
    ).reverse())
    this.rotation = 0
    this.inverseTwists = []
    this.inverseRotation = 0
    this.inversed = false
    this.cancelMoves()
  }

  cancelMoves() {
    const twists = this.twists
    const length = twists.length
    const stacks = twists.map(() => [])
    const marks = twists.map(() => 2)
    let y = -1
    for (let x = 0; x < length; ++x) {
      if (y < 0 || twists[x] >>> 3 !== twists[y] >>> 3) {
        twists[++y] = twists[x]
        stacks[y].push(x)
      } else if (twists[x] >>> 2 === twists[y] >>> 2) {
        const orientation = twists[x] + twists[y] & 3
        if (orientation === 0) {
          stacks[y--] = []
        } else {
          twists[y] = twists[y] & ~3 | orientation
          stacks[y].push(x)
        }
      } else if (y > 0 && twists[y - 1] >>> 3 === twists[y] >>> 3) {
        const orientation = twists[x] + twists[y - 1] & 3
        if (orientation === 0) {
          twists[y - 1] = twists[y]
          stacks[y - 1] = stacks[y]
          stacks[y--] = []
        } else {
          twists[y - 1] = twists[y - 1] & ~3 | orientation
          stacks[y - 1].push(x)
        }
      } else {
        twists[++y] = twists[x]
        stacks[y].push(x)
      }
    }
    twists.length = y + 1
    for (const list of stacks) {
      if (list.length === 1) {
        marks[list[0]] = 0
      } else {
        for (const x of list) {
          marks[x] = 1
        }
      }
    }
    return marks
  }

  normalize() {
    for (let i = 1; i < this.twists.length; ++i) {
      if (this.twists[i - 1] >>> 3 === this.twists[i] >>> 3 && this.twists[i - 1] > this.twists[i]) {
        [this.twists[i - 1], this.twists[i]] = [this.twists[i], this.twists[i - 1]]
        ++i
      }
    }
  }
}

exports = module.exports = Algorithm
Object.assign(exports, {InvalidAlgorithmStringError})
