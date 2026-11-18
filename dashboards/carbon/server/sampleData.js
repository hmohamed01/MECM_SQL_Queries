// A seeded, internally consistent virtual MECM fleet. Every sample query is derived from the same
// devices, so totals agree across dashboards the same way they would against a real site database.

const NOW = new Date()
const DAY_MS = 86_400_000

const createRandom = (seed) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

const random = createRandom(20261118)
const chance = (probability) => random() < probability
const between = (min, max) => min + random() * (max - min)
const integerBetween = (min, max) => Math.floor(between(min, max + 1))
const pick = (items) => items[Math.floor(random() * items.length)]
const pickWeighted = (weightedItems) => {
  let threshold = random() * weightedItems.reduce((sum, [, weight]) => sum + weight, 0)
  for (const [item, weight] of weightedItems) {
    threshold -= weight
    if (threshold < 0) return item
  }
  return weightedItems.at(-1)[0]
}

const daysAgo = (days) => new Date(NOW.getTime() - days * DAY_MS)
const startOfUtcDay = (date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
const datediffDays = (date) => (date ? Math.round((startOfUtcDay(NOW) - startOfUtcDay(date)) / DAY_MS) : null)
const formatDate = (date) => (date ? date.toISOString().slice(0, 10) : null)
const formatDateTime = (date) => (date ? date.toISOString().slice(0, 16).replace('T', ' ') : null)
const randomSerial = (length) =>
  Array.from({ length }, () => pick([...'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'])).join('')

// ── Reference data ───────────────────────────────────────────────────────────

const WORKSTATION_SITES = [
  [{ site: 'HQ-Site', prefix: 'HQ' }, 44],
  [{ site: 'Branch-A', prefix: 'BRA' }, 19],
  [{ site: 'Branch-B', prefix: 'BRB' }, 15],
  [{ site: 'Branch-C', prefix: 'BRC' }, 11],
  [{ site: 'Remote-VPN', prefix: 'RMT' }, 11],
]
const SERVER_SITES = [['Datacenter-East', 55], ['Datacenter-West', 35], ['HQ-Site', 10]]

const SURNAMES = [
  'smith', 'jones', 'garcia', 'lee', 'wilson', 'davis', 'brown', 'nguyen', 'patel', 'kim', 'martin', 'clark',
  'lewis', 'walker', 'hall', 'allen', 'young', 'king', 'wright', 'lopez', 'hill', 'scott', 'green', 'adams',
  'baker', 'nelson', 'carter', 'mitchell', 'perez', 'roberts', 'turner', 'phillips', 'campbell', 'parker',
  'evans', 'edwards', 'collins', 'stewart', 'morris', 'rogers', 'reed', 'cook', 'morgan', 'bell', 'murphy',
  'bailey', 'rivera', 'cooper', 'richardson', 'cox', 'howard', 'ward', 'torres', 'peterson', 'gray', 'ramirez',
]
const USER_POOL = Array.from({ length: 1150 }, () => `${pick([...'abcdefghijklmnoprstw'])}${pick(SURNAMES)}`)

// [manufacturer, model, chassisType, weight, processor, cores, logicalProcessors, ramOptions, diskSizesGB, isLegacy]
const WORKSTATION_MODELS = [
  ['Dell Inc.', 'Latitude 5540', 10, 16, '13th Gen Intel(R) Core(TM) i5-1345U', 10, 12, [[16, 70], [32, 30]], [476], false],
  ['Dell Inc.', 'Latitude 7440', 10, 9, '13th Gen Intel(R) Core(TM) i7-1365U', 10, 12, [[16, 40], [32, 60]], [476, 953], false],
  ['Dell Inc.', 'Latitude 5520', 9, 7, '11th Gen Intel(R) Core(TM) i5-1145G7 @ 2.60GHz', 4, 8, [[8, 55], [16, 45]], [237], true],
  ['Dell Inc.', 'OptiPlex 7010', 3, 11, '13th Gen Intel(R) Core(TM) i5-13500', 14, 20, [[16, 75], [32, 25]], [476], false],
  ['Dell Inc.', 'Precision 3660', 7, 3, '13th Gen Intel(R) Core(TM) i9-13900', 24, 32, [[64, 70], [128, 30]], [953], false],
  ['Lenovo', 'ThinkPad T14 Gen 4', 10, 11, '13th Gen Intel(R) Core(TM) i7-1355U', 10, 12, [[16, 60], [32, 40]], [476], false],
  ['Lenovo', 'ThinkPad X1 Carbon Gen 11', 10, 3, '13th Gen Intel(R) Core(TM) i7-1365U', 10, 12, [[32, 100]], [476, 953], false],
  ['Lenovo', 'ThinkCentre M90q Gen 3', 3, 6, '12th Gen Intel(R) Core(TM) i5-12500T', 6, 12, [[16, 100]], [237, 476], false],
  ['HP', 'EliteBook 840 G10', 10, 9, '13th Gen Intel(R) Core(TM) i5-1345U', 10, 12, [[16, 65], [32, 35]], [476], false],
  ['HP', 'EliteBook 840 G8', 10, 6, '11th Gen Intel(R) Core(TM) i5-1145G7 @ 2.60GHz', 4, 8, [[8, 50], [16, 50]], [237], true],
  ['HP', 'ProDesk 400 G7', 15, 5, 'Intel(R) Core(TM) i5-10500 CPU @ 3.10GHz', 6, 12, [[8, 60], [16, 40]], [237, 476], true],
  ['HP', 'EliteOne 840 G9', 13, 3, '12th Gen Intel(R) Core(TM) i7-12700', 12, 20, [[16, 50], [32, 50]], [476], false],
  ['Microsoft Corporation', 'Surface Laptop 5', 9, 4, '12th Gen Intel(R) Core(TM) i7-1265U', 10, 12, [[16, 70], [32, 30]], [237, 476], false],
  ['Microsoft Corporation', 'Virtual Machine', 1, 4, 'Intel(R) Xeon(R) Gold 6338 CPU @ 2.00GHz', 8, 16, [[32, 60], [64, 40]], [127], false],
].map(([manufacturer, model, chassis, weight, processor, cores, logical, ramOptions, diskSizes, isLegacy]) => [
  { manufacturer, model, chassis, processor, cores, logical, ramOptions, diskSizes, isLegacy },
  weight,
])

const WORKSTATION_OS = {
  modern: [
    [{ caption: 'Microsoft Windows 11 Enterprise', builds: [['26100', 58], ['22631', 34], ['22621', 8]] }, 66],
    [{ caption: 'Microsoft Windows 10 Enterprise', builds: [['19045', 93], ['19044', 7]] }, 17],
    [{ caption: 'Microsoft Windows 11 Pro', builds: [['26100', 55], ['22631', 45]] }, 11],
    [{ caption: 'Microsoft Windows 10 Pro', builds: [['19045', 100]] }, 3],
    [{ caption: 'Microsoft Windows 10 Enterprise LTSC', builds: [['19044', 100]] }, 3],
  ],
  legacy: [
    [{ caption: 'Microsoft Windows 10 Enterprise', builds: [['19045', 90], ['19044', 10]] }, 52],
    [{ caption: 'Microsoft Windows 11 Enterprise', builds: [['22631', 60], ['26100', 40]] }, 30],
    [{ caption: 'Microsoft Windows 10 Pro', builds: [['19045', 100]] }, 12],
    [{ caption: 'Microsoft Windows 10 Enterprise LTSC', builds: [['19044', 100]] }, 6],
  ],
  virtual: [[{ caption: 'Microsoft Windows 11 Enterprise multi-session', builds: [['26100', 70], ['22631', 30]] }, 1]],
}

// Feature updates reset Win32_OperatingSystem.InstallDate, so install dates cluster after each release.
const BUILD_INSTALL_WINDOWS = {
  26100: [0, 760], 22631: [760, 1120], 22621: [1120, 1480], 19045: [900, 1900], 19044: [1300, 2200],
  20348: [300, 1500], 17763: [900, 2300], 14393: [1800, 3000], 9600: [2800, 4000],
}

const SERVER_OS = [
  [{ caption: 'Microsoft Windows Server 2022 Standard', build: '20348' }, 30],
  [{ caption: 'Microsoft Windows Server 2022 Datacenter', build: '20348' }, 12],
  [{ caption: 'Microsoft Windows Server 2019 Standard', build: '17763' }, 22],
  [{ caption: 'Microsoft Windows Server 2019 Datacenter', build: '17763' }, 5],
  [{ caption: 'Microsoft Windows Server 2016 Standard', build: '14393' }, 13],
  [{ caption: 'Microsoft Windows Server 2012 R2 Standard', build: '9600' }, 6],
  [{ caption: 'Microsoft Windows Server 2025 Standard', build: '26100' }, 8],
]

const SERVER_HARDWARE = {
  vmware: { manufacturer: 'VMware, Inc.', model: 'VMware7,1', chassis: 1, processor: 'Intel(R) Xeon(R) Gold 6338 CPU @ 2.00GHz' },
  hyperv: { manufacturer: 'Microsoft Corporation', model: 'Virtual Machine', chassis: 1, processor: 'Intel(R) Xeon(R) Gold 6338 CPU @ 2.00GHz' },
  r650: { manufacturer: 'Dell Inc.', model: 'PowerEdge R650', chassis: 23, processor: 'Intel(R) Xeon(R) Gold 6338 CPU @ 2.00GHz', cores: 32, ram: [[256, 50], [512, 50]] },
  dl380: { manufacturer: 'HPE', model: 'ProLiant DL380 Gen10', chassis: 23, processor: 'Intel(R) Xeon(R) Gold 6248 CPU @ 2.50GHz', cores: 20, ram: [[128, 40], [256, 60]] },
}

const IIS_FEATURES = [
  'Web-WebServer', 'Web-Common-Http', 'Web-Default-Doc', 'Web-Static-Content', 'Web-Http-Errors',
  'Web-Http-Logging', 'Web-Filtering', 'Web-Mgmt-Console', 'Web-Asp-Net45', 'Web-Net-Ext45', 'Web-ISAPI-Ext', 'Web-ISAPI-Filter',
]
const SERVER_PROFILES = [
  { prefix: 'DC', count: 8, user: 'svcadmin', roles: ['AD-Domain-Services', 'DNS'], features: ['RSAT-AD-Tools', 'RSAT-AD-PowerShell', 'RSAT-ADDS', 'RSAT-DNS-Server', 'GPMC'] },
  { prefix: 'DHCP', count: 2, user: 'svcadmin', roles: ['DHCP'], features: ['RSAT-DHCP'] },
  { prefix: 'FS', count: 9, user: 'fileadmin', roles: ['File-Services'], features: ['FS-FileServer', 'FS-DFS-Namespace', 'FS-DFS-Replication', 'FS-Resource-Manager', 'FS-Data-Deduplication'] },
  { prefix: 'WEB', count: 12, user: 'webadmin', roles: ['Web-Server'], features: IIS_FEATURES },
  { prefix: 'SQL', count: 10, user: 'sqladmin', roles: [], features: ['NET-Framework-Core', 'Failover-Clustering', 'RSAT-Clustering'] },
  { prefix: 'HV', count: 6, user: 'svcadmin', roles: ['Hyper-V'], features: ['Hyper-V-PowerShell', 'RSAT-Hyper-V-Tools', 'Failover-Clustering', 'RSAT-Clustering', 'Multipath-IO'], physical: true },
  { prefix: 'RDS', count: 6, user: 'appadmin', roles: ['Remote-Desktop-Services'], features: ['RDS-RD-Server', 'RDS-Licensing'] },
  { prefix: 'PRT', count: 2, user: 'svcadmin', roles: ['Print-Services'], features: ['Print-Server'] },
  { prefix: 'CM', count: 3, user: 'cmadmin', roles: ['Web-Server', 'WSUS'], features: ['UpdateServices-Services', 'UpdateServices-DB', 'BITS', 'RDC', ...IIS_FEATURES] },
  { prefix: 'PKI', count: 2, user: 'svcadmin', roles: ['ADCS-Cert-Authority', 'Web-Server'], features: ['ADCS-Web-Enrollment', 'RSAT-ADCS', 'Web-WebServer'] },
  { prefix: 'NPS', count: 2, user: 'svcadmin', roles: ['NPAS'], features: [] },
  { prefix: 'ADFS', count: 2, user: 'svcadmin', roles: ['ADFS-Federation'], features: [] },
  { prefix: 'WDS', count: 1, user: 'cmadmin', roles: ['WDS'], features: ['WDS-Deployment', 'WDS-Transport'] },
  { prefix: 'APP', count: 21, user: 'appadmin', roles: [], features: ['NET-Framework-Core'] },
]

const CLIENT_VERSIONS = [['5.00.9135.1007', 56], ['5.00.9132.1011', 26], ['5.00.9128.1007', 11], ['5.00.9122.1007', 4], ['5.00.9106.1000', 3]]

const PERSONAS = [['standard', 70], ['developer', 8], ['finance', 10], ['analyst', 6], ['field', 6]]

// ── Fleet construction ──────────────────────────────────────────────────────

const buildOperatingSystem = (caption, build) => {
  const [minDays, maxDays] = BUILD_INSTALL_WINDOWS[build] ?? [0, 1500]
  return {
    caption,
    build,
    version: `10.0.${build}`,
    installDate: daysAgo(minDays + Math.pow(random(), 1.35) * (maxDays - minDays)),
  }
}

const buildUptimeDays = (isServer) =>
  isServer
    ? pickWeighted([[between(0, 32), 74], [between(32, 60), 12], [between(60, 90), 7], [between(90, 240), 7]])
    : pickWeighted([[between(0, 7), 58], [between(7, 14), 19], [between(14, 30), 13], [between(30, 120), 10]])

const buildDisks = (diskSizesGB, isServer) => {
  const cSize = pick(diskSizesGB)
  const freeProfile = pickWeighted([['healthy', 94], ['critical', 1.6], ['warning', 2.2], ['lowPercent', 2.2]])
  const cFreeGB = {
    healthy: between(cSize * 0.14, cSize * 0.62),
    critical: between(0.6, 4.9),
    warning: between(5.1, 9.9),
    lowPercent: Math.min(between(10.2, 40), cSize * between(0.05, 0.095)),
  }[freeProfile]
  const disks = [{ drive: 'C:', volume: isServer ? 'System' : 'Windows', sizeMB: cSize * 1024, freeMB: Math.max(cFreeGB, 0.1) * 1024 }]

  if (isServer) {
    const dataSize = pick([200, 500, 1024, 2048])
    disks.push({ drive: 'D:', volume: 'Data', sizeMB: dataSize * 1024, freeMB: dataSize * between(0.08, 0.7) * 1024 })
    if (chance(0.3)) disks.push({ drive: 'E:', volume: 'Logs', sizeMB: 100 * 1024, freeMB: between(4, 80) * 1024 })
  } else if (chance(0.12)) {
    disks.push({ drive: 'D:', volume: 'Data', sizeMB: 953 * 1024, freeMB: between(120, 800) * 1024 })
  }
  return disks.map((disk) => ({ ...disk, fileSystem: 'NTFS', sizeMB: Math.round(disk.sizeMB), freeMB: Math.round(disk.freeMB) }))
}

const buildClient = () => {
  const isActive = chance(0.945)
  const lastDdr = isActive ? daysAgo(between(0, 6)) : daysAgo(pickWeighted([[between(31, 60), 45], [between(61, 90), 25], [between(91, 260), 30]]))
  const hwStale = isActive && chance(0.03)
  return {
    version: pickWeighted(CLIENT_VERSIONS),
    activeStatus: isActive ? 1 : 0,
    isActiveDdr: isActive ? 1 : 0,
    isActiveHw: isActive && !hwStale ? 1 : 0,
    lastDdr,
    lastHw: hwStale ? daysAgo(between(15, 45)) : daysAgo(datediffDays(lastDdr) + between(0, 3)),
    lastPolicyRequest: daysAgo(datediffDays(lastDdr) + between(0, 0.4)),
  }
}

const buildBitLocker = (device) => {
  if (device.isVirtual || device.isServer) return []
  const conversion = pickWeighted([[1, 91], [0, 3.5], [2, 2.5], [4, 0.8], [3, 0.5], [5, 0.2], [null, 1.5]])
  const suspended = conversion === 1 && chance(0.035)
  const protection = conversion === 1 && !suspended ? 1 : conversion === null ? 2 : 0
  const method = conversion === 0 ? 0 : pickWeighted([[7, 72], [6, 26], [4, 2]])
  const volumes = [{ drive: 'C:', protection, conversion, method, protectors: conversion === 0 ? null : 'TPM, RecoveryPassword' }]
  const dataDisk = device.disks.find((disk) => disk.drive === 'D:')
  if (dataDisk) volumes.push({ drive: 'D:', protection: conversion === 1 ? 1 : 0, conversion: conversion === 1 ? 1 : 0, method, protectors: 'RecoveryPassword' })
  return volumes
}

const buildSecurity = (device) => {
  const isLegacyBios = !device.isVirtual && device.hardware.isLegacy && chance(0.12)
  const firmwareMissing = chance(0.015)
  const firmware = firmwareMissing
    ? null
    : { uefi: isLegacyBios ? 0 : 1, secureBoot: isLegacyBios ? 0 : chance(device.isServer ? 0.8 : 0.955) ? 1 : 0 }

  const hasTpm = !device.isVirtual || device.hardware.manufacturer === 'Microsoft Corporation'
  const tpm = hasTpm && !chance(0.01)
    ? {
        activated: chance(0.975) ? 1 : 0,
        enabled: chance(0.985) ? 1 : 0,
        owned: chance(0.965) ? 1 : 0,
        spec: device.hardware.isLegacy && chance(0.18) ? '1.2, 2, 3' : '2.0, 0, 1.38',
        manufacturerVersion: pick(['7.2.3.1', '7.63.3353.0', '1.3.2.8', '600.18.0.0']),
      }
    : null

  const sigAgeDays = pickWeighted([[between(0, 1.5), 88], [between(1.5, 7), 6.5], [between(7.2, 14), 2.6], [between(14.5, 75), 1.7]])
  const defender = chance(0.988)
    ? {
        amService: chance(0.993) ? 1 : 0,
        realTime: chance(0.978) ? 1 : 0,
        signatureDate: daysAgo(sigAgeDays),
        signatureVersion: `1.${Math.max(441 - Math.floor(sigAgeDays / 2), 401)}.${integerBetween(100, 899)}.0`,
        engineVersion: pickWeighted([['1.1.25100.9', 82], ['1.1.25090.3', 14], ['1.1.24080.9', 4]]),
      }
    : null

  return { firmware, tpm, defender }
}

const createDevice = ({ index, name, userName, site, isServer, hardware, os, persona, serverProfile }) => {
  const hasClient = isServer ? chance(0.98) : chance(0.962)
  const device = {
    resourceId: 16777216 + index * 7,
    name,
    userName,
    site,
    isServer,
    isVirtual: hardware.chassis === 1,
    hasClient,
    hardware,
    os,
    persona,
    serverProfile,
    serial: hardware.chassis === 1 ? `VMware-${randomSerial(12)}` : randomSerial(hardware.manufacturer === 'Dell Inc.' ? 7 : 10),
    disks: buildDisks(hardware.diskSizes ?? [127], isServer),
  }
  if (!hasClient) return { ...device, bitlocker: [], firmware: null, tpm: null, defender: null }

  const client = buildClient()
  const lastBoot = daysAgo(buildUptimeDays(isServer))
  return {
    ...device,
    client,
    os: { ...os, lastBoot },
    pendingReboot: chance(isServer ? 0.11 : 0.055),
    provisioningMode: !isServer && chance(0.006),
    bitlocker: buildBitLocker(device),
    ...buildSecurity(device),
    scan: {
      lastScan: client.activeStatus ? daysAgo(pickWeighted([[between(0, 1.5), 88], [between(1.5, 7), 7], [between(7, 30), 5]])) : daysAgo(datediffDays(client.lastDdr) + between(0, 2)),
      state: pickWeighted([[3, 93], [5, 2.6], [4, 1.6], [2, 0.6], [1, 1.2], [0, 1]]),
    },
  }
}

const buildWorkstations = () =>
  Array.from({ length: 1240 }, (_, index) => {
    const { site, prefix } = pickWeighted(WORKSTATION_SITES)
    const model = pickWeighted(WORKSTATION_MODELS)
    const isVirtual = model.chassis === 1
    const osProfile = pickWeighted(isVirtual ? WORKSTATION_OS.virtual : model.isLegacy ? WORKSTATION_OS.legacy : WORKSTATION_OS.modern)
    const build = pickWeighted(osProfile.builds)
    const chassisPrefix = isVirtual ? 'AVD' : [3, 4, 6, 7, 13, 15].includes(model.chassis) ? 'DT' : 'LT'
    return createDevice({
      index,
      name: `${isVirtual ? 'VDI' : prefix}-${chassisPrefix}${String(1000 + index).padStart(4, '0')}`,
      userName: pick(USER_POOL),
      site,
      isServer: false,
      hardware: { ...model, ramGB: pickWeighted(model.ramOptions), sockets: 1 },
      os: buildOperatingSystem(osProfile.caption, build),
      persona: pickWeighted(PERSONAS),
    })
  })

const buildServers = (startIndex) =>
  SERVER_PROFILES.flatMap((profile) =>
    Array.from({ length: profile.count }, (_, profileIndex) => {
      const isPhysical = profile.physical || (profile.prefix === 'SQL' && chance(0.3))
      const hardwareKey = isPhysical ? pick(['r650', 'dl380']) : chance(0.68) ? 'vmware' : 'hyperv'
      const base = SERVER_HARDWARE[hardwareKey]
      const legacyBias = ['FS', 'APP', 'PRT', 'RDS'].includes(profile.prefix)
      const osChoice = profile.physical
        ? pickWeighted([[{ caption: 'Microsoft Windows Server 2022 Datacenter', build: '20348' }, 4], [{ caption: 'Microsoft Windows Server 2019 Datacenter', build: '17763' }, 2]])
        : pickWeighted(SERVER_OS.map(([choice, weight]) => [choice, legacyBias && ['14393', '9600'].includes(choice.build) ? weight * 2.2 : weight]))
      return {
        profile,
        hardware: {
          ...base,
          sockets: isPhysical ? 2 : 1,
          cores: isPhysical ? base.cores : pickWeighted([[2, 20], [4, 45], [8, 28], [16, 7]]),
          logical: isPhysical ? base.cores * 2 : undefined,
          ramGB: isPhysical ? pickWeighted(base.ram) : pickWeighted([[8, 22], [16, 40], [32, 26], [64, 12]]),
          diskSizes: [127, 150],
          isLegacy: osChoice.build === '9600',
        },
        os: buildOperatingSystem(osChoice.caption, osChoice.build),
        name: `SRV-${profile.prefix}${String(profileIndex + 1).padStart(2, '0')}`,
      }
    }),
  ).map(({ profile, hardware, os, name }, offset) =>
    createDevice({
      index: startIndex + offset,
      name,
      userName: profile.user,
      site: pickWeighted(SERVER_SITES),
      isServer: true,
      hardware: { ...hardware, logical: hardware.logical ?? hardware.cores },
      os,
      serverProfile: profile,
    }),
  )

const workstations = buildWorkstations()
const servers = buildServers(workstations.length)
const devices = [...workstations, ...servers]
const inventoried = devices.filter((device) => device.hasClient)

// ── Software inventory (Add/Remove Programs) ─────────────────────────────────

const SOFTWARE_TITLES = [
  { name: 'Microsoft 365 Apps for enterprise - en-us', publisher: 'Microsoft Corporation', versions: [['16.0.19231.20156', 61], ['16.0.19127.20264', 29], ['16.0.18925.20184', 10]], reach: 0.97, scope: 'workstation' },
  { name: 'Microsoft Edge', publisher: 'Microsoft Corporation', versions: [['142.0.3595.65', 83], ['141.0.3537.99', 17]], reach: 1, scope: 'all' },
  { name: 'Microsoft Edge WebView2 Runtime', publisher: 'Microsoft Corporation', versions: [['142.0.3595.65', 90], ['141.0.3537.99', 10]], reach: 0.99, scope: 'all' },
  { name: 'Microsoft Teams', publisher: 'Microsoft Corporation', versions: [['25290.205.4069.4894', 76], ['25255.703.3998.5960', 24]], reach: 0.95, scope: 'workstation' },
  { name: 'Google Chrome', publisher: 'Google LLC', versions: [['142.0.7444.162', 49], ['141.0.7390.123', 31], ['140.0.7339.208', 13], ['138.0.7204.184', 7]], reach: 0.88, scope: 'workstation' },
  { name: 'Adobe Acrobat (64-bit)', publisher: 'Adobe', versions: [['25.001.20844', 57], ['25.001.20693', 31], ['24.005.20414', 12]], reach: 0.74, scope: 'workstation' },
  { name: 'Zoom Workplace (64-bit)', publisher: 'Zoom Communications, Inc.', versions: [['6.6.2.6371', 64], ['6.5.7.3298', 36]], reach: 0.68, scope: 'workstation' },
  { name: 'Cisco Secure Client - AnyConnect VPN', publisher: 'Cisco Systems, Inc.', versions: [['5.1.8.105', 81], ['5.1.4.74', 19]], reach: 0.81, scope: 'workstation' },
  { name: 'Mozilla Firefox (x64 en-US)', publisher: 'Mozilla', versions: [['145.0.1', 52], ['144.0.2', 30], ['128.5.0', 18]], reach: 0.17, scope: 'workstation' },
  { name: 'Notepad++ (64-bit x64)', publisher: 'Notepad++ Team', versions: [['8.8.7', 54], ['8.7.4', 31], ['8.5.8', 15]], reach: 0.34, scope: 'all' },
  { name: 'VLC media player', publisher: 'VideoLAN', versions: [['3.0.21', 78], ['3.0.18', 22]], reach: 0.21, scope: 'workstation' },
  { name: 'Citrix Workspace 2409', publisher: 'Citrix Systems, Inc.', versions: [['24.9.10.28', 100]], reach: 0.24, scope: 'workstation' },
  { name: 'Slack (Machine - MSI)', publisher: 'Slack Technologies Inc.', versions: [['4.46.101', 100]], reach: 0.14, scope: 'workstation' },
  { name: 'Webex', publisher: 'Cisco Systems, Inc', versions: [['45.10.0.33234', 100]], reach: 0.11, scope: 'workstation' },
  { name: 'Microsoft Visio - en-us', publisher: 'Microsoft Corporation', versions: [['16.0.19231.20156', 100]], reach: 0.06, scope: 'workstation' },
  { name: 'Microsoft Project - en-us', publisher: 'Microsoft Corporation', versions: [['16.0.19231.20156', 100]], reach: 0.04, scope: 'workstation' },
  { name: 'Microsoft Visual C++ 2015-2022 Redistributable (x64) - 14.44.35211', publisher: 'Microsoft Corporation', versions: [['14.44.35211.0', 100]], reach: 0.96, scope: 'all' },
  { name: 'Microsoft Visual C++ 2015-2022 Redistributable (x86) - 14.44.35211', publisher: 'Microsoft Corporation', versions: [['14.44.35211.0', 100]], reach: 0.89, scope: 'all' },
  { name: 'Microsoft Windows Desktop Runtime - 8.0.21 (x64)', publisher: 'Microsoft Corporation', versions: [['8.0.21.35217', 100]], reach: 0.79, scope: 'workstation' },
  { name: 'Microsoft Update Health Tools', publisher: 'Microsoft Corporation', versions: [['5.72.0.0', 100]], reach: 0.88, scope: 'workstation' },
  { name: 'Microsoft Policy Platform', publisher: 'Microsoft Corporation', versions: [['68.1.1010.0', 100]], reach: 1, scope: 'all' },
  { name: 'Local Administrator Password Solution', publisher: 'Microsoft Corporation', versions: [['6.2.0.0', 100]], reach: 0.38, scope: 'all' },
  { name: 'Java 8 Update 471 (64-bit)', publisher: 'Oracle Corporation', versions: [['8.0.4710.10', 70], ['8.0.4310.10', 30]], reach: 0.08, scope: 'all' },
  { name: '7-Zip 25.01 (x64)', publisher: 'Igor Pavlov', versions: [['25.01', 100]], reach: 0.41, scope: 'all' },
  { name: '7-Zip 23.01 (x64)', publisher: 'Igor Pavlov', versions: [['23.01', 100]], reach: 0.12, scope: 'all' },
  { name: '7-Zip 19.00 (x64)', publisher: 'Igor Pavlov', versions: [['19.00', 100]], reach: 0.04, scope: 'all' },
  { name: 'Dell Command | Update for Windows Universal', publisher: 'Dell Inc.', versions: [['5.5.0', 74], ['5.4.0', 26]], reach: 0.95, scope: 'workstation', manufacturer: 'Dell Inc.' },
  { name: 'Dell SupportAssist', publisher: 'Dell Inc.', versions: [['4.8.2.29006', 100]], reach: 0.46, scope: 'workstation', manufacturer: 'Dell Inc.' },
  { name: 'HP Wolf Security', publisher: 'HP Inc.', versions: [['4.7.2.4062', 100]], reach: 0.9, scope: 'workstation', manufacturer: 'HP' },
  { name: 'HP Support Assistant', publisher: 'HP Inc.', versions: [['9.47.41.0', 100]], reach: 0.58, scope: 'workstation', manufacturer: 'HP' },
  { name: 'Lenovo Vantage Service', publisher: 'Lenovo Group Ltd.', versions: [['4.3.97.0', 100]], reach: 0.93, scope: 'workstation', manufacturer: 'Lenovo' },
  { name: 'Lenovo System Update', publisher: 'Lenovo', versions: [['5.08.03.59', 100]], reach: 0.71, scope: 'workstation', manufacturer: 'Lenovo' },
  { name: 'Microsoft Visual Studio Code', publisher: 'Microsoft Corporation', versions: [['1.106.2', 70], ['1.105.1', 30]], reach: 0.92, scope: 'workstation', persona: 'developer' },
  { name: 'Git', publisher: 'The Git Development Community', versions: [['2.51.2', 65], ['2.47.1', 35]], reach: 0.85, scope: 'workstation', persona: 'developer' },
  { name: 'Python 3.13.9 (64-bit)', publisher: 'Python Software Foundation', versions: [['3.13.9150.0', 100]], reach: 0.66, scope: 'workstation', persona: 'developer' },
  { name: 'Node.js', publisher: 'Node.js Foundation', versions: [['24.11.1', 58], ['22.21.1', 42]], reach: 0.55, scope: 'workstation', persona: 'developer' },
  { name: 'PuTTY release 0.83 (64-bit)', publisher: 'Simon Tatham', versions: [['0.83.0.0', 100]], reach: 0.45, scope: 'workstation', persona: 'developer' },
  { name: 'Wireshark 4.4.10 x64', publisher: 'The Wireshark developer community', versions: [['4.4.10', 100]], reach: 0.21, scope: 'workstation', persona: 'developer' },
  { name: 'Microsoft SQL Server Management Studio - 21.6', publisher: 'Microsoft Corporation', versions: [['21.6.17.0', 100]], reach: 0.6, scope: 'workstation', persona: 'developer' },
  { name: 'SAP GUI for Windows 8.00 Patchlevel 12', publisher: 'SAP SE', versions: [['8.00.12', 100]], reach: 0.94, scope: 'workstation', persona: 'finance' },
  { name: 'Contoso Expense Tool', publisher: 'Contoso', versions: [['3.4.1', 82], ['3.2.0', 18]], reach: 0.9, scope: 'workstation', persona: 'finance' },
  { name: 'Microsoft Power BI Desktop (x64)', publisher: 'Microsoft Corporation', versions: [['2.148.1226.0', 100]], reach: 0.88, scope: 'workstation', persona: 'analyst' },
  { name: 'Tableau Desktop 2025.2', publisher: 'Tableau Software, LLC', versions: [['25.2.1450', 100]], reach: 0.72, scope: 'workstation', persona: 'analyst' },
  { name: 'Contoso Field Agent', publisher: 'Contoso', versions: [['2.9.0', 100]], reach: 0.95, scope: 'workstation', persona: 'field' },
  { name: 'Oracle Instant Client 19', publisher: 'Oracle Corporation', versions: [['19.25.0.0', 100]], reach: 0.5, scope: 'workstation', persona: 'finance' },
  { name: 'VMware Tools', publisher: 'VMware, Inc.', versions: [['12.5.2.24683', 100]], reach: 1, scope: 'server', manufacturer: 'VMware, Inc.' },
  { name: 'Azure Connected Machine Agent', publisher: 'Microsoft Corporation', versions: [['1.56.03109.2410', 100]], reach: 0.72, scope: 'server' },
  { name: 'Microsoft SQL Server 2022 (64-bit)', publisher: 'Microsoft Corporation', versions: [['16.0.4215.2', 100]], reach: 1, scope: 'server', serverProfile: 'SQL' },
]

const titleApplies = (title, device) =>
  (title.scope === 'all' || (title.scope === 'server') === device.isServer) &&
  (!title.manufacturer || title.manufacturer === device.hardware.manufacturer) &&
  (!title.persona || title.persona === device.persona) &&
  (!title.serverProfile || title.serverProfile === device.serverProfile?.prefix)

const softwareInstalls = inventoried.flatMap((device) => {
  const installs = SOFTWARE_TITLES.filter((title) => titleApplies(title, device) && chance(title.reach)).map((title) => ({
    device,
    name: title.name,
    publisher: title.publisher,
    version: pickWeighted(title.versions),
    installDate: chance(0.93) ? daysAgo(between(1, 720)) : null,
  }))
  return [
    ...installs,
    { device, name: 'Configuration Manager Client', publisher: 'Microsoft Corporation', version: device.client.version, installDate: daysAgo(between(10, 400)) },
  ]
})

// ── Software updates ────────────────────────────────────────────────────────

const isWindows11 = (device) => device.os.caption.includes('Windows 11')
const isWindows10 = (device) => device.os.caption.includes('Windows 10')
const serverBuild = (build) => (device) => device.isServer && device.os.build === build

// [title, article, bulletin, severity, classification, daysSincePosted, appliesTo, requiredRate]
const SOFTWARE_UPDATES = [
  ['2026-11 Cumulative Update for Windows 11 Version 24H2 for x64-based Systems (KB5068861)', '5068861', '', 10, 'Security Updates', 7, (d) => !d.isServer && d.os.build === '26100', 0.19],
  ['2026-11 Cumulative Update for Windows 11 Version 23H2 for x64-based Systems (KB5068865)', '5068865', '', 10, 'Security Updates', 7, (d) => !d.isServer && ['22631', '22621'].includes(d.os.build), 0.22],
  ['2026-11 Cumulative Update for Windows 10 Version 22H2 for x64-based Systems (KB5068781)', '5068781', '', 10, 'Security Updates', 7, (d) => isWindows10(d) && d.os.build === '19045', 0.24],
  ['2026-11 Cumulative Update for Windows 10 Enterprise LTSC 2021 (KB5068779)', '5068779', '', 10, 'Security Updates', 7, (d) => isWindows10(d) && d.os.build === '19044', 0.3],
  ['2026-10 Cumulative Update for Windows 11 Version 24H2 for x64-based Systems (KB5066835)', '5066835', '', 10, 'Security Updates', 35, (d) => !d.isServer && d.os.build === '26100', 0.025],
  ['2026-10 Cumulative Update for Windows 10 Version 22H2 for x64-based Systems (KB5066791)', '5066791', '', 10, 'Security Updates', 35, (d) => isWindows10(d), 0.04],
  ['2026-11 Cumulative Update for .NET Framework 3.5 and 4.8.1 for Windows 11 (KB5068998)', '5068998', '', 8, 'Security Updates', 7, isWindows11, 0.16],
  ['2026-11 Cumulative Update for .NET Framework 3.5 and 4.8.1 for Windows 10 (KB5068996)', '5068996', '', 8, 'Security Updates', 7, isWindows10, 0.2],
  ['Microsoft .NET 8.0.22 Security Update for x64 Client (KB5069120)', '5069120', '', 8, 'Security Updates', 7, (d) => !d.isServer && chance(0.8), 0.09],
  ['2026-11 Cumulative Update for Microsoft server operating system version 21H2 for x64-based Systems (KB5068787)', '5068787', '', 10, 'Security Updates', 7, serverBuild('20348'), 0.31],
  ['2026-11 Cumulative Update for Windows Server 2019 for x64-based Systems (KB5068791)', '5068791', '', 10, 'Security Updates', 7, serverBuild('17763'), 0.34],
  ['2026-11 Cumulative Update for Windows Server 2016 for x64-based Systems (KB5068864)', '5068864', '', 10, 'Security Updates', 7, serverBuild('14393'), 0.42],
  ['2026-11 Cumulative Update for Windows Server 2025 for x64-based Systems (KB5068861)', '5068861', '', 10, 'Security Updates', 7, serverBuild('26100'), 0.27],
  ['2026-11 Security Monthly Quality Rollup for Windows Server 2012 R2 (KB5068905)', '5068905', '', 8, 'Security Updates', 7, serverBuild('9600'), 0.5],
  ['2026-11 Servicing Stack Update for Windows Server 2016 for x64-based Systems (KB5068012)', '5068012', '', 10, 'Critical Updates', 7, serverBuild('14393'), 0.18],
  ['2026-11 Out-of-band Update for Windows 11 Version 24H2 (KB5070773)', '5070773', '', 10, 'Critical Updates', 3, (d) => !d.isServer && d.os.build === '26100', 0.34],
  ['Windows Malicious Software Removal Tool x64 - v5.143 (KB890830)', '890830', '', 0, 'Update Rollups', 7, () => true, 0.07],
  ['Update for Windows Security platform - KB5007651 (Version 10.0.29429.1000)', '5007651', '', 0, 'Updates', 21, (d) => !d.isServer, 0.05],
  ['Microsoft Edge-Stable Channel Version 142 Update for x64 based Editions (Build 142.0.3595.65)', '', '', 2, 'Updates', 9, () => true, 0.11],
  ['Update for Microsoft Defender Antivirus antimalware platform - KB4052623 (Version 4.18.25100.9008)', '4052623', '', 0, 'Updates', 18, () => true, 0.04],
  ['Security Intelligence Update for Microsoft Defender Antivirus - KB2267602 (Version 1.441.217.0)', '2267602', '', 0, 'Definition Updates', 0, () => true, 0.06],
  ['Security Update for Microsoft Office LTSC 2021 (KB5002793)', '5002793', '', 6, 'Security Updates', 7, (d) => !d.isServer && chance(0.05), 0.35],
].map(([title, articleId, bulletinId, severity, classification, daysPosted, appliesTo, requiredRate], index) => ({
  ciId: 16800000 + index,
  title,
  articleId,
  bulletinId,
  severity,
  classification,
  datePosted: daysAgo(daysPosted),
  appliesTo,
  requiredRate,
}))

// Unhealthy clients fall behind on patching, so their required rate is scaled up.
const updateStatuses = inventoried.flatMap((device) => {
  const healthMultiplier = device.client.activeStatus ? 1 : 3.4
  return SOFTWARE_UPDATES.filter((update) => update.appliesTo(device)).map((update) => ({
    device,
    update,
    status: chance(Math.min(update.requiredRate * healthMultiplier, 0.95)) ? 2 : 3,
  }))
})
const updateStatusesByDevice = new Map()
for (const entry of updateStatuses) {
  updateStatusesByDevice.set(entry.device, [...(updateStatusesByDevice.get(entry.device) ?? []), entry])
}

const UPDATE_GROUPS = [
  ['2026-11 Patch Tuesday - Workstations', (u) => u.datePosted > daysAgo(10) && !u.title.includes('Server') && u.classification !== 'Definition Updates', (d) => !d.isServer],
  ['2026-11 Patch Tuesday - Servers', (u) => u.datePosted > daysAgo(10) && (u.title.includes('Server') || u.title.includes('server')), (d) => d.isServer],
  ['2026-10 Patch Tuesday - Workstations', (u) => u.title.startsWith('2026-10'), (d) => !d.isServer],
  ['Definition Updates - Defender (ADR)', (u) => u.classification === 'Definition Updates', () => true],
  ['Microsoft Edge Updates', (u) => u.title.startsWith('Microsoft Edge'), () => true],
  ['.NET Runtime Security Updates', (u) => u.title.includes('.NET'), (d) => !d.isServer],
  ['Server 2012 R2 - Extended Security Updates', (u) => u.title.includes('2012 R2'), (d) => d.isServer],
]

// ── Collections ─────────────────────────────────────────────────────────────

const pilotDevices = new Set(workstations.filter(() => chance(0.02)).map((device) => device.resourceId))
const criticalDevices = new Set(workstations.filter((d) => d.site === 'HQ-Site' && chance(0.04)).map((device) => device.resourceId))

// [id, name, comment, refreshType, limitingCollection, isDirect, memberPredicate]
const COLLECTIONS = [
  ['SMS00001', 'All Systems', 'All Systems', 2, null, false, () => true],
  ['SMSDM003', 'All Desktop and Server Clients', 'All Desktop and Server Clients', 6, 'All Systems', false, (d) => d.hasClient],
  ['PS100001', 'All Workstations', 'All Windows workstation clients', 6, 'All Systems', false, (d) => !d.isServer],
  ['PS100002', 'All Servers', 'All Windows Server clients', 6, 'All Systems', false, (d) => d.isServer],
  ['PS100003', 'All Windows 11 Devices', 'Windows 11 workstations', 6, 'All Workstations', false, (d) => d.hasClient && isWindows11(d)],
  ['PS100004', 'All Windows 10 Devices', 'Windows 10 workstations', 6, 'All Workstations', false, (d) => d.hasClient && isWindows10(d)],
  ['PS100005', 'OSD - Windows 11 24H2 In-Place Upgrade', 'Windows 11 devices below 24H2', 6, 'All Windows 11 Devices', false, (d) => d.hasClient && isWindows11(d) && d.os.build !== '26100'],
  ['PS100006', 'OSD - Windows 10 to 11 Upgrade Candidates', 'TPM 2.0 and 16 GB+', 2, 'All Windows 10 Devices', false, (d) => d.hasClient && isWindows10(d) && d.hardware.ramGB >= 16 && d.tpm?.spec.startsWith('2.0')],
  ['PS100010', 'Workstations - HQ-Site', 'Site-based workstation collection', 2, 'All Workstations', false, (d) => !d.isServer && d.site === 'HQ-Site'],
  ['PS100011', 'Workstations - Branch-A', 'Site-based workstation collection', 2, 'All Workstations', false, (d) => !d.isServer && d.site === 'Branch-A'],
  ['PS100012', 'Workstations - Branch-B', 'Site-based workstation collection', 2, 'All Workstations', false, (d) => !d.isServer && d.site === 'Branch-B'],
  ['PS100013', 'Workstations - Branch-C', 'Site-based workstation collection', 2, 'All Workstations', false, (d) => !d.isServer && d.site === 'Branch-C'],
  ['PS100014', 'Workstations - Remote-VPN', 'Site-based workstation collection', 2, 'All Workstations', false, (d) => !d.isServer && d.site === 'Remote-VPN'],
  ['PS100020', 'Patch Ring 0 - IT Pilot', 'Direct-membership pilot devices', 1, 'All Workstations', true, (d) => pilotDevices.has(d.resourceId)],
  ['PS100021', 'Patch Ring 1 - Early Adopters', 'Branch-C early adopters', 2, 'All Workstations', false, (d) => !d.isServer && d.site === 'Branch-C'],
  ['PS100022', 'Patch Ring 2 - Broad', 'All remaining workstations', 6, 'All Workstations', false, (d) => !d.isServer && d.site !== 'Branch-C' && !criticalDevices.has(d.resourceId)],
  ['PS100023', 'Patch Ring 3 - Critical Systems', 'Manually approved critical workstations', 1, 'All Workstations', true, (d) => criticalDevices.has(d.resourceId)],
  ['PS100030', 'MW - Servers - Sunday 02:00', 'Maintenance window', 2, 'All Servers', false, (d) => d.isServer && d.site === 'Datacenter-East'],
  ['PS100031', 'MW - Servers - Saturday 22:00', 'Maintenance window', 2, 'All Servers', false, (d) => d.isServer && d.site !== 'Datacenter-East'],
  ['PS100032', 'MW - Domain Controllers', 'Maintenance window', 2, 'All Servers', false, (d) => d.serverProfile?.prefix === 'DC'],
  ['PS100040', 'APP - Microsoft 365 Apps - Required', 'Application deployment', 2, 'All Workstations', false, (d) => !d.isServer && d.hasClient],
  ['PS100041', 'APP - Adobe Acrobat - Required', 'Application deployment', 2, 'All Workstations', false, (d) => !d.isServer && d.hasClient && d.persona !== 'field'],
  ['PS100042', 'APP - Zoom Workplace - Required', 'Application deployment', 2, 'All Workstations', false, (d) => !d.isServer && d.hasClient && d.site !== 'Branch-B'],
  ['PS100043', 'APP - Developer Tools - Available', 'Developer workstations', 6, 'All Workstations', false, (d) => d.persona === 'developer' && d.hasClient],
  ['PS100044', 'APP - Finance Suite - Required', 'Finance department', 6, 'All Workstations', false, (d) => d.persona === 'finance' && d.hasClient],
  ['PS100045', 'APP - Analytics Tools - Required', 'Analyst workstations', 2, 'All Workstations', false, (d) => d.persona === 'analyst' && d.hasClient],
  ['PS100046', 'APP - Contoso Field Agent - Required', 'Field staff devices', 4, 'All Workstations', false, (d) => d.persona === 'field' && d.hasClient],
  ['PS100047', 'APP - Cisco Secure Client - Required', 'Remote and branch devices', 2, 'All Workstations', false, (d) => !d.isServer && d.hasClient && d.site !== 'HQ-Site'],
  ['PS100050', 'Health - Inactive Clients', 'Clients without heartbeat in 30 days', 6, 'All Systems', false, (d) => d.client && !d.client.activeStatus],
  ['PS100051', 'Health - Pending Reboot', 'Devices reporting a pending restart', 6, 'All Systems', false, (d) => d.pendingReboot],
  ['PS100052', 'Security - BitLocker Not Encrypted', 'OS volume not fully encrypted', 6, 'All Workstations', false, (d) => !d.isServer && d.hasClient && !d.isVirtual && d.bitlocker[0]?.conversion !== 1],
  ['PS100053', 'Security - Defender Signatures Outdated', 'Signatures older than 7 days', 6, 'All Systems', false, (d) => d.defender && datediffDays(d.defender.signatureDate) > 7],
  ['PS100060', 'OSD - Build and Capture', 'Reference image build', 1, 'All Systems', true, () => false],
  ['PS100061', 'Legacy - Windows 7 Devices', 'Remaining Windows 7 devices', 2, 'All Workstations', false, () => false],
  ['PS100062', 'APP - Java 8 Runtime - Uninstall', 'Retired runtime removal', 4, 'All Workstations', false, () => false],
  ['PS100063', 'Server 2008 R2 - Remaining', 'Decommission tracking', 6, 'All Servers', false, () => false],
  ['PS100064', 'Test - Remove Me', 'Temporary test collection', 1, 'All Systems', true, () => false],
  ['PS100065', 'Retired - Office 2016 Remediation', 'Retired remediation', 6, 'All Workstations', false, () => false],
].map(([collectionId, name, comment, refreshType, limitingCollection, isDirect, includes]) => {
  const members = devices.filter(includes)
  return { collectionId, name, comment, refreshType, limitingCollection, isDirect, members }
})
const collectionByName = new Map(COLLECTIONS.map((collection) => [collection.name, collection]))

// ── Applications ────────────────────────────────────────────────────────────

const ENFORCEMENT_PROFILES = {
  stable: [[1000, 82], [1001, 13], [2000, 1], [2001, 0.6], [2003, 0.8], [4002, 0.8], [4000, 0.3], [3000, 0.5], [null, 1]],
  heavy: [[1000, 77], [1001, 9], [2000, 2.5], [2001, 2], [2002, 1], [2004, 1.4], [2003, 1.6], [4001, 1.6], [4002, 1.4], [3000, 0.5], [null, 2]],
  flaky: [[1000, 71], [1001, 6], [2000, 2], [2006, 1.2], [4002, 7.5], [4004, 3.5], [4000, 1.5], [3000, 3], [null, 4]],
  remote: [[1000, 72], [1001, 5], [2001, 6], [2005, 2], [4001, 8], [4002, 1], [null, 6]],
}

// [ciId, name, manufacturer, version, isDeployed, isEnabled, deploymentTypes, createdDaysAgo, modifiedDaysAgo, deployments]
const APPLICATIONS = [
  [16777220, 'Microsoft 365 Apps for enterprise', 'Microsoft', '16.0', 1, 1, 2, 1210, 40, [['APP - Microsoft 365 Apps - Required', 'heavy']]],
  [16777225, 'Adobe Acrobat', 'Adobe Inc.', '25.001.20844', 1, 1, 1, 1100, 12, [['APP - Adobe Acrobat - Required', 'stable']]],
  [16777229, 'Zoom Workplace', 'Zoom Communications', '6.6.2', 1, 1, 1, 860, 9, [['APP - Zoom Workplace - Required', 'stable']]],
  [16777231, 'Cisco Secure Client', 'Cisco Systems', '5.1.8.105', 1, 1, 2, 690, 33, [['APP - Cisco Secure Client - Required', 'remote']]],
  [16777234, 'Visual Studio Code', 'Microsoft', '1.106.2', 1, 1, 1, 520, 14, [['APP - Developer Tools - Available', 'stable']]],
  [16777235, 'Git for Windows', 'The Git Development Community', '2.51.2', 1, 1, 1, 520, 30, [['APP - Developer Tools - Available', 'stable']]],
  [16777236, 'Python 3.13', 'Python Software Foundation', '3.13.9', 1, 1, 1, 210, 25, [['APP - Developer Tools - Available', 'stable']]],
  [16777240, 'SAP GUI for Windows 8.00', 'SAP SE', '8.00 PL12', 1, 1, 1, 1460, 120, [['APP - Finance Suite - Required', 'heavy']]],
  [16777241, 'Contoso Expense Tool', 'Contoso', '3.4.1', 1, 1, 2, 980, 6, [['APP - Finance Suite - Required', 'flaky']]],
  [16777242, 'Oracle Instant Client 19', 'Oracle Corporation', '19.25', 1, 1, 1, 1500, 300, [['APP - Finance Suite - Required', 'flaky']]],
  [16777245, 'Microsoft Power BI Desktop', 'Microsoft', '2.148', 1, 1, 1, 640, 21, [['APP - Analytics Tools - Required', 'stable']]],
  [16777246, 'Tableau Desktop 2025.2', 'Tableau Software', '2025.2', 1, 1, 1, 160, 18, [['APP - Analytics Tools - Required', 'heavy']]],
  [16777250, 'Contoso Field Agent', 'Contoso', '2.9.0', 1, 1, 1, 420, 4, [['APP - Contoso Field Agent - Required', 'remote']]],
  [16777253, 'Notepad++', 'Notepad++ Team', '8.8.7', 1, 1, 1, 1300, 50, [['APP - Developer Tools - Available', 'stable']]],
  [16777255, '7-Zip', 'Igor Pavlov', '25.01', 0, 1, 1, 1600, 380, []],
  [16777256, 'Google Chrome Enterprise', 'Google', '142.0', 0, 1, 1, 1550, 26, []],
  [16777257, 'Mozilla Firefox ESR', 'Mozilla', '140.5', 0, 1, 1, 1180, 210, []],
  [16777258, 'VLC media player', 'VideoLAN', '3.0.21', 0, 1, 1, 1700, 640, []],
  [16777259, 'Java 8 Runtime', 'Oracle Corporation', '8u471', 0, 0, 1, 2400, 700, []],
  [16777260, 'Legacy Payroll Client', 'Contoso', '1.8', 0, 0, 1, 2650, 1400, []],
  [16777261, 'Citrix Workspace', 'Citrix Systems', '2409', 0, 1, 2, 900, 360, []],
  [16777262, 'Wireshark', 'The Wireshark developer community', '4.4.10', 0, 1, 1, 300, 60, []],
  [16777263, 'Slack', 'Slack Technologies', '4.46', 0, 1, 1, 450, 90, []],
  [16777264, 'Microsoft Visio', 'Microsoft', '16.0', 0, 1, 1, 1000, 180, []],
  [16777265, 'Microsoft Project', 'Microsoft', '16.0', 0, 1, 1, 1000, 180, []],
  [16777266, 'Webex', 'Cisco Systems', '45.10', 0, 1, 1, 760, 400, []],
  [16777267, 'PuTTY', 'Simon Tatham', '0.83', 0, 1, 1, 1900, 220, []],
  [16777268, 'Remote Desktop Manager', 'Devolutions', '2025.3', 0, 1, 1, 90, 30, []],
].map(([ciId, name, manufacturer, version, isDeployed, isEnabled, deploymentTypes, createdDaysAgo, modifiedDaysAgo, deployments]) => ({
  ciId, name, manufacturer, version, isDeployed, isEnabled, deploymentTypes,
  created: daysAgo(createdDaysAgo),
  modified: daysAgo(modifiedDaysAgo),
  deployments,
}))

const appDeployments = APPLICATIONS.flatMap((application) =>
  application.deployments.map(([collectionName, profileName], index) => {
    const collection = collectionByName.get(collectionName)
    const profile = collection.name.includes('Cisco') ? ENFORCEMENT_PROFILES.remote : ENFORCEMENT_PROFILES[profileName]
    const states = collection.members.map((device) => ({
      device,
      enforcementState: device.site === 'Remote-VPN' && profileName !== 'stable' ? pickWeighted(ENFORCEMENT_PROFILES.remote) : pickWeighted(profile),
    }))
    return { assignmentId: application.ciId * 10 + index, application, collection, states }
  }),
)

// ── Query row builders ──────────────────────────────────────────────────────

const chassisName = (code) =>
  ({
    1: 'Other', 2: 'Unknown', 3: 'Desktop', 4: 'Low Profile Desktop', 5: 'Pizza Box', 6: 'Mini Tower', 7: 'Tower',
    8: 'Portable', 9: 'Laptop', 10: 'Notebook', 11: 'Hand Held', 12: 'Docking Station', 13: 'All in One',
    14: 'Sub Notebook', 15: 'Space-Saving', 16: 'Lunch Box', 17: 'Main System Chassis', 23: 'Rack Mount Chassis',
  })[code] ?? 'Unknown'

const featureUpdateName = (build) =>
  ({ 19041: '2004', 19042: '20H2', 19043: '21H1', 19044: '21H2', 19045: '22H2', 22000: '21H2', 22621: '22H2', 22631: '23H2', 26100: '24H2' })[build] ?? build

const serverVersionName = (caption) =>
  [['2025', 'Server 2025'], ['2022', 'Server 2022'], ['2019', 'Server 2019'], ['2016', 'Server 2016'], ['2012 R2', 'Server 2012 R2'], ['2012', 'Server 2012'], ['2008 R2', 'Server 2008 R2'], ['2008', 'Server 2008']]
    .find(([fragment]) => caption.includes(fragment))?.[1] ?? 'Other'

const yesNo = (value) => (value === 1 ? 'Yes' : value === 0 ? 'No' : 'Unknown')
const enabledDisabled = (value) => (value === 1 ? 'Enabled' : value === 0 ? 'Disabled' : 'Unknown')
const ramGB = (device) => device.hardware.ramGB
const deviceIdentity = (device) => ({
  ResourceID: device.resourceId,
  'Computer Name': device.name,
  'User Name': device.userName,
  'AD Site': device.site,
})
const byName = (left, right) => left['Computer Name'].localeCompare(right['Computer Name'])
const byNumberDesc = (column) => (left, right) => (right[column] ?? -1) - (left[column] ?? -1)
const countBy = (items, keyOf) => {
  const counts = new Map()
  for (const item of items) {
    const key = keyOf(item)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}
// SQL LIKE (% and _, case-insensitive) without a regex: a RegExp built from user-typed % runs backtracks
// catastrophically, while this two-pointer match only retries from the last % and stays O(pattern × text).
const likeMatcher = (pattern) => {
  const loweredPattern = pattern.toLowerCase()
  return (value) => {
    const text = String(value).toLowerCase()
    let patternIndex = 0
    let textIndex = 0
    let lastWildcardIndex = -1
    let resumeTextIndex = 0
    while (textIndex < text.length) {
      const token = loweredPattern[patternIndex]
      if (token === '%') {
        lastWildcardIndex = patternIndex++
        resumeTextIndex = textIndex
      } else if (token !== undefined && (token === '_' || token === text[textIndex])) {
        patternIndex++
        textIndex++
      } else if (lastWildcardIndex !== -1) {
        patternIndex = lastWildcardIndex + 1
        textIndex = ++resumeTextIndex
      } else {
        return false
      }
    }
    while (loweredPattern[patternIndex] === '%') patternIndex++
    return patternIndex === loweredPattern.length
  }
}
const isServerOs = (device) => device.os.caption.includes('Server')

const conversionName = (code) =>
  ({ 0: 'Fully Decrypted', 1: 'Fully Encrypted', 2: 'Encryption In Progress', 3: 'Decryption In Progress', 4: 'Encryption Paused', 5: 'Decryption Paused' })[code] ?? 'Unknown'

// Each SQL processor row reflects a single socket, so multi-socket servers return one row per socket.
const processorRows = (device) => Array.from({ length: device.hardware.sockets }, () => device.hardware)

const sampleQueries = {
  'Operating-Systems/OS_Count_Summary': () =>
    [...countBy(inventoried, (device) => device.os.caption)]
      .map(([caption, count]) => ({ 'Operating System': caption, 'Device Count': count }))
      .sort(byNumberDesc('Device Count')),

  'Operating-Systems/OS_FeatureUpdate_Counts': () =>
    [...countBy(inventoried, (device) => `${device.os.caption}|${device.os.build}`)]
      .map(([key, count]) => {
        const [caption, build] = key.split('|')
        return { 'Operating System': caption, 'Feature Update': featureUpdateName(build), 'Build Number': build, 'Device Count': count }
      })
      .sort((left, right) => left['Operating System'].localeCompare(right['Operating System']) || right['Build Number'].localeCompare(left['Build Number'])),

  'Operating-Systems/Windows11_Clients': () =>
    inventoried
      .filter(isWindows11)
      .map((device) => ({
        ResourceID: device.resourceId,
        'Computer Name': device.name,
        'User Name': device.userName,
        'Primary User': `CONTOSO\\${device.userName}`,
        'AD Site': device.site,
        'Operating System': device.os.caption,
        'OS Version': device.os.version,
        'Build Number': device.os.build,
        'Service Pack': null,
        'OS Install Date': device.os.installDate,
        'Last Boot Time': device.os.lastBoot,
      }))
      .sort(byName),

  'Hardware-Inventory/Computer_Summary': () =>
    devices
      .flatMap((device) => {
        const processors = device.hasClient ? processorRows(device) : [null]
        return processors.map((processor) => ({
          ...deviceIdentity(device),
          Manufacturer: device.hasClient ? device.hardware.manufacturer : 'Unknown',
          Model: device.hasClient ? device.hardware.model : 'Unknown',
          'Chassis Type': device.hasClient ? chassisName(device.hardware.chassis) : 'Unknown',
          'Serial Number': device.hasClient ? device.serial : 'N/A',
          Processor: processor?.processor ?? 'Unknown',
          'CPU Cores': processor?.cores ?? null,
          'Logical Processors': processor?.logical ?? null,
          'RAM (GB)': device.hasClient ? ramGB(device) : null,
          'Operating System': device.hasClient ? device.os.caption : null,
          'Build Number': device.hasClient ? device.os.build : null,
          'OS Install Date': device.hasClient ? formatDate(device.os.installDate) : null,
        }))
      })
      .sort(byName),

  'Hardware-Inventory/Device_Models': () =>
    [...countBy(inventoried, (device) => `${device.hardware.manufacturer}|${device.hardware.model}|${device.hardware.chassis}`)]
      .map(([key, count]) => {
        const [manufacturer, model, chassis] = key.split('|')
        return { Manufacturer: manufacturer, Model: model, 'Chassis Type': chassisName(Number(chassis)), 'Device Count': count }
      })
      .sort(byNumberDesc('Device Count')),

  'Hardware-Inventory/Disk_Space': () =>
    inventoried
      .flatMap((device) =>
        device.disks.map((disk) => ({
          ResourceID: device.resourceId,
          'Computer Name': device.name,
          'User Name': device.userName,
          Drive: disk.drive,
          'Volume Name': disk.volume,
          'File System': disk.fileSystem,
          'Total Size (GB)': +(disk.sizeMB / 1024).toFixed(2),
          'Free Space (GB)': +(disk.freeMB / 1024).toFixed(2),
          'Used Space (GB)': +((disk.sizeMB - disk.freeMB) / 1024).toFixed(2),
          'Percent Used': +(((disk.sizeMB - disk.freeMB) * 100) / disk.sizeMB).toFixed(1),
        })),
      )
      .sort((left, right) => byName(left, right) || left.Drive.localeCompare(right.Drive)),

  'Hardware-Inventory/Low_Disk_Space': () =>
    inventoried
      .flatMap((device) => device.disks.filter((disk) => disk.drive === 'C:').map((disk) => ({ device, disk })))
      .filter(({ disk }) => disk.freeMB / 1024 < 10 || (disk.freeMB * 100) / disk.sizeMB < 10)
      .sort((left, right) => left.disk.freeMB - right.disk.freeMB)
      .map(({ device, disk }) => ({
        ...deviceIdentity(device),
        Drive: disk.drive,
        'Total Size (GB)': +(disk.sizeMB / 1024).toFixed(2),
        'Free Space (GB)': +(disk.freeMB / 1024).toFixed(2),
        'Percent Used': +(((disk.sizeMB - disk.freeMB) * 100) / disk.sizeMB).toFixed(1),
        Status: disk.freeMB / 1024 < 5 ? 'Critical (< 5GB)' : disk.freeMB / 1024 < 10 ? 'Warning (< 10GB)' : 'Low (< 10%)',
      })),

  'Hardware-Inventory/Memory_Summary': () =>
    [...countBy(inventoried, ramGB)]
      .map(([ram, count]) => ({ 'RAM (GB)': ram, 'Device Count': count }))
      .sort(byNumberDesc('RAM (GB)')),

  'Software-Inventory/Installed_Software': () =>
    softwareInstalls
      .map(({ device, name, publisher, version, installDate }) => ({
        ResourceID: device.resourceId,
        'Computer Name': device.name,
        'User Name': device.userName,
        'Software Name': name,
        Version: version,
        Publisher: publisher,
        'Install Date': formatDate(installDate),
      }))
      .sort((left, right) => byName(left, right) || left['Software Name'].localeCompare(right['Software Name'])),

  'Software-Inventory/Software_Counts': () =>
    [...countBy(softwareInstalls, (install) => `${install.name}|${install.publisher}`)]
      .map(([key, count]) => {
        const [name, publisher] = key.split('|')
        return { 'Software Name': name, Publisher: publisher, 'Install Count': count }
      })
      .sort(byNumberDesc('Install Count')),

  'Software-Inventory/Find_Software': ({ SoftwareName }) => {
    const matchesName = likeMatcher(SoftwareName)
    return softwareInstalls
      .filter((install) => matchesName(install.name))
      .map(({ device, name, version, publisher, installDate }) => ({
        ...deviceIdentity(device),
        'Software Name': name,
        Version: version,
        Publisher: publisher,
        'Install Date': formatDate(installDate),
      }))
      .sort((left, right) => byName(left, right) || left['Software Name'].localeCompare(right['Software Name']))
  },

  'Software-Inventory/Software_Versions': ({ SoftwareName }) => {
    const matchesName = likeMatcher(SoftwareName)
    return [...countBy(softwareInstalls.filter((install) => matchesName(install.name)), (install) => `${install.name}|${install.version}`)]
      .map(([key, count]) => {
        const [name, version] = key.split('|')
        return { 'Software Name': name, Version: version, 'Install Count': count }
      })
      .sort((left, right) => left['Software Name'].localeCompare(right['Software Name']) || right['Install Count'] - left['Install Count'])
  },

  'Client-Health/Client_Status': () =>
    devices
      .map((device) => ({
        ...deviceIdentity(device),
        'Client Status': device.client ? (device.client.activeStatus ? 'Active' : 'Inactive') : 'Unknown',
        'Active DDR': yesNo(device.client?.isActiveDdr),
        'Active HW Inventory': yesNo(device.client?.isActiveHw),
        'Last DDR': formatDateTime(device.client?.lastDdr),
        'Last HW Scan': formatDateTime(device.client?.lastHw),
        'Last Policy Request': formatDateTime(device.client?.lastPolicyRequest),
        'Days Since DDR': datediffDays(device.client?.lastDdr),
        'Days Since HW Scan': datediffDays(device.client?.lastHw),
      }))
      .sort(byName),

  'Client-Health/Client_Version': () =>
    [...countBy(devices, (device) => device.client?.version ?? 'No Client')]
      .map(([version, count]) => ({ 'Client Version': version, 'Device Count': count }))
      .sort(byNumberDesc('Device Count')),

  'Client-Health/Inactive_Clients': ({ InactiveDays }) =>
    devices
      .filter((device) => !device.client || datediffDays(device.client.lastDdr) > InactiveDays)
      .sort((left, right) => (left.client?.lastDdr ?? 0) - (right.client?.lastDdr ?? 0))
      .map((device) => {
        const daysInactive = datediffDays(device.client?.lastDdr)
        return {
          ...deviceIdentity(device),
          'Last DDR': formatDateTime(device.client?.lastDdr) ?? 'Never',
          'Last HW Scan': formatDateTime(device.client?.lastHw) ?? 'Never',
          'Last Policy Request': formatDateTime(device.client?.lastPolicyRequest) ?? 'Never',
          'Days Inactive': daysInactive,
          Status: daysInactive > 90 ? 'Critical (> 90 days)' : daysInactive > 60 ? 'Warning (> 60 days)' : 'Inactive (> 30 days)',
        }
      }),

  'Client-Health/Last_Boot_Time': () =>
    [...inventoried]
      .sort((left, right) => left.os.lastBoot - right.os.lastBoot)
      .map((device) => {
        const uptime = datediffDays(device.os.lastBoot)
        return {
          ...deviceIdentity(device),
          'Last Boot Time': formatDateTime(device.os.lastBoot),
          'Uptime (Days)': uptime,
          Status: uptime > 30 ? 'Needs Reboot (> 30 days)' : uptime > 14 ? 'Consider Reboot (> 14 days)' : 'OK',
        }
      }),

  'Client-Health/Pending_Reboot': () =>
    inventoried
      .filter((device) => device.pendingReboot)
      .map((device) => ({ ...deviceIdentity(device), 'Pending Reboot': 'Yes', 'Last HW Scan': formatDateTime(device.client.lastHw) }))
      .sort(byName),

  'Client-Health/Provisioning_Mode': () =>
    inventoried
      .filter((device) => device.provisioningMode)
      .map((device) => ({
        ...deviceIdentity(device),
        'Operating System': device.os.caption,
        'Provisioning Mode': 'Enabled',
        'Last Inventory': formatDateTime(device.client.lastHw),
      }))
      .sort(byName),

  'Software-Updates/Update_Compliance_Summary': () =>
    [...new Set(SOFTWARE_UPDATES.map((update) => update.classification))].sort().map((classification) => {
      const statuses = updateStatuses.filter((entry) => entry.update.classification === classification)
      const installed = statuses.filter((entry) => entry.status === 3).length
      return {
        Classification: classification,
        'Total Devices': new Set(statuses.map((entry) => entry.device.resourceId)).size,
        Required: statuses.length - installed,
        Installed: installed,
        'Compliance %': +((installed * 100) / statuses.length).toFixed(1),
      }
    }),

  'Software-Updates/Missing_Updates_By_Device': () => {
    const missingByDevice = new Map()
    for (const entry of updateStatuses.filter((status) => status.status === 2)) {
      const list = missingByDevice.get(entry.device) ?? []
      list.push(entry.update)
      missingByDevice.set(entry.device, list)
    }
    return [...missingByDevice]
      .map(([device, updates]) => ({
        ...deviceIdentity(device),
        'Missing Updates': updates.length,
        Critical: updates.filter((update) => update.severity === 10).length,
        Important: updates.filter((update) => update.severity === 8).length,
        Moderate: updates.filter((update) => update.severity === 6).length,
        Low: updates.filter((update) => update.severity === 2).length,
      }))
      .sort(byNumberDesc('Missing Updates'))
  },

  'Software-Updates/Missing_Updates_Detail': () =>
    updateStatuses
      .filter((entry) => entry.status === 2)
      .sort((left, right) => left.device.name.localeCompare(right.device.name) || right.update.severity - left.update.severity)
      .map(({ device, update }) => ({
        ResourceID: device.resourceId,
        'Computer Name': device.name,
        'User Name': device.userName,
        'Update Title': update.title,
        'KB Article': update.articleId,
        'Bulletin ID': update.bulletinId,
        Severity: { 10: 'Critical', 8: 'Important', 6: 'Moderate', 2: 'Low' }[update.severity] ?? 'Unspecified',
        Classification: update.classification,
        'Release Date': formatDate(update.datePosted),
      })),

  'Software-Updates/Last_Scan_Times': () =>
    [...devices]
      .sort((left, right) => (left.scan?.lastScan ?? 0) - (right.scan?.lastScan ?? 0))
      .map((device) => ({
        ...deviceIdentity(device),
        'Last Scan Time': formatDateTime(device.scan?.lastScan) ?? 'Never',
        'Days Since Scan': datediffDays(device.scan?.lastScan),
        'Scan Status': { 0: 'Unknown', 1: 'Waiting for Scan', 2: 'Running', 3: 'Completed', 4: 'Pending Retry', 5: 'Failed' }[device.scan?.state] ?? 'Unknown',
      })),

  'Software-Updates/Update_Deployment_Status': () =>
    UPDATE_GROUPS.map(([title, includesUpdate, targets]) => {
      const groupUpdates = new Set(SOFTWARE_UPDATES.filter(includesUpdate))
      const targetedDevices = inventoried.filter(targets)
      let compliant = 0
      let required = 0
      for (const device of targetedDevices) {
        const applicable = (updateStatusesByDevice.get(device) ?? []).filter((entry) => groupUpdates.has(entry.update))
        if (applicable.length === 0) continue
        if (applicable.some((entry) => entry.status === 2)) required += 1
        else compliant += 1
      }
      return {
        'Update Group': title,
        'Targeted Devices': targetedDevices.length,
        Compliant: compliant,
        Required: required,
        'Not Required': targetedDevices.length - compliant - required,
        'Compliance %': +((compliant * 100) / targetedDevices.length).toFixed(1),
      }
    }).sort((left, right) => left['Update Group'].localeCompare(right['Update Group'])),

  'Collections/Collection_Members': ({ CollectionName }) => {
    const collection = COLLECTIONS.find((candidate) => candidate.name.toLowerCase() === CollectionName.toLowerCase())
    return (collection?.members ?? [])
      .map((device) => ({
        ...deviceIdentity(device),
        'Collection Name': collection.name,
        'Collection ID': collection.collectionId,
        'Membership Type': collection.isDirect ? 'Direct' : 'Query',
      }))
      .sort(byName)
  },

  'Collections/Collection_Summary': () =>
    COLLECTIONS.map((collection) => ({
      'Collection ID': collection.collectionId,
      'Collection Name': collection.name,
      Description: collection.comment,
      'Member Count': collection.members.length,
      'Collection Type': 'Device',
      'Refresh Type': { 1: 'Manual', 2: 'Scheduled', 4: 'Incremental', 6: 'Incremental and Scheduled' }[collection.refreshType],
      'Incremental Updates': [4, 6].includes(collection.refreshType) ? 'Yes' : 'No',
      'Limiting Collection': collection.limitingCollection,
    })).sort((left, right) => left['Collection Name'].localeCompare(right['Collection Name'])),

  'Collections/Device_Collection_Membership': ({ ComputerName }) =>
    COLLECTIONS.filter((collection) => collection.members.some((device) => device.name.toLowerCase() === ComputerName.toLowerCase()))
      .map((collection) => ({
        'Collection ID': collection.collectionId,
        'Collection Name': collection.name,
        Description: collection.comment,
        'Membership Type': collection.isDirect ? 'Direct' : 'Query',
      }))
      .sort((left, right) => left['Collection Name'].localeCompare(right['Collection Name'])),

  'Collections/Empty_Collections': () =>
    COLLECTIONS.filter((collection) => collection.members.length === 0)
      .map((collection) => ({
        'Collection ID': collection.collectionId,
        'Collection Name': collection.name,
        Description: collection.comment,
        'Limiting Collection': collection.limitingCollection,
        'Refresh Type': { 1: 'Manual', 2: 'Scheduled', 4: 'Incremental', 6: 'Incremental and Scheduled' }[collection.refreshType],
      }))
      .sort((left, right) => left['Collection Name'].localeCompare(right['Collection Name'])),

  'Security/BitLocker_Status': () =>
    devices
      .flatMap((device) => (device.bitlocker.length ? device.bitlocker : [null]).map((volume) => ({ device, volume })))
      .map(({ device, volume }) => ({
        ...deviceIdentity(device),
        Drive: volume?.drive ?? null,
        'Protection Status': volume ? { 0: 'Protection Off', 1: 'Protection On', 2: 'Protection Unknown' }[volume.protection] : 'Unknown',
        'Conversion Status': conversionName(volume?.conversion),
        'Encryption Method': volume?.method ?? null,
        'Key Protectors': volume?.protectors ?? 'None',
      }))
      .sort((left, right) => byName(left, right) || String(left.Drive).localeCompare(String(right.Drive))),

  'Security/BitLocker_Not_Encrypted': () =>
    devices
      .map((device) => ({ device, osVolume: device.bitlocker.find((volume) => volume.drive === 'C:') }))
      .filter(({ osVolume }) => !osVolume || osVolume.conversion !== 1)
      .map(({ device, osVolume }) => ({ ...deviceIdentity(device), Status: osVolume ? conversionName(osVolume.conversion) : 'No BitLocker Data' }))
      .sort(byName),

  'Security/TPM_Status': () =>
    devices
      .map((device) => ({
        ...deviceIdentity(device),
        'TPM Activated': yesNo(device.tpm?.activated),
        'TPM Enabled': yesNo(device.tpm?.enabled),
        'TPM Owned': yesNo(device.tpm?.owned),
        'TPM Version': device.tpm?.spec ?? 'N/A',
        'Manufacturer Version': device.tpm?.manufacturerVersion ?? 'N/A',
      }))
      .sort(byName),

  'Security/Defender_Status': () =>
    devices
      .map((device) => ({
        ...deviceIdentity(device),
        'Antimalware Service': enabledDisabled(device.defender?.amService),
        'Real-Time Protection': enabledDisabled(device.defender?.realTime),
        'AV Signature Version': device.defender?.signatureVersion ?? 'N/A',
        'Last Signature Update': formatDateTime(device.defender?.signatureDate),
        'Signature Age (Days)': datediffDays(device.defender?.signatureDate),
        'Engine Version': device.defender?.engineVersion ?? 'N/A',
      }))
      .sort(byName),

  'Security/Defender_Outdated_Signatures': ({ MaxAge }) =>
    devices
      .filter((device) => !device.defender || datediffDays(device.defender.signatureDate) > MaxAge)
      .sort((left, right) => (left.defender?.signatureDate ?? 0) - (right.defender?.signatureDate ?? 0))
      .map((device) => {
        const age = datediffDays(device.defender?.signatureDate)
        return {
          ...deviceIdentity(device),
          'AV Signature Version': device.defender?.signatureVersion ?? 'N/A',
          'Last Signature Update': formatDateTime(device.defender?.signatureDate) ?? 'Never',
          'Signature Age (Days)': age,
          Status: age === null ? 'No Signature Data' : age > 14 ? 'Critical (> 14 days)' : age > 7 ? 'Warning (> 7 days)' : 'OK',
        }
      }),

  'Security/Secure_Boot_Status': () =>
    devices
      .map((device) => ({
        ...deviceIdentity(device),
        'Secure Boot Status': device.firmware ? enabledDisabled(device.firmware.secureBoot) : 'Unknown/Not Supported',
        'Boot Mode': device.firmware ? (device.firmware.uefi ? 'UEFI' : 'Legacy BIOS') : 'Unknown',
      }))
      .sort(byName),

  'Applications/Application_List': () =>
    APPLICATIONS.map((application) => ({
      'CI ID': application.ciId,
      'Application Name': application.name,
      Manufacturer: application.manufacturer,
      Version: application.version,
      'Is Deployed': application.isDeployed,
      'Is Enabled': application.isEnabled,
      'Deployment Types': application.deploymentTypes,
      'Created Date': formatDate(application.created),
      'Last Modified': formatDate(application.modified),
    })).sort((left, right) => left['Application Name'].localeCompare(right['Application Name'])),

  'Applications/Application_Deployment_Status': () =>
    appDeployments
      .map(({ application, collection, states }) => {
        const count = (predicate) => states.filter(({ enforcementState }) => predicate(enforcementState)).length
        const success = count((state) => state !== null && state < 2000)
        return {
          'Application Name': application.name,
          Manufacturer: application.manufacturer,
          'Target Collection': collection.name,
          'Total Targeted': states.length,
          Success: success,
          'In Progress': count((state) => state >= 2000 && state < 3000),
          Errors: count((state) => state >= 4000 && state < 5000),
          Unknown: count((state) => state === null),
          'Success Rate %': +((success * 100) / states.length).toFixed(1),
        }
      })
      .sort((left, right) => left['Application Name'].localeCompare(right['Application Name'])),

  'Applications/Application_Install_Status_By_Device': ({ AppName }) => {
    const matchesName = likeMatcher(AppName)
    const enforcementNames = {
      1000: 'Success', 1001: 'Already Compliant', 1002: 'Simulate Success', 2000: 'In Progress', 2001: 'Waiting for Content',
      2002: 'Installing', 2003: 'Restart Pending', 2004: 'Waiting for Maintenance Window', 2005: 'Waiting for Install Window',
      2006: 'Pending Soft Reboot', 3000: 'Requirements Not Met', 4000: 'Error', 5000: 'Evaluating',
    }
    return appDeployments
      .filter(({ application }) => matchesName(application.name))
      .flatMap(({ application, states }) =>
        states
          .filter(({ enforcementState }) => enforcementState !== null)
          .map(({ device, enforcementState }) => ({
            'Computer Name': device.name,
            'User Name': device.userName,
            'AD Site': device.site,
            'Application Name': application.name,
            'Install Status': enforcementState < 2000 ? 'Installed' : 'Not Installed',
            'Enforcement State': enforcementNames[enforcementState] ?? String(enforcementState),
          })),
      )
      .sort((left, right) => byName(left, right) || left['Application Name'].localeCompare(right['Application Name']))
  },

  'Applications/Failed_Deployments': () => {
    const errorNames = { 4000: 'Unknown Error', 4001: 'Failed to Download', 4002: 'Failed to Install', 4003: 'Failed to Uninstall', 4004: 'Dependency Failed' }
    return appDeployments
      .flatMap(({ application, states }) =>
        states
          .filter(({ enforcementState }) => enforcementState >= 4000 && enforcementState < 5000)
          .map(({ device, enforcementState }) => ({
            'Computer Name': device.name,
            'User Name': device.userName,
            'AD Site': device.site,
            'Application Name': application.name,
            Manufacturer: application.manufacturer,
            'Error Code': enforcementState,
            'Error Description': errorNames[enforcementState],
          })),
      )
      .sort((left, right) => left['Application Name'].localeCompare(right['Application Name']) || byName(left, right))
  },

  'Applications/Deployment_Summary': () => {
    const rows = sampleQueries['Applications/Application_Deployment_Status']()
    const sum = (column) => rows.reduce((total, row) => total + row[column], 0)
    return [
      {
        'Total Applications': new Set(appDeployments.map(({ application }) => application.ciId)).size,
        'Total Deployments': appDeployments.length,
        'Total Targeted Devices': sum('Total Targeted'),
        'Total Successful': sum('Success'),
        'Total Failed': sum('Errors'),
        'Total In Progress': sum('In Progress'),
        'Overall Success Rate %': +((sum('Success') * 100) / sum('Total Targeted')).toFixed(1),
      },
    ]
  },

  'Server/Server_Summary': () =>
    inventoried
      .filter(isServerOs)
      .flatMap((device) =>
        processorRows(device).map((processor) => ({
          ...deviceIdentity(device),
          'Operating System': device.os.caption,
          'Server Version': serverVersionName(device.os.caption),
          'OS Version': device.os.version,
          'Build Number': device.os.build,
          'Service Pack': null,
          Manufacturer: device.hardware.manufacturer,
          Model: device.hardware.model,
          'System Type': 'x64-based PC',
          'RAM (GB)': ramGB(device),
          Processor: processor.processor,
          'CPU Sockets': device.hardware.sockets,
          'Total Cores': processor.cores,
          'OS Install Date': formatDate(device.os.installDate),
          'Last Boot Time': formatDateTime(device.os.lastBoot),
        })),
      )
      .sort(byName),

  'Server/Server_Roles': () =>
    inventoried
      .filter(isServerOs)
      .flatMap((device) =>
        device.serverProfile.roles.map((role) => ({
          ...deviceIdentity(device),
          'Operating System': device.os.caption,
          'Role Name': role,
          'Role ID': featureId(role),
          'Install State': 'Installed',
        })),
      )
      .sort((left, right) => byName(left, right) || left['Role Name'].localeCompare(right['Role Name'])),

  'Server/Server_Features': () =>
    inventoried
      .filter(isServerOs)
      .flatMap((device) =>
        serverFeatures(device).map((feature) => ({
          ...deviceIdentity(device),
          'Operating System': device.os.caption,
          'Feature Name': feature,
          'Feature ID': featureId(feature),
          'Install State': 'Installed',
        })),
      )
      .sort((left, right) => byName(left, right) || left['Feature Name'].localeCompare(right['Feature Name'])),

  'Server/Server_Uptime': () =>
    inventoried
      .filter(isServerOs)
      .sort((left, right) => left.os.lastBoot - right.os.lastBoot)
      .map((device) => {
        const uptime = datediffDays(device.os.lastBoot)
        return {
          ...deviceIdentity(device),
          'Operating System': device.os.caption,
          'Last Boot Time': formatDateTime(device.os.lastBoot),
          'Uptime (Days)': uptime,
          Status: uptime > 90 ? 'Critical (> 90 days)' : uptime > 60 ? 'Warning (> 60 days)' : uptime > 30 ? 'Review (> 30 days)' : 'OK',
        }
      }),

  'Server/Server_OS_Versions': () =>
    [...countBy(inventoried.filter(isServerOs), (device) => `${device.os.caption}|${device.os.build}`)]
      .map(([key, count]) => {
        const [caption, build] = key.split('|')
        return { 'Operating System': caption, 'Server Version': serverVersionName(caption), 'Build Number': build, 'Server Count': count }
      })
      .sort((left, right) => right['Server Count'] - left['Server Count'] || left['Operating System'].localeCompare(right['Operating System'])),

  'Server/Server_TLS10_Enabled': () => {
    const statusRank = (row) => (row['Value Name'] === 'Enabled' && row.Value === '1' ? 1 : row['Value Name'] === 'DisabledByDefault' && row.Value === '0' ? 2 : 3)
    return inventoried
      .filter(isServerOs)
      .flatMap((device) =>
        tlsRegistryValues(device).map(([valueName, value]) => ({
          ...deviceIdentity(device),
          'Operating System': device.os.caption,
          'Build Number': device.os.build,
          'Registry Key': valueName ? 'SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.0\\Server' : null,
          'Value Name': valueName,
          Value: value,
          'TLS 1.0 Status':
            valueName === 'Enabled' ? (value === '1' ? 'TLS 1.0 Enabled - ACTION REQUIRED' : 'TLS 1.0 Disabled')
              : valueName === 'DisabledByDefault' ? (value === '1' ? 'TLS 1.0 Disabled by Default' : 'TLS 1.0 May Be Enabled')
                : 'Check Manually',
        })),
      )
      .sort((left, right) => statusRank(left) - statusRank(right) || byName(left, right))
  },
}

// Server features and TLS posture are generated eagerly so the seeded sequence never depends on query order.
const DEFAULT_SERVER_FEATURES = ['NET-Framework-45-Core', 'NET-Framework-45-Features', 'NET-WCF-Services45', 'NET-WCF-TCP-PortSharing45', 'PowerShellRoot', 'PowerShell', 'WoW64-Support', 'FileAndStorage-Services', 'Storage-Services']

const featuresByServer = new Map(
  servers.map((device) => {
    const build = Number(device.os.build)
    const optional = [
      [build >= 14393, 'Windows-Defender'],
      [build >= 14393 && build < 20348, 'XPS-Viewer'],
      [build < 26100, 'PowerShell-ISE'],
      [build <= 14393 && chance(0.7), 'FS-SMB1'],
      [build >= 17763, 'System-DataArchiver'],
      [chance(0.16), 'SNMP-Service'],
      [chance(0.1), 'Telnet-Client'],
      [chance(0.3), 'RSAT-AD-PowerShell'],
    ].filter(([applies]) => applies).map(([, feature]) => feature)
    return [device, [...new Set([...DEFAULT_SERVER_FEATURES, ...optional, ...device.serverProfile.roles, ...device.serverProfile.features])]]
  }),
)
const serverFeatures = (device) => featuresByServer.get(device)

const featureIds = new Map([...new Set([...featuresByServer.values()].flat())].sort().map((name, index) => [name, 100 + index * 3]))
const featureId = (name) => featureIds.get(name)

const TLS_POSTURE_WEIGHTS = {
  9600: [['enabled', 50], ['unknown', 30], ['hardened', 20]],
  14393: [['enabled', 25], ['mayBe', 15], ['unknown', 20], ['hardened', 40]],
  17763: [['enabled', 8], ['mayBe', 10], ['unknown', 15], ['hardened', 67]],
}
const TLS_REGISTRY_VALUES = {
  enabled: [['Enabled', '1'], ['DisabledByDefault', '0']],
  mayBe: [['DisabledByDefault', '0']],
  unknown: [[null, null]],
  hardened: [['Enabled', '0'], ['DisabledByDefault', '1']],
}
const tlsByServer = new Map(
  servers.map((device) => [
    device,
    TLS_REGISTRY_VALUES[pickWeighted(TLS_POSTURE_WEIGHTS[device.os.build] ?? [['enabled', 2], ['unknown', 18], ['hardened', 80]])],
  ]),
)
const tlsRegistryValues = (device) => tlsByServer.get(device)

export const runSampleQuery = (queryId, paramValues) => {
  const rows = sampleQueries[queryId](paramValues)
  return { columns: rows.length ? Object.keys(rows[0]) : [], rows }
}
