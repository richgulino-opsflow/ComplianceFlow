'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    const { data, error } = await supabase
      .from('work_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.log(error)
      return
    }

    setItems(data || [])
  }

  async function addItem() {
    if (!title.trim()) return

    const { error } = await supabase
      .from('work_items')
      .insert([
        {
          title: title,
          status: 'Intake',
          priority: 'Medium'
        }
      ])

    if (error) {
      console.log(error)
      return
    }

    setTitle('')
    loadItems()
  }

  return (
    <main style={{ padding: 30 }}>
      <h1>OpsFlow</h1>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter work item title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            padding: '10px',
            width: '300px',
            marginRight: '10px'
          }}
        />

        <button
          onClick={addItem}
          style={{
            padding: '10px 20px',
            cursor: 'pointer'
          }}
        >
          Create Work Item
        </button>
      </div>

      <h2>Work Items</h2>

      {items.map((item) => (
        <div
          key={item.id}
          style={{
  padding: '10px',
  width: '300px',
  marginRight: '10px',
  border: '2px solid blue',
  backgroundColor: 'white'
}}
        >
          <strong>{item.title}</strong>

          <div>Status: {item.status}</div>

          <div>Priority: {item.priority}</div>
        </div>
      ))}
    </main>
  )
}