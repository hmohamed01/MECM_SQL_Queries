/*
    BitLocker - Unencrypted Devices
    Description: Returns devices where the OS drive is not fully encrypted
    Views Used: v_R_System_Valid, v_GS_BITLOCKER_DETAILS
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    COALESCE(
        CASE bd.ConversionStatus0
            WHEN 0 THEN 'Fully Decrypted'
            WHEN 2 THEN 'Encryption In Progress'
            WHEN 3 THEN 'Decryption In Progress'
            WHEN 4 THEN 'Encryption Paused'
            WHEN 5 THEN 'Decryption Paused'
            ELSE 'Unknown'
        END,
        'No BitLocker Data'
    ) AS [Status]
FROM v_R_System_Valid sys
LEFT JOIN v_GS_BITLOCKER_DETAILS bd
    ON sys.ResourceID = bd.ResourceID
    AND bd.DriveLetter0 = 'C:'
WHERE bd.ConversionStatus0 IS NULL
    OR bd.ConversionStatus0 <> 1
ORDER BY sys.Name0
