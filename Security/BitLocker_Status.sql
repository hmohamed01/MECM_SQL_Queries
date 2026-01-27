/*
    BitLocker Encryption Status
    Description: Returns BitLocker encryption status for all devices
    Views Used: v_R_System_Valid, v_GS_BITLOCKER_DETAILS
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.UserName0 AS [User Name],
    sys.AD_Site_Name0 AS [AD Site],
    bd.DriveLetter0 AS [Drive],
    CASE bd.ProtectionStatus0
        WHEN 0 THEN 'Protection Off'
        WHEN 1 THEN 'Protection On'
        WHEN 2 THEN 'Protection Unknown'
        ELSE 'Unknown'
    END AS [Protection Status],
    CASE bd.ConversionStatus0
        WHEN 0 THEN 'Fully Decrypted'
        WHEN 1 THEN 'Fully Encrypted'
        WHEN 2 THEN 'Encryption In Progress'
        WHEN 3 THEN 'Decryption In Progress'
        WHEN 4 THEN 'Encryption Paused'
        WHEN 5 THEN 'Decryption Paused'
        ELSE 'Unknown'
    END AS [Conversion Status],
    bd.EncryptionMethod0 AS [Encryption Method],
    COALESCE(bd.KeyProtectorTypes0, 'None') AS [Key Protectors]
FROM v_R_System_Valid sys
LEFT JOIN v_GS_BITLOCKER_DETAILS bd
    ON sys.ResourceID = bd.ResourceID
ORDER BY
    sys.Name0,
    bd.DriveLetter0
