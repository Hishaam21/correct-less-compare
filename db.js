    import sqlite3 from 'sqlite3'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'users.db')

let db

export function initDB() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) reject(err)
      else {
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password TEXT NOT NULL,
            verified INTEGER DEFAULT 0,
            verificationCode TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err)
          else {
            console.log('✓ Database initialized at', DB_PATH)
            resolve()
          }
        })
      }
    })
  })
}

export function signUp(email, password, name) {
  return new Promise((resolve, reject) => {
    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return reject(err)

      // Generate verification code
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      db.run(
        'INSERT INTO users (email, password, name, verificationCode) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, name, verificationCode],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              reject(new Error('Email already registered'))
            } else {
              reject(err)
            }
          } else {
            resolve({ id: this.lastID, email, name, verificationCode })
          }
        }
      )
    })
  })
}

export function signIn(email, password) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return reject(err)
      if (!user) return reject(new Error('User not found'))

      bcrypt.compare(password, user.password, (err, match) => {
        if (err) return reject(err)
        if (!match) return reject(new Error('Invalid password'))
        resolve({ id: user.id, email: user.email, name: user.name, verified: user.verified === 1 })
      })
    })
  })
}

export function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, email, name, verified, createdAt FROM users ORDER BY createdAt DESC',
      (err, rows) => {
        if (err) reject(err)
        else resolve(rows || [])
      }
    )
  })
}

export function verifyEmail(email, code) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ? AND verificationCode = ?', [email, code], (err, user) => {
      if (err) return reject(err)
      if (!user) return reject(new Error('Invalid verification code'))

      db.run('UPDATE users SET verified = 1, verificationCode = NULL WHERE email = ?', [email], (err) => {
        if (err) reject(err)
        else resolve({ id: user.id, email: user.email, name: user.name, verified: true })
      })
    })
  })
}

export function getVerificationCode(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT verificationCode FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err)
      else resolve(row?.verificationCode || null)
    })
  })
}

export function closeDB() {
  return new Promise((resolve) => {
    if (db) db.close(() => resolve())
    else resolve()
  })
}

export function getDb() {
  return db
}

