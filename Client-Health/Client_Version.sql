/*
    MECM Client Version Distribution
    Description: Returns count of devices by Configuration Manager client version
    Views Used: v_R_System_Valid
*/

SELECT
    COALESCE(sys.Client_Version0, 'No Client') AS [Client Version],
    COUNT(*) AS [Device Count]
FROM v_R_System_Valid sys
GROUP BY sys.Client_Version0
ORDER BY [Device Count] DESC
