/*
    Client Status Overview
    Description: Returns client health status including last activity and communication
    Views Used: v_R_System_Valid, v_CH_ClientSummary, v_GS_WORKSTATION_STATUS
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    CASE ch.ClientActiveStatus
        WHEN 1 THEN 'Active'
        WHEN 0 THEN 'Inactive'
        ELSE 'Unknown'
    END AS [Client Status],
    CASE ch.IsActiveDDR
        WHEN 1 THEN 'Yes'
        WHEN 0 THEN 'No'
        ELSE 'Unknown'
    END AS [Active DDR],
    CASE ch.IsActiveHW
        WHEN 1 THEN 'Yes'
        WHEN 0 THEN 'No'
        ELSE 'Unknown'
    END AS [Active HW Inventory],
    FORMAT(ch.LastDDR, 'yyyy-MM-dd HH:mm') AS [Last DDR],
    FORMAT(ch.LastHW, 'yyyy-MM-dd HH:mm') AS [Last HW Scan],
    FORMAT(ch.LastPolicyRequest, 'yyyy-MM-dd HH:mm') AS [Last Policy Request],
    DATEDIFF(DAY, ch.LastDDR, GETDATE()) AS [Days Since DDR],
    DATEDIFF(DAY, ch.LastHW, GETDATE()) AS [Days Since HW Scan]
FROM v_R_System_Valid sys
LEFT JOIN v_CH_ClientSummary ch
    ON sys.ResourceID = ch.ResourceID
ORDER BY sys.Name0
