/*
    Installed Software Inventory
    Description: Returns all installed software from Add/Remove Programs
    Views Used: v_R_System_Valid, v_GS_ADD_REMOVE_PROGRAMS
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    arp.DisplayName0 AS [Software Name],
    COALESCE(arp.Version0, 'N/A') AS [Version],
    COALESCE(arp.Publisher0, 'Unknown') AS [Publisher],
    FORMAT(arp.InstallDate0, 'yyyy-MM-dd') AS [Install Date]
FROM v_R_System_Valid sys
INNER JOIN v_GS_ADD_REMOVE_PROGRAMS arp
    ON sys.ResourceID = arp.ResourceID
WHERE arp.DisplayName0 IS NOT NULL
    AND arp.DisplayName0 <> ''
ORDER BY
    sys.Name0,
    arp.DisplayName0
