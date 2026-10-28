# Nakkaş — İslam Sanatı Geometrik Desen Oyunu

Tarayıcıda çalışan, çevrimdışı oynanabilen eğitsel yapboz.

**Canlı:** https://kutlu53.github.io/nakkas-desen-oyunu/ · Depo: https://github.com/kutlu53/nakkas-desen-oyunu

Ayrıntılar: `CLAUDE.md` (Claude Code için proje bağlamı), `docs/tasarim.md`, `docs/seviyeler.md`.

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

Etkileşim testleri sentetik dokunuşlarla oynar: `tests/kur.smoke.html`, `tests/tani.smoke.html` (tarayıcıda aç ya da headless Chrome `--dump-dom`).

Tanı çizimleri ve 10'lu seviyeler üretilir: `node build/gen_tani.mjs`, `node build/gen_levels10.mjs` (elle düzenleme).

## Parça verisini yeniden üretme
```bash
python build/gen_pieces.py
```
`data/pieces.json` ve `assets/pieces/*.svg` üretilir. Elle düzenleme; şekli değiştirmek için `gen_pieces.py` içindeki tanımı değiştir.

## Kalfa — Kur nasıl oynanır
- Her aile **pergelle kur** hazırlığıyla başlar: bir noktadan ötekine sürükle (ya da iki noktaya sırayla dokun). Pergelde ilk nokta sivri uç, ikincisi kalemdir; cetvel iki noktayı birleştirir. "Usta göstersin" adımı kendisi çizer. Yıldız çizimden çıkar, sonra parçalarla kurulur.
- Parçayı kutudan tahtaya sürükle. Köşesi sahnedeki bir köşeye yaklaşınca yapışır ve kenarı hizalanacak şekilde aile adımıyla döner.
- Her paylaşılan köşede açılar toplanır: yeşil = 360 (tam), sarı = eksik (kaç derece açık kaldığı yazar), kırmızı = aşım (parça kutuya döner).
- Döndürme: sürüklerken **R** ya da "Döndür" düğmesi; tahtadaki parçayı çift tıklama.
- Klavye: kutudaki parçada Enter → ok tuşlarıyla taşı (Shift: büyük adım) → R döndür → Enter bırak → Esc vazgeç. Tahtadaki parçada Enter al, Delete kutuya gönder.
- Ortaokul profili: açı etiketleri sürekli açık, doğru parça kutuda parlar, ipucu hedefleri 4 sn gösterir. Lise profili: etiketler isteğe bağlı, kutuda başka ailelerden yanıltıcı parçalar.
- **Geçme çizgisi** düğmesi (ya da bitişteki "Çizgiye dönüştür") yıldızları birbirinin altından ve üstünden geçen bantlara çevirir; 8'li yıldız iki kareden örülür.
- **Aynala ve çoğalt** seviyesinde birim, Topkapı Tomarı'ndaki gibi çeyrek bir karedir. Araç seç (Aynala / Ötele), sonra birimin bir kenarına dokun. Çeyrek ötelenince desen kırılır ve geri alınır; aynalanınca birleşir.
- Bazı seviyeler bitince bir hikâye kartı açılır (kündekâri, Topkapı Tomarı). Metinler `data/motifs.json → cards`; sınıfta kullanmadan önce kaynaklardan doğrulayın.
- "Ötele ve kapla" seviyesinde kutuda **birim hücre** vardır; döndürülmez, yalnızca ötelenir. Kopyalar kafese (a = (2,0), b = (0,2)) oturunca seviye biter.

## Araştırma verisi
Her oturum `localStorage`'a `{ts, mode, family, level, difficulty, attempts, wrongFamilyAttempts, seconds, completed, hintsUsed}` yazar; pergel seviyesi ayrıca `wrongPicks` (yanlış çizim), aynalama seviyesi `brokenCopies` (kırık öteleme) ekler. Giriş ekranındaki **Verileri dışa aktar** JSON indirir. Sunucu yok; veri cihazda kalır.

## Durum
- [x] Parça geometrisi (28 parça, 4 aile), SVG'ler, iç açılar — `hac` yıldızla birebir örtüşen oranlara çekildi
- [x] Giriş ekranı + Parça atlası (`#atlas`)
- [x] `geometry.js`: snap, köşe açı toplamı, çakışma denetimi, kenar hizalı yerleşim çözücü, hedef eşleme, kafes
- [x] PWA iskeleti (manifest, service worker)
- [x] Kalfa / Kur modu — iki zorluk profili, klavye desteği, araştırma logu, geçme çizgisi görünümü, hikâye kartları
- [x] Kur · 8'li aile — pergel hazırlığı + 5 seviye (yıldız çevresi, yıldız-haç, ötele, aynala, bozuk çini)
- [x] Kur · 10'lu aile — pergel hazırlığı + 4 seviye; kesin girih deseninden (`build/hankin.mjs`), fiziksel setle birebir değil
- [ ] Kur · 6'lı ve 12'li aileler — önce dolgu parçalarının kenarı yıldız kenarına eşitlenmeli
- [ ] Kur · çapraz seviye (lise rütbe sınavı: 8'li ve 10'lu karışık kutu)
- [x] Çırak / Tanı modu — 7 motif; görseller kendi kesin çizimlerimiz (`data/tani.json`, `build/gen_tani.mjs`): yıldızı bul, köşe say, birim hücre, lisede "hangi aileyle yapılamaz?"
- [ ] Usta / Yarat modu — simetri aynası
- [ ] Ses, rozetler
