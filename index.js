const request = require('request')
const { forEach } = require('lodash')
const fs = require('fs')
const toMarkdown = require('to-markdown')

const Authorization = `Bearer ${process.argv[2]}`

const fetchPrivateFolder = (error, response, body) => {
  if (!error && response.statusCode == 200) {
    const info = JSON.parse(body)
    request({
      url: `https://platform.quip.com/1/folders/${info.private_folder_id}`,
      headers: { Authorization }
    }, fetchDocs)
  }
}

const fetchThreads = (folder_id) => {
  request({
    url: `https://platform.quip.com/1/folders/${folder_id}`,
    headers: { Authorization }
  }, (err, res, body) => {
    forEach(JSON.parse(body), (folder) => {
      if (!folder.title) return

      fs.mkdirSync(`output/${folder.title}`, (err) => {
        if (err) throw err
        console.log(`successfully created output/${folder.title}`)
      })
      fetchDocs(err, res, body, folder.title)
    })
  })
}

const fetchDocs = (err, res, body, folder_name = 'output') => {
  const { children } = JSON.parse(body)
  const ids = children
    .filter(({ thread_id }) => !!thread_id)
    .map(({ thread_id }) => thread_id)
    .join(',')

  const folder_ids = children
    .filter(({ folder_id }) => !!folder_id)
    .map(({ folder_id }) => folder_id)

  forEach(folder_ids, fetchThreads)

  request({
    url: `https://platform.quip.com/1/threads/?ids=${ids}`,
    headers: { Authorization }
  }, (err, res, body) => {
    forEach(JSON.parse(body), (({ thread, html }) => {
      const file = thread.title.replace(/\//g, '')
      const path = folder_name === 'output'
        ? folder_name
        : `output/${folder_name}`
      fs.writeFile(`${path}/${file}.html`, html, (err) => {
        if (err) throw err
        console.log(`${path}/${file}.html saved successfully`)
      })
      fs.writeFile(`${path}/${file}.md`, toMarkdown(html), (err) => {
        if (err) throw err
        console.log(`${path}/${file}.md saved successfully`)
      })
    }))
  })
}

request({
  url: 'https://platform.quip.com/1/users/current',
  headers: { Authorization }
}, fetchPrivateFolder)
