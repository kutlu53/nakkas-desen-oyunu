# Nakkaş — İslam Sanatı Geometrik Desen Oyunu

Tarayıcıda çalışan, çevrimdışı oynanabilen eğitsel yapboz.

**Canlı:** https://kutlu53.github.io/nakkas-desen-oyunu/ · Depo: https://github.com/kutlu53/nakkas-desen-oyunu Ayrıntılar: `CLAUDE.md` (Claude Code için proje bağlamı), `docs/tasarim.md`, `docs/seviyeler.md`.

## Çalıştırma
Modüller `fetch` kullandığı için dosyayı doğrudan açmak yerine küçük bir sunucu gerekir:

```bash
npx serve .            # veya
python -m http.server 8080
```
Sonra `http://localhost:8080` (telefon/tabletten aynı ağdaki bilgisayarın IP'si ile).

## Testler
Geometri örnekleri `tests/geometry.tests.js` içinde; iki yoldan çalışır:

- Tarayıcı: `http://localhost:8080/tests/geometry.test.html`
- Komut satırı: `node tests/run-node.mjs`

## Parça verisini yeniden üretme
```bash
python build/gen_pieces.py
```
`data/pieces.json` ve `assets/pieces/*.svg` üretilir. Elle düzenleme; şekli değiştirmek için `gen_pieces.py` içindeki tanımı değiştir.

## Kalfa — Kur nasıl oynanır
- Parçayı kutudan tahtaya sürükle. Köşesi sahnedeki bir köşeye yaklaşınca yapışır ve kenarı hizalanacak şekilde aile adımıyla döner.
- Her paylaşılan köşede açılar toplanır: yeşil = 360 (tam), sarı = eksik (kaç derece açık kaldığı yazar), kırmızı = aşım (parça kutuya döner).
- Döndürme: sürüklerken **R** ya da "Döndür" düğmesi; tahtadaki parçayı çift tıklama.
- Klavye: kutudaki parçada Enter → ok tuşlarıyla taşı (Shift: büyük adım) → R döndür → Enter bırak → Esc vazgeç. Tahtadaki parçada Enter al, Delete kutuya gönder.
- Ortaokul profili: açı etiketleri sürekli açık, doğru parça kutuda parlar, ipucu hedefleri 4 sn gösterir. Lise profili: etiketler isteğe bağlı, kutuda başka ailelerden yanıltıcı parçalar.
- "Ötele ve kapla" seviyesinde kutuda **birim hücre** vardır; döndürülmez, yalnızca ötelenir. Kopyalar kafese (a = (2,0), b = (0,2)) oturunca seviye biter.

## Araştırma verisi
Her oturum `localStorage`'a `{ts, mode, family, level, difficulty, attempts, wrongFamilyAttempts, seconds, completed, hintsUsed}` yazar. Giriş ekranındaki **Verileri dışa aktar** JSON indirir. Sunucu yok; veri cihazda kalır.

## Durum
- [x] Parça geometrisi (27 parça, 4 aile), SVG'ler, iç açılar — `hac` yıldızla birebir örtüşen oranlara çekildi
- [x] Giriş ekranı + Parça atlası (`#atlas`)
- [x] `geometry.js`: snap, köşe açı toplamı, çakışma denetimi, kenar hizalı yerleşim çözücü, hedef eşleme, kafes
- [x] PWA iskeleti (manifest, service worker)
- [x] Kalfa / Kur modu — 8'li aile 3 seviye (`#kur`), iki zorluk profili, klavye desteği, araştırma logu
- [ ] Kalfa / Kur — 10'lu, 6'lı, 12'li seviyeler (parça oranları döşemeyle doğrulanmalı), "Bozuk çini" seviyesi
- [ ] Çırak / Tanı modu — `data/motifs.json`, görseller eklenecek
- [ ] Usta / Yarat modu — simetri aynası
- [ ] Ses, rozetler
