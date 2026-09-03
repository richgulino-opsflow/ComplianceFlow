'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const stages = [
  'Intake',
  'Planning',
  'Ready To Start',
  'In Progress',
  'Blocked',
  'QA / Closeout',
  'Complete',
]

export default function Home() {
 const [items, setItems] = useState<any[]>([])
const [title, setTitle] = useState('')
const [selectedItem, setSelectedItem] =
  useState<any | null>(null)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    const { data } = await supabase
      .from('work_items')
      .select('*')
      .order('created_at', { ascending: false })

    setItems(data || [])
  }
async function updateStage(
  id: string,
  stage: string
) {
  const { error } = await supabase
    .from('work_items')
    .update({
      stage,
      status: stage
    })
    .eq('id', id)

  if (error) {
    console.log(error)
    return
  }

  loadItems()
}
  async function addItem() {
    if (!title.trim()) return

    await supabase
      .from('work_items')
      .insert([
        {
          title,
          status: 'Intake',
          priority: 'Medium',
          stage: 'Intake',
        },
      ])

    setTitle('')
    loadItems()
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>OpsFlow Operations Board</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New Work Item"
          style={{
            padding: 10,
            width: 300,
            border: '1px solid #ccc',
            marginRight: 10,
          }}
        />

        <button
          onClick={addItem}
          style={{
            padding: '10px 20px',
          }}
        >
          Create
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '15px',
          overflowX: 'auto',
        }}
      >
        {stages.map((stage) => (
          <div
            key={stage}
            style={{
              minWidth: '250px',
              background: '#f3f4f6',
              padding: '10px',
              borderRadius: '8px',
            }}
          >
            <h3>{stage}</h3>

            {items
              .filter((item) => item.stage === stage)
              .map((item) => (
               <div
  key={item.id}
  onClick={() => setSelectedItem(item)}
  style={{
                    background: 'white',
                    padding: '10px',
                    marginBottom: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                  }}
                >
                  <strong>{item.title}</strong>

                  <div>{item.priority}</div>

<select
  value={item.stage}
  onChange={(e) => updateStage(item.id, e.target.value)}
  style={{
    width: '100%',
    marginTop: '10px',
    padding: '5px'
  }}
>
  {stages.map((stageName) => (
    <option key={stageName} value={stageName}>
      {stageName}
    </option>
  ))}
</select>
                </div>
              ))}
          </div>
        ))}
      </div>
{selectedItem && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '350px',
      height: '100%',
      background: 'white',
      borderLeft: '1px solid #ddd',
      padding: '20px',
      overflowY: 'auto',
      boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
    }}
  >
    <button
      onClick={() => setSelectedItem(null)}
      style={{
        marginBottom: '20px',
      }}
    >
      Close
    </button>

    <h2>{selectedItem.title}</h2>

    <p>
      <strong>Owner:</strong>{' '}
      {selectedItem.owner || 'Not Assigned'}
    </p>

    <p>
      <strong>Stage:</strong>{' '}
      {selectedItem.stage}
    </p>

    <p>
      <strong>Priority:</strong>{' '}
      {selectedItem.priority}
    </p>

    <p>
      <strong>Due Date:</strong>{' '}
      {selectedItem.due_date || 'Not Set'}
    </p>

    <p>
      <strong>Description:</strong>
    </p>

    <p>
      {selectedItem.description ||
        'No description'}
    </p>
  </div>
)}
    </div>
  )
}