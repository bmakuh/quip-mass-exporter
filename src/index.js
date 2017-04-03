const axios = require('axios')
const { forEach } = require('lodash')
const fs = require('fs')
const toMarkdown = require('to-markdown')

// headers :: { Authorization: string }
const headers = { Authorization: `Bearer ${process.argv[2]}` }

// fetch :: (string, ?Object) => Promise<*>
const fetch = (url, opts = {}, deps = { axios }) => {
  return deps.axios(url, Object.assign({}, { headers }, opts))
}

// logErr :: string => void
const logErr = (err) => {
  console.error(err)
  process.exitCode = 1
  return
}

// fetchPrivateFolder :: (number) => Promise<*>
const fetchPrivateFolder = (id, deps = { fetch }) => {
  const { fetch } = deps

  return fetch(`https://platform.quip.com/1/folders/${id}`)
}

// type Child = { folder_id: number }
// fetchDocs :: (Array<Child>, string) => Promise<*>
const fetchDocs = (
  children,
  folderName = 'output',
  deps = {
    fs,
    fetch,
    fetchThreads,
    writeFiles
  }
) => {
  const { fs, fetch, fetchThreads, writeFiles } = deps

  fs.mkdir(folderName, 0o777, (err) => {
    if (err) {
      return logErr(`❌ Failed to create folder ${folderName}. ${err}`)
    }

    console.log(`🗂 ${folderName} created successfully`)
  })

  const ids = children
    .filter(({ thread_id }) => !!thread_id)
    .map(({ thread_id }) => thread_id)
    .join(',')

  const folderIds = children
    .filter(({ folder_id }) => !!folder_id)
    .map(({ folder_id }) => folder_id)

  forEach(folderIds, (folderId) => fetchThreads(folderId, folderName))

  return fetch(`https://platform.quip.com/1/threads/?ids=${ids}`)
    .then(writeFiles(folderName))
}

// fetchThreads :: (number, string) => Promise<*>
const fetchThreads = (
  folderId,
  parentDir,
  deps = {
    fetchDocs,
    fetchPrivateFolder
  }
) => {
  const { fetchDocs, fetchPrivateFolder } = deps

  return fetchPrivateFolder(folderId)
    .then(({ data }) => {
      forEach(data, (folder) => {
        if (!folder.title) return

        fetchDocs(data.children, `${parentDir}/${folder.title}`)
      })
    })
}

// type Threads = {
//   data: {
//     [Id]: {
//       thread: { title: string },
//       html: string
//     }
//   }
// }
// writeFiles :: string => Threads => void
const writeFiles = (folderName) => ({ data }, deps = { fs, toMarkdown }) => {
  const { fs, toMarkdown } = deps

  forEach(data, (({ thread, html }) => {
    const file = thread.title.replace(/\//g, '')
    const fileName = `${folderName}/${file}`

    fs.writeFile(`${fileName}.html`, html, (err) => {
      if (err) return logErr(`❌ Failed to save ${fileName}.html. ${err}`)

      console.log(`✅ ${fileName}.html saved successfully`)
    })

    fs.writeFile(`${fileName}.md`, toMarkdown(html), (err) => {
      if (err) return logErr(`❌ Failed to save ${fileName}.md. ${err}`)

      console.log(`✅ ${fileName}.md saved successfully`)
    })
  }))
}

// main :: () => Promise<*>
const main = (
  deps = {
    console,
    fetch,
    fetchDocs,
    fetchPrivateFolder,
    logErr,
    process
  }
) => {
  const {
    console,
    fetch,
    fetchDocs,
    fetchPrivateFolder,
    logErr,
    process
  } = deps

  if (!process.argv[2]) {
    console.log('❌ Please provide your Quip API token. Exiting.')
    process.exitCode = 1
    return
  }

  return fetch('https://platform.quip.com/1/users/current')
    .then((res) => {
      return new Promise((resolve, reject) => {
        if (res.status !== 200) return reject(`❌ Error: ${res.statusText}`)

        resolve(res.data.private_folder_id)
      })
    })
    .then(fetchPrivateFolder)
    .then(({ data: { children } }) => children)
    .then(fetchDocs)
    .catch(logErr)
}

module.exports = {
  fetch,
  fetchDocs,
  fetchPrivateFolder,
  fetchThreads,
  logErr,
  main,
  writeFiles
}
