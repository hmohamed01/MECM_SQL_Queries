/*
    Find Specific Software
    Description: Search for devices with specific software installed
    Views Used: v_R_System_Valid, v_GS_ADD_REMOVE_PROGRAMS

    Usage: Replace 'SOFTWARE_NAME' with the software you're searching for
*/

DECLARE @SoftwareName NVARCHAR(255) = '%SOFTWARE_NAME%'

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    arp.DisplayName0 AS [Software Name],
    COALESCE(arp.Version0, 'N/A') AS [Version],
    COALESCE(arp.Publisher0, 'Unknown') AS [Publisher],
    FORMAT(arp.InstallDate0, 'yyyy-MM-dd') AS [Install Date]
FROM v_R_System_Valid sys
INNER JOIN v_GS_ADD_REMOVE_PROGRAMS arp
    ON sys.ResourceID = arp.ResourceID
WHERE arp.DisplayName0 LIKE @SoftwareName
ORDER BY
    sys.Name0,
    arp.DisplayName0
