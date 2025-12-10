# MECM_SQL_Queries

A collection of useful SQL queries to run against the MECM SQL database.

## Queries

### Windows11_Clients.sql

Returns all Windows 11 devices from MECM inventory with detailed system information.

**Columns returned:**
- Computer Name
- Primary User
- AD Site
- Operating System
- OS Version
- Build Number
- Service Pack
- OS Install Date
- Last Boot Time

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
