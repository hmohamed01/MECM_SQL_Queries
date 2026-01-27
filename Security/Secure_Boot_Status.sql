/*
    Secure Boot Status
    Description: Returns Secure Boot configuration status
    Views Used: v_R_System_Valid, v_GS_FIRMWARE
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.UserName0 AS [User Name],
    sys.AD_Site_Name0 AS [AD Site],
    CASE fw.SecureBoot0
        WHEN 1 THEN 'Enabled'
        WHEN 0 THEN 'Disabled'
        ELSE 'Unknown/Not Supported'
    END AS [Secure Boot Status],
    CASE fw.UEFI0
        WHEN 1 THEN 'UEFI'
        WHEN 0 THEN 'Legacy BIOS'
        ELSE 'Unknown'
    END AS [Boot Mode]
FROM v_R_System_Valid sys
LEFT JOIN v_GS_FIRMWARE fw
    ON sys.ResourceID = fw.ResourceID
ORDER BY sys.Name0
