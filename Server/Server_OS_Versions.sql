/*
    Windows Server OS Version Summary
    Description: Returns count of servers grouped by OS version
    Views Used: v_R_System_Valid, v_GS_OPERATING_SYSTEM
*/

SELECT
    os.Caption0 AS [Operating System],
    CASE
        WHEN os.Caption0 LIKE '%2022%' THEN 'Server 2022'
        WHEN os.Caption0 LIKE '%2019%' THEN 'Server 2019'
        WHEN os.Caption0 LIKE '%2016%' THEN 'Server 2016'
        WHEN os.Caption0 LIKE '%2012 R2%' THEN 'Server 2012 R2'
        WHEN os.Caption0 LIKE '%2012%' THEN 'Server 2012'
        WHEN os.Caption0 LIKE '%2008 R2%' THEN 'Server 2008 R2'
        WHEN os.Caption0 LIKE '%2008%' THEN 'Server 2008'
        ELSE 'Other'
    END AS [Server Version],
    os.BuildNumber0 AS [Build Number],
    COUNT(*) AS [Server Count]
FROM v_R_System_Valid sys
INNER JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
WHERE os.Caption0 LIKE '%Server%'
GROUP BY
    os.Caption0,
    os.BuildNumber0
ORDER BY
    [Server Count] DESC,
    os.Caption0
