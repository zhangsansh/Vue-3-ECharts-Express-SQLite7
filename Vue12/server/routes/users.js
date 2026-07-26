import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { authRequired, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authRequired)

router.get('/', requireRole('admin', 'analyst'), (req, res) => {
  const { page = 1, pageSize = 10, keyword = '' } = req.query
  const offset = (Number(page) - 1) * Number(pageSize)
  let where = '1=1'
  const params = []
  if (keyword) {
    where += ' AND (username LIKE ? OR phone LIKE ? OR nickname LIKE ?)'
    const k = `%${keyword}%`
    params.push(k, k, k)
  }
  const total = db.prepare(`SELECT COUNT(*) as c FROM users WHERE ${where}`).get(...params).c
  const list = db.prepare(
    `SELECT id, username, phone, role, nickname, avatar, status, created_at
     FROM users WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset)
  res.json({ code: 0, data: { list, total, page: Number(page), pageSize: Number(pageSize) } })
})

router.post('/', requireRole('admin'), (req, res) => {
  const { username, password, phone, role = 'user', nickname } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '用户名和密码必填' })
  }
  try {
    const hash = bcrypt.hashSync(password, 10)
    const r = db.prepare(
      `INSERT INTO users (username, password, phone, role, nickname) VALUES (?, ?, ?, ?, ?)`
    ).run(username, hash, phone || null, role, nickname || username)
    res.json({ code: 0, data: { id: r.lastInsertRowid }, message: '创建成功' })
  } catch (e) {
    res.status(400).json({ code: 400, message: e.message.includes('UNIQUE') ? '用户名或手机号已存在' : e.message })
  }
})

router.put('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  const { phone, role, nickname, status, password } = req.body || {}
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
  if (!user) return res.status(404).json({ code: 404, message: '用户不存在' })
  if (password) {
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), id)
  }
  db.prepare(
    `UPDATE users SET phone = ?, role = ?, nickname = ?, status = ? WHERE id = ?`
  ).run(phone ?? user.phone, role ?? user.role, nickname ?? user.nickname, status ?? user.status, id)
  res.json({ code: 0, message: '更新成功' })
})

router.delete('/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id)
  if (id === req.user.id) return res.status(400).json({ code: 400, message: '不能删除自己' })
  db.prepare('DELETE FROM users WHERE id = ?').run(id)
  res.json({ code: 0, message: '删除成功' })
})

export default router
