import {generateTwistCubes} from './twist'
import {centerCycleTable, generateCenterTransformTable, generateRotationCubes} from './center'
import Algorithm from '../algorithm/index.mjs'

let twistCubes = []
let centerTransformTable = []
let rotationCubes = []

export default class Cube {
  constructor() {
    this.corners = [0, 3, 6, 9, 12, 15, 18, 21]
    this.edges = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]
    this.placement = 0
  }

  clone() {
    let cube = new Cube()
    cube.corners = this.corners.slice()
    cube.edges = this.edges.slice()
    cube.placement = this.placement
    return cube
  }

  twist(item, {corners = true, edges = true, centers = true} = {}) {
    if (item instanceof Algorithm) {
      for (let twist of item.twists) {
        this.twist(twistCubes[twist], {corners, edges, centers})
      }
      this.rotate(item.rotation)
    } else if (item instanceof Cube) {
      if (corners) {
        for (let i = 0; i < 8; ++i) {
          let transform = item.corners[Math.floor(this.corners[i] / 3)]
          this.corners[i] = transform - transform % 3 + (this.corners[i] + transform) % 3
        }
      }
      if (edges) {
        for (let i = 0; i < 12; ++i) {
          this.edges[i] = item.edges[this.edges[i] >>> 1] ^ this.edges[i] & 1
        }
      }
      if (centers) {
        this.placement = centerTransformTable[this.placement][item.placement]
      }
    } else {
      this.twist(twistCubes[item], {corners: true, edges: true})
    }
  }

  rotate(rotation) {
    if (rotation === 0) {
      return
    }
    this.twist(rotationCubes[rotation])
  }

  hasParity() {
    let visited = new Array(8).fill(false)
    let parity = false
    for (let x = 0; x < 8; ++x) {
      if (!visited[x]) {
        parity = !parity
        let y = x
        do {
          visited[y] = true
          y = Math.floor(this.corners[y] / 3)
        } while (y !== x)
      }
    }
    return parity
  }

  getCornerStatus() {
    let visited = new Array(8).fill(false)
    let list = []
    for (let x = 0; x < 8; ++x) {
      if (!visited[x]) {
        let length = 0
        let orientation = 0
        let y = x
        do {
          visited[y] = true
          ++length
          orientation += this.corners[y]
          y = Math.floor(this.corners[y] / 3)
        } while (y !== x)
        orientation %= 3
        if (length > 1 || orientation) {
          list.push({length, orientation})
        }
      }
    }
    return list.sort((x, y) => {
      if (x.length === y.length) {
        return x.orientation - y.orientation
      } else {
        return x.length - y.length
      }
    })
  }

  getCornerCycles() {
    let visited = new Array(8).fill(false)
    let smallCycles = [0, 0, 0, 0, 0, 0, 0]
    let cycles = 0
    let parity = false
    for (let x = 0; x < 8; ++x) {
      if (!visited[x]) {
        let length = -1
        let orientation = 0
        let y = x
        do {
          visited[y] = true
          ++length
          orientation += this.corners[y]
          y = Math.floor(this.corners[y] / 3)
        } while (y !== x)
        cycles += length >>> 1
        orientation %= 3
        if (length === 0 && orientation) {
          ++smallCycles[orientation - 1]
        } else if ((length & 1) === 0 && orientation) {
          ++smallCycles[orientation + 1]
        } else if (length & 1) {
          parity = !parity
          ++cycles
          ++smallCycles[orientation + 4]
        }
      }
    }
    if (parity) {
      --cycles
      if (smallCycles[4]) {
        --smallCycles[4]
      } else if (smallCycles[5] < smallCycles[6]) {
        --smallCycles[6]
        ++smallCycles[3]
      } else {
        --smallCycles[5]
        ++smallCycles[2]
      }
    }
    if (smallCycles[5] < smallCycles[6]) {
      smallCycles[3] += smallCycles[4] & 1
      smallCycles[2] += smallCycles[6] - smallCycles[5] >>> 1
    } else {
      smallCycles[2] += smallCycles[4] & 1
      smallCycles[3] += smallCycles[5] - smallCycles[6] >>> 1
    }
    let x = smallCycles[0] + smallCycles[2]
    let y = smallCycles[1] + smallCycles[3]
    cycles += Math.floor(x / 3) + Math.floor(y / 3) << 1
    let twists = x % 3
    return cycles + twists + (smallCycles[2] + smallCycles[3] < twists)
  }

  getEdgeStatus() {
    let visited = new Array(12).fill(false)
    let list = []
    for (let x = 0; x < 12; ++x) {
      if (!visited[x]) {
        let length = 0
        let flip = false
        let y = x
        do {
          visited[y] = true
          ++length
          flip ^= this.edges[y] & 1
          y = this.edges[y] >>> 1
        } while (y !== x)
        if (length > 1 || flip) {
          list.push({length, flip})
        }
      }
    }
    return list.sort((x, y) => {
      if (x.length === y.length) {
        return x.orientation - y.orientation
      } else {
        return x.length - y.length
      }
    })
  }

  getEdgeCycles() {
    let visited = new Array(12).fill(false)
    let smallCycles = [0, 0, 0]
    let cycles = 0
    let parity = false
    for (let x = 0; x < 12; ++x) {
      if (!visited[x]) {
        let length = -1
        let flip = false
        let y = x
        do {
          visited[y] = true
          ++length
          flip ^= this.edges[y] & 1
          y = this.edges[y] >>> 1
        } while (y !== x)
        cycles += length >>> 1
        if (length & 1) {
          parity = !parity
          ++cycles
        }
        if (flip) {
          if (length === 0) {
            ++smallCycles[0]
          } else if (length & 1) {
            smallCycles[2] ^= 1
          } else {
            ++smallCycles[1]
          }
        }
      }
    }
    smallCycles[1] += smallCycles[2]
    if (smallCycles[0] < smallCycles[1]) {
      cycles += smallCycles[0] + smallCycles[1] >>> 1
    } else {
      const flipCycles = [0, 2, 3, 5, 6, 8, 9]
      cycles += smallCycles[1] + flipCycles[smallCycles[0] - smallCycles[1] >>> 1]
    }
    return cycles - parity
  }

  getBestPlacement() {
    let bestCube = this.clone()
    let bestCycles = this.hasParity() + this.getCornerCycles() + this.getEdgeCycles()
    if (bestCycles <= 4) {
      return bestCube
    }
    for (let index of [
      2, 8, 10,
      5, 7, 13, 15, 17, 19, 21, 23,
      1, 3, 4, 12, 16, 20,
      6, 9, 11, 14, 18, 22
    ]) {
      let cube = this.clone()
      cube.rotate(index)
      let cycles = cube.getCornerCycles() + cube.getEdgeCycles()
      if (centerCycleTable[index] <= 1) {
        cycles += cube.hasParity()
      }
      if (cycles + centerCycleTable[index] < bestCycles) {
        bestCube = cube
        bestCycles = cycles + centerCycleTable[index]
        if (cycles <= 4) {
          return bestCube
        }
      }
    }
    return bestCube
  }
}

twistCubes = generateTwistCubes(Cube)
centerTransformTable = generateCenterTransformTable()
rotationCubes = generateRotationCubes(Cube)
