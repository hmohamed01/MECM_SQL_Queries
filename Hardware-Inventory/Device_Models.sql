/*
    Device Models Summary
    Description: Returns count of devices grouped by manufacturer and model
    Views Used: v_R_System_Valid, v_GS_COMPUTER_SYSTEM
*/

SELECT
    COALESCE(cs.Manufacturer0, 'Unknown') AS [Manufacturer],
    COALESCE(cs.Model0, 'Unknown') AS [Model],
    COUNT(*) AS [Device Count]
FROM v_R_System_Valid sys
INNER JOIN v_GS_COMPUTER_SYSTEM cs
    ON sys.ResourceID = cs.ResourceID
GROUP BY
    cs.Manufacturer0,
    cs.Model0
ORDER BY
    [Device Count] DESC,
    [Manufacturer],
    [Model]
