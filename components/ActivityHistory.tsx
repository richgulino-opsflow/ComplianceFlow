export default function ActivityHistory({ activity }: any) {
  return (
    <div>
      Activity History

      <p>Records: {activity.length}</p>
{activity.length === 0 && (
<p>No activity found</p>
)}
{activity.map((entry: any) => (
<div key={entry.id}>
<p>{entry.action}</p>
<p>{entry.details}</p>
<p>{entry.created_at}</p>
<hr />
</div>
))}

    </div>
  )
}