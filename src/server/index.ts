import cors from 'cors'
import express from 'express'
import path from 'path'

import { appPort } from '../common/values'

const app = express()

// Enable CORS
app.use(cors())

// const couch = nano(config.couchDbFullpath)
// const db = couch.use('xxxxxx')

// Cleaner for the Asset type
app.get('/api/template', async (req, res) => {
  try {
    res.json({})
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assets' })
  }
})

app.use(express.static(path.join(__dirname, '../../dist')))

// Add this to handle client-side routing
app.get('*catchAll', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'))
})

app.listen(appPort, () => {
  console.log(`Server running at http://localhost:${appPort}`)
})
