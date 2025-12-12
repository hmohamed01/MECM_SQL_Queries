/*
    Memory Summary by RAM Amount
    Description: Returns count of devices grouped by RAM capacity
    Views Used: v_R_System_Valid, v_GS_X86_PC_MEMORY
*/

SELECT
    CAST(ROUND(mem.TotalPhysicalMemory0 / 1024.0 / 1024.0, 0) AS INT) AS [RAM (GB)],
    COUNT(*) AS [Device Count]
FROM v_R_System_Valid sys
INNER JOIN v_GS_X86_PC_MEMORY mem
    ON sys.ResourceID = mem.ResourceID
GROUP BY CAST(ROUND(mem.TotalPhysicalMemory0 / 1024.0 / 1024.0, 0) AS INT)
ORDER BY [RAM (GB)] DESC
