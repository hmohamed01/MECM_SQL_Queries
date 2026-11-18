import { statusTokens } from '@carbon/themes'
import {
  CheckmarkFilled,
  CheckmarkOutline,
  CircleDash,
  ErrorFilled,
  InProgress,
  PendingFilled,
  UndefinedFilled,
  UnknownFilled,
  WarningAltFilled,
  WarningSquareFilled,
} from '@carbon/icons-react'

// Carbon's status indicator pattern: each kind pairs a status token with a distinct shape,
// so severity never relies on color alone.
export const STATUS_KINDS = {
  failed: { token: 'statusRed', icon: ErrorFilled, name: 'Failed' },
  'caution-major': { token: 'statusOrange', icon: WarningSquareFilled, name: 'Caution major' },
  'caution-minor': { token: 'statusYellow', icon: WarningAltFilled, name: 'Caution minor' },
  undefined: { token: 'statusPurple', icon: UndefinedFilled, name: 'Undefined' },
  succeeded: { token: 'statusGreen', icon: CheckmarkFilled, name: 'Succeeded' },
  normal: { token: 'statusBlue', icon: CheckmarkOutline, name: 'Normal' },
  'in-progress': { token: 'statusBlue', icon: InProgress, name: 'In progress' },
  'not-started': { token: 'statusGray', icon: CircleDash, name: 'Not started' },
  pending: { token: 'statusGray', icon: PendingFilled, name: 'Pending' },
  unknown: { token: 'statusGray', icon: UnknownFilled, name: 'Unknown' },
}

// Status strings emitted by the SQL files in this repository, mapped to Carbon status kinds.
const STATUS_BY_LABEL = {
  'Critical (< 5GB)': 'failed',
  'Warning (< 10GB)': 'caution-major',
  'Low (< 10%)': 'caution-minor',
  'Critical (> 90 days)': 'failed',
  'Warning (> 60 days)': 'caution-major',
  'Inactive (> 30 days)': 'caution-minor',
  'Review (> 30 days)': 'caution-minor',
  'Needs Reboot (> 30 days)': 'caution-major',
  'Consider Reboot (> 14 days)': 'caution-minor',
  'Critical (> 14 days)': 'failed',
  'Warning (> 7 days)': 'caution-major',
  OK: 'succeeded',
  Active: 'succeeded',
  Inactive: 'caution-major',
  Unknown: 'unknown',
  'Unknown/Not Supported': 'unknown',
  'No Signature Data': 'unknown',
  'Protection On': 'succeeded',
  'Protection Off': 'failed',
  'Protection Unknown': 'unknown',
  'Fully Encrypted': 'succeeded',
  'Fully Decrypted': 'failed',
  'Encryption In Progress': 'in-progress',
  'Decryption In Progress': 'caution-major',
  'Encryption Paused': 'caution-minor',
  'Decryption Paused': 'caution-minor',
  'No BitLocker Data': 'unknown',
  Completed: 'succeeded',
  Failed: 'failed',
  'Pending Retry': 'caution-minor',
  Running: 'in-progress',
  'Waiting for Scan': 'not-started',
  Never: 'not-started',
  'TLS 1.0 Enabled - ACTION REQUIRED': 'failed',
  'TLS 1.0 May Be Enabled': 'caution-major',
  'TLS 1.0 Disabled': 'succeeded',
  'TLS 1.0 Disabled by Default': 'succeeded',
  'Check Manually': 'unknown',
  Installed: 'succeeded',
  'Not Installed': 'caution-minor',
  Success: 'succeeded',
  'Already Compliant': 'succeeded',
  'Simulate Success': 'succeeded',
  'In Progress': 'in-progress',
  'Waiting for Content': 'in-progress',
  Installing: 'in-progress',
  'Waiting for Maintenance Window': 'pending',
  'Waiting for Install Window': 'pending',
  'Restart Pending': 'pending',
  'Pending Soft Reboot': 'pending',
  'Requirements Not Met': 'undefined',
  Error: 'failed',
  Errors: 'failed',
  Evaluating: 'in-progress',
  Compliant: 'succeeded',
  Required: 'failed',
  'Not Required': 'normal',
  Critical: 'failed',
  Important: 'caution-major',
  Moderate: 'caution-minor',
  Low: 'normal',
  Unspecified: 'unknown',
}

// Yes/No and Enabled/Disabled only become statuses in context: "TPM Owned: No" is a failure, "Pending Reboot: Yes" is not.
export const POSITIVE_YES = { Yes: 'succeeded', No: 'failed', Unknown: 'unknown' }
export const POSITIVE_ENABLED = { Enabled: 'succeeded', Disabled: 'failed', Unknown: 'unknown' }

export const thresholdKind = (percent, [target, warning, critical] = [95, 85, 70]) =>
  percent >= target ? 'succeeded' : percent >= warning ? 'caution-minor' : percent >= critical ? 'caution-major' : 'failed'

const THEME_TOKEN_KEYS = { white: 'whiteTheme', g10: 'g10', g90: 'g90', g100: 'g100' }

export const statusKindOf = (label, overrides = {}) => overrides[label] ?? STATUS_BY_LABEL[label] ?? null

export const statusColor = (kind, theme) => statusTokens[STATUS_KINDS[kind].token][THEME_TOKEN_KEYS[theme]]

// Builds a Carbon Charts `color.scale` so status groups always render in their Carbon status color.
export const statusScale = (labels, theme, overrides) =>
  Object.fromEntries(labels.map((label) => [label, statusColor(statusKindOf(label, overrides) ?? 'unknown', theme)]))

/**
 * Collapse several statuses for one device into a single representative status.
 *
 * Carbon's status pattern: "When multiple statuses are consolidated, use the highest-attention
 * color to represent the group." Server_TLS10_Enabled returns one row per registry value, so a
 * server can report both "TLS 1.0 Disabled" and "TLS 1.0 May Be Enabled" at once.
 *
 * @param {string[]} labels - status labels reported for one device (e.g. TLS 1.0 Status values)
 * @param {Record<string, string>} [overrides] - per-panel label → status kind overrides
 * @returns {string} the label that should represent the device
 */
export const consolidateStatus = (labels, overrides) => {
  // TODO: rank Carbon status kinds by attention and return the highest-attention label.
  // Placeholder: relies on the SQL ORDER BY having already put the riskiest row first.
  return labels[0]
}
