/*
    Defender Outdated Signatures
    Description: Returns devices with Defender signatures older than 7 days
    Views Used: v_R_System_Valid, v_GS_WINDOWS_DEFENDER_STATUS

    Usage: Adjust @MaxAge to change the threshold (default 7 days)
*/

DECLARE @MaxAge INT = 7

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    COALESCE(wds.AntivirusSignatureVersion0, 'N/A') AS [AV Signature Version],
    COALESCE(FORMAT(wds.AntivirusSignatureUpdateDateTime0, 'yyyy-MM-dd HH:mm'), 'Never') AS [Last Signature Update],
    DATEDIFF(DAY, wds.AntivirusSignatureUpdateDateTime0, GETDATE()) AS [Signature Age (Days)],
    CASE
        WHEN DATEDIFF(DAY, wds.AntivirusSignatureUpdateDateTime0, GETDATE()) > 14 THEN 'Critical (> 14 days)'
        WHEN DATEDIFF(DAY, wds.AntivirusSignatureUpdateDateTime0, GETDATE()) > 7 THEN 'Warning (> 7 days)'
        ELSE 'OK'
    END AS [Status]
FROM v_R_System_Valid sys
LEFT JOIN v_GS_WINDOWS_DEFENDER_STATUS wds
    ON sys.ResourceID = wds.ResourceID
WHERE wds.AntivirusSignatureUpdateDateTime0 IS NULL
    OR DATEDIFF(DAY, wds.AntivirusSignatureUpdateDateTime0, GETDATE()) > @MaxAge
ORDER BY wds.AntivirusSignatureUpdateDateTime0 ASC
