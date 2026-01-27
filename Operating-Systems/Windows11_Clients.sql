/*
    Windows 11 Clients Query
    Description: Returns all Windows 11 devices from MECM inventory
    Views Used: v_GS_OPERATING_SYSTEM, v_R_System_Valid, v_GS_SYSTEM_CONSOLE_USAGE
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.UserName0 AS [User Name],
    scu.TopConsoleUser0 AS [Primary User],
    sys.AD_Site_Name0 AS [AD Site],
    os.Caption0 AS [Operating System],
    os.Version0 AS [OS Version],
    os.BuildNumber0 AS [Build Number],
    os.CSDVersion0 AS [Service Pack],
    os.InstallDate0 AS [OS Install Date],
    os.LastBootUpTime0 AS [Last Boot Time]
FROM v_R_System_Valid sys
INNER JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
LEFT JOIN v_GS_SYSTEM_CONSOLE_USAGE scu
    ON sys.ResourceID = scu.ResourceID
WHERE os.Caption0 LIKE '%Windows 11%'
ORDER BY sys.Name0
