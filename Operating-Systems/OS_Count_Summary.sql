/*
    Operating System Count Summary
    Description: Returns count of computers grouped by OS caption only
    Views Used: v_GS_OPERATING_SYSTEM, v_R_System_Valid
*/

SELECT
    os.Caption0 AS [Operating System],
    COUNT(*) AS [Device Count]
FROM v_R_System_Valid sys
INNER JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
WHERE os.Caption0 LIKE '%Windows%'
GROUP BY os.Caption0
ORDER BY [Device Count] DESC
