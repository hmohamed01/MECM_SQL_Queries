/*
    Last Boot Time Report
    Description: Returns devices with last boot time and uptime information
    Views Used: v_R_System_Valid, v_GS_OPERATING_SYSTEM
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.UserName0 AS [User Name],
    sys.AD_Site_Name0 AS [AD Site],
    FORMAT(os.LastBootUpTime0, 'yyyy-MM-dd HH:mm') AS [Last Boot Time],
    DATEDIFF(DAY, os.LastBootUpTime0, GETDATE()) AS [Uptime (Days)],
    CASE
        WHEN DATEDIFF(DAY, os.LastBootUpTime0, GETDATE()) > 30 THEN 'Needs Reboot (> 30 days)'
        WHEN DATEDIFF(DAY, os.LastBootUpTime0, GETDATE()) > 14 THEN 'Consider Reboot (> 14 days)'
        ELSE 'OK'
    END AS [Status]
FROM v_R_System_Valid sys
INNER JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
WHERE os.LastBootUpTime0 IS NOT NULL
ORDER BY os.LastBootUpTime0 ASC
