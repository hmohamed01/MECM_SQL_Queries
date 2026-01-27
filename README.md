# MECM SQL Queries

A comprehensive library of SQL queries for Microsoft Endpoint Configuration Manager (MECM/SCCM) database reporting. These queries run against the MECM site database to extract inventory, compliance, and device management data.

## Query Categories

| Category | Description | Query Count |
|----------|-------------|-------------|
| [Operating Systems](#operating-systems) | OS versions, feature updates, Windows client info | 3 |
| [Hardware Inventory](#hardware-inventory) | CPU, memory, disk, device models | 5 |
| [Software Inventory](#software-inventory) | Installed software, version tracking | 4 |
| [Client Health](#client-health) | Client status, activity, communication | 6 |
| [Software Updates](#software-updates) | Patch compliance, missing updates | 5 |
| [Collections](#collections) | Collection membership, device counts | 4 |
| [Security](#security) | BitLocker, Defender, TPM, Secure Boot | 6 |
| [Applications](#applications) | Application deployment status | 5 |
| [Server](#server) | Windows Server inventory and roles | 6 |

---

## Operating Systems

### Windows11_Clients.sql

Returns all Windows 11 devices from MECM inventory with detailed system information.

**Sample Output:**

| Computer Name | User Name | Primary User | AD Site | Operating System | OS Version | Build Number |
|--------------|-----------|--------------|---------|------------------|------------|--------------|
| PC-001 | jsmith | jsmith | HQ-Site | Microsoft Windows 11 Enterprise | 10.0.22631 | 22631 |
| PC-002 | mjones | mjones | Branch-A | Microsoft Windows 11 Pro | 10.0.26100 | 26100 |

---

### OS_FeatureUpdate_Counts.sql

Returns count of computers grouped by OS caption and feature update version. Useful for tracking Windows feature update adoption across your environment.

**Sample Output:**

| Operating System | Feature Update | Build Number | Device Count |
|-----------------|----------------|--------------|--------------|
| Microsoft Windows 11 Enterprise | 24H2 | 26100 | 150 |
| Microsoft Windows 11 Enterprise | 23H2 | 22631 | 320 |
| Microsoft Windows 10 Enterprise | 22H2 | 19045 | 500 |

---

### OS_Count_Summary.sql

Returns a simple count of computers grouped by OS caption only. Provides a quick overview of your fleet composition.

**Sample Output:**

| Operating System | Device Count |
|-----------------|--------------|
| Microsoft Windows 11 Enterprise | 850 |
| Microsoft Windows 10 Enterprise | 620 |
| Microsoft Windows Server 2022 | 45 |

---

## Hardware Inventory

### Computer_Summary.sql

Returns comprehensive hardware inventory for all devices including manufacturer, model, chassis type, CPU, RAM, and OS info.

**Sample Output:**

| Computer Name | User Name | Manufacturer | Model | Chassis Type | Serial Number | Processor | RAM (GB) |
|--------------|-----------|--------------|-------|--------------|---------------|-----------|----------|
| PC-001 | jsmith | Dell Inc. | Latitude 5520 | Notebook | ABC123 | Intel Core i7 | 16 |
| PC-002 | mjones | HP | EliteBook 840 | Laptop | XYZ789 | Intel Core i5 | 8 |

---

### Disk_Space.sql

Returns disk space usage for all logical drives on all devices.

**Sample Output:**

| Computer Name | User Name | Drive | Volume Name | File System | Total Size (GB) | Free Space (GB) | Used Space (GB) | Percent Used |
|--------------|-----------|-------|-------------|-------------|-----------------|-----------------|-----------------|--------------|
| PC-001 | jsmith | C: | OS | NTFS | 237.00 | 85.50 | 151.50 | 63.9 |
| PC-001 | jsmith | D: | Data | NTFS | 500.00 | 320.00 | 180.00 | 36.0 |
| PC-002 | mjones | C: | Windows | NTFS | 476.00 | 12.30 | 463.70 | 97.4 |

---

### Low_Disk_Space.sql

Returns devices with less than 10GB or 10% free space on C: drive. Categorizes as Critical (< 5GB), Warning (< 10GB), or Low (< 10%).

**Sample Output:**

| Computer Name | User Name | AD Site | Drive | Total Size (GB) | Free Space (GB) | Percent Used | Status |
|--------------|-----------|---------|-------|-----------------|-----------------|--------------|--------|
| PC-003 | alee | Branch-B | C: | 237.00 | 3.20 | 98.6 | Critical (< 5GB) |
| PC-004 | bwilson | HQ-Site | C: | 119.00 | 8.50 | 92.9 | Warning (< 10GB) |
| PC-005 | cdavis | Branch-A | C: | 476.00 | 42.00 | 91.2 | Low (< 10%) |

---

### Memory_Summary.sql

Returns count of devices grouped by RAM capacity.

**Sample Output:**

| RAM (GB) | Device Count |
|----------|--------------|
| 32 | 150 |
| 16 | 450 |
| 8 | 200 |

---

### Device_Models.sql

Returns count of devices grouped by manufacturer, model, and chassis type.

**Sample Output:**

| Manufacturer | Model | Chassis Type | Device Count |
|-------------|-------|--------------|--------------|
| Dell Inc. | Latitude 5520 | Notebook | 245 |
| Dell Inc. | OptiPlex 7090 | Desktop | 180 |
| HP | EliteBook 840 G8 | Laptop | 156 |
| Lenovo | ThinkPad T14 Gen 2 | Notebook | 98 |

---

## Software Inventory

### Installed_Software.sql

Returns all installed software from Add/Remove Programs for all devices.

**Sample Output:**

| Computer Name | User Name | Software Name | Version | Publisher | Install Date |
|--------------|-----------|---------------|---------|-----------|--------------|
| PC-001 | jsmith | Microsoft 365 Apps | 16.0.17328 | Microsoft Corporation | 2024-01-15 |
| PC-001 | jsmith | Google Chrome | 120.0.6099 | Google LLC | 2024-02-01 |
| PC-002 | mjones | Adobe Acrobat Reader | 23.008.20470 | Adobe Inc. | 2024-01-20 |

---

### Software_Counts.sql

Returns count of installations for each software title across all devices.

**Sample Output:**

| Software Name | Publisher | Install Count |
|--------------|-----------|---------------|
| Microsoft 365 Apps for enterprise | Microsoft Corporation | 1250 |
| Google Chrome | Google LLC | 1180 |
| Microsoft Edge | Microsoft Corporation | 1150 |
| Adobe Acrobat Reader DC | Adobe Inc. | 890 |

---

### Find_Software.sql

Search for devices with specific software installed. Replace `SOFTWARE_NAME` with the software you're searching for.

**Sample Output:**

| Computer Name | User Name | AD Site | Software Name | Version | Publisher | Install Date |
|--------------|-----------|---------|---------------|---------|-----------|--------------|
| PC-001 | jsmith | HQ-Site | 7-Zip 23.01 | 23.01 | Igor Pavlov | 2024-01-10 |
| PC-015 | kbrown | Branch-A | 7-Zip 23.01 | 23.01 | Igor Pavlov | 2024-02-05 |

---

### Software_Versions.sql

Returns version distribution for a specific software title. Useful for tracking version sprawl.

**Sample Output:**

| Software Name | Version | Install Count |
|--------------|---------|---------------|
| Google Chrome | 120.0.6099 | 450 |
| Google Chrome | 119.0.6045 | 380 |
| Google Chrome | 118.0.5993 | 125 |

---

## Client Health

### Client_Status.sql

Returns client health status including last activity, DDR, hardware scan, and policy request times.

**Sample Output:**

| Computer Name | User Name | AD Site | Client Status | Active DDR | Active HW Inventory | Last DDR | Last HW Scan | Days Since DDR |
|--------------|-----------|---------|---------------|------------|---------------------|----------|--------------|----------------|
| PC-001 | jsmith | HQ-Site | Active | Yes | Yes | 2024-02-10 08:30 | 2024-02-09 14:22 | 1 |
| PC-002 | mjones | Branch-A | Inactive | No | No | 2024-01-05 10:15 | 2024-01-04 09:00 | 37 |

---

### Inactive_Clients.sql

Returns clients that haven't communicated in specified days (default 30). Categorizes as Critical (> 90 days), Warning (> 60 days), or Inactive (> 30 days).

**Sample Output:**

| Computer Name | User Name | AD Site | Last DDR | Last HW Scan | Last Policy Request | Days Inactive | Status |
|--------------|-----------|---------|----------|--------------|---------------------|---------------|--------|
| PC-OLD1 | rgarcia | Branch-B | 2023-10-15 09:00 | 2023-10-14 14:30 | 2023-10-15 09:05 | 120 | Critical (> 90 days) |
| PC-OLD2 | jsmith | HQ-Site | 2023-12-01 11:22 | 2023-11-30 16:00 | 2023-12-01 11:30 | 72 | Warning (> 60 days) |
| PC-OLD3 | mjones | Branch-A | 2024-01-05 08:45 | 2024-01-04 10:00 | 2024-01-05 08:50 | 37 | Inactive (> 30 days) |

---

### Client_Version.sql

Returns count of devices by Configuration Manager client version.

**Sample Output:**

| Client Version | Device Count |
|---------------|--------------|
| 5.00.9128.1007 | 850 |
| 5.00.9122.1009 | 320 |
| 5.00.9088.1025 | 45 |
| No Client | 12 |

---

### Last_Boot_Time.sql

Returns devices with last boot time and uptime. Flags devices needing reboot (> 30 days uptime).

**Sample Output:**

| Computer Name | User Name | AD Site | Last Boot Time | Uptime (Days) | Status |
|--------------|-----------|---------|----------------|---------------|--------|
| PC-003 | alee | HQ-Site | 2023-12-15 09:00 | 58 | Needs Reboot (> 30 days) |
| PC-004 | bwilson | Branch-A | 2024-01-20 14:30 | 22 | Consider Reboot (> 14 days) |
| PC-005 | cdavis | Branch-B | 2024-02-08 08:00 | 3 | OK |

---

### Pending_Reboot.sql

Returns devices with pending reboot flags.

**Sample Output:**

| Computer Name | User Name | AD Site | Pending Reboot | Last HW Scan |
|--------------|-----------|---------|----------------|--------------|
| PC-006 | jsmith | HQ-Site | Yes | 2024-02-10 14:30 |
| PC-007 | mjones | Branch-A | Yes | 2024-02-09 09:15 |

---

### Provisioning_Mode.sql

Returns clients where MECM client provisioning mode is enabled. Provisioning mode prevents the client from processing policies and can cause devices to appear non-compliant.

**Sample Output:**

| Computer Name | User Name | AD Site | Operating System | Provisioning Mode | Last Inventory |
|--------------|-----------|---------|------------------|-------------------|----------------|
| PC-008 | jsmith | HQ-Site | Microsoft Windows 11 Enterprise | Enabled | 2024-02-10 14:30 |
| PC-009 | mjones | Branch-A | Microsoft Windows 10 Enterprise | Enabled | 2024-02-09 11:45 |

**Note:** This query requires a custom hardware inventory extension to collect the `ProvisioningMode` registry value from `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\CCM\CcmExec`. See the SQL file comments for the MOF extension to add to your `configuration.mof`.

---

## Software Updates

### Update_Compliance_Summary.sql

Returns overall patch compliance status by update classification.

**Sample Output:**

| Classification | Total Devices | Required | Installed | Compliance % |
|---------------|---------------|----------|-----------|--------------|
| Critical Updates | 1200 | 45 | 1155 | 96.3 |
| Security Updates | 1200 | 120 | 1080 | 90.0 |
| Definition Updates | 1200 | 25 | 1175 | 97.9 |

---

### Missing_Updates_By_Device.sql

Returns count of missing updates per device, broken down by severity (Critical, Important, Moderate, Low).

**Sample Output:**

| Computer Name | User Name | AD Site | Missing Updates | Critical | Important | Moderate | Low |
|--------------|-----------|---------|-----------------|----------|-----------|----------|-----|
| PC-010 | rgarcia | Branch-B | 15 | 2 | 8 | 4 | 1 |
| PC-011 | jsmith | HQ-Site | 8 | 0 | 5 | 3 | 0 |
| PC-012 | mjones | Branch-A | 5 | 1 | 2 | 2 | 0 |

---

### Missing_Updates_Detail.sql

Returns detailed list of missing updates with KB article info and release dates.

**Sample Output:**

| Computer Name | User Name | Update Title | KB Article | Bulletin ID | Severity | Classification | Release Date |
|--------------|-----------|--------------|------------|-------------|----------|----------------|--------------|
| PC-010 | rgarcia | 2024-01 Cumulative Update for Windows 11 | 5034123 | | Critical | Security Updates | 2024-01-09 |
| PC-010 | rgarcia | Security Update for .NET Framework | 5033890 | MS24-001 | Important | Security Updates | 2024-01-09 |

---

### Last_Scan_Times.sql

Returns last software update scan time and status for each device.

**Sample Output:**

| Computer Name | User Name | AD Site | Last Scan Time | Days Since Scan | Scan Status |
|--------------|-----------|---------|----------------|-----------------|-------------|
| PC-013 | jsmith | HQ-Site | 2024-02-10 06:30 | 1 | Completed |
| PC-014 | mjones | Branch-A | 2024-02-08 14:22 | 3 | Completed |
| PC-015 | kbrown | Branch-B | 2024-01-15 09:00 | 27 | Failed |

---

### Update_Deployment_Status.sql

Returns deployment status for software update groups with compliance percentages.

**Sample Output:**

| Update Group | Targeted Devices | Compliant | Required | Not Required | Compliance % |
|-------------|------------------|-----------|----------|--------------|--------------|
| 2024-01 Security Updates | 1200 | 1150 | 35 | 15 | 95.8 |
| 2024-02 Security Updates | 1200 | 980 | 180 | 40 | 81.7 |

---

## Collections

### Collection_Members.sql

Returns all members of a specific collection. Replace `COLLECTION_NAME` with the collection to query.

**Sample Output:**

| Computer Name | User Name | AD Site | Collection Name | Collection ID | Membership Type |
|--------------|-----------|---------|-----------------|---------------|-----------------|
| PC-001 | jsmith | HQ-Site | All Windows 11 | SMS00002 | Query |
| PC-002 | mjones | Branch-A | All Windows 11 | SMS00002 | Query |
| PC-003 | alee | HQ-Site | All Windows 11 | SMS00002 | Direct |

---

### Collection_Summary.sql

Returns all device collections with member counts, refresh type, and limiting collection.

**Sample Output:**

| Collection ID | Collection Name | Description | Member Count | Collection Type | Refresh Type | Incremental Updates | Limiting Collection |
|--------------|-----------------|-------------|--------------|-----------------|--------------|---------------------|---------------------|
| SMS00001 | All Systems | All Systems | 1500 | Device | Scheduled | No | |
| PS100001 | All Windows 11 | Windows 11 devices | 850 | Device | Incremental and Scheduled | Yes | All Systems |
| PS100002 | Pilot Group | Pilot deployment | 25 | Device | Manual | No | All Systems |

---

### Device_Collection_Membership.sql

Returns all collections a specific device belongs to. Replace `COMPUTER_NAME` with the device name.

**Sample Output:**

| Collection ID | Collection Name | Description | Membership Type |
|--------------|-----------------|-------------|-----------------|
| SMS00001 | All Systems | All Systems | Query |
| PS100001 | All Windows 11 | Windows 11 devices | Query |
| PS100005 | Finance Department | Finance workstations | Direct |

---

### Empty_Collections.sql

Returns all device collections with zero members.

**Sample Output:**

| Collection ID | Collection Name | Description | Limiting Collection | Refresh Type |
|--------------|-----------------|-------------|---------------------|--------------|
| PS100010 | Test Collection | Testing purposes | All Systems | Manual |
| PS100015 | Legacy XP | Windows XP systems | All Systems | Scheduled |

---

## Security

### BitLocker_Status.sql

Returns BitLocker encryption status for all devices including protection status, conversion status, and key protectors.

**Sample Output:**

| Computer Name | User Name | AD Site | Drive | Protection Status | Conversion Status | Encryption Method | Key Protectors |
|--------------|-----------|---------|-------|-------------------|-------------------|-------------------|----------------|
| PC-001 | jsmith | HQ-Site | C: | Protection On | Fully Encrypted | XTS-AES 256 | TPM, RecoveryPassword |
| PC-001 | jsmith | HQ-Site | D: | Protection On | Fully Encrypted | XTS-AES 128 | RecoveryPassword |
| PC-002 | mjones | Branch-A | C: | Protection Off | Fully Decrypted | None | None |

---

### BitLocker_Not_Encrypted.sql

Returns devices where the OS drive (C:) is not fully encrypted.

**Sample Output:**

| Computer Name | User Name | AD Site | Status |
|--------------|-----------|---------|--------|
| PC-020 | rgarcia | Branch-B | Fully Decrypted |
| PC-021 | jsmith | HQ-Site | Encryption In Progress |
| PC-022 | mjones | Branch-A | No BitLocker Data |

---

### TPM_Status.sql

Returns TPM chip information including activation, enabled status, ownership, and version.

**Sample Output:**

| Computer Name | User Name | AD Site | TPM Activated | TPM Enabled | TPM Owned | TPM Version | Manufacturer Version |
|--------------|-----------|---------|---------------|-------------|-----------|-------------|---------------------|
| PC-001 | jsmith | HQ-Site | Yes | Yes | Yes | 2.0 | 7.2.1.0 |
| PC-002 | mjones | Branch-A | Yes | Yes | No | 2.0 | 7.2.1.0 |
| PC-003 | alee | Branch-B | No | No | No | 1.2 | 5.1.0.0 |

---

### Defender_Status.sql

Returns Windows Defender antivirus status including real-time protection, signature version, and engine version.

**Sample Output:**

| Computer Name | User Name | AD Site | Antimalware Service | Real-Time Protection | AV Signature Version | Last Signature Update | Signature Age (Days) | Engine Version |
|--------------|-----------|---------|---------------------|----------------------|---------------------|----------------------|---------------------|----------------|
| PC-001 | jsmith | HQ-Site | Enabled | Enabled | 1.403.1234.0 | 2024-02-10 06:00 | 1 | 1.1.24010.10 |
| PC-002 | mjones | Branch-A | Enabled | Disabled | 1.403.1200.0 | 2024-02-05 12:00 | 6 | 1.1.24010.10 |

---

### Defender_Outdated_Signatures.sql

Returns devices with Defender signatures older than 7 days. Categorizes as Critical (> 14 days) or Warning (> 7 days).

**Sample Output:**

| Computer Name | User Name | AD Site | AV Signature Version | Last Signature Update | Signature Age (Days) | Status |
|--------------|-----------|---------|---------------------|----------------------|---------------------|--------|
| PC-025 | rgarcia | Branch-B | 1.401.1050.0 | 2024-01-20 08:00 | 22 | Critical (> 14 days) |
| PC-026 | jsmith | HQ-Site | 1.402.1100.0 | 2024-02-01 14:30 | 10 | Warning (> 7 days) |

---

### Secure_Boot_Status.sql

Returns Secure Boot configuration status and boot mode (UEFI vs Legacy BIOS).

**Sample Output:**

| Computer Name | User Name | AD Site | Secure Boot Status | Boot Mode |
|--------------|-----------|---------|-------------------|-----------|
| PC-001 | jsmith | HQ-Site | Enabled | UEFI |
| PC-002 | mjones | Branch-A | Disabled | UEFI |
| PC-003 | alee | Branch-B | Unknown/Not Supported | Legacy BIOS |

---

## Applications

### Application_List.sql

Returns all applications in MECM with deployment info, version, and creation dates.

**Sample Output:**

| CI ID | Application Name | Manufacturer | Version | Is Deployed | Is Enabled | Deployment Types | Created Date | Last Modified |
|-------|-----------------|--------------|---------|-------------|------------|------------------|--------------|---------------|
| 16777220 | Microsoft 365 Apps | Microsoft | 16.0 | 1 | 1 | 2 | 2023-06-15 | 2024-01-20 |
| 16777225 | Adobe Acrobat Reader | Adobe Inc. | 23.008 | 1 | 1 | 1 | 2023-08-10 | 2024-02-01 |
| 16777230 | 7-Zip | Igor Pavlov | 23.01 | 0 | 1 | 1 | 2024-01-05 | 2024-01-05 |

---

### Application_Deployment_Status.sql

Returns deployment status for all applications with success rates.

**Sample Output:**

| Application Name | Manufacturer | Target Collection | Total Targeted | Success | In Progress | Errors | Unknown | Success Rate % |
|-----------------|--------------|-------------------|----------------|---------|-------------|--------|---------|----------------|
| Microsoft 365 Apps | Microsoft | All Workstations | 1200 | 1150 | 20 | 15 | 15 | 95.8 |
| Adobe Acrobat Reader | Adobe Inc. | All Workstations | 1200 | 1100 | 50 | 30 | 20 | 91.7 |

---

### Application_Install_Status_By_Device.sql

Returns application installation status for a specific application. Replace `APPLICATION_NAME` with the app name.

**Sample Output:**

| Computer Name | User Name | AD Site | Application Name | Install Status | Enforcement State |
|--------------|-----------|---------|-----------------|----------------|-------------------|
| PC-001 | jsmith | HQ-Site | Microsoft 365 Apps | Installed | Success |
| PC-002 | mjones | Branch-A | Microsoft 365 Apps | Not Installed | In Progress |
| PC-003 | alee | Branch-B | Microsoft 365 Apps | Not Installed | Error |

---

### Failed_Deployments.sql

Returns all failed application deployments with error codes and descriptions.

**Sample Output:**

| Computer Name | User Name | AD Site | Application Name | Manufacturer | Error Code | Error Description |
|--------------|-----------|---------|-----------------|--------------|------------|-------------------|
| PC-030 | rgarcia | Branch-B | Custom App v2 | Contoso | 4002 | Failed to Install |
| PC-031 | jsmith | HQ-Site | Legacy Tool | Internal | 4001 | Failed to Download |
| PC-032 | mjones | Branch-A | Database Client | Oracle | 4004 | Dependency Failed |

---

### Deployment_Summary.sql

Returns summary statistics for all application deployments including total success rate.

**Sample Output:**

| Total Applications | Total Deployments | Total Targeted Devices | Total Successful | Total Failed | Total In Progress | Overall Success Rate % |
|-------------------|-------------------|------------------------|------------------|--------------|-------------------|------------------------|
| 45 | 120 | 54000 | 51500 | 850 | 1650 | 95.4 |

---

## Server

### Server_Summary.sql

Returns all Windows Server devices with OS version, build, and hardware specifications.

**Sample Output:**

| Computer Name | User Name | AD Site | Operating System | Server Version | Build Number | Manufacturer | Model | RAM (GB) | Processor | CPU Sockets | Total Cores |
|--------------|-----------|---------|------------------|----------------|--------------|--------------|-------|----------|-----------|-------------|-------------|
| SRV-DC01 | svcadmin | HQ-Site | Microsoft Windows Server 2022 Standard | Server 2022 | 20348 | Dell Inc. | PowerEdge R640 | 64 | Intel Xeon Gold 6230 | 2 | 40 |
| SRV-SQL01 | sqladmin | HQ-Site | Microsoft Windows Server 2019 Standard | Server 2019 | 17763 | HP | ProLiant DL380 Gen10 | 128 | Intel Xeon Gold 6248 | 2 | 40 |

---

### Server_Roles.sql

Returns installed server roles for all Windows Server devices. Filters to common roles like AD DS, DNS, DHCP, IIS, etc.

**Sample Output:**

| Computer Name | User Name | AD Site | Operating System | Role Name | Role ID | Install State |
|--------------|-----------|---------|------------------|-----------|---------|---------------|
| SRV-DC01 | svcadmin | HQ-Site | Microsoft Windows Server 2022 Standard | AD-Domain-Services | 110 | Installed |
| SRV-DC01 | svcadmin | HQ-Site | Microsoft Windows Server 2022 Standard | DNS | 109 | Installed |
| SRV-WEB01 | webadmin | Branch-A | Microsoft Windows Server 2019 Standard | Web-Server | 2 | Installed |

**Note:** Requires Server Feature hardware inventory class to be enabled in MECM.

---

### Server_Features.sql

Returns all installed Windows features for Windows Server devices.

**Sample Output:**

| Computer Name | User Name | AD Site | Operating System | Feature Name | Feature ID | Install State |
|--------------|-----------|---------|------------------|--------------|------------|---------------|
| SRV-DC01 | svcadmin | HQ-Site | Microsoft Windows Server 2022 Standard | NET-Framework-45-Core | 417 | Installed |
| SRV-DC01 | svcadmin | HQ-Site | Microsoft Windows Server 2022 Standard | RSAT-AD-Tools | 486 | Installed |

**Note:** Requires Server Feature hardware inventory class to be enabled in MECM.

---

### Server_Uptime.sql

Returns Windows Server devices with last boot time and uptime. Flags servers with extended uptime that may need patching/reboot.

**Sample Output:**

| Computer Name | User Name | AD Site | Operating System | Last Boot Time | Uptime (Days) | Status |
|--------------|-----------|---------|------------------|----------------|---------------|--------|
| SRV-LEGACY01 | svcadmin | Branch-B | Microsoft Windows Server 2016 Standard | 2024-08-15 03:00 | 120 | Critical (> 90 days) |
| SRV-APP02 | appadmin | HQ-Site | Microsoft Windows Server 2019 Standard | 2024-10-01 02:30 | 73 | Warning (> 60 days) |
| SRV-DC01 | svcadmin | HQ-Site | Microsoft Windows Server 2022 Standard | 2024-11-15 04:00 | 28 | OK |

---

### Server_OS_Versions.sql

Returns count of servers grouped by OS version.

**Sample Output:**

| Operating System | Server Version | Build Number | Server Count |
|-----------------|----------------|--------------|--------------|
| Microsoft Windows Server 2022 Standard | Server 2022 | 20348 | 45 |
| Microsoft Windows Server 2019 Standard | Server 2019 | 17763 | 120 |
| Microsoft Windows Server 2016 Standard | Server 2016 | 14393 | 65 |
| Microsoft Windows Server 2012 R2 Standard | Server 2012 R2 | 9600 | 15 |

---

### Server_TLS10_Enabled.sql

Returns Windows Server devices that may have TLS 1.0 enabled. TLS 1.0 is insecure and should be disabled.

**Sample Output:**

| Computer Name | User Name | AD Site | Operating System | Build Number | Registry Key | Value Name | Value | TLS 1.0 Status |
|--------------|-----------|---------|------------------|--------------|--------------|------------|-------|----------------|
| SRV-LEGACY01 | svcadmin | Branch-B | Microsoft Windows Server 2016 Standard | 14393 | TLS 1.0\Server | Enabled | 1 | TLS 1.0 Enabled - ACTION REQUIRED |
| SRV-APP03 | appadmin | HQ-Site | Microsoft Windows Server 2019 Standard | 17763 | TLS 1.0\Server | DisabledByDefault | 0 | TLS 1.0 May Be Enabled |
| SRV-DC01 | svcadmin | HQ-Site | Microsoft Windows Server 2022 Standard | 20348 | TLS 1.0\Server | Enabled | 0 | TLS 1.0 Disabled |

**Note:** Requires Registry hardware inventory class to be configured to collect SCHANNEL protocol settings.

---

## Usage Notes

### Query Conventions

- All queries use `v_R_System_Valid` instead of `v_R_System` to exclude obsolete records
- `COALESCE` is used to handle NULL values gracefully
- `FORMAT` is used for consistent date formatting (yyyy-MM-dd)
- Column aliases use `[Friendly Name]` format for SSRS compatibility
- `LEFT JOIN` is used for optional inventory data that may not exist for all devices

### Parameterized Queries

Several queries include `DECLARE` statements with variables you can modify:
- `@SoftwareName` - Software search pattern
- `@CollectionName` - Collection name to query
- `@ComputerName` - Specific device name
- `@AppName` - Application name pattern
- `@InactiveDays` - Threshold for inactive clients
- `@MaxAge` - Maximum age for Defender signatures

### Running the Queries

1. Connect to your MECM site database in SQL Server Management Studio
2. Open the desired .sql file
3. Modify any variables as needed
4. Execute the query

### Key MECM Database Views

| View Pattern | Purpose |
|-------------|---------|
| `v_R_System_Valid` | Valid device/resource system data |
| `v_GS_*` | Hardware inventory classes (Golden State) |
| `v_CH_*` | Client health data |
| `v_Update*` | Software update compliance |
| `v_Collection*` | Collection membership and details |
| `fn_ListApplicationCIs` | Application catalog |
