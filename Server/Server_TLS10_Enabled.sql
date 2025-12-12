/*
    Windows Server TLS 1.0 Enabled
    Description: Returns Windows Server devices that may have TLS 1.0 enabled
    Views Used: v_R_System_Valid, v_GS_OPERATING_SYSTEM, v_GS_REGISTRY

    Note: Requires Registry hardware inventory class to be configured to collect:
          HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.0

    TLS 1.0 is considered insecure and should be disabled on all servers.
    This query identifies servers where TLS 1.0 may still be enabled.

    Registry paths for TLS 1.0:
    - Server: HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.0\Server
    - Client: HKLM\SYSTEM\CurrentControlSet\Control\SecurityProviders\SCHANNEL\Protocols\TLS 1.0\Client

    Values:
    - Enabled = 1 means TLS 1.0 is enabled
    - Enabled = 0 or DisabledByDefault = 1 means TLS 1.0 is disabled
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.AD_Site_Name0 AS [AD Site],
    os.Caption0 AS [Operating System],
    os.BuildNumber0 AS [Build Number],
    reg.KeyName0 AS [Registry Key],
    reg.ValueName0 AS [Value Name],
    reg.Value0 AS [Value],
    CASE
        WHEN reg.ValueName0 = 'Enabled' AND reg.Value0 = '1' THEN 'TLS 1.0 Enabled - ACTION REQUIRED'
        WHEN reg.ValueName0 = 'Enabled' AND reg.Value0 = '0' THEN 'TLS 1.0 Disabled'
        WHEN reg.ValueName0 = 'DisabledByDefault' AND reg.Value0 = '1' THEN 'TLS 1.0 Disabled by Default'
        WHEN reg.ValueName0 = 'DisabledByDefault' AND reg.Value0 = '0' THEN 'TLS 1.0 May Be Enabled'
        ELSE 'Check Manually'
    END AS [TLS 1.0 Status]
FROM v_R_System_Valid sys
INNER JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
LEFT JOIN v_GS_REGISTRY reg
    ON sys.ResourceID = reg.ResourceID
    AND reg.KeyName0 LIKE '%SCHANNEL\Protocols\TLS 1.0%'
    AND reg.ValueName0 IN ('Enabled', 'DisabledByDefault')
WHERE os.Caption0 LIKE '%Server%'
ORDER BY
    CASE
        WHEN reg.ValueName0 = 'Enabled' AND reg.Value0 = '1' THEN 1
        WHEN reg.ValueName0 = 'DisabledByDefault' AND reg.Value0 = '0' THEN 2
        ELSE 3
    END,
    sys.Name0
