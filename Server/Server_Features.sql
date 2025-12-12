/*
    Windows Server Features
    Description: Returns all installed Windows features for Windows Server devices
    Views Used: v_R_System_Valid, v_GS_OPERATING_SYSTEM, v_GS_SERVER_FEATURE

    Note: Requires Server Feature hardware inventory class to be enabled in MECM
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    os.Caption0 AS [Operating System],
    sf.Name0 AS [Feature Name],
    sf.ID0 AS [Feature ID],
    CASE sf.InstallState0
        WHEN 1 THEN 'Installed'
        WHEN 2 THEN 'Removed'
        WHEN 3 THEN 'Install Pending'
        WHEN 4 THEN 'Remove Pending'
        ELSE 'Unknown'
    END AS [Install State]
FROM v_R_System_Valid sys
INNER JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
INNER JOIN v_GS_SERVER_FEATURE sf
    ON sys.ResourceID = sf.ResourceID
WHERE os.Caption0 LIKE '%Server%'
    AND sf.InstallState0 = 1  -- Only installed features
ORDER BY
    sys.Name0,
    sf.Name0
