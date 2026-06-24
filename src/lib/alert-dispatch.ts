// ─── Alarm Dağıtımı ────────────────────────────────────────────────────────
// Kritik alarmları (yakıt hırsızlığı, geofence ihlali, yetkisiz kullanım)
// tenant'ın tanımladığı alarm kanalına (WhatsApp + SMS) anında gönderir.
// Kanal yoksa messaging.ts MOCK olarak loglar — dev'de akış kırılmaz.
// Bu, telematik ham verisini "patrona anında SMS" KARARINA çeviren katman.

import { prisma } from '@/lib/prisma'
import { sendSms, sendWhatsApp } from '@/lib/messaging'

export async function dispatchTenantAlert(
    tenantId: string,
    title: string,
    message: string,
    opts?: { lat?: number | null; lng?: number | null },
): Promise<void> {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { alertPhone: true, alertWhatsapp: true },
        })
        if (!tenant) return

        let body = `🚨 ${title}\n${message}`
        if (opts?.lat && opts?.lng) {
            body += `\nKonum: https://www.google.com/maps?q=${opts.lat},${opts.lng}`
        }

        const tasks: Promise<any>[] = []
        if (tenant.alertWhatsapp) tasks.push(sendWhatsApp(tenant.alertWhatsapp, body))
        if (tenant.alertPhone) tasks.push(sendSms(tenant.alertPhone, body))
        // Kanal tanımlı değilse en azından mock log için bir SMS denemesi
        if (tasks.length === 0) tasks.push(sendSms('', body))
        await Promise.allSettled(tasks)
    } catch (e) {
        console.error('Alarm dağıtım hatası:', e)
    }
}
