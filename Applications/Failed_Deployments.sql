/*
    Failed Application Deployments
    Description: Returns all failed application deployments with error details
    Views Used: v_R_System_Valid, fn_ListApplicationCIs, v_AppIntentAssetData
*/

SELECT
    sys.Name0 AS [Computer Name],
    sys.UserName0 AS [User Name],
    sys.AD_Site_Name0 AS [AD Site],
    app.DisplayName AS [Application Name],
    COALESCE(app.Manufacturer, 'Unknown') AS [Manufacturer],
    aiad.EnforcementState AS [Error Code],
    CASE aiad.EnforcementState
        WHEN 4000 THEN 'Unknown Error'
        WHEN 4001 THEN 'Failed to Download'
        WHEN 4002 THEN 'Failed to Install'
        WHEN 4003 THEN 'Failed to Uninstall'
        WHEN 4004 THEN 'Dependency Failed'
        ELSE 'Error: ' + CAST(aiad.EnforcementState AS VARCHAR(10))
    END AS [Error Description]
FROM v_R_System_Valid sys
INNER JOIN v_AppIntentAssetData aiad
    ON sys.ResourceID = aiad.MachineID
INNER JOIN fn_ListApplicationCIs(1033) app
    ON aiad.AppCI = app.CI_ID
WHERE aiad.EnforcementState >= 4000
    AND aiad.EnforcementState < 5000
ORDER BY
    app.DisplayName,
    sys.Name0
