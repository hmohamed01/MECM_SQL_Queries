# MECM SQL Queries

A comprehensive library of SQL queries for Microsoft Endpoint Configuration Manager (MECM/SCCM) database reporting. These queries run against the MECM site database to extract inventory, compliance, and device management data.

## Query Categories

| Category | Description | Query Count |
|----------|-------------|-------------|
| [Operating Systems](#operating-systems) | OS versions, feature updates, Windows client info | 3 |
| [Hardware Inventory](#hardware-inventory) | CPU, memory, disk, device models | 5 |
| [Software Inventory](#software-inventory) | Installed software, version tracking | 4 |
| [Client Health](#client-health) | Client status, activity, communication | 5 |
| [Software Updates](#software-updates) | Patch compliance, missing updates | 5 |
| [Collections](#collections) | Collection membership, device counts | 4 |
| [Security](#security) | BitLocker, Defender, TPM, Secure Boot | 6 |
| [Applications](#applications) | Application deployment status | 5 |

---

## Operating Systems

### Windows11_Clients.sql

Returns all Windows 11 devices from MECM inventory with detailed system information.

**Columns returned:**
- Computer Name, Primary User, AD Site
- Operating System, OS Version, Build Number
- Service Pack, OS Install Date, Last Boot Time

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

Returns comprehensive hardware inventory for all devices including manufacturer, model, CPU, RAM, and OS info.

**Sample Output:**

| Computer Name | Manufacturer | Model | Serial Number | Processor | RAM (GB) |
|--------------|--------------|-------|---------------|-----------|----------|
| PC-001 | Dell Inc. | Latitude 5520 | ABC123 | Intel Core i7 | 16 |
| PC-002 | HP | EliteBook 840 | XYZ789 | Intel Core i5 | 8 |

---

### Disk_Space.sql

Returns disk space usage for all logical drives on all devices.

---

### Low_Disk_Space.sql

Returns devices with less than 10GB or 10% free space on C: drive. Categorizes as Critical (< 5GB), Warning (< 10GB), or Low (< 10%).

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

Returns count of devices grouped by manufacturer and model.

---

## Software Inventory

### Installed_Software.sql

Returns all installed software from Add/Remove Programs for all devices.

---

### Software_Counts.sql

Returns count of installations for each software title across all devices.

---

### Find_Software.sql

Search for devices with specific software installed. Replace `SOFTWARE_NAME` with the software you're searching for.

---

### Software_Versions.sql

Returns version distribution for a specific software title. Useful for tracking version sprawl.

---

## Client Health

### Client_Status.sql

Returns client health status including last activity, DDR, hardware scan, and policy request times.

---

### Inactive_Clients.sql

Returns clients that haven't communicated in specified days (default 30). Categorizes as Critical (> 90 days), Warning (> 60 days), or Inactive (> 30 days).

---

### Client_Version.sql

Returns count of devices by Configuration Manager client version.

---

### Last_Boot_Time.sql

Returns devices with last boot time and uptime. Flags devices needing reboot (> 30 days uptime).

---

### Pending_Reboot.sql

Returns devices with pending reboot flags.

---

## Software Updates

### Update_Compliance_Summary.sql

Returns overall patch compliance status by update classification.

---

### Missing_Updates_By_Device.sql

Returns count of missing updates per device, broken down by severity (Critical, Important, Moderate, Low).

---

### Missing_Updates_Detail.sql

Returns detailed list of missing updates with KB article info and release dates.

---

### Last_Scan_Times.sql

Returns last software update scan time and status for each device.

---

### Update_Deployment_Status.sql

Returns deployment status for software update groups with compliance percentages.

---

## Collections

### Collection_Members.sql

Returns all members of a specific collection. Replace `COLLECTION_NAME` with the collection to query.

---

### Collection_Summary.sql

Returns all device collections with member counts, refresh type, and limiting collection.

---

### Device_Collection_Membership.sql

Returns all collections a specific device belongs to. Replace `COMPUTER_NAME` with the device name.

---

### Empty_Collections.sql

Returns all device collections with zero members.

---

## Security

### BitLocker_Status.sql

Returns BitLocker encryption status for all devices including protection status, conversion status, and key protectors.

---

### BitLocker_Not_Encrypted.sql

Returns devices where the OS drive (C:) is not fully encrypted.

---

### TPM_Status.sql

Returns TPM chip information including activation, enabled status, ownership, and version.

---

### Defender_Status.sql

Returns Windows Defender antivirus status including real-time protection, signature version, and engine version.

---

### Defender_Outdated_Signatures.sql

Returns devices with Defender signatures older than 7 days. Categorizes as Critical (> 14 days) or Warning (> 7 days).

---

### Secure_Boot_Status.sql

Returns Secure Boot configuration status and boot mode (UEFI vs Legacy BIOS).

---

## Applications

### Application_List.sql

Returns all applications in MECM with deployment info, version, and creation dates.

---

### Application_Deployment_Status.sql

Returns deployment status for all applications with success rates.

---

### Application_Install_Status_By_Device.sql

Returns application installation status for a specific application. Replace `APPLICATION_NAME` with the app name.

---

### Failed_Deployments.sql

Returns all failed application deployments with error codes and descriptions.

---

### Deployment_Summary.sql

Returns summary statistics for all application deployments including total success rate.

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
