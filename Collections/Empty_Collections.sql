/*
    Empty Collections
    Description: Returns all device collections with zero members
    Views Used: v_Collection
*/

SELECT
    col.CollectionID AS [Collection ID],
    col.Name AS [Collection Name],
    COALESCE(col.Comment, '') AS [Description],
    col.LimitToCollectionName AS [Limiting Collection],
    CASE col.RefreshType
        WHEN 1 THEN 'Manual'
        WHEN 2 THEN 'Scheduled'
        WHEN 4 THEN 'Incremental'
        WHEN 6 THEN 'Incremental and Scheduled'
        ELSE 'Unknown'
    END AS [Refresh Type]
FROM v_Collection col
WHERE col.CollectionType = 2  -- Device collections only
    AND col.MemberCount = 0
ORDER BY col.Name
