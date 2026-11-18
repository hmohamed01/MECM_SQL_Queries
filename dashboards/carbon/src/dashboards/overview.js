import { Dashboard } from '@carbon/icons-react'
import { formatNumber, percentOf, sum } from '../lib/aggregate.js'
import { thresholdKind } from '../lib/status.js'
import { osCompositionPanel } from './operatingSystems.js'
import { complianceBulletPanel } from './softwareUpdates.js'

const percentMetric = (part, whole, detail) => {
  const value = percentOf(part, whole)
  return { value, format: 'percent', kind: thresholdKind(value), detail }
}

const countWhere = (rows, predicate) => rows.filter(predicate).length

export const overview = {
  id: 'overview',
  navLabel: 'Overview',
  icon: Dashboard,
  eyebrow: 'All categories',
  title: 'Fleet overview',
  summary: 'Headline health indicators from across the query library. Each tile runs one .sql file and links to the dashboard that explains it.',
  kpis: [
    {
      query: 'Operating-Systems/OS_Count_Summary',
      label: 'Managed devices',
      href: '#/operating-systems',
      compute: (rows) => ({ value: sum(rows, (row) => row['Device Count']), format: 'count', detail: `${rows.length} operating system editions` }),
    },
    {
      query: 'Operating-Systems/OS_Count_Summary',
      label: 'Workstations on Windows 11',
      href: '#/operating-systems',
      compute: (rows) => {
        const countOf = (fragment) => sum(rows.filter((row) => row['Operating System'].includes(fragment)), (row) => row['Device Count'])
        const windows10 = countOf('Windows 10')
        return percentMetric(countOf('Windows 11'), countOf('Windows 11') + windows10, `${formatNumber(windows10)} still on Windows 10`)
      },
    },
    {
      query: 'Client-Health/Client_Status',
      label: 'Active clients',
      href: '#/client-health',
      compute: (rows) =>
        percentMetric(
          countWhere(rows, (row) => row['Client Status'] === 'Active'),
          rows.length,
          `${formatNumber(countWhere(rows, (row) => row['Client Status'] !== 'Active'))} inactive or unmanaged`,
        ),
    },
    {
      query: 'Software-Updates/Update_Compliance_Summary',
      label: 'Update compliance',
      href: '#/software-updates',
      compute: (rows) => {
        const installed = sum(rows, (row) => row.Installed)
        const required = sum(rows, (row) => row.Required)
        return percentMetric(installed, installed + required, `${formatNumber(required)} required installs outstanding`)
      },
    },
    {
      query: 'Security/BitLocker_Status',
      label: 'OS volumes protected',
      href: '#/security',
      compute: (rows) => {
        const osVolumes = rows.filter((row) => row.Drive === 'C:')
        const protectedCount = countWhere(osVolumes, (row) => row['Protection Status'] === 'Protection On')
        return percentMetric(protectedCount, osVolumes.length, `${formatNumber(osVolumes.length - protectedCount)} without BitLocker protection`)
      },
    },
    {
      query: 'Security/Secure_Boot_Status',
      label: 'Secure Boot enabled',
      href: '#/security',
      compute: (rows) =>
        percentMetric(
          countWhere(rows, (row) => row['Secure Boot Status'] === 'Enabled'),
          rows.length,
          `${formatNumber(countWhere(rows, (row) => row['Boot Mode'] === 'Legacy BIOS'))} on legacy BIOS`,
        ),
    },
    {
      query: 'Security/Defender_Status',
      label: 'Signatures under 7 days',
      href: '#/security',
      compute: (rows) => {
        const reporting = rows.filter((row) => row['Signature Age (Days)'] !== null)
        const stale = countWhere(reporting, (row) => row['Signature Age (Days)'] > 7)
        return percentMetric(reporting.length - stale, reporting.length, `${formatNumber(stale)} devices with stale signatures`)
      },
    },
    {
      query: 'Applications/Deployment_Summary',
      label: 'App deployment success',
      href: '#/applications',
      compute: ([summary]) => {
        const value = summary?.['Overall Success Rate %'] ?? 0
        return { value, format: 'percent', kind: thresholdKind(value), detail: `${formatNumber(summary?.['Total Failed'])} failed installs` }
      },
    },
  ],
  panels: [osCompositionPanel, complianceBulletPanel],
}
