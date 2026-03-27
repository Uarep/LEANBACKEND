import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import pg from 'pg' // 👈 1. นำเข้าเครื่องมือ pg

const { Pool } = pg

const app = new Hono()
app.use('/*', cors())

// 🌟 2. ตั้งค่ากุญแจเข้าตู้เซฟ (ใส่รหัส 1234 ของเราลงไป)
const pool = new Pool({
  user: 'postgres',
  password: '1234', // รหัสผ่านที่คุณตั้งไว้ตอนติดตั้ง
  host: 'localhost', // ที่อยู่ของตู้เซฟ (เครื่องเราเอง)
  port: 5432,          // เลขที่ประตู
  database: 'my_database' // ชื่อตู้เซฟที่เราเพิ่งสร้าง
})

// 🌟 3. สั่งให้สร้างตารางเก็บข้อมูลอัตโนมัติ (ถ้ายังไม่มี)
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL
  )
`).then(() => {
  console.log("🐘 เชื่อมต่อ PostgreSQL และเตรียมตารางพร้อมแล้ว!")
}).catch((err) => {
  console.error("❌ เกิดข้อผิดพลาดในการเชื่อมต่อ:", err)
})


app.get('/', (c) => {
  return c.text('say HI, nakub')
})

// 🌟 API 1: ดึงข้อมูลทั้งหมด (READ)
app.get('/api/users', async (c) => {
  try {
    // สั่ง SQL: ดึงข้อมูลทุกคอลัมน์ (*) จากตาราง users เรียงตาม id
    const result = await pool.query('SELECT * FROM users ORDER BY id ASC')
    return c.json(result.rows) // ส่งข้อมูลที่เป็น Array กลับไปให้ React
  } catch (err) {
    return c.json({ error: err.message }, 500)
  }
})

// 🌟 API 2: สมัครสมาชิก (CREATE)
app.post('/api/register', async (c) => {
  try {
    const body = await c.req.json()
    const { username, email } = body

    // สั่ง SQL: เพิ่มข้อมูลลงตาราง (ใช้ $1, $2 เพื่อความปลอดภัย ป้องกันโดนแฮก!)
    const result = await pool.query(
      'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *',
      [username, email]
    )

    console.log("📥 บันทึกลงฐานข้อมูล:", result.rows[0])
    return c.json({ message: "Register Success!", user: result.rows[0] }, 201)
  } catch (err) {
    return c.json({ error: err.message }, 500)
  }
})

// 🌟 API 3: ลบข้อมูลทั้งหมด (DELETE)
app.delete('/api/users', async (c) => {
  try {
    // สั่ง SQL: ลบข้อมูลทุกอย่างในตาราง users และรีเซ็ตเลข id กลับไปนับ 1 ใหม่
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY')
    return c.json({ message: "ล้างข้อมูลในฐานข้อมูลถาวรเรียบร้อยแล้ว!" })
  } catch (err) {
    return c.json({ error: err.message }, 500)
  }
})
// 🌟 API 4: แก้ไขข้อมูล (UPDATE)
app.put('/api/users/:id', async (c) => {
  try {
    const id = c.req.param('id') // รับค่า ID จาก URL เช่น /api/users/1
    const body = await c.req.json()
    const { username, email } = body

    // สั่ง SQL: แก้ไข (UPDATE) ชื่อและอีเมล เฉพาะคนที่ id ตรงกับที่ส่งมา (WHERE id = ...)
    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING *',
      [username, email, id]
    )

    return c.json({ message: "✏️ อัปเดตข้อมูลสำเร็จ!", user: result.rows[0] })
  } catch (err) {
    return c.json({ error: err.message }, 500)
  }
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`🚀 Server running at http://localhost:${info.port}`)
})