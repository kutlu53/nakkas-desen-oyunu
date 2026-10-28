# Nakkaş — Eğitsel Gerekçe

Bu belge, Nakkaş desen oyununun her bölümünün hangi amaçla tasarlandığını, hangi kazanımlara hizmet ettiğini ve bu tasarım kararlarının dayandığı akademik gerekçeleri özetler. Oyunun teknik ayrıntıları için `CLAUDE.md` ve `docs/tasarim.md`, seviye tabloları için `docs/seviyeler.md` dosyalarına bakınız.

> **Durum (28 Ekim 2026):** Çırak / Tanı modu oynanabilir (7 motif). Kalfa / Kur modu 8'li aile için hazırlık + 5 seviye, 10'lu ve 6'lı aileler için hazırlık + 4'er seviye, 12'li aile için hazırlık + 4 seviye, ayrıca 8'li + 10'lu rütbe sınavı; Usta / Yarat modu oynanabilir. Rütbe ilerlemesi ve ses (varsayılan kapalı) var. Henüz yapılmayan: Yarat'ta öteleme kopyası aracı.

---

## 1. Projenin amacı

Nakkaş, TÜBİTAK destekli bir değerler eğitimi projesinin dijital ayağıdır. Ortaokul (5–8. sınıf) ve lise (9–12. sınıf) öğrencilerine İslam sanatındaki geometrik desenleri, fiziksel ahşap yapboz setinin birebir dijital karşılığı olan bir oyunla öğretir. Üç genel kazanım hedeflenir:

| Kazanım | Tanım |
|---|---|
| **K1 · Tanıma** | Yaygın yıldız sistemlerini (6'lı, 8'li, 10'lu, 12'li) ve kullanıldıkları yapıları tanımak |
| **K2 · Mekanik** | Desenin arkasındaki geometrik mantığı kavramak: pergel-cetvel kurulumu, köşede 360°, dönme ve yansıma simetrisi, birim hücre, ailelerin birbirine uymaması |
| **K3 · Yaratıcılık** | Parçalar ve simetri araçlarıyla özgün motif üretmek |

Bunlara ek olarak oyun, değerler eğitimi boyutunda **kültürel mirasa saygı, emek ve sabır, estetik duyarlılık** gibi değerleri, ustalık geleneği (çırak → kalfa → usta) kurgusu ve hikâye kartlarıyla destekler.

### Matematik öğretim programıyla ilişki

Oyunun içeriği, MEB matematik öğretim programındaki şu konu alanlarıyla doğrudan ilişkilidir: **açılar ve açı ölçme, çokgenler ve iç açıları, düzgün çokgenler, dönüşüm geometrisi (öteleme, yansıma, dönme), örüntü ve süslemeler (kaplamalar), geometrik çizimler.** Sınıf düzeyine göre kazanım kodu eşleştirmesi güncel programdan yapılmalıdır; bu belge kod vermez.

---

## 2. Genel tasarım ilkeleri ve gerekçeleri

### 2.1 Önce kur, sonra açıkla
Ustalar deseni açı ölçerek değil, **pergel ve cetvelle kurarak** tasarlardı: daire n eşit parçaya bölünür, yıldız ve çevresindeki çokgenler bu çizimden çıkar. Açıların bir köşede 360° etmesi ise bugünün matematiğiyle kurulumun **neden** çalıştığını gösteren bir açıklamadır. Oyun bu sırayı korur: önce kurulum (hazırlık seviyesi), sonra açı toplamı (Kur seviyeleri).

**Gerekçe:** Bu sıralama hem tarihsel olarak doğrudur hem de öğrenmenin somuttan soyuta ilerlemesi ilkesine uyar (Bruner, 1966). Öğrencinin bir yapıyı kendi elleriyle kurarak öğrenmesi, yapılandırmacı ve "yaparak öğrenme" (constructionism) yaklaşımının temelidir (Papert, 1980).

### 2.2 Kural değil geometri konuşur
Yanlış aileden bir parça bir köşeye konduğunda oyun "yanlış" demez, açıyı söyler: "225 + 108 = 333 — 27° açık kaldı." Öğrenci 10'lu bir parçanın 8'li bir yıldıza neden uymadığını bir yasaktan değil, sayıdan öğrenir.

**Gerekçe:** Görev düzeyinde, açıklayıcı ve hemen verilen geri bildirim, öğrenme üzerinde en güçlü etkiye sahip geri bildirim türleri arasındadır (Hattie ve Timperley, 2007). "Yanlış aile" ve "kırık öteleme" denemeleri, hatayı bir öğrenme fırsatına dönüştüren **üretken başarısızlık** (productive failure) yaklaşımıyla da örtüşür (Kapur, 2008).

### 2.3 Somut → görsel → simgesel
Fiziksel ahşap set (somut), oyundaki sürüklenebilir parçalar (görsel) ve köşedeki açı toplamı (simgesel) aynı bilgiyi üç farklı temsil düzeyinde sunar.

**Gerekçe:** Bruner'in eylemsel, imgesel ve simgesel temsil düzeyleri (Bruner, 1966). Ayrıca van Hiele geometrik düşünme düzeyleri açısından oyun, öğrenciyi **görsel düzeyden** (şekli tanıma) **analiz düzeyine** (şeklin özelliklerini, örneğin iç açıları, fark etme) ve lise profilinde **ilişkilendirme düzeyine** (neden bu ailenin bu parçayı aldığını açıklama) taşımayı hedefler (van Hiele, 1986).

### 2.4 İki zorluk profili: destek ve desteğin geri çekilmesi
Tek bir `difficulty` ayarı, mod kodunu değil seviye verisini değiştirir:

| | Ortaokul | Lise |
|---|---|---|
| Açı etiketleri | Sürekli açık | İsteğe bağlı |
| Doğru parça / nokta | Parlar | Parlamaz |
| Aile notu ("Bu parça 10'lu sistemden…") | Verilir | Verilmez |
| Kutuda yanıltıcı parça | Az | Başka ailelerden de |
| İpucu metni | Yönlendirici | Soru biçiminde |
| Hedef alan | Küçük (2×2, 4×2) | Büyük (3×3, 4×4) |

**Gerekçe:** Öğrenciye gerektiği kadar destek verilip zamanla geri çekilmesi, **iskele kurma** (scaffolding) kavramına dayanır (Wood, Bruner ve Ross, 1976). "Usta göstersin" düğmesi, adımı bir **çözümlü örnek** olarak gösterir; öğrenci takıldığında bilişsel yükü azaltır (Sweller, 1988) ve çözümlü örnekten bağımsız çözüme geçişi kolaylaştırır (Renkl ve Atkinson, 2003).

### 2.5 Kültürel bağlam ve tarihsel dürüstlük
Desenler soyut bir matematik alıştırması olarak değil, belirli yapılarda, belirli ustaların geleneğinde yaşamış bir sanat olarak sunulur. Hikâye kartları her tekniği tarihsel karşılığına bağlar. Kesin olmayan bilgiler "rivayet" diye işaretlenir; motifler dönem ve coğrafyayla doğru eşleştirilir (örneğin 8'li yıldız-haç çinisi ağırlıkla Selçuklu-İlhanlı, 10'lu girih İran-Timurlu geleneğindendir; Osmanlı'da geometrik desen çoğunlukla kündekâri, taş ve kalem işinde görülür).

**Gerekçe:** Matematiğin kültürel bağlamı içinde öğretilmesi **etnomatematik** yaklaşımının temel önerisidir (D'Ambrosio, 1985). Öğrencinin kendi kültürel mirasında matematiği görmesi, hem konuya ilgiyi hem de değerler eğitimi hedeflerini destekler.

### 2.6 Oyun kurgusu: lonca ve rütbeler
Öğrenci bir nakkaş loncasına çırak olarak girer; motifleri tanıyarak kalfa, kurarak usta olur. Her seviye bir "usta" sözüyle açılır, bir "keşif" kartıyla kapanır.

**Rütbe koşulları:** Kalfa olmak için atlasın yarısı (motiflerin en az yarısı tanınmış) ve her ailede 2. seviye; usta olmak için ayrıca her ailede 3. seviye (ötele ve kapla) ve ailelerin karıştığı rütbe sınavı. Giriş ekranı eksik koşulları listeler; terfide bir kez kutlama kartı açılır ve araştırma kaydına `mode: "rutbe"` düşer.

**Gerekçe:** Oyunlar, öğrenmeyi bir kimlik ve amaç içine yerleştirdiğinde, kısa ve anlamlı görevlerle hemen geri bildirim verdiğinde etkili öğrenme ortamları oluşturur (Gee, 2003). Ustalık geleneği kurgusu ayrıca emek, sabır ve usta-çırak ilişkisi gibi değerleri doğal biçimde işler.

---

## 3. Bölümler

### 3.1 Çırak — Tanı *(oynanabilir)*

**Amaç:** Öğrencinin gerçek yapılardaki desenlerde yıldız sistemini görmesi.

**Görevler:** Görsel üzerinde yıldızın merkezini bul; köşelerini say (6 / 8 / 10 / 12); tekrar eden en küçük birimi (birim hücre) çerçevele. Lise profilinde ek soru: "Bu desen hangi aileyle yapılamaz?"

**Kazanımlar:** K1 (motifi ve yapıyı tanıma), K2'ye hazırlık (dönme simetrisi, birim hücre kavramı).

**Gerekçe:** van Hiele'nin görsel düzeyi; şekli bütün olarak tanımadan özelliklerini incelemeye geçilemez. Yapı adı, dönemi ve hikâye kartı etnomatematik bağlamı kurar.

**Görseller:** Projede yapı fotoğrafı bulunmadığı için her motif, kendi ailesine ait kesin bir desen çizimiyle gösterilir (6'lı yıldız-altıgen, 8'li yıldız-haç, 10'lu girih, 12'li 4.6.12 ağı üstünde yıldız deseni). Ekranda çizimin yapının kendi deseninin kopyası olmadığı belirtilir. Kesin çizim, "yıldızın merkezi" ve "birim hücre" görevlerinin doğru denetlenmesini sağlar. Sınırlılık: öğrenci gerçek yapı yüzeyini görmez; öğretmenin sınıfta gerçek yapı görselleri göstermesi önerilir.

**Ölçülen:** Deneme, yanlış cevap (`wrongFamilyAttempts`), ipucu, süre (`mode: "tani"`).

---

### 3.2 Kalfa — Kur *(oynanabilir: 8'li aile)*

Kur modu, oyunun mekanik kazanımının (K2) merkezidir. Seviyeler bilinçli bir sırayla ilerler: **kur → tanı → birleştir → ötele → aynala → onar.**

#### Hazırlık · "Pergelle kur"
**Ne yapılır:** Dokuz adımda, yalnızca pergel ve cetvelle 8'li yıldız kurulur: ana daire → çap → dikme yayları → dik çap → dört yardımcı daire → köşegenler → birinci kare → ikinci kare → yıldızı boya.

**Neden:** Ustaların gerçek tasarım yöntemini öğretmek. Öğrenci hiç açı ölçmeden 90°'yi (dikme), 45°'yi (köşegen) ve sonunda yıldızın çentiğindeki 135°'yi elde eder. Dört yardımcı dairenin kesiştiği J noktası, bir sonraki seviyede haçın merkezidir; böylece çizim ile parça birbirine bağlanır.

**Kazanımlar:** Pergel-cetvel ile dik çizme ve açıyı ikiye bölme; düzgün sekizgenin ve {8/2} yıldızının iki kareden oluştuğunu görme; geleneksel tasarım yöntemini tanıma.

**Ölçülen:** Yanlış çizim sayısı (`wrongPicks`), ipucu kullanımı, süre.

#### Seviye 1 · "Çentiği tanı"
**Ne yapılır:** Sabit bir yıldızın çentiklerine uygun parça yerleştirilir. Kutuda haç, kare ve (lisede) beşgen vardır.

**Neden:** Seviyenin "aha" anı: yıldızın çentiği 135° boşluk bırakır. Kare (90°) 45° açık bırakır, beşgen (108°) 27° açık bırakır, haçın omzu (135°) tam oturur. Öğrenci doğru parçayı açı hesabıyla bulur.

**Kazanımlar:** Bir köşede açıların 360° ettiğini keşfetme; iç açı ile dış boşluk (360 − iç açı) ilişkisi; farklı ailelerin neden birbirine uymadığını açıyla açıklama.

**Ölçülen:** Deneme sayısı, **yanlış aile denemesi** (`wrongFamilyAttempts`; ölçek çalışması için en anlamlı veri), ipucu, süre.

#### Seviye 2 · "Yıldız-haç"
**Ne yapılır:** Bu kez haç sabittir; çevresine dört yıldız dizilir.

**Neden:** Aynı ilişkiyi ters yönden kurmak. Öğrenci haçın ucunda 90 + 90 + 90 = 270 toplandığını, kalan 90°'yi komşu haçın ucunun doldurduğunu görür. Yıldız ve haç, başka parçaya gerek kalmadan bütün düzlemi kaplar.

**Kazanımlar:** Kaplama (süsleme) kavramı; iki parçanın düzlemi boşluksuz örtmesi.

**Hikâye kartı · Kündekâri:** Parçaların çivisiz ve tutkalsız, yalnızca birbirine oturarak deseni tuttuğu ahşap tekniği. Fiziksel setin tarihsel karşılığıdır; öğrencinin az önce yaptığı işi gerçek bir zanaata bağlar.

#### Seviye 3 · "Ötele ve kapla"
**Ne yapılır:** Bir yıldız ve bir haçtan oluşan birim hücre, öteleme vektörleriyle kopyalanarak 2×2 (ortaokul) ya da 3×3 (lise) alan kaplanır.

**Neden:** "Nakkaş bütün duvarı değil, tek birimi tasarlar." Öğrenci öteleme vektörünün iki yıldız merkezini birleştirdiğini, yanlış vektörün çakışma ya da boşluk ürettiğini görür.

**Kazanımlar:** Birim hücre; öteleme dönüşümü ve vektör; periyodik desen.

#### Seviye 4 · "Aynala ve çoğalt"
**Ne yapılır:** Kenarları yıldızın ve haçın ortasından geçen **çeyrek kare** birim verilir. Öğrenci araç seçer (aynala / ötele) ve birimin bir kenarına dokunur. Hedef: 4×2 (ortaokul) ya da 4×4 (lise) alanı doldurmak.

**Neden:** Topkapı Tomarı'ndaki desen çizimlerinin çoğu bütün duvarı değil, kenarlarından aynalanacak küçük bir birimi gösterir. Öğrenci şunu kendisi keşfeder: çeyrek birim ötelenince desen **kırılır** (çeyrek yıldızlar birleşmez); aynalanınca **birleşir**. İki aynadan sonra elinde 2×2 birim hücre olur ve artık öteleme de çalışır. Bu, iki dönüşümün farkını ve birlikte nasıl kullanıldığını en açık biçimde gösterir.

**Kazanımlar:** Yansıma (ayna) dönüşümü; yansıma ile öteleme arasındaki fark; en küçük tekrar biriminden bütün desene ulaşma; dönüşümlerin bileşkesi.

**Ölçülen:** Kırık öteleme denemesi (`brokenCopies`).

**Hikâye kartı · Topkapı Tomarı:** Ustanın desen defteri; birimlerin aynalanarak çoğaltılması ve mürekkepsiz yardımcı çizgiler.

#### 10'lu aile · hazırlık ve 1. seviye
**Hazırlık · "Pergelle kur":** Daire pergelle ona bölünür. Yarıçapın orta noktasından açılan pergel ongenin kenarını verir (yarıçapın ≈ 0,618'i, altın oran); bu kenar boyu daire üzerinde taşınarak on köşe bulunur, köşeler üçer atlanarak birleştirilince {10/3} yıldızı ve 108°'lik çentik ölçmeden çıkar.

**Seviye 1 · "Yıldızın çevresi":** Yıldızın on çentiğine on beşgen yerleştirilir (252 + 108 = 360).

**Seviye 2 · "Papyon köprüsü":** Bir eşkenar dörtgenin köşelerindeki dört yıldızın ortası papyon, küçük dörtgen ve beşgenlerle doldurulur. Papyonun içe çökük 216° köşesine dörtgenin 144° köşesi oturur.

**Seviye 3 · "Ötele ve kapla":** Birim hücre bu kez kare değil, 72°/108°'lik bir eşkenar dörtgendir. Öğrenci, ötelemeyle düzlemi kaplayan bir desenin 5 ya da 10 kat dönme simetrisine sahip olamayacağıyla (kristalografik kısıt) karşılaşır: on kat simetri yıldızın çevresinde yereldir.

**Seviye 4 · "Bozuk çini":** Ortadaki yıldızı düşmüş bir yamayı onarmak; aynı büyüklükteki 8'li ve 12'li yıldız uç açılarıyla elenir.

**Desen kaynağı:** Bu seviyeler klasik bir girih deseninden kesin olarak türetildi (girih ongen + papyon döşemesi üzerinde Hankin yöntemi, 54°). Fiziksel setin 10'lu parçalarından farklıdır; set başka bir 10'lu desene dayanıyor görünmektedir.

**Kazanımlar:** Daireyi pergelle beşe/ona bölme; altın oranla ilk karşılaşma; 8'li ailede öğrenilen "çentik = 360 − iç açı" ilişkisini yeni bir ailede uygulama (aktarım); içbükey köşe ve eğik birim hücre; kristalografik kısıtla sezgisel tanışma.

#### 6'lı aile · hazırlık ve 4 seviye
**Hazırlık:** Pergelin açıklığı hiç değiştirilmeden daire altıya bölünür (yarıçap, çevreye tam altı kez sığar); birer atlayarak iki eşkenar üçgen çizilince altı köşeli yıldız ve 120°'lik çentik çıkar. En kısa kurulum budur; ortaokul için iyi bir başlangıçtır.

**Seviyeler:** Yıldızın çevresi (altı altıgen), Petek (uç uca üç yıldızın ortası), Ötele ve kapla (60°/120°'lik eşkenar dörtgen hücre: bir yıldız, iki altıgen), Bozuk çini.

**Kazanımlar:** Yarıçapın çevreye altı kez sığması; düzgün altıgen ve eşkenar üçgen; aynı "çentik = 360 − iç açı" ilişkisinin üçüncü bir ailede uygulanması.

#### 12'li aile · hazırlık ve 1. seviye
**Hazırlık:** Daire yarıçapla altıya bölünür; altı köşeden çizilen altı daire klasik "altı yapraklı gül"ü oluşturur, yaprak uçlarından geçen çaplar her parçayı ikiye böler. Dörder atlayan dört eşkenar üçgen {12/4} yıldızını ve 90°'lik çentiği verir.

**Seviye 1:** On iki kare yıldızın çentiklerine oturur (270 + 90 = 360); üçgen 30° açık bırakır.

**Kazanımlar:** Açıyı pergelle ikiye bölme (60° → 30°); dik açının ölçmeden ortaya çıkması; altı yapraklı gül motifiyle tanışma.

**Seviye 2–4 · 3.4.6.4 Arşimet döşemesi:** Altıgenin çevresine altı kare ve altı üçgen konunca düzgün onikigen oluşur (ailenin adı); her köşede aynı sıra: 60 + 90 + 120 + 90 = 360. Ardından bu döşemenin birim hücresi ötelenir ve bozuk bir yaması onarılır. Kazanım: düzgün çokgenlerle kaplama, Arşimet (yarı düzgün) döşemesi kavramı, köşe düzeni gösterimi (3.4.6.4). Not: klasik 12'li yıldız deseni bir hücrede 18 parça ve ayna biçimli parçalar gerektirdiğinden Kur'da sade döşeme seçildi; yıldız deseni Tanı modunda görülür.

#### Rütbe sınavı · "Karışık kutu"
**Ne yapılır:** Sahnede 8'li ve 10'lu iki yıldız, kutuda iki ailenin parçaları karışık. Her yıldız kendi ailesinin parçalarıyla çevrilir.

**Neden:** Öğrenci "hangi parça nereye?" sorusunu yalnızca açıyla cevaplayabilir: 135°'lik çentiğe haçın omzu, 108°'lik çentiğe beşgen. Bu, iki ailede ayrı ayrı öğrenilenin aktarımını ve ayırt edilmesini sınar.

**Ölçülen:** Yanlış aile denemesi (`wrongFamilyAttempts`); parçanın yanına konduğu yıldızın ailesine göre sayılır. Ölçek çalışması için en anlamlı gösterge budur.

#### Her seviyede · "Geçme çizgisi"
**Ne yapılır:** Bir düğmeyle (ya da seviye sonundaki "Çizgiye dönüştür" ile) desen, birbirinin altından ve üstünden sırayla geçen bantlara dönüşür. 8'li yıldız iki kareden örülür.

**Neden:** Geleneksel desenin özü, parçalar değil, birbirine geçen bant çizgisidir (geçme, örgü). Öğrenci aynı deseni hem parça hem çizgi olarak görür; hazırlık seviyesinde çizdiği iki karenin desenin içinde hâlâ yaşadığını fark eder.

**Kazanımlar:** Aynı yapının farklı temsillerini ilişkilendirme; {8/2} yıldızının iki kareden oluşması; geleneksel geçme tekniğini tanıma.

#### Seviye 5 · "Bozuk çini"
**Ne yapılır:** Dört çinisi düşmüş bir duvar (3×3 yıldız, 4 haç) onarılır. Kutuda eksik parçaların yanında birbirine benzeyen yanıltıcılar vardır: ortaokulda 10'lu yıldız ve kare, lisede 10'lu yıldız, 12'li yıldız ve beşgen.

**Neden:** 10'lu ve 12'li yıldız uzaktan 8'li yıldıza benzer; öğrenci doğru parçayı şeklinden değil açısından ayırmak zorundadır. Yanlış yıldız boşluğa konduğunda oyun nedenini açıyla söyler: "90 + 90 + 90 + 72 = 342 — boşluk 90° istiyor, bu parçanın köşesi 72°." Restorasyon kurgusu, kültürel mirası koruma değerini işler.

**Kazanımlar:** Benzer şekilleri açı özelliğiyle ayırt etme (van Hiele analiz düzeyi); bir köşedeki eksik açıyı hesaplama; önceki seviyelerde öğrenilenleri tek görevde birleştirme.

**Ölçülen:** Yanlış aile denemesi (`wrongFamilyAttempts`).

---

### 3.3 Usta — Yarat *(oynanabilir)*

**Amaç:** Öğrenilen kuralları özgün üretimde kullanmak.

**Araçlar:** Boş tuval; parça kutusu (aile sekmeleri); **simetri aynası** (kapalı, 6×, 8×, 10×, 12×: konulan her parça merkez etrafında n kez çoğaltılır; sığmayan kopyalar atlanır ve söylenir); geleneksel renk paleti (seçili grubu boyar); sil, geri al, temizle; açı etiketleri. Dört görev rozeti: tek aile, üç renk, dört tam köşe, simetri aynasıyla 16 parça. PNG dışa aktarma ve yerel galeri (cihazda).

**Ölçülen:** Parça sayısı, kullanılan aileler, simetri, süre, kazanılan rozetler (`mode: "yarat"`). Öteleme kopyası aracı bu sürümde yok.

**Kazanımlar:** K3 (yaratıcılık); dönme simetrisi; kısıt altında tasarım.

**Gerekçe:** Yapılandırmacılığın en üst basamağı, öğrencinin öğrendiği yapıyla kendi ürününü oluşturmasıdır (Papert, 1980). Kısıtlı görevler, serbest üretimi bir amaca bağlayarak yaratıcılığı yönlendirir.

---

## 4. Ölçme ve araştırma verisi

Oyun, öğretmen paneli ya da sunucu olmadan, her oturum için cihazda (`localStorage`) bir kayıt tutar:

```
{ ts, mode, family, level, difficulty, attempts, wrongFamilyAttempts,
  seconds, completed, hintsUsed, [wrongPicks], [brokenCopies] }
```

"Verileri dışa aktar" bu kayıtları JSON dosyası olarak indirir. Kayıtlar, projenin ölçek çalışmasıyla eşleştirilmek üzere tasarlanmıştır. Önerilen göstergeler:

- **Yanlış aile denemesi:** Öğrencinin aileleri açı üzerinden ayırt edip edemediği (K2).
- **Kırık öteleme / yanlış çizim:** Dönüşüm ve kurulum kavramlarının oturup oturmadığı.
- **İpucu ve "Usta göstersin" kullanımı:** Destek ihtiyacı; ortaokul ve lise profilleri arasında karşılaştırma.
- **Tekrar oynama süresi:** Öğrenmenin kalıcılığı (en iyi süre saklanır).

Toplanan veri kişisel bilgi içermez ve cihazdan çıkmaz; paylaşım öğretmenin dışa aktardığı dosyayla olur.

---

## 5. Sınırlılıklar ve açık işler

- **Kapsam:** Şu an Tanı modu (7 motif), Yarat modu ve Kur modunda 8'li aile (hazırlık + 5 seviye), 10'lu ve 6'lı aileler (hazırlık + 4'er seviye) ve rütbe sınavı oynanabilir. Motif hikâye metinleri önceki bir aşamada yazıldı; sınıfta kullanmadan önce kaynaklardan doğrulanmalıdır. 10'lu seviyeler kesin bir girih deseninden türetildiği için fiziksel setin 10'lu parçalarıyla birebir değildir (sette olmayan küçük bir dörtgen içerir). 6'lı ve 12'li ailelerin dolgu parçaları kesin geometriyle yeniden türetilmeyi bekliyor. Tanı ve Yarat modları ile 10'lu, 6'lı ve 12'li aileler henüz yazılmadı. Diğer ailelerin parça oranları, döşeme testiyle doğrulanmadan seviyeye dönüştürülmeyecek.
- **Etkililik:** Oyunun öğrenme üzerindeki etkisi henüz ölçülmedi. Bu belgedeki gerekçeler tasarım kararlarını açıklar; etkililiğe dair kanıt, ölçek çalışmasından gelecektir.
- **Tarihsel içerik:** Hikâye kartlarındaki tarih ve örnekler genel bilgiden yazılmıştır ve `data/motifs.json` içinde `_dogrulama` notuyla işaretlidir. Sınıfta kullanılmadan önce aşağıdaki kaynaklardan doğrulanmalıdır.
- **Geçme çizgisi:** Şimdilik yalnızca yıldız parçalarından üretilir; yıldıza değmeyen kenarlar bant olarak çizilmez.

---

## 6. Kaynakça

> Künyeler genel bilgiden derlenmiştir; proje raporuna eklemeden önce yayın bilgilerini doğrulayınız.

**Eğitim ve öğrenme**
- Bruner, J. S. (1966). *Toward a Theory of Instruction.* Harvard University Press.
- D'Ambrosio, U. (1985). Ethnomathematics and its place in the history and pedagogy of mathematics. *For the Learning of Mathematics, 5*(1), 44–48.
- Gee, J. P. (2003). *What Video Games Have to Teach Us About Learning and Literacy.* Palgrave Macmillan.
- Hattie, J. ve Timperley, H. (2007). The power of feedback. *Review of Educational Research, 77*(1), 81–112.
- Kapur, M. (2008). Productive failure. *Cognition and Instruction, 26*(3), 379–424.
- Papert, S. (1980). *Mindstorms: Children, Computers, and Powerful Ideas.* Basic Books.
- Renkl, A. ve Atkinson, R. K. (2003). Structuring the transition from example study to problem solving in cognitive skill acquisition: A cognitive load perspective. *Educational Psychologist, 38*(1), 15–22.
- Sweller, J. (1988). Cognitive load during problem solving: Effects on learning. *Cognitive Science, 12*(2), 257–285.
- van Hiele, P. M. (1986). *Structure and Insight: A Theory of Mathematics Education.* Academic Press.
- Wood, D., Bruner, J. S. ve Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry, 17*(2), 89–100.

**İslam sanatı ve geometrik desen**
- Bonner, J. (2017). *Islamic Geometric Patterns: Their Historical Development and Traditional Methods of Construction.* Springer.
- Broug, E. (2008). *Islamic Geometric Patterns.* Thames & Hudson.
- Lu, P. J. ve Steinhardt, P. J. (2007). Decagonal and quasi-crystalline tilings in medieval Islamic architecture. *Science, 315*(5815), 1106–1110.
- Necipoğlu, G. (1995). *The Topkapı Scroll: Geometry and Ornament in Islamic Architecture.* Getty Center for the History of Art and the Humanities.
- Öney, G. *Anadolu Selçuklu Mimari Süslemesi ve El Sanatları.* (Baskı bilgisi doğrulanacak.)
- TDV İslâm Ansiklopedisi, "Kündekâri" maddesi.
