import { useTheme } from '@carbon/react'
import { STATUS_KINDS, statusColor, statusKindOf } from '../lib/status.js'

// Carbon icon indicator: shape + color + text label, so status is never conveyed by color alone.
export const StatusIndicator = ({ label, overrides, kind: explicitKind }) => {
  const { theme } = useTheme()
  const kind = explicitKind ?? statusKindOf(label, overrides)
  if (!kind) return label

  const { icon: Icon, name } = STATUS_KINDS[kind]
  return (
    <span className={`status-indicator status-indicator--${kind}`}>
      <Icon size={16} style={{ fill: statusColor(kind, theme) }} aria-label={name} />
      <span>{label}</span>
    </span>
  )
}
