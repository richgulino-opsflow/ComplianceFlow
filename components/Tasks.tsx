export default function Tasks({ tasks }: any) {
return (
<div>
Tasks
Count: {tasks.length}
Tasks:

{tasks[0]?.title}
{tasks[1]?.title}
{tasks[2]?.title}
</div>
)
}