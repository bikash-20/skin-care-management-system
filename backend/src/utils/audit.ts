import { query } from '../db/pool';

export interface AuditEntry {
    userId?: string | number | null;
    action: string;
    entityType?: string;
    entityId?: string | number | null;
    details?: Record<string, unknown>;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
    try {
        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                entry.userId ?? null,
                entry.action,
                entry.entityType ?? null,
                entry.entityId ?? null,
                entry.details ? JSON.stringify(entry.details) : null,
            ]
        );
    } catch (err) {
        // Audit failures should not break the main flow.
        // eslint-disable-next-line no-console
        console.error('Audit log write failed:', err);
    }
}