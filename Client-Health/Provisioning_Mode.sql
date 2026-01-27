/*
    Clients in Provisioning Mode
    Description: Returns clients where MECM client provisioning mode is enabled
    Views Used: v_R_System_Valid, v_GS_PROVISIONINGMODE0

    PREREQUISITE: Custom Hardware Inventory Extension
    ================================================
    This query requires extending MECM hardware inventory to collect the
    ProvisioningMode registry value. Without this extension, the view
    v_GS_PROVISIONINGMODE0 will not exist.

    Registry Key: HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\CCM\CcmExec
    Value Name:   ProvisioningMode
    Value Type:   REG_SZ (String)
    Values:       "true" = Provisioning mode enabled
                  "false" = Provisioning mode disabled

    To enable collection, add the following to your configuration.mof file
    located at: <ConfigMgr Install Dir>\inboxes\clifiles.src\hinv\configuration.mof

    --- BEGIN MOF EXTENSION ---

    #pragma namespace ("\\\\.\\root\\cimv2\\SMS")
    #pragma deleteclass("ProvisioningMode", NOFAIL)

    [SMS_Report(TRUE),
     SMS_Group_Name("Provisioning Mode"),
     SMS_Class_ID("CUSTOM|PROVISIONINGMODE|1.0")]
    class ProvisioningMode : SMS_Class_Template
    {
        [SMS_Report(TRUE), key]
        string KeyName;

        [SMS_Report(TRUE)]
        string ProvisioningMode;
    };

    #pragma namespace ("\\\\.\\root\\cimv2")
    #pragma deleteclass("ProvisioningMode", NOFAIL)

    [DYNPROPS]
    class ProvisioningMode
    {
        [key]
        string KeyName;

        string ProvisioningMode;
    };

    [DYNPROPS]
    instance of ProvisioningMode
    {
        KeyName = "CcmExec";

        [PropertyContext("local|HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\CCM\\CcmExec|ProvisioningMode"),
         Dynamic, Provider("RegPropProv")]
        ProvisioningMode;
    };

    --- END MOF EXTENSION ---

    After adding the MOF:
    1. Restart the SMS Agent Host service on the site server
    2. Wait for clients to receive updated policy and run hardware inventory
    3. The view v_GS_PROVISIONINGMODE0 will be created after first inventory
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    sys.Operating_System_Name_and0 AS [Operating System],
    CASE pm.ProvisioningMode0
        WHEN 'true' THEN 'Enabled'
        WHEN 'false' THEN 'Disabled'
        ELSE 'Unknown'
    END AS [Provisioning Mode],
    FORMAT(pm.TimeStamp, 'yyyy-MM-dd HH:mm') AS [Last Inventory]
FROM v_R_System_Valid sys
LEFT JOIN v_GS_PROVISIONINGMODE0 pm
    ON sys.ResourceID = pm.ResourceID
WHERE pm.ProvisioningMode0 = 'true'
ORDER BY sys.Name0
