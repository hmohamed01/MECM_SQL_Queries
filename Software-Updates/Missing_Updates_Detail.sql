/*
    Missing Updates Detail
    Description: Returns detailed list of missing updates with KB article info
    Views Used: v_R_System_Valid, v_UpdateComplianceStatus, v_UpdateInfo
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.UserName0 AS [User Name],
    ui.Title AS [Update Title],
    ui.ArticleID AS [KB Article],
    ui.BulletinID AS [Bulletin ID],
    CASE ui.Severity
        WHEN 10 THEN 'Critical'
        WHEN 8 THEN 'Important'
        WHEN 6 THEN 'Moderate'
        WHEN 2 THEN 'Low'
        ELSE 'Unspecified'
    END AS [Severity],
    ui.UpdateClassification AS [Classification],
    FORMAT(ui.DatePosted, 'yyyy-MM-dd') AS [Release Date]
FROM v_R_System_Valid sys
INNER JOIN v_UpdateComplianceStatus ucs
    ON sys.ResourceID = ucs.ResourceID
INNER JOIN v_UpdateInfo ui
    ON ucs.CI_ID = ui.CI_ID
WHERE ucs.Status = 2  -- Required (missing)
    AND ui.IsDeployed = 1
ORDER BY
    sys.Name0,
    ui.Severity DESC,
    ui.DatePosted DESC
