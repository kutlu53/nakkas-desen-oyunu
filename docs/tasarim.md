# Nakkaş — Oyun Tasarım Dokümanı

## 1. Özet
Nakkaş, İslam sanatındaki geometrik desenleri üç kademede öğreten tarayıcı oyunu. Oyuncu bir nakkaş loncasına çırak olarak girer; motifleri tanıyarak kalfa, kurarak usta olur, usta olunca kendi motiflerini üretir. Fiziksel ahşap yapboz setiyle aynı 17 parçayı kullanır; dijital sürüm bunlara 6'lı ve 12'li aileleri ekler.

Hedef kitle: ortaokul (5–8) ve lise (9–12). Tek oyuncu. Oturum 10–20 dakika. Çevrimdışı çalışır.

## 2. Çekirdek fikir: "Açı 360'ı bulur"
Kenar kenara oturan her döşemede olduğu gibi, bir köşede buluşan parçaların iç açıları 360° eder. Bu İslam sanatına özgü bir tasarım kuralı değil, matematik bir gerçektir; ustalar da açı ölçerek değil, pergel ve cetvelle kurarak çalışırdı: daire n'ye bölünür, yıldız ve çevresindeki çokgenler bu çizimden çıkar. Oyun önce bu kurulumu yaptırır (Kur, hazırlık seviyesi), sonra açı toplamıyla kurulumun neden çalıştığını gösterir. Yıldızın köşe sayısı (n) hangi açıların mümkün olduğunu belirler:

| Aile | Temel açı | Yıldız çentiğine tam oturan | Yaygın yerler |
|---|---|---|---|
| 6 | 60° | altıgen (120°) | Selçuklu tuğla işçiliği, Mardin taş |
| 8 | 45° | artının 135° köşesi / sekizgen | yıldız-artı çinileri, Topkapı, Mağrip zellij |
| 10 | 36° | beşgen (108°) | girih, İsfahan, Darb-ı İmam, Karatay Medresesi |
| 12 | 30° | kare (90°) | büyük kubbe kuşakları, Selimiye, Kahire minberleri |

Oyunun her modu bu kuralı farklı biçimde kullanır: Tanı'da öğrenci n'yi sayar; Kur'da açıları toplar; Yarat'ta n-kat simetri aynası motif üretir.

## 3. Modlar

### 3.1 Çırak — Tanı
**Ekran:** tam ekran yapı görseli (fotoğraf ya da çizim). Altta soru şeridi.
**Görev türleri (her motif için 3 kısa soru):**
1. *Yıldızı bul* — görsel üzerinde yıldız merkezine dokun (tolerans dairesi).
2. *Köşe say* — yıldızın köşe sayısı? 6 / 8 / 10 / 12 (dokunarak köşelere işaret koyabilir; ortaokulda sayaç görünür).
3. *Birim hücreyi çerçevele* — tekrar eden en küçük kareyi/eşkenar dörtgeni sürükleyerek seç. Doğru boyuta yaklaşınca yapışır.
**Ödül:** hikâye kartı (yapı, dönem, usta geleneği, ilginç bir ayrıntı) + atlas koleksiyonuna eklenir.
**Zorluk:** ortaokulda görselde yıldız hafifçe vurgulanır, lise'de ham görsel. Lise'de 4. soru: "Bu desen hangi aileyle **yapılamaz**?"

### 3.2 Kalfa — Kur
**Ekran:** ortada tahta (açık ahşap dokusu), altta kaydırılabilir parça kutusu, üstte açı göstergesi.
**Mekanik:**
- Parçayı sürükle; sahnedeki köşeye yaklaşınca yapışır, aile açısının katlarıyla kendini hizalar.
- Yapışan köşede açılar toplanır ve köşe üstünde yazar: `135 + 135 + 90 = 360 ✓`
- Toplam < 360 → köşe sarı, kalan açı yazar ("45° açık"). Toplam > 360 → kırmızı, parça geri zıplar.
- Sahne boşluksuz dolunca seviye biter; desen bir an "çini" dokusuna dönüşür (ödül animasyonu).
**Seviye yapısı (aile başına):**
1. *Yıldızın çevresi* — tek yıldız sabit, çentiklerini doldur. Keşif: hangi çokgen tam oturur?
2. *Birim hücre* — yıldız + komşu dolgularla bir tekrar birimini tamamla.
3. *Ötele ve kapla* — birim hücreyi öteleme vektörüyle kopyalayıp 3×3 alanı kapla (lise); ortaokulda 2×2 ve hayalet kılavuz.
4. *Bozuk çini* — tamamlanmış desende eksik 3–5 parçayı bul ve yerleştir (restorasyon kurgusu).
**Ara animasyonlar (20 sn):** daireyi n'ye bölme, pergel-cetvel ile yıldız çizimi, çentik = çokgen keşfi.
**Zorluk:** ortaokulda açı etiketleri sürekli açık, doğru parça kutuda parlar; lise'de etiketler isteğe bağlı, kutuda yanıltıcı parçalar (başka aileden) bulunur.

### 3.3 Usta — Yarat
**Ekran:** boş tuval, parça kutusu (aile filtresi), sağda/altta araç şeridi.
**Araçlar:**
- **Simetri aynası:** n ∈ {6, 8, 10, 12} seç; konulan her parça merkez etrafında n kez çoğaltılır. Ayna kapatılabilir.
- **Öteleme kopyası:** seçili grubu birim vektörle çoğalt.
- Renk paleti: geleneksel (kobalt, firuze, beyaz, hardal, kiremit) + serbest.
- Geri al / yinele, ızgara, köşe açısı göstergesini aç/kapat.
**Görevler (isteğe bağlı rozetler):** "Sadece 8'li parçalarla", "üç renk", "boşluk bırakmadan 2×2", "fiziksel setle yap, fotoğrafını yükle".
**Çıktı:** PNG indir, yerel galeri, "sınıf duvarı" için QR/JSON paylaşımı (aynı cihaz içi; sunucu yok).

## 4. İlerleme ve kayıt
- Rütbe: Çırak (atlas %50) → Kalfa (her ailede 2. seviye) → Usta (her ailede 3. seviye). Yarat modu baştan açık ama rozetler rütbeyle gelir.
- Kayıt: `localStorage` — ilerleme, atlas, galeri, ayarlar, araştırma logu.
- Araştırma logu (ölçek çalışması için): her oturumda `{ts, mode, family, level, attempts, wrongFamilyAttempts, seconds, completed, hintsUsed}`; Yarat'ta `{pieces, families, symmetry, durationSec}`.

## 5. Hikâye çerçevesi (ince, zorunlu değil)
Oyuncu, bir ustanın yanına verilen çıraktır. Her aile bir "sipariş"tir: 8'li → medrese kapısı çinileri, 10'lu → türbe kuşağı, 6'lı → hamam tuğla örgüsü, 12'li → cami kubbe eteği. Usta kısa notlar bırakır (hikâye kartları). Mistik anlatıdan kaçın; kültürel bağlam ve zanaat bilgisi ver, dinî yorumları "bazı araştırmacılara göre" diye nitele.

## 6. Görsel ve ses
- Zemin: açık ahşap / kâğıt dokusu; parçalar çini renkleri. Koyu tema: lacivert zemin, parlak çini.
- Yazı: başlıklar için tırnaklı (Fraunces/Literata), gövde için Manrope benzeri; yerelde barındır.
- Ses: yapışma "tık", 360 tamamlanınca kısa çan, yanlış aile için tahta "tok". Varsayılan kapalı, ayardan açılır.

## 7. Erişilebilirlik
- Renk körlüğü: aile rengi + aile simgesi (6/8/10/12 rakamı) birlikte.
- Tüm sürükleme işlemleri için klavye alternatifi (seç → ok tuşlarıyla taşı → R ile döndür → Enter).
- Dokunma hedefi ≥ 44px; küçük parçalar büyütülmüş tutamaçla.

## 8. Kapsam dışı (v1)
Çok oyunculu, sunucu, öğretmen paneli, hesap sistemi, mağaza yayını (PWA olarak kurulabilir yeter).
