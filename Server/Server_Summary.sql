/*
    Windows Server Summary
    Description: Returns all Windows Server devices with OS version, build, and hardware specs
    Views Used: v_R_System_Valid, v_GS_OPERATING_SYSTEM, v_GS_COMPUTER_SYSTEM, v_GS_X86_PC_MEMORY, v_GS_PROCESSOR
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    os.Caption0 AS [Operating System],
    CASE
        WHEN os.Caption0 LIKE '%2022%' THEN 'Server 2022'
        WHEN os.Caption0 LIKE '%2019%' THEN 'Server 2019'
        WHEN os.Caption0 LIKE '%2016%' THEN 'Server 2016'
        WHEN os.Caption0 LIKE '%2012 R2%' THEN 'Server 2012 R2'
        WHEN os.Caption0 LIKE '%2012%' THEN 'Server 2012'
        ELSE 'Other'
    END AS [Server Version],
    os.Version0 AS [OS Version],
    os.BuildNumber0 AS [Build Number],
    os.CSDVersion0 AS [Service Pack],
    COALESCE(cs.Manufacturer0, 'Unknown') AS [Manufacturer],
    COALESCE(cs.Model0, 'Unknown') AS [Model],
    cs.SystemType0 AS [System Type],
    CAST(ROUND(mem.TotalPhysicalMemory0 / 1024.0 / 1024.0, 0) AS INT) AS [RAM (GB)],
    proc.Name0 AS [Processor],
    cs.NumberOfProcessors0 AS [CPU Sockets],
    proc.NumberOfCores0 AS [Total Cores],
    FORMAT(os.InstallDate0, 'yyyy-MM-dd') AS [OS Install Date],
    FORMAT(os.LastBootUpTime0, 'yyyy-MM-dd HH:mm') AS [Last Boot Time]
FROM v_R_System_Valid sys
INNER JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
LEFT JOIN v_GS_COMPUTER_SYSTEM cs
    ON sys.ResourceID = cs.ResourceID
LEFT JOIN v_GS_X86_PC_MEMORY mem
    ON sys.ResourceID = mem.ResourceID
LEFT JOIN v_GS_PROCESSOR proc
    ON sys.ResourceID = proc.ResourceID
WHERE os.Caption0 LIKE '%Server%'
ORDER BY sys.Name0
