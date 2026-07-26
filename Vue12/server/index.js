import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import './db.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import salesRoutes from './routes/sales.js'
import mlRoutes from './routes/ml.js'
import settingsRoutes from './routes/settings.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/sales', salesRoutes)
app.use('/api/ml', mlRoutes)
app.use('/api/settings', settingsRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ code: 0, message: 'ok', time: new Date().toISOString() })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ code: 500, message: err.message || '服务器错误' })
})

app.listen(PORT, () => {
  console.log(`NEV ML API server running at http://localhost:${PORT}`)
})
