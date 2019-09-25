const centerCycleTable = [
  0, 2, 1, 2,
  2, 1, 3, 1,
  1, 3, 1, 3,
  2, 1, 3, 1,
  2, 1, 3, 1,
  2, 1, 3, 1
]

const rotationCornerTable = [
  [0, 3, 6, 9, 12, 15, 18, 21],
  [14, 1, 11, 22, 16, 5, 7, 20],
  [9, 0, 3, 6, 21, 12, 15, 18],
  [10, 8, 19, 23, 2, 4, 17, 13]
]

const rotationEdgeTable = [
  [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22],
  [9, 16, 1, 22, 13, 18, 5, 20, 10, 2, 6, 14],
  [6, 0, 2, 4, 14, 8, 10, 12, 23, 17, 19, 21],
  [23, 7, 21, 15, 17, 3, 19, 11, 1, 5, 13, 9]
]

const rotationPermutationTable = [
  [0, 1, 2, 3, 4, 5],
  [0, 1, 4, 5, 3, 2],
  [0, 1, 3, 2, 5, 4],
  [0, 1, 5, 4, 2, 3],
  [5, 4, 2, 3, 0, 1],
  [2, 3, 4, 5, 0, 1],
  [4, 5, 3, 2, 0, 1],
  [3, 2, 5, 4, 0, 1],
  [1, 0, 2, 3, 5, 4],
  [1, 0, 4, 5, 2, 3],
  [1, 0, 3, 2, 4, 5],
  [1, 0, 5, 4, 3, 2],
  [4, 5, 2, 3, 1, 0],
  [3, 2, 4, 5, 1, 0],
  [5, 4, 3, 2, 1, 0],
  [2, 3, 5, 4, 1, 0],
  [2, 3, 1, 0, 4, 5],
  [4, 5, 1, 0, 3, 2],
  [3, 2, 1, 0, 5, 4],
  [5, 4, 1, 0, 2, 3],
  [3, 2, 0, 1, 4, 5],
  [5, 4, 0, 1, 3, 2],
  [2, 3, 0, 1, 5, 4],
  [4, 5, 0, 1, 2, 3]
]

const inverseCenterTable = [
  0, 3, 2, 1,
  12, 23, 6, 17,
  8, 9, 10, 11,
  4, 19, 14, 21,
  20, 7, 18, 13,
  16, 15, 22, 5
]

function generateCenterTransformTable() {
  let centerTransformTable = []
  for (let i = 0; i < 24; ++i) {
    centerTransformTable.push([])
    for (let j = 0; j < 24; ++j) {
      let center0 = rotationPermutationTable[j][rotationPermutationTable[i][0]]
      let center2 = rotationPermutationTable[j][rotationPermutationTable[i][2]]
      centerTransformTable[i].push(
        rotationPermutationTable.findIndex(([c0, , c2]) => center0 === c0 && center2 === c2)
      )
    }
  }
  return centerTransformTable
}

const centerTransformTable = generateCenterTransformTable()

function generateRotationCubes(Cube) {
  let basicRotationCubes = []
  for (let i = 0; i < 4; ++i) {
    let cube = new Cube()
    cube.corners = rotationCornerTable[i].slice()
    cube.edges = rotationEdgeTable[i].slice()
    basicRotationCubes.push(cube)
  }
  let rotationCubes = []
  for (let i = 0; i < 24; ++i) {
    rotationCubes.push(new Cube())
  }
  for (let front = 0; front < 4; ++front) {
    rotationCubes[front | 4].twist(basicRotationCubes[1])
  }
  for (let front = 0; front < 4; ++front) {
    rotationCubes[front | 8].twist(basicRotationCubes[1])
    rotationCubes[front | 8].twist(basicRotationCubes[1])
  }
  for (let front = 0; front < 4; ++front) {
    rotationCubes[front | 12].twist(basicRotationCubes[1])
    rotationCubes[front | 12].twist(basicRotationCubes[1])
    rotationCubes[front | 12].twist(basicRotationCubes[1])
  }
  for (let front = 0; front < 4; ++front) {
    rotationCubes[front | 16].twist(basicRotationCubes[3])
  }
  for (let front = 0; front < 4; ++front) {
    rotationCubes[front | 20].twist(basicRotationCubes[3])
    rotationCubes[front | 20].twist(basicRotationCubes[3])
    rotationCubes[front | 20].twist(basicRotationCubes[3])
  }
  for (let top = 0; top < 6; ++top) {
    for (let front = 1; front < 4; ++front) {
      for (let i = 0; i < front; ++i) {
        rotationCubes[top << 2 | front].twist(basicRotationCubes[2])
      }
    }
  }
  for (let placement = 0; placement < 24; ++placement) {
    rotationCubes[placement].placement = placement
  }
  return rotationCubes
}

Object.assign(exports, {
  centerCycleTable, rotationPermutationTable, inverseCenterTable,
  centerTransformTable, generateRotationCubes
})
