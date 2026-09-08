export default function ActivityHistory({ activity }: any) {
  return (
    <div>
      Activity History

Records: {activity.length}
If activity.length equals 0
show:
No activity found
entry.action

entry.details

entry.created_at
    </div>
  )
}