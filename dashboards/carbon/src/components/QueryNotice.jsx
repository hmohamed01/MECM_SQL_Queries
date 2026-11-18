import { InlineNotification } from '@carbon/react'

const NOTICE_COPY = {
  prerequisite: { kind: 'warning', title: 'Inventory prerequisite missing' },
  connection: { kind: 'error', title: 'Database unreachable' },
  parameter: { kind: 'warning', title: 'Invalid parameter' },
}

export const QueryNotice = ({ error }) => {
  const { kind, title } = NOTICE_COPY[error.details?.kind] ?? { kind: 'error', title: 'Query failed' }
  const notes = error.details?.notes ?? []
  return (
    <InlineNotification
      kind={kind}
      lowContrast
      hideCloseButton
      title={title}
      subtitle={notes.length ? notes.join(' ') : error.message}
      className="query-notice"
    />
  )
}
