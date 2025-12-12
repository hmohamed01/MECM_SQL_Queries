/*
    Deployment Summary Statistics
    Description: Returns summary of all application deployments
    Views Used: fn_ListApplicationCIs, v_DeploymentSummary, v_CIAssignment
*/

SELECT
    COUNT(DISTINCT app.CI_ID) AS [Total Applications],
    COUNT(DISTINCT cia.AssignmentID) AS [Total Deployments],
    SUM(ds.NumberTotal) AS [Total Targeted Devices],
    SUM(ds.NumberSuccess) AS [Total Successful],
    SUM(ds.NumberErrors) AS [Total Failed],
    SUM(ds.NumberInProgress) AS [Total In Progress],
    CAST(ROUND(
        SUM(ds.NumberSuccess) * 100.0 / NULLIF(SUM(ds.NumberTotal), 0), 1
    ) AS DECIMAL(5,1)) AS [Overall Success Rate %]
FROM fn_ListApplicationCIs(1033) app
INNER JOIN v_CIAssignment cia
    ON app.CI_ID = cia.CI_ID
INNER JOIN v_DeploymentSummary ds
    ON cia.AssignmentID = ds.AssignmentID
WHERE cia.AssignmentType = 2  -- Application deployment
