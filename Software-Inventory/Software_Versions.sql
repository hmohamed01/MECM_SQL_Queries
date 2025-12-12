/*
    Software Version Distribution
    Description: Returns version distribution for a specific software title
    Views Used: v_R_System_Valid, v_GS_ADD_REMOVE_PROGRAMS

    Usage: Replace 'SOFTWARE_NAME' with the software you're analyzing
*/

DECLARE @SoftwareName NVARCHAR(255) = '%SOFTWARE_NAME%'

SELECT
    arp.DisplayName0 AS [Software Name],
    COALESCE(arp.Version0, 'N/A') AS [Version],
    COUNT(*) AS [Install Count]
FROM v_R_System_Valid sys
INNER JOIN v_GS_ADD_REMOVE_PROGRAMS arp
    ON sys.ResourceID = arp.ResourceID
WHERE arp.DisplayName0 LIKE @SoftwareName
GROUP BY
    arp.DisplayName0,
    arp.Version0
ORDER BY
    arp.DisplayName0,
    [Install Count] DESC
