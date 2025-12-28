/*
    Device Models Summary
    Description: Returns count of devices grouped by manufacturer, model, and chassis type
    Views Used: v_R_System_Valid, v_GS_COMPUTER_SYSTEM, v_GS_SYSTEM_ENCLOSURE
*/

SELECT
    COALESCE(cs.Manufacturer0, 'Unknown') AS [Manufacturer],
    COALESCE(cs.Model0, 'Unknown') AS [Model],
    CASE
        WHEN enc.ChassisTypes0 = 1 THEN 'Other'
        WHEN enc.ChassisTypes0 = 2 THEN 'Unknown'
        WHEN enc.ChassisTypes0 = 3 THEN 'Desktop'
        WHEN enc.ChassisTypes0 = 4 THEN 'Low Profile Desktop'
        WHEN enc.ChassisTypes0 = 5 THEN 'Pizza Box'
        WHEN enc.ChassisTypes0 = 6 THEN 'Mini Tower'
        WHEN enc.ChassisTypes0 = 7 THEN 'Tower'
        WHEN enc.ChassisTypes0 = 8 THEN 'Portable'
        WHEN enc.ChassisTypes0 = 9 THEN 'Laptop'
        WHEN enc.ChassisTypes0 = 10 THEN 'Notebook'
        WHEN enc.ChassisTypes0 = 11 THEN 'Hand Held'
        WHEN enc.ChassisTypes0 = 12 THEN 'Docking Station'
        WHEN enc.ChassisTypes0 = 13 THEN 'All in One'
        WHEN enc.ChassisTypes0 = 14 THEN 'Sub Notebook'
        WHEN enc.ChassisTypes0 = 15 THEN 'Space-Saving'
        WHEN enc.ChassisTypes0 = 16 THEN 'Lunch Box'
        WHEN enc.ChassisTypes0 = 17 THEN 'Main System Chassis'
        WHEN enc.ChassisTypes0 = 18 THEN 'Expansion Chassis'
        WHEN enc.ChassisTypes0 = 19 THEN 'Sub Chassis'
        WHEN enc.ChassisTypes0 = 20 THEN 'Bus Expansion Chassis'
        WHEN enc.ChassisTypes0 = 21 THEN 'Peripheral Chassis'
        WHEN enc.ChassisTypes0 = 22 THEN 'Storage Chassis'
        WHEN enc.ChassisTypes0 = 23 THEN 'Rack Mount Chassis'
        WHEN enc.ChassisTypes0 = 24 THEN 'Sealed-Case PC'
        ELSE 'Unknown'
    END AS [Chassis Type],
    COUNT(*) AS [Device Count]
FROM v_R_System_Valid sys
INNER JOIN v_GS_COMPUTER_SYSTEM cs
    ON sys.ResourceID = cs.ResourceID
LEFT JOIN v_GS_SYSTEM_ENCLOSURE enc
    ON sys.ResourceID = enc.ResourceID
GROUP BY
    cs.Manufacturer0,
    cs.Model0,
    enc.ChassisTypes0
ORDER BY
    [Device Count] DESC,
    [Manufacturer],
    [Model]
