/*
    Computer Hardware Summary
    Description: Returns comprehensive hardware inventory for all devices
    Views Used: v_R_System_Valid, v_GS_COMPUTER_SYSTEM, v_GS_PC_BIOS, v_GS_PROCESSOR,
                v_GS_X86_PC_MEMORY, v_GS_OPERATING_SYSTEM, v_GS_SYSTEM_ENCLOSURE
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    COALESCE(cs.Manufacturer0, 'Unknown') AS [Manufacturer],
    COALESCE(cs.Model0, 'Unknown') AS [Model],
    CASE
        WHEN enc.ChassisTypes0 = 1 THEN 'Other'
        WHEN enc.ChassisTypes0 = 2 THEN 'Unknown'
        WHEN enc.ChassisTypes0 = 3 THEN 'Desktop'
        WHEN enc.ChassisTypes0 = 4 THEN 'Low Profile Desktop'
        WHEN enc.ChassisTypes0 = 5 THEN 'Pizza Box'
        WHEN enc.ChassisTypes0 = 6 THEN 'Mini Tower'
        WHEN enc.ChassisTypes0 = 7 THEN 'Tower'
        WHEN enc.ChassisTypes0 = 8 THEN 'Portable'
        WHEN enc.ChassisTypes0 = 9 THEN 'Laptop'
        WHEN enc.ChassisTypes0 = 10 THEN 'Notebook'
        WHEN enc.ChassisTypes0 = 11 THEN 'Hand Held'
        WHEN enc.ChassisTypes0 = 12 THEN 'Docking Station'
        WHEN enc.ChassisTypes0 = 13 THEN 'All in One'
        WHEN enc.ChassisTypes0 = 14 THEN 'Sub Notebook'
        WHEN enc.ChassisTypes0 = 15 THEN 'Space-Saving'
        WHEN enc.ChassisTypes0 = 16 THEN 'Lunch Box'
        WHEN enc.ChassisTypes0 = 17 THEN 'Main System Chassis'
        WHEN enc.ChassisTypes0 = 18 THEN 'Expansion Chassis'
        WHEN enc.ChassisTypes0 = 19 THEN 'Sub Chassis'
        WHEN enc.ChassisTypes0 = 20 THEN 'Bus Expansion Chassis'
        WHEN enc.ChassisTypes0 = 21 THEN 'Peripheral Chassis'
        WHEN enc.ChassisTypes0 = 22 THEN 'Storage Chassis'
        WHEN enc.ChassisTypes0 = 23 THEN 'Rack Mount Chassis'
        WHEN enc.ChassisTypes0 = 24 THEN 'Sealed-Case PC'
        ELSE 'Unknown'
    END AS [Chassis Type],
    COALESCE(bios.SerialNumber0, 'N/A') AS [Serial Number],
    COALESCE(proc.Name0, 'Unknown') AS [Processor],
    proc.NumberOfCores0 AS [CPU Cores],
    proc.NumberOfLogicalProcessors0 AS [Logical Processors],
    CAST(ROUND(mem.TotalPhysicalMemory0 / 1024.0 / 1024.0, 0) AS INT) AS [RAM (GB)],
    os.Caption0 AS [Operating System],
    os.BuildNumber0 AS [Build Number],
    FORMAT(os.InstallDate0, 'yyyy-MM-dd') AS [OS Install Date]
FROM v_R_System_Valid sys
LEFT JOIN v_GS_COMPUTER_SYSTEM cs
    ON sys.ResourceID = cs.ResourceID
LEFT JOIN v_GS_PC_BIOS bios
    ON sys.ResourceID = bios.ResourceID
LEFT JOIN v_GS_SYSTEM_ENCLOSURE enc
    ON sys.ResourceID = enc.ResourceID
LEFT JOIN v_GS_PROCESSOR proc
    ON sys.ResourceID = proc.ResourceID
LEFT JOIN v_GS_X86_PC_MEMORY mem
    ON sys.ResourceID = mem.ResourceID
LEFT JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
ORDER BY sys.Name0
