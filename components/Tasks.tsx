export default function Tasks({
  tasks,
  toggleTaskComplete,
  newTask,
  setNewTask,
  addTask
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
<div>New Task:</div>

<input
value={newTask}
onChange={(e) => setNewTask(e.target.value)}
/>

<button
onClick={addTask}
style={{ marginLeft: '5px' }}
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
{task.completed ? '☑' : '☐'} {task.title}
</span>
</div>
))}
</div>
)
}

