const Algorithm = require('./algorithm')
const Cube = require('./cube')
const {centerCycleTable} = require('./cube/center')

const {InvalidAlgorithmStringError} = Algorithm

Object.assign(exports, {
  Algorithm, InvalidAlgorithmStringError,
  Cube, centerCycleTable
})
