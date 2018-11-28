import {twistString, parseAlgorithmString} from './pattern'

const rotationString = [
  '', 'y', 'y2', "y'",
  'x', 'x y', 'x y2', "x y'",
  'x2', 'x2 y', 'x2 y2', "x2 y'",
  "x'", "x' y", "x' y2", "x' y'",
  'z', 'z y', 'z y2', "z y'",
  "z'", "z' y", "z' y2", "z' y'"
]

export class InvalidAlgorithmStringError extends Error {
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

export default class Algorithm {
  constructor(string) {
    let {twists, rotation} = parseAlgorithmString(string)
    if (!twists) {
      throw new InvalidAlgorithmStringError(string)
    }
    this.twists = twists
    this.rotation = rotation
    this.cancelMoves()
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

  cancelMoves() {
    let twists = this.twists
    let length = twists.length
    let y = -1
    let index = length
    for (let x = 0; x < length; ++x) {
      if (y < 0 || twists[x] >>> 3 !== twists[y] >>> 3) {
        twists[++y] = twists[x]
      } else if (twists[x] >>> 2 === twists[y] >>> 2) {
        let orientation = twists[x] + twists[y] & 3
        if (orientation === 0) {
          --y
        } else {
          twists[y] = twists[y] & ~3 | orientation
        }
        if (index > y + 1) {
          index = y + 1
        }
      } else if (y > 0 && twists[y - 1] >>> 3 === twists[y] >>> 3) {
        if (index > y) {
          index = y
        }
        let orientation = twists[x] + twists[y - 1] & 3
        if (orientation === 0) {
          twists[y - 1] = twists[y]
          --y
        } else {
          twists[y - 1] = twists[y - 1] & 3 | orientation
        }
      } else {
        twists[++y] = twists[x]
      }
    }
    twists.length = y + 1
    return index
  }
}
