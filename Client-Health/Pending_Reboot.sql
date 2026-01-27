/*
    Pending Reboot Status
    Description: Returns devices with pending reboot flags
    Views Used: v_R_System_Valid, v_CombinedDeviceResources
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.UserName0 AS [User Name],
    sys.AD_Site_Name0 AS [AD Site],
    CASE cdr.PendingReboot
        WHEN 1 THEN 'Yes'
        WHEN 0 THEN 'No'
        ELSE 'Unknown'
    END AS [Pending Reboot],
    FORMAT(cdr.LastHardwareScan, 'yyyy-MM-dd HH:mm') AS [Last HW Scan]
FROM v_R_System_Valid sys
LEFT JOIN v_CombinedDeviceResources cdr
    ON sys.ResourceID = cdr.MachineID
WHERE cdr.PendingReboot = 1
ORDER BY sys.Name0
