import { createServiceRoleClient } from '@/lib/supabase/server';
import type { AuditAction } from '@/types';

/**
 * Write a tamper-evident audit log entry via the service role client.
 * Never throws — audit failures must never crash the application.
 */
export async function writeAuditLog(
  action: AuditAction,
  entityType: string,
  entityId: string | null,
  actorId: string | null,
  metadata?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    const supabase = await createServiceRoleClient();
    await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata ?? null,
      ip_address: ipAddress ?? null,
    });
  } catch {
    // Audit logging is non-critical — log to stderr but don't propagate
    console.error('[audit] Failed to write audit log:', action, entityType, entityId);
  }
}
