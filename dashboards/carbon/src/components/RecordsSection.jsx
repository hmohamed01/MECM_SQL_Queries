import { useState } from 'react'
import { Tab, TabList, TabPanel, TabPanels, Tabs, Tag } from '@carbon/react'
import { useQuery } from '../lib/api.js'
import { formatNumber } from '../lib/aggregate.js'
import { QueryTable } from './QueryTable.jsx'

const useRecordQuery = (record, params) => {
  const paramValue = record.param ? params[record.param] : undefined
  return useQuery(record.query, record.param ? { [record.param]: paramValue } : undefined, {
    enabled: !record.param || Boolean(paramValue),
  })
}

const RecordTabLabel = ({ record, params }) => {
  const state = useRecordQuery(record, params)
  return (
    <span className="record-tab">
      {record.tab}
      {state.status === 'success' && (
        <Tag size="sm" type={record.emphasis && state.result.rowCount > 0 ? 'red' : 'gray'}>
          {formatNumber(state.result.rowCount)}
        </Tag>
      )}
    </span>
  )
}

const RecordPanelContent = ({ record, params }) => {
  const state = useRecordQuery(record, params)
  if (record.param && !params[record.param]) return <p className="records__prompt">{record.paramPrompt}</p>
  return <QueryTable record={record} state={state} />
}

// Detail queries live behind tabs: progressive disclosure keeps the dashboard focused on its key metrics.
export const RecordsSection = ({ records, params }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  return (
    <section className="records" aria-labelledby="records-heading">
      <h2 id="records-heading" className="section-heading">
        Records
      </h2>
      <Tabs selectedIndex={selectedIndex} onChange={({ selectedIndex: index }) => setSelectedIndex(index)}>
        <TabList aria-label="Detail queries" contained>
          {records.map((record) => (
            <Tab key={record.query}>
              <RecordTabLabel record={record} params={params} />
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {records.map((record, index) => (
            <TabPanel key={record.query} className="records__panel">
              {index === selectedIndex && <RecordPanelContent record={record} params={params} />}
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
    </section>
  )
}
