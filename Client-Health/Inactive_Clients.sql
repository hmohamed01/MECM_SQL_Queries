/*
    Inactive Clients Report
    Description: Returns clients that haven't communicated in specified days
    Views Used: v_R_System_Valid, v_CH_ClientSummary

    Usage: Adjust @InactiveDays to change the threshold (default 30 days)
*/

DECLARE @InactiveDays INT = 30

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    COALESCE(FORMAT(ch.LastDDR, 'yyyy-MM-dd HH:mm'), 'Never') AS [Last DDR],
    COALESCE(FORMAT(ch.LastHW, 'yyyy-MM-dd HH:mm'), 'Never') AS [Last HW Scan],
    COALESCE(FORMAT(ch.LastPolicyRequest, 'yyyy-MM-dd HH:mm'), 'Never') AS [Last Policy Request],
    DATEDIFF(DAY, ch.LastDDR, GETDATE()) AS [Days Inactive],
    CASE
        WHEN DATEDIFF(DAY, ch.LastDDR, GETDATE()) > 90 THEN 'Critical (> 90 days)'
        WHEN DATEDIFF(DAY, ch.LastDDR, GETDATE()) > 60 THEN 'Warning (> 60 days)'
        ELSE 'Inactive (> 30 days)'
    END AS [Status]
FROM v_R_System_Valid sys
LEFT JOIN v_CH_ClientSummary ch
    ON sys.ResourceID = ch.ResourceID
WHERE ch.LastDDR IS NULL
    OR DATEDIFF(DAY, ch.LastDDR, GETDATE()) > @InactiveDays
ORDER BY ch.LastDDR ASC
