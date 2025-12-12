/*
    Application Install Status by Device
    Description: Returns application installation status for a specific application
    Views Used: v_R_System_Valid, fn_ListApplicationCIs, v_AppIntentAssetData

    Usage: Replace 'APPLICATION_NAME' with the application name
*/

DECLARE @AppName NVARCHAR(255) = '%APPLICATION_NAME%'

SELECT
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    app.DisplayName AS [Application Name],
    CASE aiad.ComplianceState
        WHEN 1 THEN 'Installed'
        WHEN 2 THEN 'Not Installed'
        WHEN 3 THEN 'Unknown'
        ELSE 'Unknown'
    END AS [Install Status],
    CASE aiad.EnforcementState
        WHEN 1000 THEN 'Success'
        WHEN 1001 THEN 'Already Compliant'
        WHEN 1002 THEN 'Simulate Success'
        WHEN 2000 THEN 'In Progress'
        WHEN 2001 THEN 'Waiting for Content'
        WHEN 2002 THEN 'Installing'
        WHEN 2003 THEN 'Restart Pending'
        WHEN 2004 THEN 'Waiting for Maintenance Window'
        WHEN 2005 THEN 'Waiting for Install Window'
        WHEN 2006 THEN 'Pending Soft Reboot'
        WHEN 3000 THEN 'Requirements Not Met'
        WHEN 4000 THEN 'Error'
        WHEN 5000 THEN 'Evaluating'
        ELSE CAST(aiad.EnforcementState AS VARCHAR(10))
    END AS [Enforcement State]
FROM v_R_System_Valid sys
INNER JOIN v_AppIntentAssetData aiad
    ON sys.ResourceID = aiad.MachineID
INNER JOIN fn_ListApplicationCIs(1033) app
    ON aiad.AppCI = app.CI_ID
WHERE app.DisplayName LIKE @AppName
ORDER BY
    sys.Name0,
    app.DisplayName
