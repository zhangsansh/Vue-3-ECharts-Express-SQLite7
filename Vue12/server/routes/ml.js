import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'
import db from '../db.js'
import { authRequired, requireRole } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

const router = Router()
router.use(authRequired)

/** In-memory training sessions for real-time monitoring */
const sessions = new Map()

function createSession(id, params) {
  const session = {
    id,
    learning_rate: params.learning_rate ?? 0.001,
    batch_size: params.batch_size ?? 32,
    epochs: params.epochs ?? 100,
    currentEpoch: 0,
    status: 'running',
    history: { loss: [], val_loss: [], accuracy: [], val_accuracy: [], lr: [], batch: [] },
    timer: null,
    listeners: new Set()
  }

  const tick = () => {
    if (session.status !== 'running') return
    session.currentEpoch += 1
    const ep = session.currentEpoch
    const lr = session.learning_rate
    const bs = session.batch_size
    // Simulated metrics that respond to lr / batch size
    const noise = () => (Math.random() - 0.5) * 0.02
    const lrFactor = Math.min(Math.max(lr / 0.001, 0.3), 3)
    const bsFactor = Math.min(Math.max(32 / bs, 0.5), 2)
    const progress = ep / session.epochs
    const loss = Math.max(0.05, (1.2 * Math.exp(-2.2 * progress * lrFactor * bsFactor) + noise()))
    const valLoss = loss * (1.05 + Math.random() * 0.1)
    const acc = Math.min(0.98, 0.45 + 0.5 * (1 - Math.exp(-2.5 * progress * lrFactor)) + noise())
    const valAcc = Math.max(0.4, acc - 0.02 - Math.random() * 0.03)
    session.history.loss.push(+loss.toFixed(4))
    session.history.val_loss.push(+valLoss.toFixed(4))
    session.history.accuracy.push(+acc.toFixed(4))
    session.history.val_accuracy.push(+valAcc.toFixed(4))
    session.history.lr.push(lr)
    session.history.batch.push(bs)

    const payload = {
      epoch: ep,
      total: session.epochs,
      loss: +loss.toFixed(4),
      val_loss: +valLoss.toFixed(4),
      accuracy: +acc.toFixed(4),
      val_accuracy: +valAcc.toFixed(4),
      learning_rate: lr,
      batch_size: bs,
      status: session.status,
      history: session.history
    }
    for (const res of session.listeners) {
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
    }

    if (ep >= session.epochs) {
      session.status = 'completed'
      db.prepare('UPDATE ml_experiments SET status = ?, metrics = ? WHERE id = ?').run(
        'completed',
        JSON.stringify(session.history),
        id
      )
      clearInterval(session.timer)
      for (const res of session.listeners) {
        res.write(`data: ${JSON.stringify({ ...payload, status: 'completed' })}\n\n`)
        res.end()
      }
      session.listeners.clear()
    }
  }

  session.timer = setInterval(tick, 800)
  sessions.set(id, session)
  return session
}

router.get('/experiments', (_req, res) => {
  const list = db.prepare('SELECT * FROM ml_experiments ORDER BY id DESC LIMIT 50').all()
  res.json({ code: 0, data: list })
})

router.post('/train/start', requireRole('admin', 'analyst'), (req, res) => {
  const { name, learning_rate = 0.001, batch_size = 32, epochs = 50 } = req.body || {}
  const r = db.prepare(
    `INSERT INTO ml_experiments (name, learning_rate, batch_size, epochs, status, created_by)
     VALUES (?, ?, ?, ?, 'running', ?)`
  ).run(name || `实验_${Date.now()}`, learning_rate, batch_size, epochs, req.user.id)
  const id = Number(r.lastInsertRowid)
  createSession(id, { learning_rate, batch_size, epochs })
  res.json({ code: 0, data: { id }, message: '训练已启动' })
})

router.post('/train/:id/params', requireRole('admin', 'analyst'), (req, res) => {
  const id = Number(req.params.id)
  const session = sessions.get(id)
  if (!session || session.status !== 'running') {
    return res.status(400).json({ code: 400, message: '训练会话不存在或已结束' })
  }
  const { learning_rate, batch_size } = req.body || {}
  if (learning_rate != null) session.learning_rate = Number(learning_rate)
  if (batch_size != null) session.batch_size = Number(batch_size)
  db.prepare('UPDATE ml_experiments SET learning_rate = ?, batch_size = ? WHERE id = ?').run(
    session.learning_rate, session.batch_size, id
  )
  res.json({
    code: 0,
    message: '参数已动态调整',
    data: { learning_rate: session.learning_rate, batch_size: session.batch_size }
  })
})

router.post('/train/:id/stop', requireRole('admin', 'analyst'), (req, res) => {
  const id = Number(req.params.id)
  const session = sessions.get(id)
  if (session) {
    session.status = 'stopped'
    clearInterval(session.timer)
    db.prepare('UPDATE ml_experiments SET status = ?, metrics = ? WHERE id = ?').run(
      'stopped', JSON.stringify(session.history), id
    )
    for (const r of session.listeners) {
      r.write(`data: ${JSON.stringify({ status: 'stopped', history: session.history })}\n\n`)
      r.end()
    }
    session.listeners.clear()
  }
  res.json({ code: 0, message: '训练已停止' })
})

router.get('/train/:id/stream', (req, res) => {
  const id = Number(req.params.id)
  const session = sessions.get(id)
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()
  if (!session) {
    const exp = db.prepare('SELECT * FROM ml_experiments WHERE id = ?').get(id)
    res.write(`data: ${JSON.stringify({ status: exp?.status || 'idle', history: exp?.metrics ? JSON.parse(exp.metrics) : {} })}\n\n`)
    res.end()
    return
  }
  session.listeners.add(res)
  res.write(`data: ${JSON.stringify({
    epoch: session.currentEpoch,
    total: session.epochs,
    learning_rate: session.learning_rate,
    batch_size: session.batch_size,
    status: session.status,
    history: session.history
  })}\n\n`)
  req.on('close', () => session.listeners.delete(res))
})

router.post('/predict', requireRole('admin', 'analyst'), (req, res) => {
  const {
    province = '广东',
    brand = '比亚迪',
    year = 2025,
    month = 7,
    learning_rate = 0.001,
    batch_size = 32,
    epochs = 50,
    alpha = 0.3
  } = req.body || {}

  const hist = db.prepare(
    `SELECT year, month, SUM(sales_count) as sales FROM sales
     WHERE province = ? AND brand = ? GROUP BY year, month ORDER BY year, month`
  ).all(province, brand)

  const values = hist.map(h => h.sales)
  if (!values.length) {
    return res.json({ code: 0, data: { predicted: 0, confidence: 0, series: [], message: '无历史数据' } })
  }

  // Simple exponential smoothing influenced by ML hyperparams
  let s = values[0]
  const lrBoost = Math.min(Math.max(learning_rate * 100, 0.05), 0.5)
  const smooth = alpha * (1 + lrBoost * 0.2) * (1 + Math.log2(batch_size + 1) / 20)
  const series = []
  for (let i = 0; i < values.length; i++) {
    s = smooth * values[i] + (1 - smooth) * s
    series.push({ year: hist[i].year, month: hist[i].month, actual: values[i], fitted: Math.round(s) })
  }
  const trend = values.length > 3
    ? (values[values.length - 1] - values[values.length - 4]) / 3
    : 0
  const epochFactor = 1 + Math.min(epochs, 200) / 500
  const predicted = Math.max(0, Math.round((s + trend) * epochFactor))
  const variance = values.reduce((a, v) => a + (v - s) ** 2, 0) / values.length
  const confidence = Math.min(0.99, Math.max(0.55, 1 - Math.sqrt(variance) / (s + 1) + epochs / 1000))

  db.prepare(
    `INSERT INTO ml_predictions (province, brand, predicted_sales, confidence, params, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    province, brand, predicted, +confidence.toFixed(4),
    JSON.stringify({ learning_rate, batch_size, epochs, alpha, year, month }),
    req.user.id
  )

  res.json({
    code: 0,
    data: {
      predicted,
      confidence: +confidence.toFixed(4),
      series,
      forecast: [{ year, month, predicted }],
      params: { learning_rate, batch_size, epochs, alpha }
    }
  })
})

router.post('/predict/upload', requireRole('admin', 'analyst'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, message: '请上传文件' })
  try {
    const wb = XLSX.readFile(req.file.path)
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)
    const salesCol = Object.keys(rows[0] || {}).find(k =>
      /sales|销量|count|数量/i.test(k)
    ) || Object.keys(rows[0] || {})[0]
    const values = rows.map(r => Number(r[salesCol])).filter(v => !Number.isNaN(v))
    if (!values.length) return res.status(400).json({ code: 400, message: '文件中无有效数值列' })

    const params = {
      learning_rate: Number(req.body.learning_rate) || 0.001,
      batch_size: Number(req.body.batch_size) || 32,
      epochs: Number(req.body.epochs) || 50,
      alpha: Number(req.body.alpha) || 0.3
    }
    let s = values[0]
    const smooth = params.alpha * (1 + Math.min(params.learning_rate * 50, 0.3))
    const series = values.map((v, i) => {
      s = smooth * v + (1 - smooth) * s
      return { index: i + 1, actual: v, fitted: Math.round(s) }
    })
    const trend = values.length > 3 ? (values.at(-1) - values.at(-4)) / 3 : 0
    const predicted = Math.max(0, Math.round(s + trend))
    const confidence = Math.min(0.98, 0.6 + params.epochs / 400)

    db.prepare(
      `INSERT INTO ml_predictions (province, brand, predicted_sales, confidence, params, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      '上传数据', req.file.originalname, predicted, confidence,
      JSON.stringify({ ...params, file: req.file.originalname, rows: values.length }),
      req.user.id
    )

    res.json({
      code: 0,
      data: {
        predicted,
        confidence: +confidence.toFixed(4),
        series,
        file: req.file.originalname,
        rowCount: values.length,
        params
      },
      message: '文件预测完成'
    })
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

router.get('/predictions', (_req, res) => {
  const list = db.prepare('SELECT * FROM ml_predictions ORDER BY id DESC LIMIT 30').all()
  res.json({ code: 0, data: list })
})

export default router
