/*
    Application List
    Description: Returns all applications in MECM with deployment info
    Views Used: fn_ListApplicationCIs, v_CIAssignment
*/

SELECT
    app.CI_ID AS [CI ID],
    app.DisplayName AS [Application Name],
    COALESCE(app.Manufacturer, 'Unknown') AS [Manufacturer],
    COALESCE(app.SoftwareVersion, 'N/A') AS [Version],
    app.IsDeployed AS [Is Deployed],
    app.IsEnabled AS [Is Enabled],
    app.NumberOfDeploymentTypes AS [Deployment Types],
    FORMAT(app.DateCreated, 'yyyy-MM-dd') AS [Created Date],
    FORMAT(app.DateLastModified, 'yyyy-MM-dd') AS [Last Modified]
FROM fn_ListApplicationCIs(1033) app  -- 1033 = English locale
ORDER BY app.DisplayName
