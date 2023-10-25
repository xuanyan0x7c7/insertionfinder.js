import { rotationPermutationTable, inverseCenterTable, centerTransformTable } from '../cube/center';
import { twistString, transformTwist, parseAlgorithmString } from './pattern';

const inverseTwistTable = [
  0, 3, 2, 1,
  4, 7, 6, 5,
  8, 11, 10, 9,
  12, 15, 14, 13,
  16, 19, 18, 17,
  20, 23, 22, 21,
];

const rotationString = [
  '', 'y', 'y2', "y'",
  'x', 'x y', 'x y2', "x y'",
  'x2', 'x2 y', 'z2', "x2 y'",
  "x'", "x' y", "x' y2", "x' y'",
  'z', 'z y', 'z y2', "z y'",
  "z'", "z' y", "z' y2", "z' y'",
];

export class InvalidAlgorithmStringError extends Error {
  constructor(message: string) {
    super(message);
    Error.captureStackTrace?.(this, this.constructor);
  }

  get name() {
    return this.constructor.name;
  }
}

export default class Algorithm {
  private _twists: number[];
  private _rotation: number;
  private _inverseTwists: number[];
  private _inverseRotation: number;
  private _inversed: boolean;

  constructor(string: string) {
    const result = parseAlgorithmString(string);
    if (result == null) {
      throw new InvalidAlgorithmStringError(string);
    }
    this._twists = result.twists;
    this._rotation = result.rotation;
    this._inverseTwists = result.inverseTwists;
    this._inverseRotation = result.inverseRotation;
    this._inversed = result.inversed;
  }

  get twists(): readonly number[] {
    return this._twists;
  }

  get rotation() {
    return this._rotation;
  }

  get inverseTwists(): readonly number[] {
    return this._inverseTwists;
  }

  get inverseRotation() {
    return this._inverseRotation;
  }

  get inversed() {
    return this._inversed;
  }

  get length() {
    return this._twists.length;
  }

  toString() {
    return [
      ...this._twists.map(twist => twistString[twist]),
      ...this._rotation ? [rotationString[this._rotation]] : [],
    ].join(' ');
  }

  clearFlags(placement = 0) {
    const rotation = this._inversed ? this._rotation : this._inverseRotation;
    const permutation = rotationPermutationTable[
      centerTransformTable[centerTransformTable[rotation][this.inversed ? placement : inverseCenterTable[placement]]][inverseCenterTable[rotation]]
    ];
    const transform = [permutation[0], permutation[2], permutation[4]];
    this._twists.push(...this._inverseTwists.map(
      twist => transformTwist(transform, inverseTwistTable[twist]),
    ).reverse());
    this._rotation = 0;
    this._inverseTwists = [];
    this._inverseRotation = 0;
    this._inversed = false;
    this.cancelMoves();
  }

  cancelMoves() {
    const twists = this._twists;
    const length = twists.length;
    const stacks = twists.map<number[]>(() => []);
    const marks = twists.map(() => 2);
    let y = -1;
    for (let x = 0; x < length; ++x) {
      if (y < 0 || twists[x] >>> 3 !== twists[y] >>> 3) {
        twists[++y] = twists[x];
        stacks[y].push(x);
      } else if (twists[x] >>> 2 === twists[y] >>> 2) {
        const orientation = twists[x] + twists[y] & 3;
        if (orientation === 0) {
          stacks[y--] = [];
        } else {
          twists[y] = twists[y] & ~3 | orientation;
          stacks[y].push(x);
        }
      } else if (y > 0 && twists[y - 1] >>> 3 === twists[y] >>> 3) {
        const orientation = twists[x] + twists[y - 1] & 3;
        if (orientation === 0) {
          twists[y - 1] = twists[y];
          stacks[y - 1] = stacks[y];
          stacks[y--] = [];
        } else {
          twists[y - 1] = twists[y - 1] & ~3 | orientation;
          stacks[y - 1].push(x);
        }
      } else {
        twists[++y] = twists[x];
        stacks[y].push(x);
      }
    }
    twists.length = y + 1;
    for (const list of stacks) {
      if (list.length === 1) {
        marks[list[0]] = 0;
      } else {
        for (const x of list) {
          marks[x] = 1;
        }
      }
    }
    return marks;
  }

  normalize() {
    const twists = this._twists;
    for (let i = 1; i < twists.length; ++i) {
      if (twists[i - 1] >>> 3 === twists[i] >>> 3 && twists[i - 1] > twists[i]) {
        [twists[i - 1], twists[i]] = [twists[i], twists[i - 1]];
        ++i;
      }
    }
  }
}
