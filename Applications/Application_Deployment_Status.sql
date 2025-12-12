/*
    Application Deployment Status
    Description: Returns deployment status for all applications
    Views Used: fn_ListApplicationCIs, v_DeploymentSummary, v_CIAssignment
*/

SELECT
    app.DisplayName AS [Application Name],
    COALESCE(app.Manufacturer, 'Unknown') AS [Manufacturer],
    ds.CollectionName AS [Target Collection],
    ds.NumberTotal AS [Total Targeted],
    ds.NumberSuccess AS [Success],
    ds.NumberInProgress AS [In Progress],
    ds.NumberErrors AS [Errors],
    ds.NumberUnknown AS [Unknown],
    CAST(ROUND(
        ds.NumberSuccess * 100.0 / NULLIF(ds.NumberTotal, 0), 1
    ) AS DECIMAL(5,1)) AS [Success Rate %]
FROM fn_ListApplicationCIs(1033) app
INNER JOIN v_CIAssignment cia
    ON app.CI_ID = cia.CI_ID
INNER JOIN v_DeploymentSummary ds
    ON cia.AssignmentID = ds.AssignmentID
WHERE cia.AssignmentType = 2  -- Application deployment
ORDER BY
    app.DisplayName,
    ds.CollectionName
