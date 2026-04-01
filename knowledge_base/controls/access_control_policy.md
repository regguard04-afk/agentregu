# Access Control Policy

**Control ID:** AC-001  
**Version:** 2.1  
**Last Updated:** 2025-12-15  
**Owner:** Security Team  
**Classification:** Internal  

## 1. Purpose

This policy establishes the requirements for controlling access to organizational information systems, data, and physical facilities. It ensures that only authorized individuals have access to resources necessary for their roles.

## 2. Scope

This policy applies to all employees, contractors, third-party vendors, and any individual accessing organizational systems, networks, or data.

## 3. Access Control Requirements

### 3.1 Principle of Least Privilege
- All access rights shall be granted based on the principle of least privilege.
- Users shall be granted only the minimum level of access required to perform their job functions.
- Access rights shall be reviewed quarterly by department managers.

### 3.2 User Account Management
- Unique user IDs shall be assigned to each individual.
- Shared accounts are prohibited except where explicitly approved by the CISO.
- Accounts shall be disabled within 24 hours of employment termination.
- Dormant accounts (no login for 90 days) shall be automatically disabled.

### 3.3 Authentication Controls
- Multi-factor authentication (MFA) is mandatory for all remote access.
- Passwords must meet complexity requirements: minimum 12 characters, mixed case, numbers, and special characters.
- Password rotation required every 90 days.
- Account lockout after 5 failed login attempts for 30 minutes.

### 3.4 Privileged Access Management
- Administrative access requires separate privileged accounts.
- Privileged access sessions must be logged and monitored.
- Just-in-time (JIT) access provisioning for administrative tasks.
- Privileged access reviews conducted monthly.

## 4. Remote Access
- VPN is required for all remote connections to internal networks.
- Split-tunneling is prohibited on corporate devices.
- Remote access sessions shall timeout after 15 minutes of inactivity.

## 5. Physical Access
- Badge-based access control for all facilities.
- Visitor logs maintained at all entry points.
- Server room access restricted to authorized personnel only.

## 6. Monitoring and Audit
- All access events shall be logged to the SIEM.
- Failed access attempts shall trigger alerts after the defined threshold.
- Access logs retained for a minimum of 1 year.

## 7. Compliance References
- ISO 27001: A.9.1, A.9.2, A.9.3, A.9.4
- NIST 800-53: AC-1 through AC-25
- SOC 2: CC6.1, CC6.2, CC6.3
- PCI DSS: Requirement 7, 8
- GDPR: Article 32 (Security of processing)
