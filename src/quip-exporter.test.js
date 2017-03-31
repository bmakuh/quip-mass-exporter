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
    it('sends the err to console.error and sets an exit code', () => {
      sinon.spy(console, 'error')
      logErr('foo')
      expect(console.error).to.have.been.calledWith('foo')
      expect(process.exitCode).to.equal(1)
    })
  })

  describe('fetchPrivateFolder()', () => {
    it('grabs the folder for the given ID', () => {
      const fetch = sinon.spy()
      fetchPrivateFolder(3, { fetch })

      expect(fetch).to.have.been.calledWith(`https://platform.quip.com/1/folders/3`)
    })
  })

  describe('fetchDocs()', () => {
    it('creates the given folder, fetches threads for each child folder, then writes each thread to a file', () => {
      const children = [
        { folder_id: 3, thread_id: 15 },
        { folder_id: 4, thread_id: 16 }
      ]
      folderName = 'foo'
      deps = {
        fs: { mkdir: sinon.spy() },
        fetch: () => Promise.resolve(),
        fetchThreads: sinon.spy(),
        writeFiles: sinon.spy()
      }

      sinon.spy(deps, 'fetch')

      return fetchDocs(children, folderName, deps).then(() => {
        expect(deps.fs.mkdir).to.have.been.calledWith(folderName)
        expect(deps.fetchThreads).to.have.been.calledTwice
        expect(deps.fetch).to.have.been.calledWith(`https://platform.quip.com/1/threads/?ids=15,16`)
        expect(deps.writeFiles).to.have.been.calledWith(folderName)
      })
    })
  })

  describe('fetchThreads()', () => {
    it('grabs all the docs in a given folder', () => {
      const folderId = 17
      const parentDir = 'parent'
      const deps = {
        fetchPrivateFolder: () => Promise.resolve({
          data: { folder: { title: 'thisDir' }, children: 'foo' }
        }),
        fetchDocs: sinon.spy()
      }

      sinon.spy(deps, 'fetchPrivateFolder')

      return fetchThreads(folderId, parentDir, deps).then(() => {
        expect(deps.fetchPrivateFolder).to.have.been.calledWith(folderId)
        expect(deps.fetchDocs).to.have.been.calledWith('foo', 'parent/thisDir')
      })
    })
  })

  describe('writeFiles()', () => {
    it('takes a folderName and a thread and saves it as HTML and Markdown', () => {

    })
  })

  describe('main()', () => {

  })
})
