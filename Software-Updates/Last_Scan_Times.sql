/*
    Software Update Last Scan Times
    Description: Returns last software update scan time for each device
    Views Used: v_R_System_Valid, v_UpdateScanStatus
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    COALESCE(FORMAT(uss.LastScanTime, 'yyyy-MM-dd HH:mm'), 'Never') AS [Last Scan Time],
    DATEDIFF(DAY, uss.LastScanTime, GETDATE()) AS [Days Since Scan],
    CASE uss.LastScanState
        WHEN 0 THEN 'Unknown'
        WHEN 1 THEN 'Waiting for Scan'
        WHEN 2 THEN 'Running'
        WHEN 3 THEN 'Completed'
        WHEN 4 THEN 'Pending Retry'
        WHEN 5 THEN 'Failed'
        ELSE 'Unknown'
    END AS [Scan Status]
FROM v_R_System_Valid sys
LEFT JOIN v_UpdateScanStatus uss
    ON sys.ResourceID = uss.ResourceID
ORDER BY uss.LastScanTime ASC
