/*
    Collection Members
    Description: Returns all members of a specific collection
    Views Used: v_R_System_Valid, v_FullCollectionMembership, v_Collection

    Usage: Replace 'COLLECTION_NAME' with the collection name to query
*/

DECLARE @CollectionName NVARCHAR(255) = 'COLLECTION_NAME'

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    col.Name AS [Collection Name],
    col.CollectionID AS [Collection ID],
    CASE fcm.IsDirect
        WHEN 1 THEN 'Direct'
        ELSE 'Query'
    END AS [Membership Type]
FROM v_R_System_Valid sys
INNER JOIN v_FullCollectionMembership fcm
    ON sys.ResourceID = fcm.ResourceID
INNER JOIN v_Collection col
    ON fcm.CollectionID = col.CollectionID
WHERE col.Name = @CollectionName
ORDER BY sys.Name0
