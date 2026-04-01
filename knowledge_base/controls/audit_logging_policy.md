# Audit Logging Policy

**Control ID:** AL-001  
**Version:** 1.8  
**Last Updated:** 2025-12-10  
**Owner:** Security Engineering Team  
**Classification:** Internal  

## 1. Purpose

This policy mandates the collection, storage, monitoring, and review of audit logs to support security monitoring, incident investigation, regulatory compliance, and forensic analysis.

## 2. Scope

All information systems, applications, databases, network devices, and cloud services owned or operated by the organization.

## 3. Logging Requirements

### 3.1 Events to Log
All systems must capture the following events at minimum:

- **Authentication events**: Successful and failed logins, logouts, MFA challenges.
- **Authorization events**: Access grants, denials, privilege escalations.
- **Data access events**: Read, create, update, delete operations on sensitive data.
- **Administrative events**: Configuration changes, user account modifications, policy changes.
- **System events**: Startup, shutdown, errors, resource threshold alerts.
- **Network events**: Firewall rule changes, VPN connections, DNS queries for critical systems.
- **Application events**: API calls, transaction processing, error conditions.

### 3.2 Log Content
Each log entry must contain:
- Timestamp (UTC, NTP-synchronized)
- Event type and severity
- Source system/application identifier
- User or service account identity
- Source IP address
- Action performed
- Target resource
- Success or failure indication
- Session identifier (where applicable)

### 3.3 Log Integrity
- Logs must be written to append-only storage.
- Tampering detection via checksums or digital signatures.
- Log forwarding to centralized SIEM within 60 seconds.
- Local log retention of minimum 48 hours as backup.

## 4. Log Retention

| Log Type | Minimum Retention | Storage |
|---|---|---|
| Security events | 3 years | SIEM hot (90 days) + cold storage |
| Authentication logs | 1 year | SIEM |
| Application logs | 1 year | Centralized logging platform |
| Network flow logs | 6 months | Network analytics platform |
| Database audit logs | 3 years | Database audit vault |

## 5. Monitoring and Alerting

### 5.1 Real-Time Alerts
- Multiple failed login attempts (threshold: 5 in 10 minutes)
- Privileged account usage outside business hours
- Data export exceeding defined thresholds
- Configuration changes to security controls
- New administrative account creation

### 5.2 Scheduled Reviews
- Daily review of critical security alerts by SOC team.
- Weekly review of privileged access activity.
- Monthly review of access anomalies and trends.
- Quarterly comprehensive log review for compliance.

## 6. Access to Logs
- Log access restricted to authorized security and compliance personnel.
- Log queries and exports logged themselves (meta-logging).
- Production log access requires approval from Security Manager.
- No deletion of logs permitted (immutable storage).

## 7. Compliance References
- ISO 27001: A.12.4 (Logging and monitoring)
- NIST 800-53: AU-1 through AU-16
- SOC 2: CC7.1, CC7.2 (System monitoring)
- PCI DSS: Requirement 10 (Track and monitor access)
- GDPR: Article 30 (Records of processing activities)
- SOX: Section 404 (Internal controls over financial reporting)
