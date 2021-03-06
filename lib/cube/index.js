const {generateTwistCubes} = require('./twist')
const {
  centerCycleTable, rotationPermutationTable, inverseCenterTable,
  centerTransformTable, generateRotationCubes
} = require('./center')
const {cornerFacelets, edgeFacelets} = require('./facelet')
const Algorithm = require('../algorithm')

let twistCubes = []
let rotationCubes = []

class Cube {
  constructor() {
    this.corners = [0, 3, 6, 9, 12, 15, 18, 21]
    this.edges = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]
    this.placement = 0
  }

  clone() {
    const cube = new Cube()
    cube.corners = this.corners.slice()
    cube.edges = this.edges.slice()
    cube.placement = this.placement
    return cube
  }

  twist(item, {corners = true, edges = true, centers = true} = {}) {
    if (item instanceof Algorithm) {
      for (const twist of item.twists) {
        this.twist(twistCubes[twist], {corners, edges, centers})
      }
      this.rotate(item.rotation)
      if (item.inverseTwists.length || item.inverseRotation) {
        this.inverse()
        for (const twist of item.inverseTwists) {
          this.twist(twistCubes[twist], {corners, edges, centers})
        }
        this.rotate(item.inverseRotation)
        this.inverse()
      }
      if (item.inversed) {
        this.inverse()
      }
    } else if (item instanceof Cube) {
      if (this === item) {
        if (corners) {
          const newCorners = new Array(8)
          for (let i = 0; i < 8; ++i) {
            const transform = this.corners[Math.floor(this.corners[i] / 3)]
            newCorners[i] = transform - transform % 3 + (this.corners[i] + transform) % 3
          }
          this.corners = newCorners
        }
        if (edges) {
          const newEdges = new Array(12)
          for (let i = 0; i < 12; ++i) {
            newEdges[i] = this.edges[this.edges[i] >>> 1] ^ this.edges[i] & 1
          }
          this.edges = newEdges
        }
        if (centers) {
          this.placement = centerTransformTable[this.placement][this.placement]
        }
      } else {
        if (corners) {
          for (let i = 0; i < 8; ++i) {
            const transform = item.corners[Math.floor(this.corners[i] / 3)]
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

  inverse() {
    const corners = new Array(8)
    for (let i = 0; i < 8; ++i) {
      const item = this.corners[i]
      corners[Math.floor(item / 3)] = i * 3 + (24 - item) % 3
    }
    this.corners = corners
    const edges = new Array(12)
    for (let i = 0; i < 12; ++i) {
      const item = this.edges[i]
      edges[item >>> 1] = i << 1 | item & 1
    }
    this.edges = edges
    this.placement = inverseCenterTable[this.placement]
  }

  hasParity() {
    const visited = new Array(8).fill(false)
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
    const visited = new Array(8).fill(false)
    const list = []
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
    const visited = new Array(8).fill(false)
    const smallCycles = [0, 0, 0, 0, 0, 0, 0]
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
    const x = smallCycles[0] + smallCycles[2]
    const y = smallCycles[1] + smallCycles[3]
    cycles += Math.floor(x / 3) + Math.floor(y / 3) << 1
    const twists = x % 3
    return cycles + twists + (smallCycles[2] + smallCycles[3] < twists)
  }

  getEdgeStatus() {
    const visited = new Array(12).fill(false)
    const list = []
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
        return x.flip - y.flip
      } else {
        return x.length - y.length
      }
    })
  }

  getEdgeCycles() {
    const visited = new Array(12).fill(false)
    const smallCycles = [0, 0, 0]
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
    let bestCube = null
    let bestCycles = 20
    for (const index of [
      0,
      2, 8, 10,
      5, 7, 13, 15, 17, 19, 21, 23,
      1, 3, 4, 12, 16, 20,
      6, 9, 11, 14, 18, 22
    ]) {
      const cube = this.clone()
      cube.rotate(inverseCenterTable[cube.placement])
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

  toFaceletString() {
    const offset = {U: 0, D: 1, R: 2, L: 3, F: 4, B: 5}
    const list = new Array(54)
    for (let i = 0; i < 8; ++i) {
      const permutation = Math.floor(this.corners[i] / 3)
      const orientation = this.corners[i] % 3
      for (let j = 0; j < 3; ++j) {
        const position = cornerFacelets[permutation][(orientation + j) % 3]
        list[offset[position[0]] * 9 + Number.parseInt(position[1])] = cornerFacelets[i][j][0]
      }
    }
    for (let i = 0; i < 12; ++i) {
      const permutation = this.edges[i] >>> 1
      const orientation = this.edges[i] & 1
      for (let j = 0; j < 2; ++j) {
        const position = edgeFacelets[permutation][orientation ^ j]
        list[offset[position[0]] * 9 + Number.parseInt(position[1])] = edgeFacelets[i][j][0]
      }
    }
    const table = rotationPermutationTable[inverseCenterTable[this.placement]]
    for (let i = 0; i < 6; ++i) {
      list[i * 9 + 4] = 'UDRLFB'[table[i]]
    }
    return list.join('')
  }
}

twistCubes = generateTwistCubes(Cube)
rotationCubes = generateRotationCubes(Cube)

module.exports = Cube
