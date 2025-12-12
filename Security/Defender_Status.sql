/*
    Windows Defender Status
    Description: Returns Windows Defender antivirus status and signature info
    Views Used: v_R_System_Valid, v_GS_WINDOWS_DEFENDER_STATUS
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    CASE wds.AMServiceEnabled0
        WHEN 1 THEN 'Enabled'
        WHEN 0 THEN 'Disabled'
        ELSE 'Unknown'
    END AS [Antimalware Service],
    CASE wds.RealTimeProtectionEnabled0
        WHEN 1 THEN 'Enabled'
        WHEN 0 THEN 'Disabled'
        ELSE 'Unknown'
    END AS [Real-Time Protection],
    COALESCE(wds.AntivirusSignatureVersion0, 'N/A') AS [AV Signature Version],
    FORMAT(wds.AntivirusSignatureUpdateDateTime0, 'yyyy-MM-dd HH:mm') AS [Last Signature Update],
    DATEDIFF(DAY, wds.AntivirusSignatureUpdateDateTime0, GETDATE()) AS [Signature Age (Days)],
    COALESCE(wds.EngineVersion0, 'N/A') AS [Engine Version]
FROM v_R_System_Valid sys
LEFT JOIN v_GS_WINDOWS_DEFENDER_STATUS wds
    ON sys.ResourceID = wds.ResourceID
ORDER BY sys.Name0
