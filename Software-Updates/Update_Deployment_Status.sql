/*
    Update Deployment Status
    Description: Returns per-device deployment status for software update groups
    Views Used: v_CIAssignment, v_CIAssignmentToGroup, v_CIAssignmentTargetedMachines, v_CIAssignmentToCI, v_AuthListInfo, v_UpdateComplianceStatus

    Note: Each targeted device is counted once per update group, using only the updates in that
    group's deployments. Required = at least one update missing. Compliant = none missing and at
    least one installed. Not Required = none of the updates apply.
*/

SELECT
    ali.Title AS [Update Group],
    COUNT(*) AS [Targeted Devices],
    SUM(CASE WHEN dev.HasRequired = 0 AND dev.HasInstalled = 1 THEN 1 ELSE 0 END) AS [Compliant],
    SUM(dev.HasRequired) AS [Required],
    SUM(CASE WHEN dev.HasRequired = 0 AND dev.HasInstalled = 0 AND dev.HasNotRequired = 1 THEN 1 ELSE 0 END) AS [Not Required],
    CAST(ROUND(
        SUM(CASE WHEN dev.HasRequired = 0 AND dev.HasInstalled = 1 THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(COUNT(*), 0), 1
    ) AS DECIMAL(5,1)) AS [Compliance %]
FROM (
    -- One row per update group and targeted device
    SELECT
        atg.AssignedUpdateGroup,
        atm.ResourceID,
        MAX(CASE WHEN ucs.Status = 2 THEN 1 ELSE 0 END) AS HasRequired,
        MAX(CASE WHEN ucs.Status = 3 THEN 1 ELSE 0 END) AS HasInstalled,
        MAX(CASE WHEN ucs.Status = 1 THEN 1 ELSE 0 END) AS HasNotRequired
    FROM v_CIAssignment cia
    INNER JOIN v_CIAssignmentToGroup atg
        ON cia.AssignmentID = atg.AssignmentID
    INNER JOIN v_CIAssignmentTargetedMachines atm
        ON cia.AssignmentID = atm.AssignmentID
    LEFT JOIN v_CIAssignmentToCI atc
        ON cia.AssignmentID = atc.AssignmentID
    LEFT JOIN v_UpdateComplianceStatus ucs
        ON atm.ResourceID = ucs.ResourceID
        AND atc.CI_ID = ucs.CI_ID
    WHERE cia.AssignmentType = 5  -- Software Update Group
    GROUP BY
        atg.AssignedUpdateGroup,
        atm.ResourceID
) dev
INNER JOIN v_AuthListInfo ali
    ON dev.AssignedUpdateGroup = ali.CI_ID
GROUP BY
    ali.CI_ID,
    ali.Title
ORDER BY ali.Title
