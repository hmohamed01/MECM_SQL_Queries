/*
    Collection Summary
    Description: Returns all device collections with member counts
    Views Used: v_Collection, v_FullCollectionMembership
*/

SELECT
    col.CollectionID AS [Collection ID],
    col.Name AS [Collection Name],
    COALESCE(col.Comment, '') AS [Description],
    col.MemberCount AS [Member Count],
    CASE col.CollectionType
        WHEN 1 THEN 'User'
        WHEN 2 THEN 'Device'
        ELSE 'Unknown'
    END AS [Collection Type],
    CASE col.RefreshType
        WHEN 1 THEN 'Manual'
        WHEN 2 THEN 'Scheduled'
        WHEN 4 THEN 'Incremental'
        WHEN 6 THEN 'Incremental and Scheduled'
        ELSE 'Unknown'
    END AS [Refresh Type],
    col.LimitToCollectionName AS [Limiting Collection]
FROM v_Collection col
WHERE col.CollectionType = 2  -- Device collections only
ORDER BY col.Name
