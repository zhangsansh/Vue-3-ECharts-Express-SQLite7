import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import {
  PROVINCE_META,
  BRAND_SHARE,
  MODELS,
  REGION_BRAND_BOOST,
  MONTH_FACTOR,
  normalizeCities
} from './data/provinceMeta.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const dbPath = path.join(dataDir, 'nev.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    nickname TEXT,
    avatar TEXT,
    status INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    province TEXT NOT NULL,
    city TEXT,
    brand TEXT NOT NULL,
    model TEXT,
    vehicle_type TEXT,
    sales_count INTEGER DEFAULT 0,
    amount REAL DEFAULT 0,
    year INTEGER,
    month INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS ml_experiments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    learning_rate REAL DEFAULT 0.001,
    batch_size INTEGER DEFAULT 32,
    epochs INTEGER DEFAULT 100,
    status TEXT DEFAULT 'idle',
    metrics TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS ml_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    province TEXT,
    brand TEXT,
    predicted_sales REAL,
    confidence REAL,
    params TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS db_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'sqlite',
    host TEXT,
    port INTEGER,
    database_name TEXT,
    username TEXT,
    password TEXT,
    is_active INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );
`)

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c
  if (userCount === 0) {
    const hash = bcrypt.hashSync('admin123', 10)
    const userHash = bcrypt.hashSync('123456', 10)
    db.prepare(
      `INSERT INTO users (username, password, phone, role, nickname) VALUES (?, ?, ?, ?, ?)`
    ).run('admin', hash, '13800138000', 'admin', '系统管理员')
    db.prepare(
      `INSERT INTO users (username, password, phone, role, nickname) VALUES (?, ?, ?, ?, ?)`
    ).run('analyst', userHash, '13900139000', 'analyst', '数据分析师')
    db.prepare(
      `INSERT INTO users (username, password, phone, role, nickname) VALUES (?, ?, ?, ?, ?)`
    ).run('viewer', userHash, '13700137000', 'viewer', '只读用户')
  }

  const SEED_VERSION = 'v3-full-cities'
  const seedRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('sales_seed_version')
  const needReseed = !seedRow || seedRow.value !== SEED_VERSION
  if (needReseed) {
    db.prepare('DELETE FROM sales').run()
    // 以广东月均约 8.5 万台为锚，按省份权重缩放（贴近近年新能源渗透格局）
    const GD_MONTHLY = 85000
    const insert = db.prepare(
      `INSERT INTO sales (province, city, brand, model, vehicle_type, sales_count, amount, year, month)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    const brandList = Object.keys(BRAND_SHARE)
    const tx = db.transaction(() => {
      for (let year = 2023; year <= 2025; year++) {
        const yearGrowth = year === 2023 ? 0.78 : year === 2024 ? 1.0 : 1.18
        for (let month = 1; month <= 12; month++) {
          if (year === 2025 && month > 6) break
          const season = MONTH_FACTOR[month - 1]
          for (const [province, meta] of Object.entries(PROVINCE_META)) {
            const provinceMonthTotal = Math.round(GD_MONTHLY * meta.weight * yearGrowth * season)
            const cities = normalizeCities(meta.cities)
            const boost = REGION_BRAND_BOOST[province] || {}
            let shareSum = 0
            const weighted = brandList.map((brand) => {
              const w = BRAND_SHARE[brand] * (boost[brand] || 1)
              shareSum += w
              return { brand, w }
            })
            for (const { brand, w } of weighted) {
              const brandSales = provinceMonthTotal * (w / shareSum)
              if (brandSales < 12) continue
              const modelPool = MODELS[brand]
              // 每月每品牌选 1~2 个主力车型，再按城市权重拆分
              const pickCount = Math.min(modelPool.length, brandSales > 3000 ? 2 : 1)
              const picked = [...modelPool].sort(() => Math.random() - 0.5).slice(0, pickCount)
              for (let mi = 0; mi < picked.length; mi++) {
                const m = picked[mi]
                const modelShare = pickCount === 1 ? 1 : (mi === 0 ? 0.62 : 0.38)
                const modelSales = brandSales * modelShare
                for (const [city, cityW] of cities) {
                  const noise = 0.9 + Math.random() * 0.2
                  const sales_count = Math.max(1, Math.round(modelSales * cityW * noise))
                  const amount = Math.round(sales_count * m.price * 10000)
                  insert.run(
                    province, city, brand, m.name, m.type,
                    sales_count, amount, year, month
                  )
                }
              }
            }
          }
        }
      }
      db.prepare(
        `INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, datetime('now','localtime'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
      ).run('sales_seed_version', SEED_VERSION)
    })
    tx()
    console.log('[seed] v3 full city-level NEV sales data ready')
  }

  const themeRow = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('theme')
  if (!themeRow) {
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run(
      'theme',
      JSON.stringify({
        primaryColor: '#e02e24',
        bgColor: '#0a1628',
        bgGradient: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 50%, #0d2137 100%)',
        fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: 14,
        textColor: '#e8f1ff',
        accentColor: '#00d4ff',
        cardBg: 'rgba(10, 30, 60, 0.75)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        screenTitle: '新能源汽车销量数据分析系统'
      })
    )
  }
  if (!db.prepare('SELECT value FROM system_settings WHERE key = ?').get('db_path')) {
    db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run('db_path', dbPath)
  }

  const dbCfg = db.prepare('SELECT COUNT(*) as c FROM db_config').get().c
  if (dbCfg === 0) {
    db.prepare(
      `INSERT INTO db_config (name, type, database_name, is_active) VALUES (?, ?, ?, ?)`
    ).run('本地SQLite', 'sqlite', dbPath, 1)
  }
}

seed()

export default db
export { dbPath }
