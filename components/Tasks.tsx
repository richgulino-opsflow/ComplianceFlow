export default function Tasks({
  tasks,
  toggleTaskComplete,
  newTask,
  setNewTask,
  addTask,
deleteTask,
}: any) {
return (
<div>
<div>Tasks</div>
<div>Count: {tasks.length}</div>
<div>Progress:</div>
{tasks.length === 0
? 0
: Math.round(
(tasks.filter((t: any) => t.completed).length / tasks.length) * 100
)}%
<div>Tasks:</div>
<div>
<div>

New Task:<input
value={newTask}
onChange={(e) => setNewTask(e.target.value)}
style={{
width: '200px',
border: '1px solid gray'
}}
/>

<button
onClick={addTask}
style={{
border: '1px solid #ccc',
padding: '10px 20px',
marginLeft: '125px',
background: '#2563eb',
color: 'white'
}}

>
Add Task
</button>
</div>
<div
style={{
width: '100%',
height: '10px',
backgroundColor: '#ddd'

}}
>
<div
style={{
width: `${Math.round(
(tasks.filter((t: any) => t.completed).length / tasks.length) * 100
)}%`,
height: '10px',
backgroundColor: 'green'
}}
/>
</div>
</div>

{tasks.map((task: any) => (
<div key={task.id}>
<span
onClick={() =>
toggleTaskComplete(
task.id,
task.completed
)
}
>
{task.completed ? '☑' : '☐'} {task.title}<span
onClick={() => deleteTask(task.id)}
>
❌
</span>
</span>
</div>
))}
</div>
)
}

