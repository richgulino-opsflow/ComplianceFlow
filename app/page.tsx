'use client'

import { useEffect, useState } from 'react'
import ActivityHistory from '../components/ActivityHistory'
import Tasks from '../components/Tasks'
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
const [editOwner, setEditOwner] = useState('')
const [editDescription, setEditDescription] = useState('')
const [editDueDate, setEditDueDate] = useState('')
const [editPriority, setEditPriority] = useState('')
const [activity, setActivity] = useState<any[]>([])
const [tasks, setTasks] = useState<any[]>([])
const [newTask, setNewTask] = useState('')
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
async function loadActivity(workItemId: string) {
  const { data } = await supabase
    .from('activity_log')
    .select('*')
    .eq('work_item_id', workItemId)
    .order('created_at', { ascending: false })

  setActivity(data || [])
}
async function loadTasks(workItemId: string) {
const { data } = await supabase
.from('task_items')
.select('*')
.eq('work_item_id', workItemId)
.order('created_at', { ascending: true })

setTasks(data || [])
}
async function addTask() {
  if (!selectedItem) return
if (!newTask.trim()) return
await supabase
.from('task_items')
.insert([
{
work_item_id: selectedItem.id,
title: newTask,
completed: false
}
])
setNewTask('')
loadTasks(selectedItem.id)
}
async function deleteTask(taskId: string) {
await supabase
.from('task_items')
.delete()
.eq('id', taskId)
if (selectedItem) {
await loadTasks(selectedItem.id)
}
}
async function toggleTaskComplete(
  taskId: string,
  completed: boolean
) {
await supabase
.from('task_items')
.update({
completed: !completed
})
.eq('id', taskId)
if (selectedItem) {
await loadTasks(selectedItem.id)
const updatedTasks = await supabase
.from('task_items')
.select('*')
.eq('work_item_id', selectedItem.id)
const allComplete =
updatedTasks.data?.every((t: any) => t.completed)
if (updatedTasks.data && updatedTasks.data.length > 0 && allComplete) {
await supabase
.from('work_items')
.update({
stage: 'Complete',
status: 'Complete',
completed_date: new Date().toISOString()
})
.eq('id', selectedItem.id)
}
await loadItems()
}
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
async function saveDetails() {
if (!selectedItem) return

  const { error } = await supabase
    .from('work_items')
    .update({
      owner: editOwner,
      description: editDescription,
      due_date: editDueDate || null,
      priority: editPriority,
    })
    .eq('id', selectedItem.id)

  if (error) {
    console.log(error)
    return
  }
await supabase
.from('activity_log')
.insert([
{
work_item_id: selectedItem.id,
action: 'Details Updated',
details: `Owner: ${editOwner}, Priority: ${editPriority}, Due Date: ${editDueDate}`
}
])
  await loadItems()

  alert('Changes Saved')
}

async function deleteItem() {
  if (!selectedItem) return

  const confirmed = window.confirm(
    'Are you sure you want to delete this work item?'
  )

  if (!confirmed) return

  const { error } = await supabase
    .from('work_items')
    .delete()
    .eq('id', selectedItem.id)

  if (error) {
    console.log(error)
    return
  }

  setSelectedItem(null)

  await loadItems()
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
<div style={{
  border: '1px solid #ccc',
  padding: 15,
  marginBottom: 20
}}>

<h3>Dashboard</h3>
<div style={{ height: '10px' }}></div>
<div>

Open Items: {items.length}
</div>
<div>
Completed Items: {items.filter((i: any) => i.stage === 'Complete').length}
</div>
<div>
Planning: {items.filter((i: any) => i.stage === 'Planning').length}
</div>
<div>
Intake: {items.filter((i: any) => i.stage === 'Intake').length}
</div>
In Progress:
{items.filter((i: any) => i.stage === 'In Progress').length}
</div>
<div>
Completion Rate:
{Math.round(
(items.filter((i: any) => i.stage === 'Complete').length / items.length) * 100
)}%
</div>
       
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
  onClick={() => {
  setSelectedItem(item)
loadActivity(item.id)
loadTasks(item.id)
  setEditOwner(item.owner || '')
  setEditDescription(item.description || '')
  setEditDueDate( item.due_date ? item.due_date.substring(0, 10) : '' )
  setEditPriority(item.priority || 'Medium')
}}

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
Owner:
      <input value={editOwner} onChange={(e) => setEditOwner(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
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

<textarea
  value={editDescription}
  onChange={(e) =>
    setEditDescription(e.target.value)
  }
  rows={5}
  style={{
    width: '100%',
    padding: '8px'
  }}
/>
<p>
  <strong>Due Date:</strong>
</p>

<input
  type="date"
  value={editDueDate}
  onChange={(e) =>
    setEditDueDate(e.target.value)
  }
  style={{
    width: '100%',
    padding: '8px',
    marginBottom: '10px'
  }}
/>
<p>
  <strong>Priority:</strong>
</p>

<select
  value={editPriority}
  onChange={(e) =>
    setEditPriority(e.target.value)
  }
  style={{
    width: '100%',
    padding: '8px',
    marginBottom: '20px'
  }}
>
  <option>Low</option>
  <option>Medium</option>
  <option>High</option>
  <option>Critical</option>
</select>
<ActivityHistory activity={activity} />
<Tasks
  tasks={tasks}
  newTask={newTask}
  setNewTask={setNewTask}
  addTask={addTask}
deleteTask={deleteTask}
toggleTaskComplete={toggleTaskComplete}
/>
<div>
<div style={{ height: '10px' }}></div>
  Created Date:
</div>

<div>
  {selectedItem?.created_at
    ? new Date(selectedItem.created_at).toLocaleDateString()
    : ''}
</div>
<div style={{ height: '10px' }}></div>
<div></div>
<div>
  Completed Date:
</div>

<div>
  {selectedItem?.completed_date
    ? new Date(selectedItem.completed_date).toLocaleDateString()
    : ''}
</div><div></div>
<div>
<div style={{ height: '10px' }}></div>
  Duration:
</div>

<div>
  {selectedItem?.completed_date
    ? Math.ceil(
        (
          new Date(selectedItem.completed_date).getTime() -
          new Date(selectedItem.created_at).getTime()
        ) / (1000 * 60 * 60 * 24)
      )
    : ''}
  {' days'}
</div>
<div style={{ height: '10px' }}></div>
<button
  onClick={saveDetails}
  style={{
    width: '100%',
    padding: '10px',
    background: '#2563eb',
    color: 'white'
  }}
>

  Save Changes
</button>
<button
onClick={deleteItem}
style={{
width: '100%',
padding: '10px',
marginTop: '10px',
background: 'red',
color: 'white'
}}
>
Delete Work Item
</button>

  
</div>
)}
    </div>
  )
}
