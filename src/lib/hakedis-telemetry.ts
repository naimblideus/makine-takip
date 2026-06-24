// ─── Hakediş Telemetri Bağı (WEDGE ÖZÜ) ────────────────────────────────────
// EngineSession motor verisini hakediş dönemine bağlar.
//
// KRİTİK İLKE: ignitionHours (durationMinutes toplamı) GERÇEK ölçümdür —
// telemetri cihazının kontak (ignition) sinyalinden gelir, "doğrulanmış" sayılır.
// idle/work ayrımı bugün engine-sessions cron'unda `duration * 0.2` TAHMİNİDİR;
// bu yüzden estimated* olarak etiketlenir ve UI/PDF'de "tahmini" gösterilir.
// Asla "saniye hassas / itiraz edilemez" diye sunulmaz.

import { prisma } from '@/lib/prisma'

export interface TelemetrySummary {
    hasTelemetry: boolean
    ignitionHours: number        // GERÇEK — kontak açık süre (saat)
    estimatedIdleHours: number   // TAHMİNİ
    estimatedWorkHours: number   // TAHMİNİ
    sessionCount: number
    closedSessionCount: number
    unauthorizedCount: number
    hasActiveSession: boolean
    firstStart: Date | null
    lastEnd: Date | null
}

const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * Bir makinenin belirli dönemdeki motor oturumlarını özetler.
 * Dönem: startedAt periyodun içinde olan oturumlar.
 */
export async function getTelemetryHours(
    machineId: string,
    periodStart: Date,
    periodEnd: Date,
    tenantId: string,
    rentalId?: string | null,
): Promise<TelemetrySummary> {
    const where: any = {
        tenantId,
        machineId,
        startedAt: { gte: periodStart, lte: periodEnd },
    }
    if (rentalId) where.rentalId = rentalId

    const sessions = await prisma.engineSession.findMany({
        where,
        orderBy: { startedAt: 'asc' },
    })

    const closed = sessions.filter((s) => s.durationMinutes != null)
    const ignitionMin = closed.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)
    const idleMin = closed.reduce((sum, s) => sum + (s.idleMinutes || 0), 0)
    const workMin = closed.reduce((sum, s) => sum + (s.workMinutes || 0), 0)

    return {
        hasTelemetry: sessions.length > 0,
        ignitionHours: r1(ignitionMin / 60),
        estimatedIdleHours: r1(idleMin / 60),
        estimatedWorkHours: r1(workMin / 60),
        sessionCount: sessions.length,
        closedSessionCount: closed.length,
        unauthorizedCount: sessions.filter((s) => !s.isAuthorized).length,
        hasActiveSession: sessions.some((s) => s.endedAt == null),
        firstStart: sessions[0]?.startedAt ?? null,
        lastEnd: closed.length ? closed[closed.length - 1].endedAt ?? null : null,
    }
}

export interface GpsReport {
    ignitionHours: number
    estimatedIdleHours: number
    estimatedWorkHours: number
    manualHours: number
    deltaHours: number          // beyan − doğrulanmış (pozitif = fazla beyan)
    deltaTL: number             // deltaHours × birim fiyat (tutar etkisi, gösterge)
    sessionCount: number
    unauthorizedCount: number
    hasTelemetry: boolean
    generatedAt: string
}

/**
 * Hakedişe gömülecek gpsReport JSON'unu kurar.
 * manualHours = beyan edilen/elle girilen puantaj saati.
 */
export function buildGpsReport(
    summary: TelemetrySummary,
    manualHours: number,
    unitPrice: number,
): GpsReport {
    const deltaHours = r1(manualHours - summary.ignitionHours)
    const deltaTL = Math.round(deltaHours * unitPrice * 100) / 100
    return {
        ignitionHours: summary.ignitionHours,
        estimatedIdleHours: summary.estimatedIdleHours,
        estimatedWorkHours: summary.estimatedWorkHours,
        manualHours: r1(manualHours),
        deltaHours,
        deltaTL,
        sessionCount: summary.sessionCount,
        unauthorizedCount: summary.unauthorizedCount,
        hasTelemetry: summary.hasTelemetry,
        generatedAt: new Date().toISOString(),
    }
}
