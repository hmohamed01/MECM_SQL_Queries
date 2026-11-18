import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

const EXCLUDED_DIRECTORIES = new Set(['RDL', 'dashboards', 'node_modules', '.git', '.claude'])
const HEADER_PATTERN = /^\s*\/\*([\s\S]*?)\*\//
const DECLARE_PATTERN = /^\s*DECLARE\s+@(\w+)\s+(\w+)\s*(?:\(\s*(\d+)\s*\))?\s*=\s*(.+?)\s*;?\s*$/gim
const FIELD_PATTERN = /^([A-Za-z][A-Za-z ]*?):\s*(.*)$/
const RULE_LINE_PATTERN = /^[=\-]{3,}$/

// Header comments use "Key: value" lines; following lines continue the field until a blank line.
const parseHeader = (headerText) => {
  const lines = headerText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => !RULE_LINE_PATTERN.test(line))
  const titleIndex = lines.findIndex(Boolean)

  const fields = {}
  let currentField = null
  for (const line of lines.slice(titleIndex + 1)) {
    const fieldMatch = line.match(FIELD_PATTERN)
    if (!line || line.startsWith('---')) {
      currentField = null
    } else if (fieldMatch) {
      currentField = fieldMatch[1].toLowerCase()
      fields[currentField] = fieldMatch[2]
    } else if (currentField) {
      fields[currentField] = `${fields[currentField]} ${line}`.trim()
    }
  }

  return {
    title: lines[titleIndex] ?? '',
    description: fields.description ?? '',
    views: (fields['views used'] ?? '').split(',').map((view) => view.trim()).filter(Boolean),
    notes: [fields.note, fields.usage, fields.prerequisite].filter(Boolean),
  }
}

const parseDefaultValue = (rawDefault) => {
  const quoted = rawDefault.match(/^N?'(.*)'$/)
  return quoted ? quoted[1] : Number(rawDefault)
}

const parseQueryFile = (relativePath, contents) => {
  const header = contents.match(HEADER_PATTERN)
  const params = [...contents.matchAll(DECLARE_PATTERN)].map(([, name, type, length, rawDefault]) => {
    const defaultValue = parseDefaultValue(rawDefault)
    return {
      name,
      type: type.toUpperCase(),
      length: length ? Number(length) : undefined,
      defaultValue,
      wrapsWithWildcards: typeof defaultValue === 'string' && /^%.*%$/.test(defaultValue),
    }
  })

  return {
    id: relativePath.replace(/\\/g, '/').replace(/\.sql$/i, ''),
    file: relativePath.replace(/\\/g, '/'),
    category: path.dirname(relativePath),
    ...parseHeader(header?.[1] ?? ''),
    params,
    batch: contents.replace(HEADER_PATTERN, '').replace(DECLARE_PATTERN, '').trim(),
  }
}

export const loadQueryCatalog = async () => {
  const entries = await readdir(REPO_ROOT, { withFileTypes: true })
  const categoryDirectories = entries.filter(
    (entry) => entry.isDirectory() && !EXCLUDED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.'),
  )

  const catalog = new Map()
  for (const directory of categoryDirectories) {
    const files = await readdir(path.join(REPO_ROOT, directory.name))
    for (const fileName of files.filter((name) => name.toLowerCase().endsWith('.sql'))) {
      const relativePath = path.join(directory.name, fileName)
      const contents = await readFile(path.join(REPO_ROOT, relativePath), 'utf8')
      const query = parseQueryFile(relativePath, contents)
      catalog.set(query.id, query)
    }
  }
  return catalog
}
