import { Router } from 'express'
import Database from 'better-sqlite3'
import db, { dbPath } from '../db.js'
import { authRequired, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/theme', (_req, res) => {
  const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('theme')
  res.json({ code: 0, data: row ? JSON.parse(row.value) : {} })
})

router.put('/theme', authRequired, requireRole('admin'), (req, res) => {
  const theme = req.body || {}
  db.prepare(
    `INSERT INTO system_settings (key, value, updated_at) VALUES ('theme', ?, datetime('now','localtime'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(JSON.stringify(theme))
  res.json({ code: 0, message: '主题已保存', data: theme })
})

router.get('/db-config', authRequired, requireRole('admin'), (_req, res) => {
  const list = db.prepare('SELECT id, name, type, host, port, database_name, username, is_active, created_at FROM db_config ORDER BY id').all()
  res.json({ code: 0, data: { list, currentPath: dbPath } })
})

router.post('/db-config', authRequired, requireRole('admin'), (req, res) => {
  const { name, type = 'sqlite', host, port, database_name, username, password, is_active = 0 } = req.body || {}
  if (!name) return res.status(400).json({ code: 400, message: '名称必填' })
  if (is_active) db.prepare('UPDATE db_config SET is_active = 0').run()
  const r = db.prepare(
    `INSERT INTO db_config (name, type, host, port, database_name, username, password, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(name, type, host || '', port || null, database_name || '', username || '', password || '', is_active ? 1 : 0)
  res.json({ code: 0, data: { id: r.lastInsertRowid }, message: '保存成功' })
})

router.put('/db-config/:id', authRequired, requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  const row = db.prepare('SELECT * FROM db_config WHERE id = ?').get(id)
  if (!row) return res.status(404).json({ code: 404, message: '配置不存在' })
  const b = { ...row, ...req.body }
  if (b.is_active) db.prepare('UPDATE db_config SET is_active = 0').run()
  db.prepare(
    `UPDATE db_config SET name=?, type=?, host=?, port=?, database_name=?, username=?, password=?, is_active=? WHERE id=?`
  ).run(b.name, b.type, b.host, b.port, b.database_name, b.username, b.password || row.password, b.is_active ? 1 : 0, id)
  res.json({ code: 0, message: '更新成功' })
})

router.delete('/db-config/:id', authRequired, requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM db_config WHERE id = ?').run(Number(req.params.id))
  res.json({ code: 0, message: '删除成功' })
})

router.post('/db-config/test', authRequired, requireRole('admin'), (req, res) => {
  const { type = 'sqlite', database_name } = req.body || {}
  if (type === 'sqlite') {
    try {
      const testPath = database_name || dbPath
      const tdb = new Database(testPath, { readonly: true, fileMustExist: false })
      tdb.prepare('SELECT 1').get()
      tdb.close()
      res.json({ code: 0, message: 'SQLite 连接测试成功', data: { path: testPath } })
    } catch (e) {
      res.status(400).json({ code: 400, message: `连接失败: ${e.message}` })
    }
  } else {
    res.json({ code: 0, message: '当前演示环境仅完整支持 SQLite，配置已记录' })
  }
})

router.get('/all', authRequired, requireRole('admin'), (_req, res) => {
  const rows = db.prepare('SELECT key, value, updated_at FROM system_settings').all()
  const map = {}
  for (const r of rows) {
    try { map[r.key] = JSON.parse(r.value) } catch { map[r.key] = r.value }
  }
  res.json({ code: 0, data: map })
})

export default router
