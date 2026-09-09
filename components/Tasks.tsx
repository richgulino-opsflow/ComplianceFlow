export default function Tasks({
  tasks,
  toggleTaskComplete
}: any) {
return (
<div>
Tasks
Count: {tasks.length}
Tasks:
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

<span
onClick={() =>
toggleTaskComplete(
tasks[0]?.id,
tasks[0]?.completed
)
}
>

</span>
<span
onClick={() =>
toggleTaskComplete(
tasks[1]?.id,
tasks[1]?.completed
)
}
>

</span>
<span
onClick={() =>
toggleTaskComplete(
tasks[2]?.id,
tasks[2]?.completed
)
}
>

</span>
<span
onClick={() =>
toggleTaskComplete(
tasks[3]?.id,
tasks[3]?.completed
)
}
>

</span>
</div>
)
}

