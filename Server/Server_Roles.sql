/*
    Windows Server Roles
    Description: Returns installed server roles for all Windows Server devices
    Views Used: v_R_System_Valid, v_GS_OPERATING_SYSTEM, v_GS_SERVER_FEATURE

    Note: Requires Server Feature hardware inventory class to be enabled in MECM
    Common Role IDs:
      - AD-Domain-Services (AD DS)
      - DNS
      - DHCP
      - Web-Server (IIS)
      - File-Services
      - Print-Services
      - Hyper-V
      - ADCS (Certificate Services)
*/

SELECT
    sys.ResourceID,
    sys.Name0 AS [Computer Name],
    sys.UserName0 AS [User Name],
    sys.AD_Site_Name0 AS [AD Site],
    os.Caption0 AS [Operating System],
    sf.Name0 AS [Role Name],
    sf.ID0 AS [Role ID],
    CASE sf.InstallState0
        WHEN 1 THEN 'Installed'
        WHEN 2 THEN 'Removed'
        WHEN 3 THEN 'Install Pending'
        WHEN 4 THEN 'Remove Pending'
        ELSE 'Unknown'
    END AS [Install State]
FROM v_R_System_Valid sys
INNER JOIN v_GS_OPERATING_SYSTEM os
    ON sys.ResourceID = os.ResourceID
INNER JOIN v_GS_SERVER_FEATURE sf
    ON sys.ResourceID = sf.ResourceID
WHERE os.Caption0 LIKE '%Server%'
    AND sf.InstallState0 = 1  -- Only installed roles
    AND sf.Name0 IN (
        'AD-Domain-Services',
        'ADCS-Cert-Authority',
        'ADFS-Federation',
        'DHCP',
        'DNS',
        'Fax',
        'File-Services',
        'Hyper-V',
        'NPAS',
        'Print-Services',
        'Remote-Desktop-Services',
        'Web-Server',
        'WDS',
        'WSUS'
    )
ORDER BY
    sys.Name0,
    sf.Name0
