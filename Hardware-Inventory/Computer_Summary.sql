/*
    Computer Hardware Summary
    Description: Returns comprehensive hardware inventory for all devices
    Views Used: v_R_System_Valid, v_GS_COMPUTER_SYSTEM, v_GS_PC_BIOS, v_GS_PROCESSOR,
                v_GS_X86_PC_MEMORY, v_GS_OPERATING_SYSTEM
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    COALESCE(cs.Manufacturer0, 'Unknown') AS [Manufacturer],
    COALESCE(cs.Model0, 'Unknown') AS [Model],
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
LEFT JOIN v_GS_PROCESSOR proc
    ON sys.ResourceID = proc.ResourceID
LEFT JOIN v_GS_X86_PC_MEMORY mem
    ON sys.ResourceID = mem.ResourceID
LEFT JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
ORDER BY sys.Name0
