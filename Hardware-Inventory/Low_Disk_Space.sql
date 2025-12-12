/*
    Low Disk Space Report
    Description: Returns devices with less than 10GB or 10% free space on C: drive
    Views Used: v_R_System_Valid, v_GS_LOGICAL_DISK
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    disk.DeviceID0 AS [Drive],
    CAST(ROUND(disk.Size0 / 1024.0, 2) AS DECIMAL(10,2)) AS [Total Size (GB)],
    CAST(ROUND(disk.FreeSpace0 / 1024.0, 2) AS DECIMAL(10,2)) AS [Free Space (GB)],
    CAST(ROUND(((disk.Size0 - disk.FreeSpace0) * 100.0 / NULLIF(disk.Size0, 0)), 1) AS DECIMAL(5,1)) AS [Percent Used],
    CASE
        WHEN disk.FreeSpace0 / 1024.0 < 5 THEN 'Critical (< 5GB)'
        WHEN disk.FreeSpace0 / 1024.0 < 10 THEN 'Warning (< 10GB)'
        ELSE 'Low (< 10%)'
    END AS [Status]
FROM v_R_System_Valid sys
INNER JOIN v_GS_LOGICAL_DISK disk
    ON sys.ResourceID = disk.ResourceID
WHERE disk.DriveType0 = 3
    AND disk.DeviceID0 = 'C:'
    AND (disk.FreeSpace0 / 1024.0 < 10
         OR (disk.FreeSpace0 * 100.0 / NULLIF(disk.Size0, 0)) < 10)
ORDER BY disk.FreeSpace0 ASC
