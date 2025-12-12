/*
    Operating System and Feature Update Version Counts
    Description: Returns count of computers grouped by OS caption and feature update version
    Views Used: v_GS_OPERATING_SYSTEM, v_R_System_Valid
*/

SELECT
    os.Caption0 AS [Operating System],
    CASE os.BuildNumber0
        -- Windows 10 builds
        WHEN '19041' THEN '2004'
        WHEN '19042' THEN '20H2'
        WHEN '19043' THEN '21H1'
        WHEN '19044' THEN '21H2'
        WHEN '19045' THEN '22H2'
        -- Windows 11 builds
        WHEN '22000' THEN '21H2'
        WHEN '22621' THEN '22H2'
        WHEN '22631' THEN '23H2'
        WHEN '26100' THEN '24H2'
        ELSE os.BuildNumber0
    END AS [Feature Update],
    os.BuildNumber0 AS [Build Number],
    COUNT(*) AS [Device Count]
FROM v_R_System_Valid sys
INNER JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
WHERE os.Caption0 LIKE '%Windows%'
GROUP BY
    os.Caption0,
    os.BuildNumber0
ORDER BY
    os.Caption0,
    os.BuildNumber0 DESC
