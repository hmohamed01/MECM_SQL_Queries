/*
    Software Update Compliance Summary
    Description: Returns overall patch compliance status by update classification
    Views Used: v_R_System_Valid, v_UpdateComplianceStatus, v_UpdateInfo
*/

SELECT
    ui.UpdateClassification AS [Classification],
    COUNT(DISTINCT ucs.ResourceID) AS [Total Devices],
    SUM(CASE WHEN ucs.Status = 2 THEN 1 ELSE 0 END) AS [Required],
    SUM(CASE WHEN ucs.Status = 3 THEN 1 ELSE 0 END) AS [Installed],
    CAST(ROUND(
        SUM(CASE WHEN ucs.Status = 3 THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(COUNT(*), 0), 1
    ) AS DECIMAL(5,1)) AS [Compliance %]
FROM v_R_System_Valid sys
INNER JOIN v_UpdateComplianceStatus ucs
    ON sys.ResourceID = ucs.ResourceID
INNER JOIN v_UpdateInfo ui
    ON ucs.CI_ID = ui.CI_ID
WHERE ui.IsDeployed = 1
GROUP BY ui.UpdateClassification
ORDER BY [Classification]
