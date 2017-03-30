require('rootpath')()

const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const { expect } = chai

chai.should()
chai.use(sinonChai)

const globalMethods = {
  chai,
  expect,
  noop: () => {},
  sinon,
  sinonChai
}

Object.assign(global, globalMethods)

module.exports = globalMethods
