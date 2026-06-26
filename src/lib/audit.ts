// ─── Denetim İzi yardımcısı ────────────────────────────────────────────────
// Hassas (admin/platform) işlemleri kalıcı olarak loglar. Hata yutulur —
// loglama asla asıl işlemi bozmaz.
import { prisma } from '@/lib/prisma'

export async function logAudit(p: {
    actorId: string
    actorEmail: string
    action: string
    tenantId?: string | null
    entityType?: string
    entityId?: string
    detail?: string
    ip?: string | null
}): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                actorId: p.actorId,
                actorEmail: p.actorEmail,
                action: p.action,
                tenantId: p.tenantId ?? null,
                entityType: p.entityType ?? null,
                entityId: p.entityId ?? null,
                detail: p.detail ?? null,
                ip: p.ip ?? null,
            },
        })
    } catch (e) {
        console.error('audit log hatası:', e)
    }
}
