# Nakkaş — İslam Sanatı Geometrik Desen Oyunu

Tarayıcıda çalışan, çevrimdışı oynanabilen (PWA) eğitsel yapboz oyunu. TÜBİTAK lise/ortaokul değerler eğitimi projesinin dijital ayağı. Fiziksel ahşap yapboz setinin birebir dijital karşılığı + yaratıcılık modu.

## Kazanımlar (her özellik bunlardan birine hizmet etmeli)
1. **Tanıma** — popüler motifleri (8'li, 10'lu, 6'lı, 12'li yıldız sistemleri) ve nerede kullanıldıklarını tanımak
2. **Mekanik** — motifin arkasındaki mantığı kavramak: açı toplamı 360°, dönme simetrisi, birim hücre, ailelerin birbirine uymaması
3. **Yaratıcılık** — parçalarla ve simetri aynasıyla özgün motif üretmek

## Kararlar (değiştirme, sor)
- Platform: **saf HTML + CSS + JavaScript (ES modül), framework yok, build adımı yok.** `index.html`'i açınca çalışmalı; `npx serve .` ile test edilir.
- Çizim: **SVG** (parçalar zaten SVG path; dokunma/fare olayları kolay). Canvas yalnızca performans sorunu çıkarsa.
- Çevrimdışı: `sw.js` + `manifest.webmanifest`. Tüm varlıklar yerel; CDN yok.
- Cihazlar: PC (fare), tablet ve telefon (dokunma). Pointer Events kullan, `touch-action: none` oyun alanında. En dar genişlik 360px.
- Dil: arayüz **Türkçe**; kod ve dosya adları İngilizce/ASCII (`kalkan-kucuk` gibi parça id'leri hariç, onlar `data/pieces.json` ile sabit).
- Seviye: iki zorluk profili — `ortaokul` (ipuçları açık, açı etiketleri her zaman görünür, daha az parça) ve `lise` (ipuçları kapalı, açı etiketleri isteğe bağlı, birim hücre öteleme görevleri). Profil tek bir `difficulty` ayarı; mod kodu dallanmasın, veri (seviye tanımı) dallansın.
- Öğretmen paneli **yok**. Yerel kayıt `localStorage` (ilerleme, rozetler, galeri). Dışa aktarma: JSON indir / PNG indir.
- Aileler: 8, 10, 6, 12. Parça verisi `data/pieces.json` — **elle düzenleme**, `build/gen_pieces.py` ile üretilir.

## Üç mod → üç rütbe
| Rütbe | Mod | Kazanım | Özet |
|---|---|---|---|
| Çırak | **Tanı** | 1 | Gerçek yapı fotoğrafı/çizimi üzerinde yıldızı bul, köşe say, aileyi seç, birim hücreyi çerçevele. Doğruda hikâye kartı açılır. |
| Kalfa | **Kur** | 2 | Parçalarla yapboz. Her yerleşimde köşedeki açılar toplanır; 360° olunca parça "oturur". Yanlış aile → artık açı kırmızı. Seviyeler: yıldız çevresi → birim hücre → ötele ve kapla. |
| Usta | **Yarat** | 3 | Boş tuval + parça kutusu + **simetri aynası** (n-kat döndürme). Kısıtlı görevler. PNG dışa aktar, yerel galeri. |

Ayrıntı: `docs/tasarim.md`, seviyeler: `docs/seviyeler.md`, motif atlası içeriği: `data/motifs.json`.

## Mekanik çekirdeği (src/geometry.js)
- Parça = `{id, family, points[], angles[]}`; sahnedeki örnek = `{pieceId, x, y, rot}` (rot = 360/family'nin katları + serbest mod için 15°).
- **Köşe eşleme:** sürüklenen parçanın köşesi, sahnedeki bir köşeye `SNAP_PX` içinde yaklaşınca yapışır; ardından kenar hizası için parça döndürülür (yalnızca aile açısının katlarıyla).
- **Açı denetimi:** paylaşılan bir köşede toplanan iç açılar toplanır. `=360` tam, `<360` boşluk, `>360` çakışma. Oyun bunu renkle ve sayıyla gösterir — mekanik kazanımı tam burada.
- **Aile uyumsuzluğu** kuraldan değil geometriden çıkmalı: 10'lu parça 8'li köşeye getirilince toplam 360 etmez; mesaj bunu açıyla anlatır ("135 + 135 + 72 = 342, 18° açık kaldı").
- Yıldızın çentiği (360 − iç açı) o aileye özgü bir parçayı tam alır: 8'li {8/2} → 135° (haçın omuz köşesi / sekizgen), 10'lu → 108° (beşgen), 6'lı → 120° (altıgen), 12'li {12/4} → 90° (kare). Bu, Kalfa 1. seviyenin "aha" anıdır. Açılar `data/pieces.json` → `angles` alanından okunur; elle sabit yazma.

## Kod düzeni
```
index.html            giriş: rütbe seçimi, zorluk, modlara geçiş
styles.css            tema (açık/koyu), tipografi, dokunma boyutları
src/app.js            yönlendirme, durum, localStorage
src/geometry.js       çokgen matematiği, snap, açı toplamı (saf fonksiyonlar, test edilebilir)
src/pieces.js         pieces.json yükle, SVG path üret, parça kutusu
src/modes/tani.js     Çırak
src/modes/kur.js      Kalfa
src/modes/yarat.js    Usta
data/pieces.json      27 parça (üretilmiş)
data/motifs.json      motif atlası + hikâye kartları
data/levels.json      Kalfa seviyeleri (hedef yerleşimler)
assets/pieces/*.svg   tekil parçalar
assets/motifs/        yapı fotoğrafları (eklenecek; lisans notu düşülecek)
build/gen_pieces.py   parça üretici
```

## Çalışma kuralları
- Küçük adımlar: önce `kur.js` oynanabilir olsun (3 seviye, 8'li aile), sonra diğerleri.
- `geometry.js` fonksiyonları yan etkisiz; her yeni fonksiyona `tests/geometry.tests.js` içinde en az bir örnek ekle (framework yok; `tests/geometry.test.html` tarayıcıda, `node tests/run-node.mjs` komut satırında çalıştırır). Mod etkileşimleri için `tests/kur.smoke.html` sentetik işaretçi olaylarıyla oynar; headless Chrome `--dump-dom` ile okunabilir.
- Dokunma hedefleri ≥ 44px. Parça kutusundaki küçük parçalar büyütülmüş tutamaçla sürüklenir.
- Hikâye/kültür metinleri `data/motifs.json`'da; koda gömme. Tarihsel iddiaları kaynaklı tut, emin olunmayanı "rivayet" diye işaretle.
- Performans ölçütü: 60 parçalı sahne orta sınıf Android tablette akıcı sürüklenmeli.
- Araştırma verisi: oyun `localStorage`'a oturum başına `{mode, level, attempts, seconds, completed}` yazar; `Ayarlar → Verileri dışa aktar` JSON verir. Ölçek çalışmasıyla eşleştirilecek.
