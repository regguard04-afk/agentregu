# Incident Response Policy

**Control ID:** IR-001  
**Version:** 3.0  
**Last Updated:** 2025-10-30  
**Owner:** Security Operations Team  
**Classification:** Confidential  

## 1. Purpose

This policy establishes a structured approach for identifying, managing, and resolving security incidents to minimize impact on business operations and ensure regulatory compliance.

## 2. Scope

This policy covers all security events and incidents affecting organizational information systems, data, networks, and services, including those managed by third-party providers.

## 3. Incident Classification

| Severity | Description | Response SLA | Escalation |
|---|---|---|---|
| Critical (P1) | Data breach, ransomware, system-wide outage | 15 minutes | CISO + CEO immediately |
| High (P2) | Targeted attack, significant data exposure | 1 hour | CISO within 2 hours |
| Medium (P3) | Malware on single system, policy violation | 4 hours | Security Manager within 8 hours |
| Low (P4) | Suspicious activity, minor policy deviation | 24 hours | Included in weekly report |

## 4. Incident Response Phases

### 4.1 Preparation
- Maintain incident response team with defined roles and contact information.
- Conduct tabletop exercises quarterly.
- Maintain forensic toolkit and response playbooks.
- Ensure logging and monitoring infrastructure is operational.

### 4.2 Detection and Analysis
- Continuous monitoring via SIEM, EDR, and network tools.
- Triage all alerts within defined SLA.
- Document initial indicators of compromise (IOCs).
- Assess scope, impact, and affected systems.

### 4.3 Containment
- **Short-term**: Isolate affected systems to prevent spread.
- **Long-term**: Apply temporary fixes while maintaining evidence.
- Preserve forensic evidence (memory dumps, disk images, logs).
- Disable compromised credentials immediately.

### 4.4 Eradication
- Remove threat actor access and malware.
- Patch exploited vulnerabilities.
- Reset all potentially compromised credentials.
- Scan environment for persistence mechanisms.

### 4.5 Recovery
- Restore systems from verified clean backups.
- Monitor restored systems for signs of re-infection.
- Conduct validation testing before returning to production.
- Implement additional monitoring for a minimum of 30 days.

### 4.6 Post-Incident Review
- Conduct post-mortem within 5 business days.
- Document lessons learned and root cause analysis.
- Update playbooks and procedures based on findings.
- Track remediation actions to completion.

## 5. Regulatory Notification Requirements

| Regulation | Notification Deadline | Authority |
|---|---|---|
| GDPR | 72 hours | Data Protection Authority |
| RBI (India) | 6 hours | CERT-In + RBI |
| SEC (USA) | 4 business days (material) | SEC |
| HIPAA | 60 days | HHS |
| PCI DSS | Immediately | Card brands + acquirer |

## 6. Communication Protocol
- Internal communication via secure, pre-approved channels only.
- External communication approved by Legal and Communications team.
- No disclosure of incident details on social media or unauthorized channels.
- Customer notification managed by Legal in coordination with PR.

## 7. Compliance References
- ISO 27001: A.16.1 (Incident Management)
- NIST 800-61: Computer Security Incident Handling Guide
- SOC 2: CC7.3, CC7.4, CC7.5
- GDPR: Articles 33, 34 (Breach notification)
- CERT-In Directions 2022: 6-hour reporting mandate
