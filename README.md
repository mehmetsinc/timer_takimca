# Timer Web Application

Modern, responsive timer web uygulaması. Docker ile kolayca deploy edilebilir ve Nginx Proxy Manager ile entegre çalışır.

git ## Özellikler

- ⏱️ **İki Timer Modu:**
  - **Dakika Bazlı:** Belirli dakika sayısı için geri sayım
  - **Bitiş Zamanı:** Belirli bir saate kadar geri sayım

- 🎨 **Özelleştirilebilir Arka Plan:**
  - Dots pattern (nokta deseni)
  - URL'den resim yükleme
  - Yüklenen dosyalar (uploads klasörü)

- 💬 **Özel Mesaj:** Timer ekranında gösterilecek mesaj

- 🔒 **NPM Entegrasyonu:** Nginx Proxy Manager ile SSL sertifikası desteği

## Kurulum

### 1. Repository'yi Klonlayın

```bash
git clone <repository-url>
cd timer_takimca
```

### 2. Environment Dosyası Oluşturun

```bash
cp env.example .env
```

`.env` dosyasını düzenleyin (isteğe bağlı, varsayılan port 8082):

```env
PORT=8082
```

### 3. Docker ile Çalıştırın

```bash
docker-compose up -d --build
```

Container `timer_app` adıyla çalışacak ve port 8082'den erişilebilir olacak.

## Nginx Proxy Manager Kurulumu

1. NPM arayüzüne giriş yapın
2. **Proxy Hosts** > **Add Proxy Host** tıklayın
3. Aşağıdaki ayarları yapın:
   - **Domain Names:** `timer.takimca.tech`
   - **Scheme:** `http`
   - **Forward Hostname/IP:** `timer_app` (veya container'ın IP adresi)
   - **Forward Port:** `80`
   - **Block Common Exploits:** ✅
   - **Websockets Support:** ✅ (isteğe bağlı)
4. **SSL** sekmesine gidin:
   - **SSL Certificate:** Mevcut bir sertifika seçin veya yeni oluşturun
   - **Force SSL:** ✅
   - **HTTP/2 Support:** ✅
5. **Save** tıklayın

Artık `https://timer.takimca.tech` üzerinden erişebilirsiniz!

## Kullanım

### URL Parametreleri

Timer uygulaması URL query parametreleri ile çalışır:

```
https://timer.takimca.tech/?timer=07&wall=dots&msg=TRT Mola
```

### Parametreler

#### `timer` (Zorunlu)
Timer süresini belirler. İki format desteklenir:

- **Dakika Formatı:** `timer=07` → 7 dakika geri sayım
- **Bitiş Zamanı Formatı:** `timer=14:30` → 14:30'a kadar geri sayım

**Örnekler:**
- `timer=05` → 5 dakika
- `timer=30` → 30 dakika
- `timer=14:30` → 14:30'a kadar
- `timer=09:15` → 09:15'e kadar

#### `wall` (Opsiyonel, varsayılan: `dots`)
Arka plan görselini belirler:

- `wall=dots` → Nokta deseni (varsayılan)
- `wall=https://example.com/image.jpg` → URL'den resim
- `wall=/uploads/background.jpg` → Yüklenen dosya

**Arka Plan Dosyası Yükleme:**
1. `uploads` klasörü oluşturun (yoksa)
2. Resim dosyanızı bu klasöre koyun
3. URL'de `/uploads/dosya-adi.jpg` şeklinde kullanın

#### `msg` (Opsiyonel, varsayılan: `Timer`)
Timer ekranında gösterilecek mesaj:

- `msg=TRT Mola` → "TRT Mola" gösterilir
- `msg=Öğle%20Aras%C4%B1` → URL encoded: "Öğle Arası"
- `msg=Break Time` → "Break Time" gösterilir

### Kullanım Örnekleri

```bash
# 7 dakika, dots pattern, "TRT Mola" mesajı
https://timer.takimca.tech/?timer=07&wall=dots&msg=TRT Mola

# 15 dakika, özel resim, "Ara" mesajı
https://timer.takimca.tech/?timer=15&wall=https://example.com/bg.jpg&msg=Ara

# 14:30'a kadar, dots pattern, "Toplantı" mesajı
https://timer.takimca.tech/?timer=14:30&wall=dots&msg=Toplantı

# 30 dakika, yüklenen resim, "Mola" mesajı
https://timer.takimca.tech/?timer=30&wall=/uploads/background.png&msg=Mola
```

## Dosya Yapısı

```
timer_takimca/
├── index.html          # Ana HTML sayfası
├── styles.css          # CSS stilleri
├── script.js           # Timer mantığı
├── Dockerfile          # Docker image tanımı
├── docker-compose.yml  # Docker Compose konfigürasyonu
├── nginx.conf          # Nginx konfigürasyonu
├── env.example         # Environment değişkenleri örneği
├── README.md           # Bu dosya
└── uploads/            # Arka plan dosyaları için klasör (opsiyonel)
```

## Geliştirme

### Yerel Geliştirme

Docker olmadan test etmek için:

```bash
# Basit HTTP server ile
python3 -m http.server 8082
# veya
npx serve -p 8082
```

Sonra tarayıcıda `http://localhost:8082/?timer=05&wall=dots&msg=Test` adresine gidin.

### Container'ı Yeniden Build Etme

Değişiklik yaptıktan sonra:

```bash
docker-compose up -d --build
```

### Logları Görüntüleme

```bash
docker-compose logs -f timer
```

### Container'ı Durdurma

```bash
docker-compose down
```

## Teknik Detaylar

- **Web Server:** Nginx (Alpine)
- **Port:** 8082 (host) → 80 (container)
- **Domain:** timer.takimca.tech
- **SSL:** Nginx Proxy Manager tarafından yönetilir
- **Responsive:** Mobil ve desktop uyumlu

## Sorun Giderme

### Container çalışmıyor

```bash
# Container durumunu kontrol edin
docker ps -a

# Logları kontrol edin
docker-compose logs timer
```

### NPM'den erişilemiyor

1. Container'ın çalıştığını kontrol edin: `docker ps`
2. Port 8082'nin açık olduğunu kontrol edin: `netstat -tuln | grep 8082`
3. NPM'de Forward Hostname/IP'nin doğru olduğunu kontrol edin
4. NPM'de Forward Port'un `80` olduğunu kontrol edin (container içi port)

### Timer çalışmıyor

1. Tarayıcı konsolunu açın (F12) ve hataları kontrol edin
2. URL parametrelerinin doğru formatta olduğunu kontrol edin
3. `timer` parametresinin geçerli bir değer olduğunu kontrol edin

## Lisans

Bu proje özel kullanım içindir.

