# Seviye Planı (Kalfa — Kur)

Her aile dört seviye. Ortaokul profili 1–2–4 zorunlu, 3 isteğe bağlı; lise profili dördü de zorunlu. `data/levels.json` bu tabloyu veri olarak tutar (ilk sürümde yalnızca 8'li aile dolu; diğerleri şablon).

## 8'li aile — "Medrese kapısı"
| # | Ad | Sabit | Kutuda | Hedef | Keşif |
|---|---|---|---|---|---|
| 0 | Pergelle kur (hazırlık) | O, A noktaları | pergel, cetvel | 9 adım: daire → çap → dikme yayları → dik çap → dört daire → köşegenler → iki kare → boya | daire pergelle 8'e bölünür; iki karenin birleşimi yıldızı, çentiğindeki 135°'yi ölçmeden verir; haçın merkezi (1,1) dört dairenin kesişimi |
| 1 | Çentiği tanı | sekiz-kose-yildiz ×1 | hac ×4, kare-kucuk ×2–4 (yanıltıcı; lise ayrıca besgen ×2) | 4 haç (±1, ±1) | çentik 135°: kare (90°) 45° açık bırakır, beşgen (108°) 27°, haçın omzu (135°) tam oturur |
| 2 | Yıldız-haç | hac ×1 (sabit) | sekiz-kose-yildiz ×4 | haçın dört omzuna dört yıldız (±1, ±1) | haç ucunda 90+90+90 = 270; kalan 90° komşu haçın ucu |
| 3 | Ötele ve kapla | 1 birim hücre | hücre kopyası aracı | 3×3 (lise) / 2×2 (orta) | öteleme vektörü = yıldız merkezleri arası |
| 4 | Bozuk çini | tam 3×3, 4 parça eksik | eksikler + 3 yanıltıcı | boşluklar dolu | şekilden değil açıdan tanı |

## 10'lu aile — "Türbe kuşağı"
| # | Ad | Sabit | Kutuda | Hedef | Keşif |
|---|---|---|---|---|---|
| 1 | Yıldızın çevresi | on-kose-yildiz ×1 | besgen ×10, kare-kucuk ×2 (yanıltıcı) | 10 çentik | 252 iç → 108 boşluk → beşgen |
| 2 | Papyon köprüsü | on-kose-yildiz ×2 | papyon, kalkan-kucuk, ok-ucu | iki yıldız arası | 10'lu dolgular 36° katlarıyla döner |
| 3 | Ötele ve kapla | birim hücre | kopya aracı | 2×2 | 10'lu hücre eşkenar dörtgen (72°/108°) |
| 4 | Bozuk çini | tam desen | eksikler | — | — |

## 6'lı aile — "Hamam örgüsü"
| # | Ad | Sabit | Kutuda | Hedef | Keşif |
|---|---|---|---|---|---|
| 1 | Yıldızın çevresi | alti-kose-yildiz | altigen ×6, eskenar-ucgen ×6 | çentikler | 240 iç → 120 → altıgen; ya da 60+60 iki üçgen |
| 2 | Petek | alti-kose-yildiz ×3 | altigen, eskenar-dortgen | üçlü düğüm | 120×3 = 360 |
| 3 | Ötele ve kapla | hücre | kopya | 3×3 | altıgen örgü iki vektörle |
| 4 | Bozuk çini | — | — | — | — |

## 12'li aile — "Kubbe eteği"
| # | Ad | Sabit | Kutuda | Hedef | Keşif |
|---|---|---|---|---|---|
| 1 | Yıldızın çevresi | oniki-kose-yildiz | kare-12 ×12, ucgen-12 ×6 (yanıltıcı) | 12 çentik | 270 iç → 90 boşluk → kare; üçgen 30° açık bırakır |
| 2 | 3.4.6.4 | yıldız + altigen-12 | kare-12, ucgen-12 | Arşimet döşemesi | 60+90+120+90 = 360 |
| 3 | Ötele ve kapla | hücre | kopya | 2×2 | — |
| 4 | Bozuk çini | — | — | — | — |

## Çapraz seviye (rütbe sınavı, lise)
"Karışık kutu": sahnede 8'li ve 10'lu iki yıldız yan yana, kutuda her iki ailenin parçaları karışık. Hedef: her yıldızı kendi ailesiyle doldur. Yanlış aile denemesi sayılır (`wrongFamilyAttempts`) — ölçek için en anlamlı veri.

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
