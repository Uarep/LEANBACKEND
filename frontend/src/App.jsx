import { useState, useEffect } from 'react'

function App() {
  const [users, setUsers] = useState([])
  const [usernameInput, setUsernameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  
  // 🌟 เพิ่มกล่องความจำใหม่: เอาไว้จำว่าตอนนี้เรากำลัง "แก้ไข" ใครอยู่? (เก็บค่า ID)
  // ถ้าเป็น null แปลว่ากำลัง "สมัครสมาชิกใหม่"
  const [editingId, setEditingId] = useState(null) 

  const fetchUsers = () => {
    fetch('http://localhost:3000/api/users')
      .then(response => response.json())
      .then(data => setUsers(data))
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // 🌟 รวบตึงฟังก์ชัน Submit: ให้ทำได้ทั้ง "สร้างใหม่" และ "แก้ไข"
  const handleSubmit = (e) => {
    e.preventDefault() 

    if (editingId) {
      // ✏️ โหมดแก้ไข (UPDATE) - ยิงไปที่ /api/users/เลขID
      fetch(`http://localhost:3000/api/users/${editingId}`, {
        method: 'PUT', // 👈 ใช้ PUT สำหรับการแก้ไข
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, email: emailInput })
      })
      .then(() => {
        alert("อัปเดตข้อมูลสำเร็จ!")
        setEditingId(null) // ออกจากโหมดแก้ไข
        setUsernameInput('')
        setEmailInput('')
        fetchUsers()
      })
    } else {
      // ➕ โหมดสร้างใหม่ (CREATE) เหมือนเดิม
      fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, email: emailInput })
      })
      .then(() => {
        alert("สมัครสมาชิกสำเร็จ!")
        setUsernameInput('')
        setEmailInput('')
        fetchUsers()
      })
    }
  }

  // 🌟 ฟังก์ชันเมื่อกดปุ่มดินสอ (ดึงข้อมูลเก่ามาใส่ช่องกรอก)
  const handleEditClick = (user) => {
    setEditingId(user.id) // เข้าสู่โหมดแก้ไข
    setUsernameInput(user.username) // เอาชื่อเก่ามาใส่ช่อง
    setEmailInput(user.email) // เอาอีเมลเก่ามาใส่ช่อง
  }

  const handleDeleteAll = () => {
    const isConfirm = window.confirm("🚨 แน่ใจหรือไม่ว่าจะล้างข้อมูลทั้งหมด?")
    if (isConfirm) {
      fetch('http://localhost:3000/api/users', { method: 'DELETE' })
      .then(() => fetchUsers())
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '500px' }}>
      <h1>👨‍💻 ระบบจัดการสมาชิก (Full CRUD)</h1>
      
      <div style={{ background: editingId ? '#fff3cd' : '#f0f0f0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        {/* เปลี่ยนหัวข้อตามโหมด */}
        <h3>{editingId ? "✏️ แก้ไขข้อมูลสมาชิก" : "✨ เพิ่มสมาชิกใหม่"}</h3> 
        
        <form onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="ชื่อผู้ใช้" 
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            style={{ display: 'block', width: '90%', padding: '8px', marginBottom: '10px' }}
            required
          />
          <input 
            type="email" 
            placeholder="อีเมล" 
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            style={{ display: 'block', width: '90%', padding: '8px', marginBottom: '10px' }}
            required
          />
          
          {/* เปลี่ยนสีและข้อความปุ่มตามโหมด */}
          <button type="submit" style={{ padding: '10px 15px', background: editingId ? '#ffc107' : '#4CAF50', color: editingId ? 'black' : 'white', border: 'none', cursor: 'pointer', marginRight: '10px' }}>
            {editingId ? "💾 บันทึกการแก้ไข" : "➕ สมัครสมาชิก"}
          </button>

          {/* ปุ่มยกเลิกการแก้ไข (จะโผล่มาเฉพาะตอนอยู่ในโหมดแก้ไข) */}
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setUsernameInput(''); setEmailInput(''); }} style={{ padding: '10px 15px', cursor: 'pointer' }}>
              ❌ ยกเลิก
            </button>
          )}
        </form>
      </div>

      <button onClick={fetchUsers} style={{ padding: '8px', cursor: 'pointer', marginRight: '10px' }}>🔄 รีเฟรช</button>
      {users.length > 0 && (
        <button onClick={handleDeleteAll} style={{ padding: '8px', cursor: 'pointer', background: '#f44336', color: 'white', border: 'none' }}>🗑️ ล้างข้อมูลทั้งหมด</button>
      )}
      
      <h2>รายชื่อสมาชิก ({users.length} คน)</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id} style={{ fontSize: '18px', margin: '10px 0', display: 'flex', alignItems: 'center' }}>
            <span style={{ flexGrow: 1 }}>
              <strong>{user.username}</strong> ({user.email})
            </span>
            {/* 🌟 ปุ่มดินสอสำหรับกดแก้ไข */}
            <button onClick={() => handleEditClick(user)} style={{ marginLeft: '10px', cursor: 'pointer', padding: '5px' }}>
              ✏️ แก้ไข
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App