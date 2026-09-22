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
const [editTitle, setEditTitle] = useState('')
const [editDescription, setEditDescription] = useState('')
const [editDueDate, setEditDueDate] = useState('')
const [editPriority, setEditPriority] = useState('')
const [activity, setActivity] = useState<any[]>([])
const [tasks, setTasks] = useState<any[]>([])
const [allTasks, setAllTasks] = useState<any[]>([])
const [newTask, setNewTask] = useState('')
const [editLeadValue, setEditLeadValue] = useState('')
const [editLeadSource, setEditLeadSource] = useState('')
const [editContactName, setEditContactName] = useState('')
const [editContactEmail, setEditContactEmail] = useState('')
const [editPhone, setEditPhone] = useState('')
const [editCompanyName, setEditCompanyName] = useState('')
const [editWebsite, setEditWebsite] = useState('')
const [editFollowUpDate, setEditFollowUpDate] = useState('')
const [editWinProbability, setEditWinProbability] = useState('')
const [selectedModule, setSelectedModule] = useState('Dashboard')
const [showWorkOrderForm, setShowWorkOrderForm] = useState(false)
const [woCustomer, setWoCustomer] = useState('')
const [woDescription, setWoDescription] = useState('')
const [woStatus, setWoStatus] = useState('Open')
const [workOrders, setWorkOrders] = useState<any[]>([])
const [woAssignedTo, setWoAssignedTo] = useState('')
const [woDueDate, setWoDueDate] = useState('')
const [woPercentComplete, setWoPercentComplete] = useState('0')
  useEffect(() => {
loadAllTasks()    
loadItems()
loadWorkOrders()
  }, [])
async function loadAllTasks() {
const { data } = await supabase
.from('task_items')
.select('*')
setAllTasks(data || [])
}
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
if (updatedTasks.data && updatedTasks.data.length > 0 && !allComplete) {
await supabase
.from('work_items')
.update({
stage: 'In Progress',
status: 'In Progress',
completed_date: null
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
if (!confirm('Save changes to this work item?')) return

  const { error } = await supabase
    .from('work_items')
    .update({follow_up_date: editFollowUpDate || null,
title: editTitle,
      owner: editOwner,
      description: editDescription,
      due_date: editDueDate || null,
      priority: editPriority,
updated_at: new Date().toISOString(),
lead_value: editLeadValue || null,
lead_source: editLeadSource,
contact_name: editContactName,
contact_email: editContactEmail,
phone: editPhone,
company_name: editCompanyName,
website: editWebsite,
win_probability: editWinProbability || null,

    })
    .eq('id', selectedItem.id)

 if (error) {
  alert(error.message)
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
async function saveWorkOrder() {
const woNumber = 'WO-' + (workOrders.length + 1001)
console.log('Percent Complete:', woPercentComplete)
const { error } = await supabase.from('work_orders').insert([{
wo_number: woNumber,
customer: woCustomer,
description: woDescription,
status: woStatus,
assigned_to: woAssignedTo,
due_date: woDueDate,
percent_complete: woPercentComplete,
created_date: new Date().toISOString().substring(0, 10)
}])
if (error) {
alert(error.message)
return
}
await loadWorkOrders()
setWoCustomer('')
setWoDescription('')
setWoStatus('Open')
setShowWorkOrderForm(false)
}
async function loadWorkOrders() {
const { data } = await supabase.from('work_orders').select('*')
setWorkOrders(data || [])
}
async function deleteWorkOrder(id: number) {
await supabase.from('work_orders').delete()
.eq('id', id)
await loadWorkOrders()
}
  return (

    <div style={{ padding: 20 }}>
<div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
<button onClick={() => window.location.reload()} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
<img src="/logo.png" alt="Company Logo" width="120" />
</button>
<div>
 <strong>ComplianceFlow Tools:</strong>{' '}
  <select
    value={selectedModule}
    onChange={(e) => setSelectedModule(e.target.value)}
    style={{ marginLeft: '5px', width: '160px' }}
  >
    <option value="">Select</option>
    <option value="Dashboard">Dashboard</option>
    <option value="Projects">Projects</option>
    <option value="Contractors">Contractors</option>
    <option value="Certified Payroll">Certified Payroll</option>
    <option value="AA202">AA202</option>
    <option value="Reports">Reports</option>
    <option value="Administration">Administration</option>
</select>

{selectedModule === 'Work Orders' && (
<div style={{ backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '15px', marginTop: '15px', minHeight: '300px', marginBottom: '20px' }}>
<hr />
<h2>Work Orders</h2>
<button onClick={() => setShowWorkOrderForm(true)}>Add Work Order</button>
{showWorkOrderForm && (
<div>
<label>Customer Name: </label>
<input value={woCustomer} onChange={(e) => setWoCustomer(e.target.value)} style={{ border: '1px solid black', width: '200px' }} />
<br />
<label>Description: </label>
<input value={woDescription} onChange={(e) => setWoDescription(e.target.value)}
/>
<br />
<label>Assigned To: </label>
<input value={woAssignedTo} onChange={(e) => setWoAssignedTo(e.target.value)} />
<br />
<label>Due Date: </label>
<input type="date" value={woDueDate} onChange={(e) => setWoDueDate(e.target.value)} />
<br />
<label>% Complete: </label>
<select value={woPercentComplete} onChange={(e) => setWoPercentComplete(e.target.value)}>
<option>0</option>
<option>25</option>
<option>50</option>
<option>75</option>
<option>100</option>
</select>
<label>Status: </label>
<select value={woStatus} onChange={(e) => setWoStatus(e.target.value)}>
<option>Open</option>
<option>Scheduled</option>
<option>In Progress</option>
<option>Complete</option>
</select>
<br />
<div>Current % Complete: {woPercentComplete}</div>
<button onClick={saveWorkOrder}
style={{ backgroundColor: '#16a34a', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save Work Order</button>

</div>
)}

<table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
<thead>
<tr><th>WO #</th>
<th>Customer</th>
<th>Description</th>
<th>Status</th>
<th>Created</th>
<th>Assigned To</th>
<th>Due Date</th>
<th>% Complete</th>
<th>Actions</th>
</tr>
</thead>
<tbody>
{workOrders.map((wo, index) => (
<tr key={index}>
<td>{wo.wo_number}</td>
<td>{wo.customer}</td>
<td>{wo.description}</td>
<td>{wo.status}</td>
<td>{wo.created_date?.substring(0, 10)}</td>
<td>{wo.assigned_to}</td>
<td>{wo.due_date?.substring(0,10)}</td>
<td>{wo.percent_complete}%</td>
<td style={{ padding: '2px' }}><button onClick={() => deleteWorkOrder(wo.id)}
 style={{ backgroundColor: '#dc2626', color: 'white', padding: '4px 12px',border: 'none', borderRadius: '6px', cursor: 'pointer'  }}>Delete</button></td>
</tr>
))}
</tbody>

</table>
</div>
)}
{selectedModule === 'Accounting' && <div>Accounting Module</div>}
{selectedModule === 'Reports' && <div>Reports Module</div>}
{selectedModule === 'Settings' && <div>Settings Module</div>}
</div>
</div>
{selectedModule === 'Dashboard' && (
<h1>ComplianceFlow Operations Board</h1>
)}

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
<button onClick={addItem}
style={{
backgroundColor: '#2563eb',
color: 'white',
padding: '10px 20px',
border: 'none',
borderRadius: '6px',
cursor: 'pointer'
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
<div style={{
display: 'flex',
gap: '80px',
alignItems: 'flex-start'
}}>
<div style={{
display: 'flex',
flexDirection: 'column',
gap: '4px'
}}>
<div>Open Items: {items.length}</div>
<div>
Completed Items: {items.filter((i: any) => i.stage === 'Complete').length}
</div>
<div>
Planning:
{items.filter((i: any) => i.stage === 'Planning').length}
</div>
<div>
Intake:
{items.filter((i: any) => i.stage === 'Intake').length}
</div>
<div>
In Progress:
{items.filter((i: any) => i.stage === 'In Progress').length}
</div>
<div>
Completion Rate:
{Math.round(
(items.filter((i: any) => i.stage === 'Complete').length / items.length) * 100
)}%
</div>
<div
style={{
backgroundColor: '#fef3c7',
padding: '10px',
borderRadius: '8px',
maxWidth: '200px',
marginBottom: '10px',
fontWeight: 'bold',
marginTop: '5px'
}}>
⚠️ Overdue Items: {
items.filter(
(i: any) =>
i.due_date &&
new Date(i.due_date) < new Date() &&
i.stage !== 'Complete'
).length
}
</div>
<div
style={{
backgroundColor: '#fee2e2',
padding: '10px',
borderRadius: '8px',
maxWidth: '225px',
marginBottom: '10px',
fontWeight: 'bold',
marginTop: '5px'
}}
>
🔴 High Priority Items: {
items.filter(
(i: any) => i.priority === 'High'
).length
}
</div>

</div>

<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
 <div> 🏆 Top Opportunity:
{
items
.sort((a: any, b: any) =>
(Number(b.lead_value) || 0) -
(Number(a.lead_value) || 0)
)[0]?.title
}(${(Number(
items .sort((a: any, b: any) =>
(Number(b.lead_value) || 0) -
(Number(a.lead_value) || 0)
)[0]?.lead_value || 0
)).toLocaleString()
}
)
</div>
<div>
💰 Total Pipeline Value: {items.reduce(
  (sum: number, item: any) =>
    sum + (Number(item.lead_value) || 0),
  0
).toLocaleString('en-US', {
  style: 'currency',
  currency: 'USD'
})}
</div>
<div>
🎯 Weighted Pipeline Value:
{
items.reduce(
(sum: number, item: any) =>
sum +
(
(Number(item.lead_value || 0) *
Number(item.win_probability || 0)) / 100
),
0
).toLocaleString('en-US', {
style: 'currency',
currency: 'USD',
minimumFractionDigits: 0,
maximumFractionDigits: 0
})
}
</div>
<div>
💼 Active Leads:
{items.filter((i: any) => i.stage !== 'Complete').length}
</div>
<div>
🔴 Overdue Follow-Ups: {items.filter((i: any) =>
i.follow_up_date &&
new Date(i.follow_up_date) < new Date()
).length}
</div>

🟢 Scheduled Follow-Ups: {items.filter((i: any) =>
i.follow_up_date &&
new Date(i.follow_up_date) >= new Date()
).length}
</div>
<div>
📅 Due Today: {items.filter((i: any) =>
i.due_date === new Date().toISOString().substring(0, 10)
).length}
</div>
</div>  
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
setEditTitle(item.title || '')
  setEditOwner(item.owner || '')
  setEditDescription(item.description || '')
  setEditDueDate( item.due_date ? item.due_date.substring(0, 10) : '' )
  setEditPriority(item.priority || 'Medium')
setEditLeadValue(item.lead_value || '')
setEditLeadSource(item.lead_source || '')
setEditContactName(item.contact_name || '')
setEditContactEmail(item.contact_email || '')
setEditPhone(item.phone || '')
setEditCompanyName(item.company_name || '')
setEditWebsite(item.website || '')
setEditFollowUpDate(
  item.follow_up_date
    ? item.follow_up_date.substring(0, 10)
    : ''
)
setEditWinProbability(item.win_probability || '')
}}

  style={{
                    background: 'white',
                    padding: '10px',
                    marginBottom: '10px',
                    borderRadius: '6px',
border:
item.due_date &&
new Date(item.due_date) < new Date() &&
item.stage !== 'Complete'
? '2px solid #dc2626'
: '1px solid #ccc',
                  }}
                >
                  <strong>{item.title}</strong>
<div
style={{
padding: '4px 10px',
borderRadius: '12px',
display: 'inline-block',

marginTop: '4px',
backgroundColor:
item.stage === 'Planning'
? '#dbeafe'
: item.stage === 'Intake'
? '#e5e7eb'
: item.stage === 'In Progress'
? '#fed7aa'
: '#dcfce7'
}}
>
{item.stage}
</div>
<div>
📅 Due: {new Date(item.due_date).toLocaleDateString()}
</div>

<div>
📋 Tasks: {
allTasks.filter(
(t: any) => t.work_item_id === item.id
).length
}
<div>
{
allTasks.filter((t: any) => t.work_item_id === item.id).length === 0
? '🔴'
:
Math.round(
(
allTasks.filter(
(t: any) =>
t.work_item_id === item.id &&
t.completed
).length
/
allTasks.filter(
(t: any) =>
t.work_item_id === item.id
).length
) * 100
) === 100
? '🟢'
: '🟡'
}
📈 Progress:{
allTasks.filter((t: any) => t.work_item_id === item.id).length === 0
? 0
: Math.round(
(
allTasks.filter(
(t: any) =>
t.work_item_id === item.id &&
t.completed
).length
/
allTasks.filter(
(t: any) =>
t.work_item_id === item.id
).length
) * 100
)
}%
<div
style={{
width: '100%',
height: '6px',
backgroundColor: '#ddd'
}}
>
</div>
<div
style={{
width: `${
allTasks.filter((t: any) => t.work_item_id === item.id).length === 0
? 0
: Math.round(
(
allTasks.filter(
(t: any) =>
t.work_item_id === item.id &&
t.completed
).length
/
allTasks.filter(
(t: any) =>
t.work_item_id === item.id
).length
) * 100
)
}%`,
height: '6px',
backgroundColor: 'green'
}}
/>
</div>
</div>
                  {
<div
style={{
color:
item.priority === 'High'
? '#dc2626'
: item.priority === 'Medium'
? '#d97706'
: '#16a34a',

backgroundColor:
item.priority === 'High'
? '#fee2e2'
: item.priority === 'Medium'
? '#fef3c7'
: '#dcfce7',

padding: '4px 10px',

borderRadius: '12px',

display: 'inline-block',
width: '200px',
textAlign: 'center',
fontWeight: 'bold',

fontSize: '12px',

marginTop: '4px'

}}
>

{item.priority}
</div>
}
<div>
{
item.due_date &&
new Date(item.due_date) < new Date() &&
item.stage !== 'Complete'
? '⚠️ Overdue'
: ''
}
</div>
<select
  value={item.stage}
  onClick={(e) => e.stopPropagation()}
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
   

    <p>
<span
style={{
fontWeight: 'bold'
}}
>
📝 Work Item Name
</span>
<input
autoFocus
value={editTitle}
onChange={(e) => setEditTitle(e.target.value)}
style={{
width: '100%',
padding: '8px',
fontSize: '14px',
marginBottom: '10px',
border: '1px solid #d1d5db',
borderRadius: '6px'
}}
/>
<span
style={{
fontWeight: 'bold'
}}
>
👤 Owner

</span>
      <input value={editOwner} onChange={(e) => setEditOwner(e.target.value)} style={{
width: '100%',
padding: '8px',
marginBottom: '10px',
border: '1px solid #d1d5db',
borderRadius: '6px'

}} />
    </p>
<p>
  <strong>💰 Lead Value: $</strong> <input value={editLeadValue} onChange={(e) => setEditLeadValue(e.target.value)}
style={{ marginLeft: '5px', width: '120px' }}
/> 
</p>

<p style={{ display: 'flex', alignItems: 'center' }}>
<strong>🎯 Win Probability:</strong>
<select
value={editWinProbability}
onChange={(e) => setEditWinProbability(e.target.value)}
>
<option value="">Select</option>
<option value="10">10%</option>
<option value="25">25%</option>
<option value="50">50%</option>
<option value="75">75%</option>
<option value="90">90%</option>
<option value="WON">WON</option>
</select>
</p>
<p style={{ display: 'flex', alignItems: 'center' }}>
  <strong>📢 Lead Source:</strong>{' '}
  <select
    value={editLeadSource}
    onChange={(e) => setEditLeadSource(e.target.value)}
    style={{ marginLeft: '5px', width: '160px' }}
  >
    <option value="">Select</option>
    <option value="Referral">Referral</option>
    <option value="Website">Website</option>
    <option value="LinkedIn">LinkedIn</option>
    <option value="Facebook">Facebook</option>
    <option value="Instagram">Instagram</option>
    <option value="YouTube">YouTube</option>
    <option value="Cold Call">Cold Call</option>
    <option value="Networking Event">Networking Event</option>
    <option value="Other">Other</option>
  </select>
</p>
<p style={{ display: 'flex', alignItems: 'center' }}>
<strong>👤 Contact:</strong>
<input
value={editContactName}
onChange={(e) => setEditContactName(e.target.value)}
style={{ marginLeft: '5px', width: '150px' }}
/>
</p>
<p style={{ display: 'flex', alignItems: 'center' }}>
<strong>📧 Email:</strong>
<input
value={editContactEmail}
onChange={(e) => setEditContactEmail(e.target.value)}
style={{ marginLeft: '5px', width: '200px' }}
/>
</p>
<p style={{ display: 'flex', alignItems: 'center' }}>

<strong>📞 Phone:</strong>
<input
value={editPhone}
onChange={(e) => setEditPhone(e.target.value)}
style={{ marginLeft: '5px', width: '150px' }}
/>
</p>
<p style={{ display: 'flex', alignItems: 'center' }}>
<strong>🏢 Company:</strong>
<input
value={editCompanyName}
onChange={(e) => setEditCompanyName(e.target.value)}
style={{ marginLeft: '5px', width: '150px' }}
/>
</p>
<p style={{ display: 'flex', alignItems: 'center' }}>
<strong>🌐 Website:</strong>
<input
value={editWebsite}
onChange={(e) => setEditWebsite(e.target.value)}
style={{ marginLeft: '5px', width: '150px' }}
/>
</p>
<p style={{ display: 'flex', alignItems: 'center' }}>
<strong>📅 Follow-Up Date:</strong>
<input
  type="date"
  value={editFollowUpDate}
  onChange={(e) =>
    setEditFollowUpDate(e.target.value)
  }
/>
</p>
<p><strong>Follow-Up Status:</strong>
{
!editFollowUpDate
? '⚪ Not Set'
: new Date(editFollowUpDate) < new Date()
? '🔴 Overdue'
: '🟢 Scheduled'
}</p>
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

   <span
style={{
fontWeight: 'bold'
}}
>
📝 Description
</span>



<textarea
  value={editDescription}
  onChange={(e) =>
    setEditDescription(e.target.value)
  }
  rows={5}
  style={{
    width: '100%',
    padding: '8px',
border: '1px solid #d1d5db',
borderRadius: '6px',
resize: 'vertical'
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
 🗓️ Created Date: {selectedItem?.created_at
? new Date(selectedItem.created_at).toLocaleDateString()
    : ''}
</div>
<div style={{ height: '10px' }}></div>
<div></div>
<div>
  ✅ Completed Date: {selectedItem?.completed_date
? new Date(selectedItem.completed_date).toLocaleDateString()
: 'Not Completed'}
<div>
🕒 Last Updated: {selectedItem?.updated_at
? new Date(selectedItem.updated_at).toLocaleDateString()
: ''}
</div>

</div><div></div>
<div>
<div style={{ height: '10px' }}></div>
  ⏱️ Duration: {' '}
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

<div>
  
</div>
<details>
<summary>📜 Activity History</summary>
<ActivityHistory activity={activity} />
</details>

<div style={{ height: '10px' }}></div>
<button
  onClick={saveDetails}
  style={{
    width: '100%',
    padding: '10px',
    backgroundColor: '#2563eb',
border: 'none',
borderRadius: '6px',
cursor: 'pointer',

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
backgroundColor: '#dc2626',
border: 'none',
borderRadius: '6px',
cursor: 'pointer',
color: 'white'
}}
>
Delete Work Item
</button>
{editWinProbability === 'WON' && (
<button
onClick={() => alert('Work Order Created')}
style={{
width: '100%',
padding: '10px',
marginTop: '10px',
backgroundColor: '#16a34a',
border: 'none',
borderRadius: '6px',
cursor: 'pointer',
color: 'white'
}}
>
Create Work Order
</button>
)}
 <button
onClick={() => setSelectedItem(null)}
style={{
width: '100%',
padding: '10px',
marginTop: '10px',
backgroundColor: '#6b7280',
color: 'white',
border: 'none',
borderRadius: '6px',
cursor: 'pointer',

}}
>
Close
</button> 
</div>
)}
    </div>
  )
}
