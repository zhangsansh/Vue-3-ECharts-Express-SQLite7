import { Router } from 'express'
import XLSX from 'xlsx'
import db from '../db.js'
import { PROVINCE_META, normalizeCities } from '../data/provinceMeta.js'
import { authRequired, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authRequired)

router.get('/', (req, res) => {
  const { page = 1, pageSize = 20, province, brand, year, month, keyword } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  let where = '1=1'
  const params = []
  if (province) { where += ' AND province = ?'; params.push(province) }
  if (brand) { where += ' AND brand = ?'; params.push(brand) }
  if (year) { where += ' AND year = ?'; params.push(Number(year)) }
  if (month) { where += ' AND month = ?'; params.push(Number(month)) }
  if (keyword) {
    where += ' AND (brand LIKE ? OR model LIKE ? OR province LIKE ?)'
    const k = `%${keyword}%`
    params.push(k, k, k)
  }
  const total = db.prepare(`SELECT COUNT(*) as c FROM sales WHERE ${where}`).get(...params).c
  const list = db.prepare(
    `SELECT * FROM sales WHERE ${where} ORDER BY year DESC, month DESC, id DESC LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset)
  res.json({ code: 0, data: { list, total, page: Number(page), pageSize: Number(pageSize) } })
})

router.get('/stats/overview', (_req, res) => {
  const totalSales = db.prepare('SELECT COALESCE(SUM(sales_count),0) as v FROM sales').get().v
  const totalAmount = db.prepare('SELECT COALESCE(SUM(amount),0) as v FROM sales').get().v
  const brandCount = db.prepare('SELECT COUNT(DISTINCT brand) as v FROM sales').get().v
  const provinceCount = db.prepare('SELECT COUNT(DISTINCT province) as v FROM sales').get().v
  res.json({
    code: 0,
    data: { totalSales, totalAmount: Math.round(totalAmount), brandCount, provinceCount }
  })
})

router.get('/stats/by-province', (req, res) => {
  const { year } = req.query
  let sql = `SELECT province, SUM(sales_count) as sales, SUM(amount) as amount FROM sales`
  const params = []
  if (year) { sql += ' WHERE year = ?'; params.push(Number(year)) }
  sql += ' GROUP BY province ORDER BY sales DESC'
  res.json({ code: 0, data: db.prepare(sql).all(...params) })
})

router.get('/stats/by-brand', (req, res) => {
  const { year, province } = req.query
  let where = '1=1'
  const params = []
  if (year) { where += ' AND year = ?'; params.push(Number(year)) }
  if (province) { where += ' AND province = ?'; params.push(province) }
  const data = db.prepare(
    `SELECT brand, SUM(sales_count) as sales, SUM(amount) as amount FROM sales WHERE ${where} GROUP BY brand ORDER BY sales DESC`
  ).all(...params)
  res.json({ code: 0, data })
})

router.get('/stats/trend', (req, res) => {
  const { province, brand } = req.query
  let where = '1=1'
  const params = []
  if (province) { where += ' AND province = ?'; params.push(province) }
  if (brand) { where += ' AND brand = ?'; params.push(brand) }
  const data = db.prepare(
    `SELECT year, month, SUM(sales_count) as sales, SUM(amount) as amount
     FROM sales WHERE ${where} GROUP BY year, month ORDER BY year, month`
  ).all(...params)
  res.json({ code: 0, data })
})

router.get('/stats/by-type', (req, res) => {
  const { province } = req.query
  let where = '1=1'
  const params = []
  if (province) { where += ' AND province = ?'; params.push(province) }
  const data = db.prepare(
    `SELECT vehicle_type as name, SUM(sales_count) as value FROM sales WHERE ${where} GROUP BY vehicle_type`
  ).all(...params)
  res.json({ code: 0, data })
})

router.get('/stats/province-brand', (req, res) => {
  const { province } = req.query
  if (!province) return res.status(400).json({ code: 400, message: '请指定省份' })
  const brands = db.prepare(
    `SELECT brand, SUM(sales_count) as sales FROM sales WHERE province = ? GROUP BY brand ORDER BY sales DESC`
  ).all(province)
  const trend = db.prepare(
    `SELECT year, month, SUM(sales_count) as sales FROM sales WHERE province = ? GROUP BY year, month ORDER BY year, month`
  ).all(province)
  const types = db.prepare(
    `SELECT vehicle_type as name, SUM(sales_count) as value FROM sales WHERE province = ? GROUP BY vehicle_type`
  ).all(province)
  const models = db.prepare(
    `SELECT model, brand, SUM(sales_count) as sales FROM sales WHERE province = ? GROUP BY model, brand ORDER BY sales DESC LIMIT 10`
  ).all(province)
  const cities = db.prepare(
    `SELECT city, SUM(sales_count) as sales, SUM(amount) as amount FROM sales WHERE province = ? GROUP BY city ORDER BY sales DESC`
  ).all(province)
  const overview = db.prepare(
    `SELECT SUM(sales_count) as totalSales, SUM(amount) as totalAmount,
            COUNT(DISTINCT brand) as brandCount, COUNT(DISTINCT city) as cityCount
     FROM sales WHERE province = ?`
  ).get(province)
  const recentMonth = db.prepare(
    `SELECT year, month, SUM(sales_count) as sales FROM sales WHERE province = ?
     GROUP BY year, month ORDER BY year DESC, month DESC LIMIT 1`
  ).get(province)
  res.json({
    code: 0,
    data: { brands, trend, types, models, cities, overview, recentMonth, province }
  })
})

router.get('/meta/provinces', (_req, res) => {
  const list = Object.entries(PROVINCE_META).map(([name, meta]) => ({
    name,
    adcode: meta.adcode,
    weight: meta.weight,
    cities: normalizeCities(meta.cities).map(([city]) => city)
  }))
  res.json({ code: 0, data: list })
})

router.get('/meta/province/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name)
  const meta = PROVINCE_META[name]
  if (!meta) return res.status(404).json({ code: 404, message: '未找到该省份元数据' })
  res.json({
    code: 0,
    data: {
      name,
      adcode: meta.adcode,
      weight: meta.weight,
      cities: normalizeCities(meta.cities).map(([city, w]) => ({ city, weight: w }))
    }
  })
})

router.get('/filters', (_req, res) => {
  const provinces = db.prepare('SELECT DISTINCT province FROM sales ORDER BY province').all().map(r => r.province)
  const brands = db.prepare('SELECT DISTINCT brand FROM sales ORDER BY brand').all().map(r => r.brand)
  const years = db.prepare('SELECT DISTINCT year FROM sales ORDER BY year').all().map(r => r.year)
  res.json({ code: 0, data: { provinces, brands, years } })
})

router.post('/', requireRole('admin', 'analyst'), (req, res) => {
  const { province, city, brand, model, vehicle_type, sales_count, amount, year, month } = req.body || {}
  if (!province || !brand) return res.status(400).json({ code: 400, message: '省份和品牌必填' })
  const r = db.prepare(
    `INSERT INTO sales (province, city, brand, model, vehicle_type, sales_count, amount, year, month)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(province, city || province, brand, model || '', vehicle_type || '纯电动',
    Number(sales_count) || 0, Number(amount) || 0, Number(year) || new Date().getFullYear(), Number(month) || 1)
  res.json({ code: 0, data: { id: r.lastInsertRowid }, message: '新增成功' })
})

router.put('/:id', requireRole('admin', 'analyst'), (req, res) => {
  const id = Number(req.params.id)
  const row = db.prepare('SELECT * FROM sales WHERE id = ?').get(id)
  if (!row) return res.status(404).json({ code: 404, message: '记录不存在' })
  const b = { ...row, ...req.body }
  db.prepare(
    `UPDATE sales SET province=?, city=?, brand=?, model=?, vehicle_type=?, sales_count=?, amount=?, year=?, month=? WHERE id=?`
  ).run(b.province, b.city, b.brand, b.model, b.vehicle_type, b.sales_count, b.amount, b.year, b.month, id)
  res.json({ code: 0, message: '更新成功' })
})

router.delete('/:id', requireRole('admin', 'analyst'), (req, res) => {
  db.prepare('DELETE FROM sales WHERE id = ?').run(Number(req.params.id))
  res.json({ code: 0, message: '删除成功' })
})

router.get('/export', requireRole('admin', 'analyst'), (req, res) => {
  const { province, brand, year } = req.query
  let where = '1=1'
  const params = []
  if (province) { where += ' AND province = ?'; params.push(province) }
  if (brand) { where += ' AND brand = ?'; params.push(brand) }
  if (year) { where += ' AND year = ?'; params.push(Number(year)) }
  const rows = db.prepare(`SELECT * FROM sales WHERE ${where} ORDER BY id`).all(...params)
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '销量数据')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=sales_export.xlsx')
  res.send(buf)
})

router.post('/import', requireRole('admin', 'analyst'), (req, res) => {
  try {
    const { rows } = req.body || {}
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(400).json({ code: 400, message: '无有效数据' })
    }
    const insert = db.prepare(
      `INSERT INTO sales (province, city, brand, model, vehicle_type, sales_count, amount, year, month)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    const tx = db.transaction((list) => {
      let n = 0
      for (const r of list) {
        if (!r.province || !r.brand) continue
        insert.run(
          r.province, r.city || r.province, r.brand, r.model || '',
          r.vehicle_type || r['vehicle_type'] || '纯电动',
          Number(r.sales_count || r['sales_count'] || 0),
          Number(r.amount || 0),
          Number(r.year || new Date().getFullYear()),
          Number(r.month || 1)
        )
        n++
      }
      return n
    })
    const count = tx(rows)
    res.json({ code: 0, message: `成功导入 ${count} 条`, data: { count } })
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message })
  }
})

export default router
