/*
    Device Collection Membership
    Description: Returns all collections a specific device belongs to
    Views Used: v_R_System_Valid, v_FullCollectionMembership, v_Collection

    Usage: Replace 'COMPUTER_NAME' with the device name to query
*/

DECLARE @ComputerName NVARCHAR(255) = 'COMPUTER_NAME'

SELECT
    col.CollectionID AS [Collection ID],
    col.Name AS [Collection Name],
    COALESCE(col.Comment, '') AS [Description],
    CASE fcm.IsDirect
        WHEN 1 THEN 'Direct'
        ELSE 'Query'
    END AS [Membership Type]
FROM v_R_System_Valid sys
INNER JOIN v_FullCollectionMembership fcm
    ON sys.ResourceID = fcm.ResourceID
INNER JOIN v_Collection col
    ON fcm.CollectionID = col.CollectionID
WHERE sys.Name0 = @ComputerName
    AND col.CollectionType = 2  -- Device collections only
ORDER BY col.Name
