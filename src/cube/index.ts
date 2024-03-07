import Algorithm from '../algorithm';
import {
  centerCycleTable,
  centerTransformTable,
  inverseCenterTable,
  rotationCornerTable,
  rotationEdgeTable,
  rotationPermutationTable,
} from './center';
import { cornerFacelets, edgeFacelets } from './facelet';
import { cornerTwistTable, edgeTwistTable } from './twist';

export default class Cube {
  private static twistCubes = Cube.generateTwistCubes();
  private static rotationCubes = Cube.generateRotationCubes();
  private corners = [0, 3, 6, 9, 12, 15, 18, 21];
  private edges = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  private _placement = 0;

  static fromCubieCube(corners: number[], edges: number[], placement: number) {
    const cube = new Cube();
    cube.corners = corners.slice();
    cube.edges = edges.slice();
    cube._placement = placement;
    return cube;
  }

  private static generateTwistCubes() {
    const twistCubes: Cube[] = [];
    for (let i = 0; i < 24; ++i) {
      const cube = new Cube();
      cube.corners = cornerTwistTable[i].slice();
      cube.edges = edgeTwistTable[i].slice();
      twistCubes.push(cube);
    }
    return twistCubes;
  }

  private static generateRotationCubes() {
    const basicRotationCubes: Cube[] = [];
    for (let i = 0; i < 4; ++i) {
      const cube = new Cube();
      cube.corners = rotationCornerTable[i].slice();
      cube.edges = rotationEdgeTable[i].slice();
      basicRotationCubes.push(cube);
    }
    const rotationCubes = [];
    for (let i = 0; i < 24; ++i) {
      rotationCubes.push(new Cube());
    }
    for (let front = 0; front < 4; ++front) {
      rotationCubes[front | 4].twist(basicRotationCubes[1]);
    }
    for (let front = 0; front < 4; ++front) {
      rotationCubes[front | 8].twist(basicRotationCubes[1]);
      rotationCubes[front | 8].twist(basicRotationCubes[1]);
    }
    for (let front = 0; front < 4; ++front) {
      rotationCubes[front | 12].twist(basicRotationCubes[1]);
      rotationCubes[front | 12].twist(basicRotationCubes[1]);
      rotationCubes[front | 12].twist(basicRotationCubes[1]);
    }
    for (let front = 0; front < 4; ++front) {
      rotationCubes[front | 16].twist(basicRotationCubes[3]);
    }
    for (let front = 0; front < 4; ++front) {
      rotationCubes[front | 20].twist(basicRotationCubes[3]);
      rotationCubes[front | 20].twist(basicRotationCubes[3]);
      rotationCubes[front | 20].twist(basicRotationCubes[3]);
    }
    for (let top = 0; top < 6; ++top) {
      for (let front = 1; front < 4; ++front) {
        for (let i = 0; i < front; ++i) {
          rotationCubes[top << 2 | front].twist(basicRotationCubes[2]);
        }
      }
    }
    for (let placement = 0; placement < 24; ++placement) {
      rotationCubes[placement]._placement = placement;
    }
    return rotationCubes;
  }

  get placement() {
    return this._placement;
  }

  getRawCorners() {
    return this.corners.slice();
  }

  getRawEdges() {
    return this.edges.slice();
  }

  clone() {
    const cube = new Cube();
    cube.corners = this.corners.slice();
    cube.edges = this.edges.slice();
    cube._placement = this._placement;
    return cube;
  }

  isSolved() {
    const cube = this.clone();
    cube.rotate(inverseCenterTable[this._placement]);
    for (let i = 0; i < 8; ++i) {
      if (cube.corners[i] !== i * 3) {
        return false;
      }
    }
    for (let i = 0; i < 12; ++i) {
      if (cube.edges[i] !== i * 2) {
        return false;
      }
    }
    return true;
  }

  twist(item: Algorithm | Cube | number, { corners = true, edges = true, centers = true } = {}) {
    if (item instanceof Algorithm) {
      for (const twist of item.twists) {
        this.twist(Cube.twistCubes[twist], { corners, edges, centers });
      }
      this.rotate(item.rotation);
      if (item.inverseTwists.length || item.inverseRotation) {
        this.inverse();
        for (const twist of item.inverseTwists) {
          this.twist(Cube.twistCubes[twist], { corners, edges, centers });
        }
        this.rotate(item.inverseRotation);
        this.inverse();
      }
      if (item.inversed) {
        this.inverse();
      }
    } else if (item instanceof Cube) {
      if (this === item) {
        if (corners) {
          const newCorners = new Array<number>(8);
          for (let i = 0; i < 8; ++i) {
            const transform = this.corners[Math.floor(this.corners[i] / 3)];
            newCorners[i] = transform - transform % 3 + (this.corners[i] + transform) % 3;
          }
          this.corners = newCorners;
        }
        if (edges) {
          const newEdges = new Array<number>(12);
          for (let i = 0; i < 12; ++i) {
            newEdges[i] = this.edges[this.edges[i] >>> 1] ^ this.edges[i] & 1;
          }
          this.edges = newEdges;
        }
        if (centers) {
          this._placement = centerTransformTable[this._placement][this._placement];
        }
      } else {
        if (corners) {
          for (let i = 0; i < 8; ++i) {
            const transform = item.corners[Math.floor(this.corners[i] / 3)];
            this.corners[i] = transform - transform % 3 + (this.corners[i] + transform) % 3;
          }
        }
        if (edges) {
          for (let i = 0; i < 12; ++i) {
            this.edges[i] = item.edges[this.edges[i] >>> 1] ^ this.edges[i] & 1;
          }
        }
        if (centers) {
          this._placement = centerTransformTable[this._placement][item._placement];
        }
      }
    } else {
      this.twist(Cube.twistCubes[item], { corners: true, edges: true });
    }
  }

  rotate(rotation: number) {
    if (rotation === 0) {
      return;
    }
    this.twist(Cube.rotationCubes[rotation]);
  }

  inverse() {
    const corners = new Array<number>(8);
    for (let i = 0; i < 8; ++i) {
      const item = this.corners[i];
      corners[Math.floor(item / 3)] = i * 3 + (24 - item) % 3;
    }
    this.corners = corners;
    const edges = new Array<number>(12);
    for (let i = 0; i < 12; ++i) {
      const item = this.edges[i];
      edges[item >>> 1] = i << 1 | item & 1;
    }
    this.edges = edges;
    this._placement = inverseCenterTable[this._placement];
  }

  hasParity() {
    const visited = new Array<boolean>(8).fill(false);
    let parity = false;
    for (let x = 0; x < 8; ++x) {
      if (!visited[x]) {
        parity = !parity;
        let y = x;
        do {
          visited[y] = true;
          y = Math.floor(this.corners[y] / 3);
        } while (y !== x);
      }
    }
    return parity;
  }

  getCornerStatus() {
    const visited = new Array<boolean>(8).fill(false);
    const list = [];
    for (let x = 0; x < 8; ++x) {
      if (!visited[x]) {
        let length = 0;
        let orientation = 0;
        let y = x;
        do {
          visited[y] = true;
          ++length;
          orientation += this.corners[y];
          y = Math.floor(this.corners[y] / 3);
        } while (y !== x);
        orientation %= 3;
        if (length > 1 || orientation) {
          list.push({ length, orientation });
        }
      }
    }
    return list.sort((x, y) => {
      if (x.length === y.length) {
        return x.orientation - y.orientation;
      } else {
        return x.length - y.length;
      }
    });
  }

  getCornerCycles() {
    const visited = new Array<boolean>(8).fill(false);
    const smallCycles = [0, 0, 0, 0, 0, 0, 0];
    let cycles = 0;
    let parity = false;
    for (let x = 0; x < 8; ++x) {
      if (!visited[x]) {
        let length = -1;
        let orientation = 0;
        let y = x;
        do {
          visited[y] = true;
          ++length;
          orientation += this.corners[y];
          y = Math.floor(this.corners[y] / 3);
        } while (y !== x);
        cycles += length >>> 1;
        orientation %= 3;
        if (length === 0 && orientation) {
          ++smallCycles[orientation - 1];
        } else if ((length & 1) === 0 && orientation) {
          ++smallCycles[orientation + 1];
        } else if (length & 1) {
          parity = !parity;
          ++cycles;
          ++smallCycles[orientation + 4];
        }
      }
    }
    if (parity) {
      --cycles;
      if (smallCycles[4]) {
        --smallCycles[4];
      } else if (smallCycles[5] < smallCycles[6]) {
        --smallCycles[6];
        ++smallCycles[3];
      } else {
        --smallCycles[5];
        ++smallCycles[2];
      }
    }
    if (smallCycles[5] < smallCycles[6]) {
      smallCycles[3] += smallCycles[4] & 1;
      smallCycles[2] += smallCycles[6] - smallCycles[5] >>> 1;
    } else {
      smallCycles[2] += smallCycles[4] & 1;
      smallCycles[3] += smallCycles[5] - smallCycles[6] >>> 1;
    }
    const x = smallCycles[0] + smallCycles[2];
    const y = smallCycles[1] + smallCycles[3];
    cycles += Math.floor(x / 3) + Math.floor(y / 3) << 1;
    const twists = x % 3;
    return cycles + twists + Number(smallCycles[2] + smallCycles[3] < twists);
  }

  getEdgeStatus() {
    const visited = new Array<boolean>(12).fill(false);
    const list: { length: number; flip: number }[] = [];
    for (let x = 0; x < 12; ++x) {
      if (!visited[x]) {
        let length = 0;
        let flip = 0;
        let y = x;
        do {
          visited[y] = true;
          ++length;
          flip ^= this.edges[y] & 1;
          y = this.edges[y] >>> 1;
        } while (y !== x);
        if (length > 1 || flip) {
          list.push({ length, flip });
        }
      }
    }
    return list.sort((x, y) => {
      if (x.length === y.length) {
        return x.flip - y.flip;
      } else {
        return x.length - y.length;
      }
    });
  }

  getEdgeCycles() {
    const visited = new Array(12).fill(false);
    const smallCycles = [0, 0, 0];
    let cycles = 0;
    let parity = false;
    for (let x = 0; x < 12; ++x) {
      if (!visited[x]) {
        let length = -1;
        let flip = 0;
        let y = x;
        do {
          visited[y] = true;
          ++length;
          flip ^= this.edges[y] & 1;
          y = this.edges[y] >>> 1;
        } while (y !== x);
        cycles += length >>> 1;
        if (length & 1) {
          parity = !parity;
          ++cycles;
        }
        if (flip) {
          if (length === 0) {
            ++smallCycles[0];
          } else if (length & 1) {
            smallCycles[2] ^= 1;
          } else {
            ++smallCycles[1];
          }
        }
      }
    }
    smallCycles[1] += smallCycles[2];
    if (smallCycles[0] < smallCycles[1]) {
      cycles += smallCycles[0] + smallCycles[1] >>> 1;
    } else {
      const flipCycles = [0, 2, 3, 5, 6, 8, 9];
      cycles += smallCycles[1] + flipCycles[smallCycles[0] - smallCycles[1] >>> 1];
    }
    return cycles - Number(parity);
  }

  getCenterCycles() {
    return centerCycleTable[this._placement];
  }

  getBestPlacement() {
    let bestCube = null;
    let bestCycles = 20;
    for (const index of [
      0,
      2, 8, 10,
      5, 7, 13, 15, 17, 19, 21, 23,
      1, 3, 4, 12, 16, 20,
      6, 9, 11, 14, 18, 22,
    ]) {
      const cube = this.clone();
      cube.rotate(inverseCenterTable[cube._placement]);
      cube.rotate(index);
      let cycles = cube.getCornerCycles() + cube.getEdgeCycles();
      if (centerCycleTable[index] <= 1) {
        cycles += Number(cube.hasParity());
      }
      if (cycles + centerCycleTable[index] < bestCycles) {
        bestCube = cube;
        bestCycles = cycles + centerCycleTable[index];
        if (cycles <= 4) {
          return bestCube;
        }
      }
    }
    return bestCube!;
  }

  getEdgeOrientationStatus() {
    const cube = this.clone();
    cube.rotate(inverseCenterTable[this._placement]);
    const cubeUD = new Cube();
    cubeUD.rotate(4);
    cubeUD.twist(cube);
    cubeUD.rotate(inverseCenterTable[4]);
    const cubeRL = new Cube();
    cubeRL.rotate(1);
    cubeRL.twist(cube);
    cubeRL.rotate(inverseCenterTable[1]);
    const cubeFB = cube.clone();
    const result: number[] = [];
    if (cubeUD.isEdgeOrientationSolved()) {
      result.push(0);
    }
    if (cubeRL.isEdgeOrientationSolved()) {
      result.push(2);
    }
    if (cubeFB.isEdgeOrientationSolved()) {
      result.push(4);
    }
    return result
      .map(item => rotationPermutationTable[this._placement][item])
      .sort()
      .map(item => (['UD', 'RL', 'FB'] as const)[item >>> 1]);
  }

  getDominoReductionStatus() {
    const cube = this.clone();
    cube.rotate(inverseCenterTable[this._placement]);
    const cubeUD = cube.clone();
    const cubeRL = new Cube();
    cubeRL.rotate(16);
    cubeRL.twist(cube);
    cubeRL.rotate(inverseCenterTable[16]);
    const cubeFB = new Cube();
    cubeFB.rotate(4);
    cubeFB.twist(cube);
    cubeFB.rotate(inverseCenterTable[4]);
    const result: number[] = [];
    if (cubeUD.isDominoReductionSolved()) {
      result.push(0);
    }
    if (cubeRL.isDominoReductionSolved()) {
      result.push(2);
    }
    if (cubeFB.isDominoReductionSolved()) {
      result.push(4);
    }
    return result
      .map(item => rotationPermutationTable[this._placement][item])
      .sort()
      .map(item => (['UD', 'RL', 'FB'] as const)[item >>> 1]);
  }

  isHalfTurnReductionSolved() {
    if (this.hasParity()) {
      return false;
    }
    const facelet = [...this.toFaceletString()]
      .map(c => ({ U: 0, D: 1, R: 2, L: 3, F: 4, B: 5 }[c]!));
    for (let i = 0; i < 6; ++i) {
      for (let j = 0; j < 9; ++j) {
        if ((facelet[j] ^ facelet[4]) & ~1) {
          return false;
        }
      }
    }
    if ([0, 2, 6, 8].filter(i => facelet[i] === facelet[0]).length % 2 === 1) {
      return false;
    }
    if ([18, 20, 27, 29].filter(i => facelet[i] === facelet[18]).length % 2 === 1) {
      return false;
    }
    return true;
  }

  toFaceletString() {
    const offset: Record<string, number> = { U: 0, D: 1, R: 2, L: 3, F: 4, B: 5 };
    const list = new Array<string>(54);
    for (let i = 0; i < 8; ++i) {
      const permutation = Math.floor(this.corners[i] / 3);
      const orientation = this.corners[i] % 3;
      for (let j = 0; j < 3; ++j) {
        const position = cornerFacelets[permutation][(orientation + j) % 3];
        list[offset[position[0]] * 9 + Number.parseInt(position[1])] = cornerFacelets[i][j][0];
      }
    }
    for (let i = 0; i < 12; ++i) {
      const permutation = this.edges[i] >>> 1;
      const orientation = this.edges[i] & 1;
      for (let j = 0; j < 2; ++j) {
        const position = edgeFacelets[permutation][orientation ^ j];
        list[offset[position[0]] * 9 + Number.parseInt(position[1])] = edgeFacelets[i][j][0];
      }
    }
    const table = rotationPermutationTable[inverseCenterTable[this._placement]];
    for (let i = 0; i < 6; ++i) {
      list[i * 9 + 4] = 'UDRLFB'[table[i]];
    }
    return list.join('');
  }

  private isEdgeOrientationSolved() {
    if (this._placement !== 0) {
      return false;
    }
    return this.edges.every(item => (item & 1) === 0);
  }

  private isDominoReductionSolved() {
    if (this._placement !== 0) {
      return false;
    }
    for (let i = 0; i < 8; ++i) {
      if (this.corners[i] % 3 !== 0) {
        return false;
      }
    }
    for (let i = 0; i < 8; ++i) {
      if ((this.edges[i] & 1) !== 0 || this.edges[i] >= 16) {
        return false;
      }
    }
    for (let i = 8; i < 12; ++i) {
      if ((this.edges[i] & 1) !== 0) {
        return false;
      }
    }
    return true;
  }
}
