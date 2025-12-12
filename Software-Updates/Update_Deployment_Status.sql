/*
    Update Deployment Status
    Description: Returns deployment status for software update groups
    Views Used: v_CIAssignment, v_AuthListInfo, v_AssignmentTargetedMachines, v_UpdateComplianceStatus
*/

SELECT
    ali.Title AS [Update Group],
    COUNT(DISTINCT atm.ResourceID) AS [Targeted Devices],
    SUM(CASE WHEN ucs.Status = 3 THEN 1 ELSE 0 END) AS [Compliant],
    SUM(CASE WHEN ucs.Status = 2 THEN 1 ELSE 0 END) AS [Required],
    SUM(CASE WHEN ucs.Status = 1 THEN 1 ELSE 0 END) AS [Not Required],
    CAST(ROUND(
        SUM(CASE WHEN ucs.Status = 3 THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(COUNT(DISTINCT atm.ResourceID), 0), 1
    ) AS DECIMAL(5,1)) AS [Compliance %]
FROM v_CIAssignment cia
INNER JOIN v_AuthListInfo ali
    ON cia.AssignedCI_UniqueID = ali.CI_UniqueID
INNER JOIN v_AssignmentTargetedMachines atm
    ON cia.AssignmentID = atm.AssignmentID
LEFT JOIN v_UpdateComplianceStatus ucs
    ON atm.ResourceID = ucs.ResourceID
WHERE cia.AssignmentType = 5  -- Software Update Group
GROUP BY ali.Title
ORDER BY ali.Title
