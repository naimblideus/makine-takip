// ─── Zod Doğrulama Şemaları ────────────────────────────────────────────────
// Yazma uçlarında ham body yerine doğrulanmış veri. Türkçe alan-bazlı hata.
import { z } from 'zod'

const optStr = (max: number) => z.string().max(max).optional().or(z.literal('')).transform(v => v || undefined)

export const SignupSchema = z.object({
    companyName: z.string().min(1, 'Firma adı zorunlu').max(200),
    name: z.string().min(1, 'Ad zorunlu').max(120),
    email: z.string().email('Geçerli e-posta girin').max(160),
    password: z.string().min(6, 'Şifre en az 6 karakter').max(100),
    phone: optStr(30),
})

export const PortalActionSchema = z.object({
    action: z.enum(['ONAYLA', 'REDDET']),
    signature: z.string().max(800_000).nullable().optional(),
})

export const TeklifPortalSchema = z.object({
    action: z.enum(['KABUL', 'RED']),
})

export const ArizaSchema = z.object({
    description: z.string().min(3, 'Lütfen arızayı kısaca açıklayın').max(500),
    reporterName: optStr(120),
    reporterPhone: optStr(30),
})

export const PaymentSchema = z.object({
    invoiceId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
    amount: z.coerce.number().positive('Tutar pozitif olmalı'),
    method: z.enum(['NAKIT', 'KREDI_KARTI', 'HAVALE_EFT', 'CEK', 'SENET']),
    paidAt: z.string().optional(),
    notes: optStr(500),
}).refine(d => d.invoiceId || d.customerId, { message: 'Fatura veya müşteri belirtilmeli' })

export const QuoteCreateSchema = z.object({
    customerName: z.string().min(1, 'Müşteri adı zorunlu').max(200),
    customerPhone: optStr(30),
    customerId: z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
    machineId: z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
    machineType: optStr(30),
    machineLabel: optStr(200),
    periodType: z.enum(['SAATLIK', 'GUNLUK', 'HAFTALIK', 'AYLIK']).default('GUNLUK'),
    unitPrice: z.coerce.number().positive('Birim fiyat pozitif olmalı'),
    quantity: z.coerce.number().int().positive().default(1),
    operatorIncluded: z.boolean().optional().default(false),
    transportCost: z.coerce.number().nonnegative().optional(),
    discount: z.coerce.number().nonnegative().optional(),
    taxRate: z.coerce.number().min(0).max(100).default(20),
    validUntil: z.string().optional(),
    notes: optStr(1000),
})

export const FaturaCreateSchema = z.object({
    customerId: z.string().uuid('Müşteri seçilmeli'),
    rentalId: z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
    issueDate: z.string().min(1, 'Düzenleme tarihi zorunlu'),
    dueDate: z.string().min(1, 'Vade tarihi zorunlu'),
    subtotal: z.coerce.number().positive('Ara toplam pozitif olmalı'),
    taxRate: z.coerce.number().min(0).max(100).default(20),
    notes: optStr(1000),
})

export const MachineCreateSchema = z.object({
    plate: z.string().max(2000).optional(),
    serialNumber: z.string().max(2000).optional(),
    brand: z.string().max(2000).optional(),
    model: z.string().max(2000).optional(),
    year: z.coerce.number().optional(),
    type: z.string().max(2000).optional(),
    status: z.string().max(2000).optional(),
    hourlyRate: z.coerce.number().optional(),
    dailyRate: z.coerce.number().optional(),
    weeklyRate: z.coerce.number().optional(),
    monthlyRate: z.coerce.number().optional(),
    operatorIncRate: z.coerce.number().optional(),
    insuranceExpiry: z.string().optional(),
    inspectionExpiry: z.string().optional(),
    totalHours: z.coerce.number().optional(),
    notes: z.string().max(20000).optional(),
    traccarDeviceId: z.string().max(2000).optional(),
    speedLimit: z.coerce.number().optional(),
    gpsEnabled: z.coerce.boolean().optional(),
    fuelCapacity: z.coerce.number().optional(),
    fuelSensorEnabled: z.coerce.boolean().optional(),
    engineHoursSensor: z.coerce.boolean().optional(),
    idleThresholdMinutes: z.coerce.number().optional(),
}).passthrough()

export const CustomerCreateSchema = z.object({
    companyName: z.string().max(2000).optional(),
    contactPerson: z.string().max(2000).optional(),
    phone: z.string().max(2000).optional(),
    email: z.string().max(2000).optional(),
    address: z.string().max(2000).optional(),
    taxOffice: z.string().max(2000).optional(),
    taxNumber: z.string().max(2000).optional(),
    notes: z.string().max(20000).optional(),
}).passthrough()

export const OperatorCreateSchema = z.object({
    name: z.string().max(2000).optional(),
    tcNumber: z.string().max(2000).optional(),
    phone: z.string().max(2000).optional(),
    address: z.string().max(2000).optional(),
    licenseClass: z.string().max(2000).optional(),
    licenseExpiry: z.string().optional(),
    machineTypes: z.array(z.any()).optional(),
    dailyWage: z.coerce.number().optional(),
    notes: z.string().max(20000).optional(),
}).passthrough()

export const RentalCreateSchema = z.object({
    machineId: z.string().min(1),
    customerId: z.string().min(1),
    siteId: z.string().min(1).nullable().optional(),
    operatorId: z.string().min(1).nullable().optional(),
    periodType: z.string().max(2000).optional(),
    unitPrice: z.coerce.number().optional(),
    operatorIncluded: z.coerce.boolean().optional(),
    startDate: z.string().max(2000).optional(),
    deliveryHours: z.coerce.number().optional(),
    deliveryFuel: z.string().max(2000).nullable().optional(),
    deposit: z.coerce.number().optional(),
    notes: z.string().max(20000).nullable().optional(),
}).passthrough()

export const FuelEntryCreateSchema = z.object({
    machineId: z.string().min(1),
    date: z.string().max(2000).optional(),
    liters: z.coerce.number().optional(),
    cost: z.coerce.number().optional(),
    fuelLevel: z.string().max(2000).nullable().optional(),
    supplier: z.string().max(2000).nullable().optional(),
    notes: z.string().max(20000).nullable().optional(),
}).passthrough()

export const TimesheetCreateSchema = z.object({
    operatorId: z.string().min(1).optional(),
    rentalId: z.string().min(1).optional(),
    date: z.string().optional(),
    hoursWorked: z.coerce.number().optional(),
    type: z.string().max(2000).optional(),
    notes: z.string().max(2000).optional(),
}).passthrough()

export const SiteCreateSchema = z.object({
    customerId: z.string().min(1).optional(),
    name: z.string().max(2000).optional(),
    address: z.string().max(2000).optional(),
    contactPerson: z.string().max(2000).optional(),
    contactPhone: z.string().max(2000).optional(),
    mapsLink: z.string().max(2000).optional(),
    notes: z.string().max(2000).optional(),
}).passthrough()

export const HakedisCreateSchema = z.object({
    rentalId: z.string().min(1).optional(),
    periodStart: z.string().optional(),
    periodEnd: z.string().optional(),
    periodLabel: z.string().max(2000).optional(),
    totalHours: z.coerce.number().optional(),
    workingDays: z.coerce.number().optional(),
    idleHours: z.coerce.number().optional(),
    overtimeHours: z.coerce.number().optional(),
    unitPrice: z.coerce.number().optional(),
    periodType: z.string().max(2000).optional(),
    fuelCost: z.coerce.number().optional(),
    operatorCost: z.coerce.number().optional(),
    transportCost: z.coerce.number().optional(),
    extraCosts: z.array(z.any()).optional(),
    discount: z.coerce.number().optional(),
    taxRate: z.coerce.number().optional(),
    notes: z.string().max(20000).optional(),
    photos: z.array(z.any()).optional(),
    useTelemetryHours: z.coerce.boolean().optional(),
}).passthrough()

export const GelirGiderCreateSchema = z.object({
    type: z.string().max(50),
    category: z.string().max(100),
    description: z.string().max(2000),
    amount: z.coerce.number(),
    date: z.string().max(100),
    machineId: z.string().min(1).optional(),
    customerId: z.string().min(1).optional(),
    invoiceId: z.string().min(1).optional(),
    paymentMethod: z.string().max(100).optional(),
    reference: z.string().max(2000).optional(),
    notes: z.string().max(20000).optional(),
}).passthrough()

export const DepoCreateSchema = z.object({
    name: z.string().max(2000),
    address: z.string().max(2000).optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    capacity: z.coerce.number().optional(),
    contactName: z.string().max(2000).optional(),
    contactPhone: z.string().max(100).optional(),
    notes: z.string().max(20000).optional(),
}).passthrough()

export const TransferCreateSchema = z.object({
    machineId: z.string().min(1),
    fromLocation: z.string().max(2000),
    toLocation: z.string().max(2000),
    fromLat: z.coerce.number().optional(),
    fromLng: z.coerce.number().optional(),
    toLat: z.coerce.number().optional(),
    toLng: z.coerce.number().optional(),
    transferDate: z.string().max(100),
    driver: z.string().max(2000).optional(),
    vehiclePlate: z.string().max(100).optional(),
    cost: z.coerce.number().optional(),
    distance: z.coerce.number().optional(),
    notes: z.string().max(20000).optional(),
}).passthrough()

export const BelgeCreateSchema = z.object({
    entityType: z.string().min(1).optional(),
    entityId: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    title: z.string().max(2000).optional(),
    filePath: z.string().max(2000).optional(),
    expiryDate: z.string().optional(),
    alertDays: z.coerce.number().optional(),
    notes: z.string().max(20000).optional(),
}).passthrough()

export const BakimTakvimiCreateSchema = z.object({
    machineId: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    description: z.string().max(2000).optional(),
    intervalHours: z.coerce.number().optional(),
    intervalDays: z.coerce.number().optional(),
    nextDueDate: z.string().optional(),
    nextDueHours: z.coerce.number().optional(),
    estimatedCost: z.coerce.number().optional(),
}).passthrough()

export const AmortismanCreateSchema = z.object({
    machineId: z.string().min(1).optional(),
    purchasePrice: z.coerce.number().optional(),
    purchaseDate: z.string().optional(),
    usefulLifeYears: z.coerce.number().optional(),
    notes: z.string().max(20000).optional(),
}).passthrough()

export const PricingRuleCreateSchema = z.object({
    machineType: z.string().max(2000).optional(),
    periodType: z.string().max(2000).optional(),
    basePrice: z.coerce.number().optional(),
    seasonMultiplier: z.coerce.number().optional(),
    longTermDiscount: z.coerce.number().optional(),
    loyaltyDiscount: z.coerce.number().optional(),
    operatorIncRate: z.coerce.number().optional(),
    minRentalDays: z.coerce.number().optional(),
    notes: z.string().max(20000).optional(),
}).passthrough()

export const GeofenceCreateSchema = z.object({
    name: z.string().max(2000).optional(),
    siteId: z.string().optional(),
    type: z.string().max(2000).optional(),
    coordinates: z.any().optional(),
    actionOnBreach: z.string().max(2000).optional(),
    machineIds: z.array(z.any()).optional(),
}).passthrough()

/** safeParse + Türkçe ilk hata mesajı döner. */
export function parseBody<T>(schema: z.ZodType<T>, body: unknown): { ok: true; data: T } | { ok: false; error: string } {
    const r = schema.safeParse(body)
    if (r.success) return { ok: true, data: r.data }
    const first = r.error.issues[0]
    return { ok: false, error: first?.message || 'Geçersiz veri' }
}
