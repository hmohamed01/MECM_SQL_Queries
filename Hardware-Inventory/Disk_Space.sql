/*
    Disk Space Inventory
    Description: Returns disk space usage for all logical drives
    Views Used: v_R_System_Valid, v_GS_LOGICAL_DISK
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.UserName0 AS [User Name],
    disk.DeviceID0 AS [Drive],
    disk.VolumeName0 AS [Volume Name],
    disk.FileSystem0 AS [File System],
    CAST(ROUND(disk.Size0 / 1024.0, 2) AS DECIMAL(10,2)) AS [Total Size (GB)],
    CAST(ROUND(disk.FreeSpace0 / 1024.0, 2) AS DECIMAL(10,2)) AS [Free Space (GB)],
    CAST(ROUND((disk.Size0 - disk.FreeSpace0) / 1024.0, 2) AS DECIMAL(10,2)) AS [Used Space (GB)],
    CAST(ROUND(((disk.Size0 - disk.FreeSpace0) * 100.0 / NULLIF(disk.Size0, 0)), 1) AS DECIMAL(5,1)) AS [Percent Used]
FROM v_R_System_Valid sys
INNER JOIN v_GS_LOGICAL_DISK disk
    ON sys.ResourceID = disk.ResourceID
WHERE disk.DriveType0 = 3  -- Local fixed disks only
    AND disk.Size0 > 0
ORDER BY
    sys.Name0,
    disk.DeviceID0
