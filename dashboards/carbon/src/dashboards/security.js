import { Security } from '@carbon/icons-react'
import { countBy } from '../lib/aggregate.js'
import { POSITIVE_ENABLED, POSITIVE_YES, statusScale } from '../lib/status.js'
import { donut, horizontalBar, statusHistogram, statusStackedBar } from './chartBuilders.js'

const SIGNATURE_SEVERITIES = ['Critical (> 14 days)', 'Warning (> 7 days)', 'No Signature Data']
const signatureBand = (days) => (days > 14 ? 'Critical (> 14 days)' : days > 7 ? 'Warning (> 7 days)' : 'OK')
const TPM_SPEC_KINDS = { 'TPM 2.0': 'succeeded', 'TPM 1.2': 'caution-major', 'No TPM data': 'unknown' }
const NO_VOLUME_NODE = 'No volume data'
// Alluvial nodes stack in input order; a fixed order keeps tiny nodes off the bottom edge where labels clip.
const CONVERSION_ORDER = ['Fully Encrypted', 'Encryption In Progress', 'Encryption Paused', 'Decryption In Progress', 'Decryption Paused', 'Fully Decrypted', 'Unknown']
const PROTECTION_ORDER = ['Protection On', 'Protection Off', 'Protection Unknown', NO_VOLUME_NODE]
const orderOf = (order, name) => (order.includes(name) ? order.indexOf(name) : order.length)

const signalStack = (rows, signals, states, overrides, theme) =>
  statusStackedBar({
    data: states.flatMap((state) =>
      signals.map(([signal, column]) => ({ group: state, key: signal, value: rows.filter((row) => row[column] === state).length })),
    ),
    valueTitle: 'Devices',
    theme,
    overrides,
  })

export const security = {
  id: 'security',
  navLabel: 'Security',
  icon: Security,
  eyebrow: 'Security',
  title: 'Security posture',
  summary: 'Disk encryption, TPM and Secure Boot readiness, and the health of Microsoft Defender Antivirus.',
  panels: [
    {
      query: 'Security/BitLocker_Status',
      title: 'BitLocker: conversion → protection',
      chart: 'alluvial',
      span: 10,
      height: '440px',
      rationale:
        'An alluvial diagram shows flows between two categorical states. A volume can be fully encrypted but have protection suspended (after a BIOS update, for example), and the flow from "Fully Encrypted" into "Protection Off" exposes that silent gap.',
      build: (rows) => {
        const protectionNode = (status) => (status === 'Unknown' ? NO_VOLUME_NODE : status)
        const flows = countBy(rows, (row) => `${row['Conversion Status']}|${protectionNode(row['Protection Status'])}`)
        const data = [...flows]
          .map(([key, value]) => {
            const [source, target] = key.split('|')
            return { source, target, value }
          })
          .sort((left, right) => orderOf(CONVERSION_ORDER, left.source) - orderOf(CONVERSION_ORDER, right.source) || orderOf(PROTECTION_ORDER, left.target) - orderOf(PROTECTION_ORDER, right.target))
        const byOrder = (order) => (left, right) => orderOf(order, left) - orderOf(order, right)
        return {
          data,
          options: {
            alluvial: {
              units: 'volumes',
              nodePadding: 14,
              nodes: [
                ...[...new Set(data.map(({ source }) => source))].sort(byOrder(CONVERSION_ORDER)).map((name) => ({ name, category: 'Conversion status' })),
                ...[...new Set(data.map(({ target }) => target))].sort(byOrder(PROTECTION_ORDER)).map((name) => ({ name, category: 'Protection status' })),
              ],
            },
          },
        }
      },
    },
    {
      query: 'Security/BitLocker_Not_Encrypted',
      title: 'Unencrypted OS volumes',
      chart: 'bar',
      span: 6,
      height: '440px',
      rationale:
        'The exceptions list breaks down into a few distinct reasons, each needing a different fix. Ranked bars in status colors put the actionable ones, decrypted or paused, ahead of in-progress work.',
      emptyText: 'Every OS volume is fully encrypted',
      emptyKind: 'succeeded',
      build: (rows, { theme }) => {
        const reasons = [...countBy(rows, (row) => row.Status)].sort(([, left], [, right]) => right - left)
        return horizontalBar({
          data: reasons.map(([reason, count]) => ({ group: reason, key: reason, value: count })),
          valueTitle: 'Devices',
          labelDomain: reasons.map(([reason]) => reason),
          colorScale: statusScale(reasons.map(([reason]) => reason), theme),
        })
      },
    },
    {
      query: 'Security/TPM_Status',
      title: 'TPM readiness',
      chart: 'stackedBar',
      span: 10,
      height: '260px',
      rationale:
        'BitLocker and Windows 11 need the TPM to be activated, enabled and owned at the same time. One stacked bar per requirement shows which of the three is failing.',
      build: (rows, { theme }) =>
        signalStack(
          rows,
          [['Activated', 'TPM Activated'], ['Enabled', 'TPM Enabled'], ['Owned', 'TPM Owned']],
          ['Yes', 'No', 'Unknown'],
          POSITIVE_YES,
          theme,
        ),
    },
    {
      query: 'Security/TPM_Status',
      title: 'TPM specification',
      chart: 'donut',
      span: 6,
      height: '260px',
      rationale:
        'Windows 11 requires TPM 2.0, so the specification split is a three-part whole that matters for upgrade planning. The raw SpecVersion string ("2.0, 0, 1.38") is reduced to its major version.',
      build: (rows, { theme }) => {
        const specOf = (version) => (version?.startsWith('2.0') ? 'TPM 2.0' : version?.startsWith('1.2') ? 'TPM 1.2' : 'No TPM data')
        const counts = countBy(rows, (row) => specOf(row['TPM Version']))
        const groups = Object.keys(TPM_SPEC_KINDS).filter((group) => counts.has(group))
        return donut({
          data: groups.map((group) => ({ group, value: counts.get(group) })),
          centerLabel: 'Devices',
          colorScale: statusScale(groups, theme, TPM_SPEC_KINDS),
        })
      },
    },
    {
      query: 'Security/Defender_Status',
      title: 'Signature age distribution',
      chart: 'histogram',
      span: 8,
      height: '320px',
      rationale:
        'Signature age is continuous, and the tail is where the risk sits. Bins break at the 7- and 14-day thresholds from Defender_Outdated_Signatures.sql, so both views agree.',
      build: (rows, { theme }) =>
        statusHistogram({
          rows,
          valueOf: (row) => row['Signature Age (Days)'],
          groupOf: (row) => signatureBand(row['Signature Age (Days)']),
          bins: [0, 1, 2, 3, 5, 7, 10, 14, 21, 30, 60],
          valueTitle: 'Signature age (days)',
          theme,
        }),
    },
    {
      query: 'Security/Defender_Status',
      title: 'Defender engine state',
      chart: 'stackedBar',
      span: 8,
      height: '320px',
      rationale:
        'Current signatures do nothing if real-time protection is off. Showing service and real-time state side by side covers both halves of "protected".',
      build: (rows, { theme }) =>
        signalStack(
          rows,
          [['Antimalware service', 'Antimalware Service'], ['Real-time protection', 'Real-Time Protection']],
          ['Enabled', 'Disabled', 'Unknown'],
          POSITIVE_ENABLED,
          theme,
        ),
    },
    {
      query: 'Security/Defender_Outdated_Signatures',
      title: 'Outdated signatures by site',
      chart: 'stackedBar',
      span: 8,
      height: '320px',
      rationale:
        'Stale signatures that cluster in one site usually mean that site\'s update source is broken, not individual devices. Stacking by severity per site makes that pattern stand out.',
      emptyText: 'Every device has signatures from the last 7 days',
      emptyKind: 'succeeded',
      build: (rows, { theme }) => {
        const counts = countBy(rows, (row) => `${row['AD Site'] ?? 'No site'}|${row.Status}`)
        const sites = [...new Set(rows.map((row) => row['AD Site'] ?? 'No site'))]
        return statusStackedBar({
          data: SIGNATURE_SEVERITIES.flatMap((status) => sites.map((site) => ({ group: status, key: site, value: counts.get(`${site}|${status}`) ?? 0 }))).filter(
            ({ value }) => value > 0,
          ),
          valueTitle: 'Devices',
          theme,
        })
      },
    },
    {
      query: 'Security/Secure_Boot_Status',
      title: 'Secure Boot by firmware mode',
      chart: 'stackedBar',
      span: 8,
      height: '320px',
      rationale:
        'Secure Boot needs UEFI firmware, so the two columns depend on each other. Stacking Secure Boot state inside each boot mode separates devices that only need a firmware setting changed from legacy BIOS devices that need conversion.',
      build: (rows, { theme }) => {
        const counts = countBy(rows, (row) => `${row['Boot Mode']}|${row['Secure Boot Status']}`)
        const modes = [...new Set(rows.map((row) => row['Boot Mode']))]
        return statusStackedBar({
          data: ['Enabled', 'Disabled', 'Unknown/Not Supported']
            .flatMap((state) => modes.map((mode) => ({ group: state, key: mode, value: counts.get(`${mode}|${state}`) ?? 0 })))
            .filter(({ value }) => value > 0),
          valueTitle: 'Devices',
          theme,
          overrides: POSITIVE_ENABLED,
        })
      },
    },
  ],
  records: [
    {
      query: 'Security/BitLocker_Not_Encrypted',
      tab: 'Not encrypted',
      title: 'OS volumes not fully encrypted',
      description: 'Devices whose C: volume is not fully encrypted, or that report no BitLocker data.',
      statusColumns: { Status: {} },
      emphasis: true,
    },
    {
      query: 'Security/Defender_Outdated_Signatures',
      tab: 'Outdated signatures',
      title: 'Outdated Defender signatures',
      description: 'Devices whose antivirus signatures are older than 7 days.',
      statusColumns: { Status: {} },
      emphasis: true,
    },
    {
      query: 'Security/BitLocker_Status',
      tab: 'BitLocker volumes',
      title: 'BitLocker status',
      description: 'Protection and conversion state for every encryptable volume.',
      statusColumns: { 'Protection Status': {}, 'Conversion Status': {} },
    },
    {
      query: 'Security/TPM_Status',
      tab: 'TPM',
      title: 'TPM status',
      description: 'TPM activation, enablement, ownership and specification per device.',
      statusColumns: { 'TPM Activated': POSITIVE_YES, 'TPM Enabled': POSITIVE_YES, 'TPM Owned': POSITIVE_YES },
    },
    {
      query: 'Security/Secure_Boot_Status',
      tab: 'Secure Boot',
      title: 'Secure Boot status',
      description: 'Secure Boot state and firmware boot mode per device.',
      statusColumns: { 'Secure Boot Status': POSITIVE_ENABLED },
    },
    {
      query: 'Security/Defender_Status',
      tab: 'Defender',
      title: 'Defender status',
      description: 'Antimalware service, real-time protection and signature versions per device.',
      statusColumns: { 'Antimalware Service': POSITIVE_ENABLED, 'Real-Time Protection': POSITIVE_ENABLED },
    },
  ],
}
