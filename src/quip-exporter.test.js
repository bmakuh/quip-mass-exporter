const axios = require('axios')
const {
  fetch,
  fetchDocs,
  fetchPrivateFolder,
  fetchThreads,
  logErr,
  main,
  writeFiles
} = require('./index')

describe('Quip exporter', () => {
  describe('fetch()', () => {
    it('passes along the URL and provides an auth header by default to axios', () => {
      const url = 'http://google.com'
      opts = { foo: 'bar' }
      deps = { axios: () => Promise.resolve() }
      sinon.spy(deps, 'axios')

      return fetch(url, opts, deps).then(() => {
        const actualOpts = deps.axios.getCall(0).args[1]

        expect(deps.axios).to.have.been.calledWith(url)
        expect(actualOpts).to.contain(opts)
        expect(actualOpts.headers).to.have.key('Authorization')
      })
    })
  })

  describe('logErr()', () => {

  })

  describe('fetchPrivateFolder()', () => {

  })

  describe('fetchDocs()', () => {

  })

  describe('fetchThreads()', () => {

  })

  describe('writeFiles()', () => {

  })

  describe('main()', () => {

  })
})
