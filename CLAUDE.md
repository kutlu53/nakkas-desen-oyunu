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
| Çırak | **Tanı** | 1 | Desen çizimi üzerinde yıldızı bul, köşe say, birim hücreyi çerçevele (lisede: hangi aileyle yapılamaz). Doğruda hikâye kartı açılır. Yapı fotoğrafı yok (kullanıcı, 2026-10-28): görseller kendi kesin çizimlerimiz, ekranda "yapının kendi deseninin kopyası değil" notu var. Proje kökündeki `Motifler/` fotoğrafları setin kurulu hâli; (2) üçüncü kişinin eseri, (4) banka kartı, (6) çocuk elleri içerir — oyunda kullanma. |
| Kalfa | **Kur** | 2 | Parçalarla yapboz. Her yerleşimde köşedeki açılar toplanır; 360° olunca parça "oturur". Yanlış aile → artık açı kırmızı. Seviyeler: pergelle kur (hazırlık, `order: 0`) → yıldız çevresi → birim hücre → ötele ve kapla → aynala ve çoğalt (Tomar birimi) → bozuk çini. Rütbe sınavı: `families: [8, 10]` olan seviye (karışık kutu); yanlış aile en yakın sabit yıldıza göre sayılır. Her seviyede "Geçme çizgisi" görünümü; bitişte hikâye kartı (`card`). |
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
src/modes/tani.js     Çırak: yıldızı bul, köşe say, birim hücreyi çerçevele (data/tani.json çizimleri)
src/modes/kur.js      Kalfa
src/modes/construct.js Kalfa hazırlık: pergel-cetvel kurulumu (levels.json → tool: "construct")
src/modes/mirror.js   Kalfa aynalama: çeyrek birimi kenarından aynala/ötele (tool: "mirror")
src/rank.js           rütbe: kalfa = atlasın yarısı + her ailede 2. seviye; usta = + her ailede 3. seviye + rütbe sınavı
src/sound.js          ses (varsayılan kapalı, state.sound; Web Audio tonları: tik, can, tok)
src/cards.js          hikâye kartları (motifs.json → cards), tamamlama kartında gösterilir
src/modes/yarat.js    Usta: serbest tuval, simetri aynası, boya, geri al, görev rozetleri, PNG, galeri (state.gallery, state.badges)
data/pieces.json      29 parça (üretilmiş; gül parçaları build/rose_pieces.json'dan)
data/motifs.json      motif atlası (motifs) + hikâye kartları (cards; _dogrulama notu: sınıftan önce kaynaktan doğrula)
data/levels.json      Kalfa seviyeleri (hedef yerleşimler)
assets/pieces/*.svg   tekil parçalar
assets/motifs/        yapı fotoğrafları (eklenecek; lisans notu düşülecek)
build/gen_pieces.py   parça üretici
build/hankin.mjs      kesin desen türetici (alt çokgen ağı + kenar ortasından 54° ışınlar → parçalar)
build/gen_levels10.mjs 10'lu kesin desenden parça biçimi ve f10-l2..l4 yerleşimleri
build/gen_rose.mjs    setin 10'lu gülünün iç kısmı (ongen + 10 beşgen, Hankin 72°) → rose_pieces.json + f10-l5
build/gen_levels6.mjs 6'lı yıldız-altıgen deseninden f6-l0..l4
build/gen_levels12.mjs 12'li pergel hazırlığı (altı yaprak), f12-l1 ve 3.4.6.4 döşemesinden f12-l2..l4
build/gen_tani.mjs    Tanı çizimleri: 6'lı yıldız-altıgen, 8'li yıldız-haç, 10'lu girih, 12'li 4.6.12 + Hankin 60° → data/tani.json
```

## Çalışma kuralları
- Küçük adımlar: önce `kur.js` oynanabilir olsun (3 seviye, 8'li aile), sonra diğerleri.
- `geometry.js` fonksiyonları yan etkisiz; her yeni fonksiyona `tests/geometry.tests.js` içinde en az bir örnek ekle (framework yok; `tests/geometry.test.html` tarayıcıda, `node tests/run-node.mjs` komut satırında çalıştırır). Mod etkileşimleri için `tests/kur.smoke.html` sentetik işaretçi olaylarıyla oynar; headless Chrome `--dump-dom` ile okunabilir.
- Dokunma hedefleri ≥ 44px. Parça kutusundaki küçük parçalar büyütülmüş tutamaçla sürüklenir.
- Hikâye/kültür metinleri `data/motifs.json`'da; koda gömme. Tarihsel iddiaları kaynaklı tut, emin olunmayanı "rivayet" diye işaretle.
- Tarihsel çerçeve: ustalar deseni pergel ve cetvelle kurardı, açı ölçüp toplamazdı. Açı toplamı bugünün matematiğiyle kurulumun *neden* çalıştığını gösterir; metinlerde "ustalar açıları toplardı" izlenimi verme. Her aile Kur'a bir pergel-cetvel hazırlığıyla başlar (`tests/geometry.tests.js` her açılan noktanın iki çizimin kesişimi olduğunu denetler). Motifleri dönem/coğrafyayla doğru eşle: 8'li yıldız-haç çinisi ağırlıkla Selçuklu-İlhanlı, 10'lu girih İran-Timurlu; Osmanlı'da geometrik desen çoğunlukla kündekâri, taş ve kalem işinde.
- Parça ölçüsü: bir ailenin dolgu parçalarının kenarı o ailenin yıldız kenarına (ya da tam katına) eşit, açıları aile adımının katı olmalı; yoksa parçalar birbirine oturmaz. 10'lu ailede kesin desen `build/hankin.mjs` (girih ongen + papyon, Hankin 54°) ile türetilir, seviyeleri `build/gen_levels10.mjs` üretir; parçaları yıldız, beşgen, papyon, `dortgen-10`. Setin fotoğraftan oranlanan diğer 10'lu parçaları (kalkanlar, çift ev, çentikli altıgen, ok ucu, uzun beşgen, yarım yıldız, beş köşeli yıldız) bu desende yok; 6'lı/12'li dolgular henüz düzeltilmedi (bkz. `docs/seviyeler.md` notu). Kullanıcı kararı: fotoğraf oranı yerine kesin geometri; 10'lu seviyeler fiziksel setle birebir değil.
- Performans ölçütü: 60 parçalı sahne orta sınıf Android tablette akıcı sürüklenmeli.
- Araştırma verisi: oyun `localStorage`'a oturum başına `{mode, level, attempts, seconds, completed}` yazar; `Ayarlar → Verileri dışa aktar` JSON verir. Ölçek çalışmasıyla eşleştirilecek.
