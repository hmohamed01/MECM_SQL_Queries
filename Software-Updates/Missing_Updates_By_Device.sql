/*
    Missing Updates by Device
    Description: Returns count of missing updates per device
    Views Used: v_R_System_Valid, v_UpdateComplianceStatus, v_UpdateInfo
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    COUNT(DISTINCT ucs.CI_ID) AS [Missing Updates],
    SUM(CASE WHEN ui.Severity = 10 THEN 1 ELSE 0 END) AS [Critical],
    SUM(CASE WHEN ui.Severity = 8 THEN 1 ELSE 0 END) AS [Important],
    SUM(CASE WHEN ui.Severity = 6 THEN 1 ELSE 0 END) AS [Moderate],
    SUM(CASE WHEN ui.Severity = 2 THEN 1 ELSE 0 END) AS [Low]
FROM v_R_System_Valid sys
INNER JOIN v_UpdateComplianceStatus ucs
    ON sys.ResourceID = ucs.ResourceID
INNER JOIN v_UpdateInfo ui
    ON ucs.CI_ID = ui.CI_ID
WHERE ucs.Status = 2  -- Required (missing)
    AND ui.IsDeployed = 1
GROUP BY
    sys.ResourceID,
    sys.Name0,
    sys.AD_Site_Name0
ORDER BY [Missing Updates] DESC
