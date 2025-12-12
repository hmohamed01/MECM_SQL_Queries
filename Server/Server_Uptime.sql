/*
    Windows Server Uptime
    Description: Returns Windows Server devices with last boot time and uptime
    Views Used: v_R_System_Valid, v_GS_OPERATING_SYSTEM
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    os.Caption0 AS [Operating System],
    FORMAT(os.LastBootUpTime0, 'yyyy-MM-dd HH:mm') AS [Last Boot Time],
    DATEDIFF(DAY, os.LastBootUpTime0, GETDATE()) AS [Uptime (Days)],
    CASE
        WHEN DATEDIFF(DAY, os.LastBootUpTime0, GETDATE()) > 90 THEN 'Critical (> 90 days)'
        WHEN DATEDIFF(DAY, os.LastBootUpTime0, GETDATE()) > 60 THEN 'Warning (> 60 days)'
        WHEN DATEDIFF(DAY, os.LastBootUpTime0, GETDATE()) > 30 THEN 'Review (> 30 days)'
        ELSE 'OK'
    END AS [Status]
FROM v_R_System_Valid sys
INNER JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
WHERE os.Caption0 LIKE '%Server%'
    AND os.LastBootUpTime0 IS NOT NULL
ORDER BY os.LastBootUpTime0 ASC
