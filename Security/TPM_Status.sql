/*
    TPM Status
    Description: Returns TPM chip information for all devices
    Views Used: v_R_System_Valid, v_GS_TPM
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    CASE tpm.IsActivated_InitialValue0
        WHEN 1 THEN 'Yes'
        WHEN 0 THEN 'No'
        ELSE 'Unknown'
    END AS [TPM Activated],
    CASE tpm.IsEnabled_InitialValue0
        WHEN 1 THEN 'Yes'
        WHEN 0 THEN 'No'
        ELSE 'Unknown'
    END AS [TPM Enabled],
    CASE tpm.IsOwned_InitialValue0
        WHEN 1 THEN 'Yes'
        WHEN 0 THEN 'No'
        ELSE 'Unknown'
    END AS [TPM Owned],
    COALESCE(tpm.SpecVersion0, 'N/A') AS [TPM Version],
    COALESCE(tpm.ManufacturerVersion0, 'N/A') AS [Manufacturer Version]
FROM v_R_System_Valid sys
LEFT JOIN v_GS_TPM tpm
    ON sys.ResourceID = tpm.ResourceID
ORDER BY sys.Name0
