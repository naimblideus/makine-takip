// KVKK Aydınlatma Metni — public sayfa
export const metadata = { title: 'KVKK Aydınlatma Metni — Makine Takip' }

export default function KvkkPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{ maxWidth: 760, margin: '0 auto', background: '#fff', borderRadius: '1rem', padding: '2.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#1e293b', color: '#fff', padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                    🏗 Makine Takip
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>KVKK Aydınlatma Metni</h1>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Kişisel Verilerin Korunması Kanunu (6698 sayılı KVKK) kapsamında bilgilendirme.</p>

                {[
                    ['1. Veri Sorumlusu', 'İş makinesi kiralama/filo yönetim hizmeti sunan firma (kiraya veren), işlenen kişisel veriler bakımından veri sorumlusudur. Makine Takip yazılımı bu hizmeti teknik altyapı olarak sağlar.'],
                    ['2. İşlenen Veriler', 'İş makinelerinin konum (GPS), çalışma/motor saati, yakıt seviyesi, hız ve güzergâh verileri; operatör ad-soyad, belge/ehliyet bilgileri ve puantaj kayıtları; müşteri firma yetkili iletişim bilgileri işlenir.'],
                    ['3. İşleme Amaçları', 'Kira sözleşmesinin ifası, hakediş ve faturalandırmanın doğrulanması, makine güvenliği (hırsızlık/yetkisiz kullanım önleme), iş sağlığı ve güvenliği yükümlülükleri ile yasal saklama yükümlülüklerinin yerine getirilmesi.'],
                    ['4. Hukuki Sebep', 'Veriler, KVKK m.5/2 uyarınca sözleşmenin kurulması/ifası, hukuki yükümlülük ve veri sorumlusunun meşru menfaati hukuki sebeplerine; gerekli hâllerde açık rızaya dayanılarak işlenir.'],
                    ['5. Aktarım', 'Veriler; yasal yükümlülükler çerçevesinde yetkili kamu kurumlarına (GİB, SGK vb.), e-fatura entegratörü, GPS/telematik ve mesajlaşma hizmet sağlayıcılarına, gerekli güvenlik tedbirleriyle aktarılabilir.'],
                    ['6. Saklama Süresi', 'Veriler, ilgili mevzuatta öngörülen süreler ve hizmet ilişkisi boyunca; sonrasında ise yasal zamanaşımı süreleri dikkate alınarak saklanır ve süre sonunda silinir/anonim hâle getirilir.'],
                    ['7. Haklarınız', 'KVKK m.11 uyarınca; verilerinize erişme, düzeltme, silinmesini isteme, işlemeye itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz. Talepleriniz için veri sorumlusu firmaya başvurabilirsiniz.'],
                ].map(([h, b]) => (
                    <div key={h} style={{ marginBottom: '1.1rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>{h}</h2>
                        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>{b}</p>
                    </div>
                ))}

                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Bu metin genel bilgilendirme amaçlıdır; kiraya veren firma kendi aydınlatma metnini ekleyebilir.
                </div>
            </div>
        </div>
    )
}
