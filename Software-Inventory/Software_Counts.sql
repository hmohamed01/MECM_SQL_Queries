/*
    Software Installation Counts
    Description: Returns count of installations for each software title
    Views Used: v_R_System_Valid, v_GS_ADD_REMOVE_PROGRAMS
*/

SELECT
    arp.DisplayName0 AS [Software Name],
    COALESCE(arp.Publisher0, 'Unknown') AS [Publisher],
    COUNT(DISTINCT sys.ResourceID) AS [Install Count]
FROM v_R_System_Valid sys
INNER JOIN v_GS_ADD_REMOVE_PROGRAMS arp
    ON sys.ResourceID = arp.ResourceID
WHERE arp.DisplayName0 IS NOT NULL
    AND arp.DisplayName0 <> ''
GROUP BY
    arp.DisplayName0,
    arp.Publisher0
ORDER BY [Install Count] DESC
