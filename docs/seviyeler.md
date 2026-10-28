# Seviye Planı (Kalfa — Kur)

Her aile dört seviye. Ortaokul profili 1–2–4 zorunlu, 3 isteğe bağlı; lise profili dördü de zorunlu. `data/levels.json` bu tabloyu veri olarak tutar (ilk sürümde yalnızca 8'li aile dolu; diğerleri şablon).

## 8'li aile — "Medrese kapısı"
| # | Ad | Sabit | Kutuda | Hedef | Keşif |
|---|---|---|---|---|---|
| 0 | Pergelle kur (hazırlık) | O, A noktaları | pergel, cetvel | 9 adım: daire → çap → dikme yayları → dik çap → dört daire → köşegenler → iki kare → boya | daire pergelle 8'e bölünür; iki karenin birleşimi yıldızı, çentiğindeki 135°'yi ölçmeden verir; haçın merkezi (1,1) dört dairenin kesişimi |
| 1 | Çentiği tanı | sekiz-kose-yildiz ×1 | hac ×4, kare-kucuk ×2–4 (yanıltıcı; lise ayrıca besgen ×2) | 4 haç (±1, ±1) | çentik 135°: kare (90°) 45° açık bırakır, beşgen (108°) 27°, haçın omzu (135°) tam oturur |
| 2 | Yıldız-haç | hac ×1 (sabit) | sekiz-kose-yildiz ×4 | haçın dört omzuna dört yıldız (±1, ±1) | haç ucunda 90+90+90 = 270; kalan 90° komşu haçın ucu |
| 3 | Ötele ve kapla | 1 birim hücre | hücre kopyası aracı | 3×3 (lise) / 2×2 (orta) | öteleme vektörü = yıldız merkezleri arası |
| 4 | Aynala ve çoğalt | çeyrek kare birim (çeyrek yıldız + çeyrek haç) | ayna / öteleme aracı | 4×2 (orta) / 4×4 (lise) | çeyrek ötelenince kırılır, aynalanınca birleşir; 2×2 olunca öteleme de çalışır (Topkapı Tomarı kartı) |
| 5 | Bozuk çini | 3×3 yıldız + 4 haçlık duvar, 4 parça eksik (yıldız (0,0), (−2,2), (2,2), haç (1,−1)) | eksikler + yanıltıcılar (orta: 10'lu yıldız, 2 kare; lise: 10'lu, 12'li yıldız, beşgen) | boşluklar dolu | şekilden değil açıdan tanı: boşluğun köşesinde 90 + 90 + 90 = 270; 10'lu uç 342, 12'li uç 330 verir |

## 10'lu aile — "Türbe kuşağı"
| # | Ad | Sabit | Kutuda | Hedef | Keşif |
|---|---|---|---|---|---|
| 0 | Pergelle kur (hazırlık) ✓ | O, A noktaları | pergel, cetvel | 12 adım: daire → çap → dikme → dik çap → yarıçapın ortası (M) → MB yayı OA'yı P'de keser (OP = ongen kenarı ≈ 0,618) → P merkezli daire ±36° köşeleri verir → karşı köşeler → kenar boyu taşınarak kalan köşeler → üçer atla | daire pergelle ona bölünür (altın oran); {10/3} yıldızı ve 108° çentik ölçmeden çıkar |
| 1 | Yıldızın çevresi ✓ | on-kose-yildiz ×1 | besgen ×10; yanıltıcı: kare-kucuk ×2 (lise: + haç, altıgen ×2) | 10 çentik | 252 iç → 108 boşluk → beşgen; uçlarda 72 + 108 + 108 = 288 |
| 2 | Papyon köprüsü ✓ | on-kose-yildiz ×4 (eşkenar dörtgenin köşelerinde) | papyon ×1, dortgen-10 ×2, besgen ×4; yanıltıcı: kare (lise: + haç, uzun beşgen) | ortadaki boşluk | papyonun 108° köşeleri iki yıldızın çentiğine (252 + 108), 216° çentiği dörtgenin 144° köşesine; öbür köşelerde 72 + 72 + 108 + 108 |
| 3 | Ötele ve kapla ✓ | birim hücre: yıldız + 4 beşgen + papyon + 2 dörtgen | kopya aracı | 2×2 (orta) / 3×3 (lise) | hücre eşkenar dörtgen (72°/108°), a = (1,902; 0,618), b = (0; 2); kristalografik kısıt: periyodik desen 10 kat simetrik olamaz |
| 4 | Bozuk çini ✓ | merkez yıldız çevresi, 4 parça eksik (yıldız, papyon, beşgen, dörtgen) | eksikler + yanıltıcılar (orta: 8'li yıldız, kare; lise: 8'li, 12'li yıldız, haç) | boşluklar dolu | boşluk çentiklerde 252°, içe bakan uçlarda 72° ister; 8'li (90°) ve 12'li (60°) uç uymaz |

> **Parça ölçüsü (28 Ekim 2026):** 10'lu ailede yalnızca yıldız ve beşgen kesin geometride (beşgen kenarı = yıldız kenarı, `build/gen_pieces.py` → `S10`). Papyon, kalkanlar, çift ev, çentikli altıgen, ok ucu, uzun beşgen ve yarım yıldız fotoğraftan oranlanmış; açıları 36°'nin katı değil, kenarları yıldız kenarının katı değil. Kullanıcı kararıyla 2.–4. seviyeler klasik kesin bir girih deseninden türetildi: girih ongen + papyon döşemesi üzerinde Hankin yöntemi, 54° (`build/hankin.mjs`, `build/gen_levels10.mjs`). Desenin parçaları: 10'lu yıldız, beşgen, kesin papyon (8 köşe, 108°/216°) ve fiziksel sette olmayan küçük dörtgen (`dortgen-10`, 72/72/144/72). Setteki papyon ve diğer büyük parçalar başka, daha seyrek bir 10'lu desene ait görünüyor; bu seviyeler fiziksel setle yapılamaz. Karşılaştırma: `docs/img/10lu-parca-karsilastirma.png`. 6'lı ve 12'li ailelerde de yıldız (ve 6'lıda altıgen) dışındaki parçaların kenarı yıldız kenarına uymuyor.

## 6'lı aile — "Hamam örgüsü"
| # | Ad | Sabit | Kutuda | Hedef | Keşif |
|---|---|---|---|---|---|
| 0 | Pergelle kur ✓ | O, A | pergel, cetvel | 7 adım: daire → yarıçapla yay → yürüt → yürüt → iki eşkenar üçgen → boya | yarıçap çevreye altı kez sığar; 120° çentik ölçmeden çıkar |
| 1 | Yıldızın çevresi ✓ | alti-kose-yildiz | altigen ×6; yanıltıcı kare (lise: + beşgen) | 6 çentik | 240 iç → 120 → altıgen; uçlarda 60 + 120 + 120 = 300 |
| 2 | Petek ✓ | alti-kose-yildiz ×3 (uç uca) | altigen ×4 (lise: + 10'lu yıldız, beşgen) | ortadaki ve çift yıldıza değen altıgenler | çentikte 240 + 120; uç uca uçlarda 60 + 60 + 120 + 120 = 360 |
| 3 | Ötele ve kapla ✓ | hücre: yıldız + 2 altıgen | kopya | 2×2 / 3×3 | a = (√3, 1), b = (0, 2), aralarında 60° |
| 4 | Bozuk çini ✓ | merkez yıldız çevresi, 3 eksik | eksikler + 8'li yıldız, kare (lise: + 12'li yıldız, beşgen) | boşluk dolu | boşluk uçlarda 60°, çentikte 240° ister |

> 6'lı seviyeleri `build/gen_levels6.mjs` üretir (yıldızlar üçgen kafeste uç uca, altıgenler her kafes üçgeninin ortasında). Altıgen üreticide düz tepeli tanımlıdır: desendeki bütün altıgenler 0° dönmeyle oturur (R 60° adımla döndürür, 30°'ye ulaşılamaz). Eşkenar üçgen, eşkenar dörtgen ve şevron yıldız kenarına uymadığı için bu seviyelerde kullanılmıyor.

## 12'li aile — "Kubbe eteği"
| # | Ad | Sabit | Kutuda | Hedef | Keşif |
|---|---|---|---|---|---|
| 0 | Pergelle kur ✓ | O, A | pergel, cetvel | 9 adım: daire → yarıçapla altıya böl → altı yaprak (altı daire) → yaprak uçlarından çaplar (on ikiye) → dörder atlayan dört üçgen → boya | altı yapraklı gül; {12/4} yıldızı ve 90° çentik ölçmeden çıkar |
| 1 | Yıldızın çevresi ✓ | oniki-kose-yildiz | kare-12 ×12; yanıltıcı ucgen-12 ×2 (lise: + beşgen, haç) | 12 çentik | 270 iç → 90 boşluk → kare; üçgen 30° açık bırakır; uçlarda 60 + 90 + 90 = 240 |
| 2 | Onikigen ✓ | altigen-12 | kare-12 ×6, ucgen-12 ×6 (lise: + beşgen, kare) | altıgenin çevresi | her köşede 60 + 90 + 120 + 90 = 360; altıgen + 6 kare + 6 üçgen = düzgün onikigen |
| 3 | Ötele ve kapla ✓ | hücre: altıgen + 3 kare + 2 üçgen | kopya | 2×2 / 3×3 | öteleme = kenar · (1 + √3), aralarında 60° |
| 4 | Bozuk çini ✓ | 3.4.6.4 yaması, 3 eksik (altıgen, kare, üçgen) | eksikler + beşgen (lise: + 6'lı altıgen, kare) | boşluklar dolu | köşedeki açıdan tanı; 6'lı altıgen aynı açılı ama büyük |

> 12'li: `build/gen_levels12.mjs` bütün seviyeleri üretir; kare-12, ucgen-12, altigen-12 kenarı yıldız kenarına (S12) eşitlendi. 2.–4. seviyeler kullanıcı kararıyla 3.4.6.4 Arşimet döşemesinden (yıldızsız); klasik 4.6.12 + Hankin 60° deseni (Tanı çizimi) bir hücrede 18 parça ve iki ayna biçimli kalkan gerektirdiği için Kur'da kullanılmadı.

## Çapraz seviye (rütbe sınavı) ✓
`karma-1` (`families: [8, 10]`): 8'li yıldız (0, 0), 10'lu yıldız (3,7; 0); kutuda haç ×4 + beşgen ×10 (lise: + kare ×2, dörtgen ×2). Yanlış aile, parçanın en yakın sabit yıldızının ailesine göre sayılır; ortaokulda aile notu verilir, kutuda parlama yoktur. "Karışık kutu": sahnede 8'li ve 10'lu iki yıldız yan yana, kutuda her iki ailenin parçaları karışık. Hedef: her yıldızı kendi ailesiyle doldur. Yanlış aile denemesi sayılır (`wrongFamilyAttempts`) — ölçek için en anlamlı veri.

## Seviye veri şeması (`data/levels.json`)
```json
{
 "id": "f8-l1",
 "family": 8,
 "order": 1,
 "title": "Yıldızın çevresi",
 "story": "Usta: 'Yıldız çentiğine hangi taş oturur, dene.'",
 "fixed": [{"pieceId": "sekiz-kose-yildiz", "x": 0, "y": 0, "rot": 0}],
 "tray": {"hac": 4},
 "trayDistractors": {"lise": {"kare-kucuk": 4}},
 "targets": [{"pieceId": "hac", "x": 1.96, "y": 0, "rot": 0}],
 "hint": {"ortaokul": "Boşluk 135°. Hangi parçanın köşesi 135°?"},
 "discovery": "Yıldızın çentiği 135° — kare 45° açık bırakır, haçın omzu tam oturur."
}
```
`targets` koordinatları parça birimindedir (yıldız dış yarıçapı = 1). Çözüm denetimi: her hedef için aynı `pieceId`, konum toleransı 0.05, açı toleransı 1°. Eşdeğer simetrik çözümler kabul edilir (hedef kümesi yıldız simetrisiyle döndürülerek karşılaştırılır).

> Not: 8'li kare ve uçurtma parçalarının hangi döşemede kullanıldığı fiziksel setle doğrulanacak.
>
> 8'li hedefler (f8-l1..l3) geometriyle doğrulandı: `hac` parçası, yıldızla birebir örtüşecek oranlara çekildi (bütün kenarlar √2−1; haç merkezi yıldız merkezinden (±1, ±1) uzakta). Yıldız-haç kafesi: yıldızlar (2i, 2j), haçlar (2i+1, 2j+1); öteleme vektörleri a = (2, 0), b = (0, 2). Köşe toplamları: çentik 225 + 135 = 360, yıldız ucu haç koltuğunda 90 + 270 = 360, uç uca değen yıldız uçlarında 90 + 90 + 90 + 90 = 360 (iki yıldız + iki haç ucu). `tests/geometry.tests.js` bunları denetler.
