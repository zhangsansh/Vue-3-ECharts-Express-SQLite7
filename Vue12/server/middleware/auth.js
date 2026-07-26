import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'nev-ml-dashboard-secret-2025'

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ code: 401, message: '未登录' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ code: 401, message: '未登录' })
    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '权限不足' })
    }
    next()
  }
}

export { JWT_SECRET }
