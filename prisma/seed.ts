import { PrismaClient, MachineType, MachineStatus, RentalStatus, RentalPeriodType, PaymentMethod, PaymentStatus, InvoiceStatus, TimesheetType, MaintenanceType, FuelLevel } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seed başlatılıyor...')

    // Mevcut verileri temizle (yeni modeller önce silinmeli - foreign key)
    await prisma.geofenceBreach.deleteMany()
    await prisma.geofenceMachine.deleteMany()
    await prisma.geofence.deleteMany()
    await prisma.gpsLog.deleteMany()
    await prisma.engineSession.deleteMany()
    await prisma.fuelTheftAlert.deleteMany()
    await prisma.systemNotification.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.timesheet.deleteMany()
    await prisma.damageRecord.deleteMany()
    await prisma.contract.deleteMany()
    await prisma.fuelEntry.deleteMany()
    await prisma.maintenance.deleteMany()
    await prisma.rental.deleteMany()
    await prisma.site.deleteMany()
    await prisma.operator.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.machine.deleteMany()
    await prisma.user.deleteMany()
    await prisma.tenant.deleteMany()

    // ─── TENANT ────────────────────────────────────────────
    const tenant = await prisma.tenant.create({
        data: {
            name: 'Yıldız İş Makineleri',
            address: 'Organize Sanayi Bölgesi, 2. Cadde No: 45, Ankara',
            phone: '0312 555 12 34',
            email: 'info@yildizmakine.com',
            taxOffice: 'Ostim Vergi Dairesi',
            taxNumber: '1234567890',
        },
    })
    console.log('✅ Tenant oluşturuldu')

    // ─── USERS ─────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash('123456', 10)

    const admin = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: 'admin@yildizmakine.com',
            password: hashedPassword,
            name: 'Ahmet Yıldız',
            role: 'ADMIN',
        },
    })

    await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: 'personel@yildizmakine.com',
            password: hashedPassword,
            name: 'Mehmet Kaya',
            role: 'PERSONEL',
        },
    })

    await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: 'muhasebe@yildizmakine.com',
            password: hashedPassword,
            name: 'Ayşe Demir',
            role: 'MUHASEBE',
        },
    })
    console.log('✅ Kullanıcılar oluşturuldu')

    // ─── MACHINES (GPS alanları dahil) ───────────────────────
    const machinesData = [
        // GPS AKTİF — 3 adet
        { brand: 'CAT', model: '320F', year: 2021, type: MachineType.EKSAVATOR, plate: '06 MK 001', status: MachineStatus.KIRADA, dailyRate: 8500, weeklyRate: 52000, monthlyRate: 185000, totalHours: 3250, gpsEnabled: true, traccarDeviceId: 'GPS-001', speedLimit: 40, fuelCapacity: 320, fuelSensorEnabled: true, engineHoursSensor: true, idleThresholdMinutes: 20 },
        { brand: 'JCB', model: '3CX', year: 2023, type: MachineType.BEKO_LODER, plate: '06 MK 004', status: MachineStatus.KIRADA, dailyRate: 5500, weeklyRate: 34000, monthlyRate: 120000, totalHours: 980, gpsEnabled: true, traccarDeviceId: 'GPS-002', speedLimit: 35, fuelCapacity: 180, fuelSensorEnabled: true, engineHoursSensor: true, idleThresholdMinutes: 15 },
        { brand: 'Liebherr', model: 'LTM 1100', year: 2021, type: MachineType.VINC, plate: '06 MK 006', status: MachineStatus.KIRADA, dailyRate: 15000, weeklyRate: 90000, monthlyRate: 320000, totalHours: 2100, gpsEnabled: true, traccarDeviceId: 'GPS-003', speedLimit: 50, fuelCapacity: 500, fuelSensorEnabled: true, engineHoursSensor: true, idleThresholdMinutes: 30 },
        // GPS KAPALI — normal makineler
        { brand: 'Komatsu', model: 'PC200', year: 2022, type: MachineType.EKSAVATOR, plate: '06 MK 002', status: MachineStatus.MUSAIT, dailyRate: 7800, weeklyRate: 48000, monthlyRate: 170000, totalHours: 1850 },
        { brand: 'Volvo', model: 'EC210D', year: 2020, type: MachineType.EKSAVATOR, plate: '06 MK 003', status: MachineStatus.BAKIMDA, dailyRate: 7200, weeklyRate: 44000, monthlyRate: 155000, totalHours: 4100 },
        { brand: 'CAT', model: 'D6T', year: 2019, type: MachineType.DOZER, plate: '06 MK 005', status: MachineStatus.MUSAIT, dailyRate: 9200, weeklyRate: 56000, monthlyRate: 200000, totalHours: 5200 },
        { brand: 'Toyota', model: '8FD25', year: 2022, type: MachineType.FORKLIFT, serialNumber: 'TYT-2022-4521', status: MachineStatus.MUSAIT, dailyRate: 2800, weeklyRate: 17000, monthlyRate: 55000, totalHours: 1200 },
        { brand: 'XCMG', model: 'GR215', year: 2020, type: MachineType.GREYDER, plate: '06 MK 008', status: MachineStatus.ARIZALI, dailyRate: 6800, weeklyRate: 42000, monthlyRate: 150000, totalHours: 3800 },
        { brand: 'Bomag', model: 'BW 213', year: 2021, type: MachineType.SILINDIR, plate: '06 MK 009', status: MachineStatus.MUSAIT, dailyRate: 4500, weeklyRate: 28000, monthlyRate: 98000, totalHours: 1600 },
        { brand: 'CAT', model: '950H', year: 2020, type: MachineType.KEPCE, plate: '06 MK 010', status: MachineStatus.KIRADA, dailyRate: 6500, weeklyRate: 40000, monthlyRate: 140000, totalHours: 4500 },
    ]

    const machines = []
    for (const m of machinesData) {
        const machine = await prisma.machine.create({
            data: {
                tenantId: tenant.id,
                plate: m.plate,
                serialNumber: (m as any).serialNumber || null,
                brand: m.brand,
                model: m.model,
                year: m.year,
                type: m.type,
                status: m.status,
                dailyRate: m.dailyRate,
                weeklyRate: m.weeklyRate,
                monthlyRate: m.monthlyRate,
                totalHours: m.totalHours,
                insuranceExpiry: new Date(2026, Math.floor(Math.random() * 6) + 3, 15),
                inspectionExpiry: new Date(2026, Math.floor(Math.random() * 6) + 1, 20),
                // GPS alanları
                gpsEnabled: (m as any).gpsEnabled || false,
                traccarDeviceId: (m as any).traccarDeviceId || null,
                speedLimit: (m as any).speedLimit || null,
                fuelCapacity: (m as any).fuelCapacity || null,
                fuelSensorEnabled: (m as any).fuelSensorEnabled || false,
                engineHoursSensor: (m as any).engineHoursSensor || false,
                idleThresholdMinutes: (m as any).idleThresholdMinutes || 15,
            },
        })
        machines.push(machine)
    }
    console.log('✅ 10 makine oluşturuldu (3 GPS aktif)')

    // ─── OPERATORS ─────────────────────────────────────────
    const operatorsData = [
        { name: 'Ali Şahin', tcNumber: '12345678901', phone: '0555 111 22 33', licenseClass: 'G', machineTypes: [MachineType.EKSAVATOR, MachineType.KEPCE], dailyWage: 1200 },
        { name: 'Hasan Çelik', tcNumber: '23456789012', phone: '0555 222 33 44', licenseClass: 'G', machineTypes: [MachineType.DOZER, MachineType.GREYDER, MachineType.SILINDIR], dailyWage: 1300 },
        { name: 'Osman Yılmaz', tcNumber: '34567890123', phone: '0555 333 44 55', licenseClass: 'B2', machineTypes: [MachineType.VINC, MachineType.BEKO_LODER, MachineType.FORKLIFT], dailyWage: 1400 },
    ]

    const operators = []
    for (const o of operatorsData) {
        const operator = await prisma.operator.create({
            data: {
                tenantId: tenant.id,
                name: o.name,
                tcNumber: o.tcNumber,
                phone: o.phone,
                licenseClass: o.licenseClass,
                licenseExpiry: new Date(2027, 5, 15),
                machineTypes: o.machineTypes,
                dailyWage: o.dailyWage,
            },
        })
        operators.push(operator)
    }
    console.log('✅ 3 operatör oluşturuldu')

    // ─── CUSTOMERS ─────────────────────────────────────────
    const customersData = [
        { companyName: 'Mega İnşaat A.Ş.', contactPerson: 'Recep Taşkın', phone: '0532 100 20 30', email: 'recep@megainsaat.com', taxOffice: 'Çankaya VD', taxNumber: '5551234567' },
        { companyName: 'Atlas Yapı Ltd.', contactPerson: 'Kemal Özdemir', phone: '0533 200 30 40', email: 'kemal@atlasyapi.com', taxOffice: 'Keçiören VD', taxNumber: '6662345678' },
        { companyName: 'Doğu Mühendislik', contactPerson: 'Serkan Aksoy', phone: '0534 300 40 50', email: 'serkan@dogumuh.com', taxOffice: 'Yenimahalle VD', taxNumber: '7773456789' },
        { companyName: 'Güneş Altyapı A.Ş.', contactPerson: 'Fatma Güneş', phone: '0535 400 50 60', email: 'fatma@gunesaltyapi.com', taxOffice: 'Etimesgut VD', taxNumber: '8884567890' },
        { companyName: 'Kara İnşaat (KARA LİSTE)', contactPerson: 'İsmail Kara', phone: '0536 500 60 70', email: 'ismail@karainsaat.com', taxOffice: 'Sincan VD', taxNumber: '9995678901', isBlacklisted: true, blacklistReason: '3 faturayı 6 aydır ödemiyor, makinede hasar bıraktı' },
    ]

    const customers = []
    for (const c of customersData) {
        const customer = await prisma.customer.create({
            data: {
                tenantId: tenant.id,
                ...c,
            },
        })
        customers.push(customer)
    }
    console.log('✅ 5 müşteri oluşturuldu (1 kara listeli)')

    // ─── SITES (koordinat dahil) ────────────────────────────
    const sitesData = [
        { customerId: customers[0].id, name: 'Etimesgut Konut Projesi', address: 'Etimesgut, Ankara', contactPerson: 'Murat Bey', contactPhone: '0532 111 00 00', lat: 39.9474, lng: 32.6886 },
        { customerId: customers[0].id, name: 'Keçiören AVM Şantiyesi', address: 'Keçiören, Ankara', contactPerson: 'Hakan Bey', contactPhone: '0532 222 00 00', lat: 39.9853, lng: 32.8646 },
        { customerId: customers[1].id, name: 'Çankaya Rezidans', address: 'Çankaya, Ankara', contactPerson: 'Deniz Hanım', contactPhone: '0533 333 00 00', lat: 39.9032, lng: 32.8540 },
        { customerId: customers[2].id, name: 'OSB Fabrika İnşaatı', address: 'Sincan OSB, Ankara', contactPerson: 'Burak Bey', contactPhone: '0534 444 00 00', lat: 39.9697, lng: 32.5863 },
        { customerId: customers[3].id, name: 'Gölbaşı Yol Projesi', address: 'Gölbaşı, Ankara', contactPerson: 'Elif Hanım', contactPhone: '0535 555 00 00', lat: 39.7808, lng: 32.7937 },
    ]

    const sites = []
    for (const s of sitesData) {
        const site = await prisma.site.create({
            data: {
                tenantId: tenant.id,
                ...s,
            },
        })
        sites.push(site)
    }
    console.log('✅ 5 şantiye oluşturuldu (koordinat dahil)')

    // ─── RENTALS ───────────────────────────────────────────
    const now = new Date()
    const rentalsData = [
        { machineId: machines[0].id, customerId: customers[0].id, siteId: sites[0].id, operatorId: operators[0].id, status: RentalStatus.AKTIF, periodType: RentalPeriodType.GUNLUK, unitPrice: 8500, operatorIncluded: true, startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12), deliveryHours: 3200, deliveryFuel: FuelLevel.TAM, deposit: 25000 },
        { machineId: machines[1].id, customerId: customers[1].id, siteId: sites[2].id, operatorId: operators[2].id, status: RentalStatus.AKTIF, periodType: RentalPeriodType.HAFTALIK, unitPrice: 34000, operatorIncluded: true, startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5), deliveryHours: 950, deliveryFuel: FuelLevel.YARI, deposit: 15000 },
        { machineId: machines[2].id, customerId: customers[2].id, siteId: sites[3].id, operatorId: null, status: RentalStatus.AKTIF, periodType: RentalPeriodType.AYLIK, unitPrice: 320000, operatorIncluded: false, startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1), deliveryHours: 2000, deliveryFuel: FuelLevel.TAM, deposit: 50000 },
        { machineId: machines[9].id, customerId: customers[3].id, siteId: sites[4].id, operatorId: operators[1].id, status: RentalStatus.AKTIF, periodType: RentalPeriodType.GUNLUK, unitPrice: 6500, operatorIncluded: true, startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3), deliveryHours: 4450, deliveryFuel: FuelLevel.TAM, deposit: 20000 },
        { machineId: machines[3].id, customerId: customers[0].id, siteId: sites[1].id, operatorId: operators[0].id, status: RentalStatus.TAMAMLANDI, periodType: RentalPeriodType.GUNLUK, unitPrice: 7800, operatorIncluded: true, startDate: new Date(now.getFullYear(), now.getMonth() - 1, 5), endDate: new Date(now.getFullYear(), now.getMonth() - 1, 20), actualEndDate: new Date(now.getFullYear(), now.getMonth() - 1, 20), deliveryHours: 1700, deliveryFuel: FuelLevel.TAM, returnHours: 1820, returnFuel: FuelLevel.YARI, deposit: 20000 },
    ]

    const rentals = []
    for (const r of rentalsData) {
        const rental = await prisma.rental.create({ data: { tenantId: tenant.id, ...r } })
        rentals.push(rental)
    }
    console.log('✅ 5 kiralama oluşturuldu (4 aktif, 1 tamamlanmış)')

    // ─── FUEL ENTRIES ──────────────────────────────────────
    const fuelData = [
        { machineId: machines[0].id, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2), liters: 180, cost: 7200, supplier: 'Shell' },
        { machineId: machines[0].id, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8), liters: 200, cost: 8000, supplier: 'BP' },
        { machineId: machines[1].id, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1), liters: 120, cost: 4800, supplier: 'Opet' },
        { machineId: machines[2].id, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3), liters: 350, cost: 14000, supplier: 'Shell', receiptNumber: 'SH-2025-4521' },
        { machineId: machines[9].id, date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1), liters: 150, cost: 6000, supplier: 'Total' },
    ]

    for (const f of fuelData) {
        await prisma.fuelEntry.create({ data: { tenantId: tenant.id, ...f } })
    }
    console.log('✅ 5 yakıt girişi oluşturuldu')

    // ─── MAINTENANCE ───────────────────────────────────────
    await prisma.maintenance.create({
        data: {
            tenantId: tenant.id,
            machineId: machines[4].id, // Bakımda olan makine (Volvo)
            type: MaintenanceType.GENEL_BAKIM,
            description: '4000 saat genel bakımı - motor, hidrolik, şasi kontrol',
            cost: 45000,
            parts: 'Motor yağı 20L, hidrolik filtre, hava filtresi, fan kayışı',
            serviceName: 'Volvo Yetkili Servis',
            performedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
            machineHoursAt: 4100,
            nextMaintenanceHours: 4500,
            nextMaintenanceDate: new Date(now.getFullYear(), now.getMonth() + 3, 1),
        },
    })
    console.log('✅ 1 bakım kaydı oluşturuldu')

    // ─── TIMESHEETS ────────────────────────────────────────
    for (let i = 0; i < 5; i++) {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
        for (let oi = 0; oi < operators.length; oi++) {
            const op = operators[oi]
            const assignedRentalId = oi === 0 ? rentals[0].id : oi === 1 ? rentals[3].id : oi === 2 ? rentals[1].id : null
            await prisma.timesheet.create({
                data: {
                    tenantId: tenant.id,
                    operatorId: op.id,
                    rentalId: assignedRentalId,
                    date,
                    type: i === 4 ? TimesheetType.FAZLA_MESAI : TimesheetType.NORMAL,
                    hoursWorked: i === 4 ? 12 : 8,
                },
            })
        }
    }
    console.log('✅ Puantaj kayıtları oluşturuldu')

    // ─── INVOICES & PAYMENTS ────────────────────────────────
    const invoice1 = await prisma.invoice.create({
        data: {
            tenantId: tenant.id,
            customerId: customers[0].id,
            rentalId: rentals[4].id,
            invoiceNumber: 'FTR-2026-001',
            status: InvoiceStatus.ODENDI,
            subtotal: 117000,
            taxRate: 20,
            taxAmount: 23400,
            totalAmount: 140400,
            items: JSON.stringify([
                { description: 'Komatsu PC200 - 15 günlük kiralama', quantity: 15, unitPrice: 7800, total: 117000 },
            ]),
            issueDate: new Date(now.getFullYear(), now.getMonth() - 1, 21),
            dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
        },
    })

    await prisma.payment.create({
        data: {
            tenantId: tenant.id,
            invoiceId: invoice1.id,
            amount: 140400,
            method: PaymentMethod.HAVALE_EFT,
            status: PaymentStatus.ODENDI,
            paidAt: new Date(now.getFullYear(), now.getMonth(), 3),
            reference: 'HAV-2026-0312',
        },
    })

    const invoice2 = await prisma.invoice.create({
        data: {
            tenantId: tenant.id,
            customerId: customers[2].id,
            rentalId: rentals[2].id,
            invoiceNumber: 'FTR-2026-002',
            status: InvoiceStatus.ONAYLANDI,
            subtotal: 320000,
            taxRate: 20,
            taxAmount: 64000,
            totalAmount: 384000,
            items: JSON.stringify([
                { description: 'Liebherr LTM 1100 Vinç - 1 aylık kiralama', quantity: 1, unitPrice: 320000, total: 320000 },
            ]),
            issueDate: new Date(now.getFullYear(), now.getMonth(), 1),
            dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
        },
    })

    await prisma.payment.create({
        data: {
            tenantId: tenant.id,
            invoiceId: invoice2.id,
            amount: 384000,
            method: PaymentMethod.HAVALE_EFT,
            status: PaymentStatus.BEKLIYOR,
            dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
        },
    })
    console.log('✅ 2 fatura ve 2 ödeme kaydı oluşturuldu')

    // ═══════════════════════════════════════════════════════
    // ─── GPS SEED VERİLERİ ────────────────────────────────
    // ═══════════════════════════════════════════════════════

    // ─── 3 GEOFENCE ────────────────────────────────────────
    const geofence1 = await prisma.geofence.create({
        data: {
            tenantId: tenant.id,
            name: 'Etimesgut Şantiye Alanı',
            siteId: sites[0].id,
            type: 'POLYGON',
            coordinates: [
                { lat: 39.9500, lng: 32.6850 },
                { lat: 39.9500, lng: 32.6920 },
                { lat: 39.9450, lng: 32.6920 },
                { lat: 39.9450, lng: 32.6850 },
            ],
            actionOnBreach: 'ALERT',
        },
    })

    const geofence2 = await prisma.geofence.create({
        data: {
            tenantId: tenant.id,
            name: 'OSB Fabrika Çevresi',
            siteId: sites[3].id,
            type: 'CIRCLE',
            coordinates: { lat: 39.9697, lng: 32.5863, radius: 800 },
            actionOnBreach: 'STOP',
        },
    })

    const geofence3 = await prisma.geofence.create({
        data: {
            tenantId: tenant.id,
            name: 'Gölbaşı Yol Güzergahı',
            siteId: sites[4].id,
            type: 'POLYGON',
            coordinates: [
                { lat: 39.7850, lng: 32.7900 },
                { lat: 39.7850, lng: 32.7970 },
                { lat: 39.7770, lng: 32.7970 },
                { lat: 39.7770, lng: 32.7900 },
            ],
            actionOnBreach: 'ALERT',
        },
    })
    console.log('✅ 3 geofence oluşturuldu')

    // ─── GEOFENCE ↔ MAKİNE ATAMALARI ──────────────────────
    await prisma.geofenceMachine.create({ data: { geofenceId: geofence1.id, machineId: machines[0].id } })
    await prisma.geofenceMachine.create({ data: { geofenceId: geofence1.id, machineId: machines[1].id } })
    await prisma.geofenceMachine.create({ data: { geofenceId: geofence2.id, machineId: machines[2].id } })
    await prisma.geofenceMachine.create({ data: { geofenceId: geofence3.id, machineId: machines[9].id } })
    console.log('✅ 4 geofence-makine ataması yapıldı')

    // ─── 3+ ENGINE SESSIONS (motor oturumları) ──────────────
    const sessionData = [
        // Makine 1 (CAT 320F) - bugün çalışmış
        { machineId: machines[0].id, rentalId: rentals[0].id, operatorId: operators[0].id, startedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 15), endedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0), durationMinutes: 285, idleMinutes: 45, workMinutes: 240, maxSpeed: 28, avgSpeed: 12, fuelConsumed: 42, startLat: 39.9474, startLng: 32.6886, isAuthorized: true },
        // Makine 1 (CAT 320F) - dün sabah
        { machineId: machines[0].id, rentalId: rentals[0].id, operatorId: operators[0].id, startedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 8, 0), endedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 17, 30), durationMinutes: 570, idleMinutes: 80, workMinutes: 490, maxSpeed: 35, avgSpeed: 15, fuelConsumed: 85, startLat: 39.9480, startLng: 32.6890, isAuthorized: true },
        // Makine 2 (JCB 3CX) - bugün çalışıyor (devam ediyor)
        { machineId: machines[1].id, rentalId: rentals[1].id, operatorId: operators[2].id, startedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 45), endedAt: null, durationMinutes: null, idleMinutes: null, workMinutes: null, maxSpeed: 22, avgSpeed: 9, fuelConsumed: null, startLat: 39.9032, startLng: 32.8540, isAuthorized: true },
        // Makine 3 (Liebherr LTM) - dün gece → YETKİSİZ KULLANIM!
        { machineId: machines[2].id, rentalId: rentals[2].id, operatorId: null, startedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 30), endedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 1, 15), durationMinutes: 105, idleMinutes: 5, workMinutes: 100, maxSpeed: 15, avgSpeed: 8, fuelConsumed: 30, startLat: 39.9700, startLng: 32.5860, isAuthorized: false },
        // Makine 1 - dün akşam (kısa oturum)
        { machineId: machines[0].id, rentalId: rentals[0].id, operatorId: operators[0].id, startedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 18, 0), endedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 18, 45), durationMinutes: 45, idleMinutes: 40, workMinutes: 5, maxSpeed: 5, avgSpeed: 2, fuelConsumed: 8, startLat: 39.9475, startLng: 32.6888, isAuthorized: true },
    ]

    for (const s of sessionData) {
        await prisma.engineSession.create({ data: { tenantId: tenant.id, ...s } })
    }
    console.log('✅ 5 motor oturumu oluşturuldu (1 yetkisiz, 1 devam eden)')

    // ─── 3+ GPS LOGS ───────────────────────────────────────
    const gpsLogData = [
        { machineId: machines[0].id, action: 'SPEED_ALERT' as const, lat: 39.9474, lng: 32.6886, speed: 42, engineOn: true, reason: 'Hız sınırı aşıldı: 42 km/h (limit: 40)', triggeredBy: admin.id },
        { machineId: machines[2].id, action: 'UNAUTHORIZED_USE' as const, lat: 39.9700, lng: 32.5860, speed: 12, engineOn: true, reason: 'Mesai dışı kullanım: Saat 23:30' },
        { machineId: machines[2].id, action: 'GEOFENCE_BREACH' as const, lat: 39.9750, lng: 32.5910, speed: 15, engineOn: true, reason: 'OSB Fabrika Çevresi bölgesinden çıkış' },
        { machineId: machines[0].id, action: 'ENGINE_STOP' as const, lat: 39.9474, lng: 32.6886, speed: 0, engineOn: false, reason: 'Manuel motor durdurma', triggeredBy: admin.id },
        { machineId: machines[1].id, action: 'IDLE_ALERT' as const, lat: 39.9032, lng: 32.8540, speed: 0, engineOn: true, fuelLevel: 65, reason: '25 dakika boşta çalışma' },
    ]

    for (const g of gpsLogData) {
        await prisma.gpsLog.create({ data: { tenantId: tenant.id, ...g, createdAt: new Date(now.getTime() - Math.random() * 86400000) } })
    }
    console.log('✅ 5 GPS log oluşturuldu')

    // ─── 3 GEOFENCE BREACHES ────────────────────────────────
    await prisma.geofenceBreach.create({
        data: {
            tenantId: tenant.id,
            geofenceId: geofence2.id,
            machineId: machines[2].id,
            lat: 39.9750,
            lng: 32.5910,
            speed: 15,
            breachType: 'EXIT',
            actionTaken: 'STOP',
            createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 35),
        },
    })

    await prisma.geofenceBreach.create({
        data: {
            tenantId: tenant.id,
            geofenceId: geofence1.id,
            machineId: machines[0].id,
            lat: 39.9510,
            lng: 32.6930,
            speed: 18,
            breachType: 'EXIT',
            actionTaken: 'ALERT',
            createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 14, 20),
        },
    })

    await prisma.geofenceBreach.create({
        data: {
            tenantId: tenant.id,
            geofenceId: geofence3.id,
            machineId: machines[9].id,
            lat: 39.7860,
            lng: 32.7985,
            speed: 22,
            breachType: 'EXIT',
            actionTaken: 'ALERT',
            createdAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 10, 45),
        },
    })
    console.log('✅ 3 geofence ihlali oluşturuldu')

    // ─── 3 FUEL THEFT ALERTS ────────────────────────────────
    await prisma.fuelTheftAlert.create({
        data: {
            tenantId: tenant.id,
            machineId: machines[0].id,
            detectedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 3, 15),
            fuelBefore: 85,
            fuelAfter: 42,
            difference: 138, // litres
            machineWasOn: false,
            lat: 39.9474,
            lng: 32.6886,
        },
    })

    await prisma.fuelTheftAlert.create({
        data: {
            tenantId: tenant.id,
            machineId: machines[2].id,
            detectedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 2, 30),
            fuelBefore: 72,
            fuelAfter: 31,
            difference: 205,
            machineWasOn: false,
            lat: 39.9700,
            lng: 32.5863,
        },
    })

    await prisma.fuelTheftAlert.create({
        data: {
            tenantId: tenant.id,
            machineId: machines[1].id,
            detectedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 4, 0),
            fuelBefore: 90,
            fuelAfter: 55,
            difference: 63,
            machineWasOn: false,
            lat: 39.9032,
            lng: 32.8540,
        },
    })
    console.log('✅ 3 yakıt hırsızlığı alarmı oluşturuldu')

    // ─── 10+ SYSTEM NOTIFICATIONS ──────────────────────────
    const notifData = [
        { type: 'HIZ_IHLALI', title: '⚡ Hız İhlali: CAT 320F', message: '42 km/h (limit: 40 km/h) — Etimesgut Şantiyesi', machineId: machines[0].id },
        { type: 'YETKISIZ_KULLANIM', title: '🚨 Yetkisiz Kullanım: Liebherr LTM 1100', message: 'Mesai dışı çalıştırıldı. Saat: 23:30', machineId: machines[2].id },
        { type: 'GEOFENCE_IHLALI', title: '📐 Geofence İhlali: Liebherr LTM 1100', message: 'OSB Fabrika Çevresi bölgesinden çıktı', machineId: machines[2].id },
        { type: 'YAKIT_HIRSIZLIGI', title: '⚠️ Yakıt Hırsızlığı: CAT 320F', message: '~138 litre yakıt kaybı tespit edildi', machineId: machines[0].id },
        { type: 'MOTOR_DURDU', title: '🔴 Motor Durduruldu: CAT 320F', message: 'Manuel motor durdurma — Admin tarafından', machineId: machines[0].id },
        { type: 'BOSTA_CALISIYOR', title: '💤 Boşta Çalışma: JCB 3CX', message: '25 dakika boşta çalıştı (eşik: 15 dk)', machineId: machines[1].id },
        { type: 'BAKIM_YAKLASIYOR', title: '🔧 Bakım Yaklaşıyor: CAT 320F', message: 'Sonraki bakıma 150 saat kaldı', machineId: machines[0].id },
        { type: 'SIGORTA_DOLACAK', title: '📋 Sigorta Bitiyor: Volvo EC210D', message: 'Sigorta süresi 15 gün sonra doluyor', machineId: machines[4].id },
        { type: 'MUAYENE_DOLACAK', title: '⛔ Muayene Gecikti: XCMG GR215', message: 'Muayene süresi 3 gün geçti', machineId: machines[7].id },
        { type: 'YAKIT_HIRSIZLIGI', title: '⚠️ Yakıt Hırsızlığı: JCB 3CX', message: '~63 litre yakıt kaybı tespit edildi', machineId: machines[1].id, isRead: true },
        { type: 'HIZ_IHLALI', title: '⚡ Hız İhlali: CAT 950H', message: '38 km/h (limit: 35 km/h) — Gölbaşı', machineId: machines[9].id, isRead: true },
    ]

    for (let i = 0; i < notifData.length; i++) {
        await prisma.systemNotification.create({
            data: {
                tenantId: tenant.id,
                ...notifData[i],
                isRead: (notifData[i] as any).isRead || false,
                createdAt: new Date(now.getTime() - i * 3600000 * 3), // her biri 3 saat arayla
            },
        })
    }
    console.log('✅ 11 sistem bildirimi oluşturuldu (çeşitli tipler)')

    console.log('\n🎉 Seed tamamlandı!')
    console.log('─────────────────────────────────')
    console.log('Giriş bilgileri:')
    console.log('  Admin:    admin@yildizmakine.com / 123456')
    console.log('  Personel: personel@yildizmakine.com / 123456')
    console.log('  Muhasebe: muhasebe@yildizmakine.com / 123456')
    console.log('─────────────────────────────────')
    console.log('GPS Aktif Makineler:')
    console.log('  CAT 320F (GPS-001) — 06 MK 001')
    console.log('  JCB 3CX  (GPS-002) — 06 MK 004')
    console.log('  Liebherr LTM 1100 (GPS-003) — 06 MK 006')
    console.log('─────────────────────────────────')
}

main()
    .catch((e) => {
        console.error('❌ Seed hatası:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
