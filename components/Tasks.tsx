export default function Tasks({ tasks }: any) {
return (
<div>
Tasks
Count: {tasks.length}


Task List:
Current Task:
{tasks[0]?.title}
New Task
</div>
)
}