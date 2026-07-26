import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { signToken, authRequired } from '../middleware/auth.js'

const router = Router()

router.post('/login', (req, res) => {
  const { username, password, phone, loginType } = req.body || {}
  let user
  if (loginType === 'phone' || phone) {
    if (!phone || !password) {
      return res.status(400).json({ code: 400, message: '请输入手机号和密码' })
    }
    user = db.prepare('SELECT * FROM users WHERE phone = ? AND status = 1').get(phone)
  } else {
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '请输入用户名和密码' })
    }
    user = db.prepare('SELECT * FROM users WHERE username = ? AND status = 1').get(username)
  }
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ code: 401, message: '账号或密码错误' })
  }
  const token = signToken(user)
  const { password: _, ...safe } = user
  res.json({ code: 0, data: { token, user: safe }, message: '登录成功' })
})

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, phone, role, nickname, avatar, status, created_at FROM users WHERE id = ?'
  ).get(req.user.id)
  if (!user) return res.status(404).json({ code: 404, message: '用户不存在' })
  res.json({ code: 0, data: user })
})

router.post('/logout', authRequired, (_req, res) => {
  res.json({ code: 0, message: '已退出' })
})

export default router
