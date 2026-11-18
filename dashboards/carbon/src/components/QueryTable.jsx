import { useMemo, useState } from 'react'
import {
  DataTable,
  DataTableSkeleton,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
} from '@carbon/react'
import { formatNumber } from '../lib/aggregate.js'
import { QueryNotice } from './QueryNotice.jsx'
import { StatusIndicator } from './StatusIndicator.jsx'

const TABLE_ROW_LIMIT = 5000
const HIDDEN_COLUMNS = new Set(['ResourceID'])
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/

const formatCell = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string' && ISO_DATETIME.test(value)) return value.slice(0, 16).replace('T', ' ')
  if (typeof value === 'number') return formatNumber(value, Number.isInteger(value) ? 0 : 1)
  return String(value)
}

export const QueryTable = ({ record, state }) => {
  const [page, setPage] = useState({ number: 1, size: 25 })

  const { headers, rows } = useMemo(() => {
    if (state.status !== 'success') return { headers: [], rows: [] }
    const { columns, rows: resultRows } = state.result
    return {
      headers: columns.filter((column) => !HIDDEN_COLUMNS.has(column)).map((column) => ({ key: column, header: column })),
      rows: resultRows.slice(0, TABLE_ROW_LIMIT).map((row, index) => ({ id: String(index), ...row })),
    }
  }, [state])

  if (state.status === 'error') return <QueryNotice error={state.error} />
  if (state.status !== 'success') return <DataTableSkeleton showHeader={false} columnCount={6} rowCount={8} />

  const statusColumns = record.statusColumns ?? {}
  const { rowCount } = state.result
  const description =
    rowCount > TABLE_ROW_LIMIT
      ? `Showing the first ${formatNumber(TABLE_ROW_LIMIT)} of ${formatNumber(rowCount)} rows. Run ${record.query}.sql directly for the full set.`
      : record.description

  return (
    <DataTable rows={rows} headers={headers} isSortable size="sm">
      {({ rows: visibleRows, headers: tableHeaders, getTableProps, getHeaderProps, getRowProps, getToolbarProps, onInputChange }) => {
        const firstRow = (page.number - 1) * page.size
        const pageRows = visibleRows.slice(firstRow, firstRow + page.size)
        return (
          <TableContainer title={record.title} description={description} className="query-table">
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch
                  persistent
                  placeholder={`Filter ${formatNumber(Math.min(rowCount, TABLE_ROW_LIMIT))} rows`}
                  onChange={(event) => {
                    setPage((current) => ({ ...current, number: 1 }))
                    onInputChange(event)
                  }}
                />
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {tableHeaders.map((header) => {
                    const { key, ...headerProps } = getHeaderProps({ header })
                    return (
                      <TableHeader key={key} {...headerProps}>
                        {header.header}
                      </TableHeader>
                    )
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {pageRows.map((row) => {
                  const { key, ...rowProps } = getRowProps({ row })
                  return (
                    <TableRow key={key} {...rowProps}>
                      {row.cells.map((cell) => {
                        const column = cell.info.header
                        return (
                          <TableCell key={cell.id} title={typeof cell.value === 'string' ? cell.value : undefined}>
                            {column in statusColumns && cell.value ? (
                              <StatusIndicator label={cell.value} overrides={statusColumns[column]} />
                            ) : (
                              <span className="query-table__cell">{formatCell(cell.value)}</span>
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Pagination
              page={page.number}
              pageSize={page.size}
              pageSizes={[10, 25, 50, 100]}
              totalItems={visibleRows.length}
              onChange={({ page: number, pageSize: size }) => setPage({ number, size })}
            />
          </TableContainer>
        )
      }}
    </DataTable>
  )
}
