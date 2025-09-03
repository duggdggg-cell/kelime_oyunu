const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Static dosyaları servis et
app.use(express.static(__dirname));

const kelimeler = [
  "Elma", "Bilgisayar", "Masa", "Futbol", "Araba", "Kedi", "Deniz", "Kalem", "Telefon",
  "Lamba", "Saat", "Kitap", "Sandalye", "Köpek", "Çanta", "Tencere", "Bardak", "Çiçek", "Pencere",
  "Dağ", "Nehir", "Göl", "Köprü", "Yol", "Otel", "Hastane", "Okul", "Ders", "Tahta",
  "Bilet", "Para", "Cüzdan", "Anahtar", "Gözlük", "Kamera", "Mikrofon", "Laptop", "Tablet", "Kulaklık",
  "Bot", "Ayakkabı", "Elbise", "Şapka", "Mont", "Atkı", "Eldiven", "Kazak", "Pantolon", "Çorap",
  "Müzik", "Film", "Dizi", "Kitaplık", "Resim", "Fotoğraf", "Tiyatro", "Müzikali", "Senaryo", "Karikatür",
  "Pizza", "Makarna", "Çorba", "Salata", "Ekmek", "Peynir", "Tereyağı", "Bal", "Reçel", "Süt",
  "Hediye", "Kart", "Zarf", "Pul", "Posta", "Mesaj", "Video", "Tren", "Uçak", "Gemi"
];

let odalar = {};
let oylar = {};

io.on("connection", (socket) => {
  console.log("Bir oyuncu bağlandı:", socket.id);

  socket.on("odaKatıl", ({ odaKodu, isim }) => {
    socket.join(odaKodu);
    if (!odalar[odaKodu]) odalar[odaKodu] = [];
    if (!oylar[odaKodu]) oylar[odaKodu] = {};

    // Aynı isimle katılımı engelle
    const isimVar = odalar[odaKodu].some(o => o.isim === isim);
    if (isimVar) {
      socket.emit("hata", "Bu isim zaten kullanılıyor!");
      return;
    }

    odalar[odaKodu].push({ id: socket.id, isim, oyVerdi: false });
    io.to(odaKodu).emit("oyuncuListesi", odalar[odaKodu]);
  });

  socket.on("oyunuBaslat", (odaKodu) => {
    const oyuncular = odalar[odaKodu];
    if (!oyuncular || oyuncular.length < 2) {
      socket.emit("hata", "Oyunu başlatmak için en az 2 oyuncu gerekiyor!");
      return;
    }

    // Tüm oyuncuların oy bilgisini sıfırla
    oyuncular.forEach(o => o.oyVerdi = false);
    oylar[odaKodu] = {};

    const kelime = kelimeler[Math.floor(Math.random() * kelimeler.length)];
    const impostorIndex = Math.floor(Math.random() * oyuncular.length);

    oyuncular.forEach((oyuncu, index) => {
      if (index === impostorIndex) {
        io.to(oyuncu.id).emit("rol", { rol: "IMPOSTER" });
      } else {
        io.to(oyuncu.id).emit("rol", { rol: "OYUNCU", kelime });
      }
    });

    io.to(odaKodu).emit("oyuncuListesi", oyuncular);
  });

  socket.on("oyVer", ({ odaKodu, hedefId }) => {
    if (!odalar[odaKodu]) return;
    
    const oyuncular = odalar[odaKodu];
    const oyuKullanan = oyuncular.find(o => o.id === socket.id);
    if (!oyuKullanan) return;

    // Önce bu oyuncunun önceki oyunu varsa temizle
    for (let hedef in oylar[odaKodu]) {
      if (oylar[odaKodu][hedef] && oylar[odaKodu][hedef].includes(socket.id)) {
        oylar[odaKodu][hedef] = oylar[odaKodu][hedef].filter(id => id !== socket.id);
        if (oylar[odaKodu][hedef].length === 0) {
          delete oylar[odaKodu][hedef];
        }
      }
    }

    // Yeni oyu kaydet
    if (hedefId && hedefId !== null) {
      if (!oylar[odaKodu][hedefId]) {
        oylar[odaKodu][hedefId] = [];
      }
      oylar[odaKodu][hedefId].push(socket.id);
      oyuKullanan.oyVerdi = true;
    } else {
      oyuKullanan.oyVerdi = false;
    }

    // Oy sayılarını hesapla
    const oySayilari = {};
    for (let hedef in oylar[odaKodu]) {
      oySayilari[hedef] = oylar[odaKodu][hedef].length;
    }

    io.to(odaKodu).emit("oyuncuListesi", oyuncular);
    io.to(odaKodu).emit("oySonucu", { oylar: oySayilari });
  });

  // CHAT sistemi
  socket.on("chatMesaj", ({ odaKodu, isim, mesaj }) => {
    io.to(odaKodu).emit("chatMesaj", { isim, mesaj });
  });

  socket.on("disconnect", () => {
    console.log("Bir oyuncu ayrıldı:", socket.id);
    for (let odaKodu in odalar) {
      odalar[odaKodu] = odalar[odaKodu].filter(o => o.id !== socket.id);
      
      // Oy bilgilerinden de çıkar
      for (let hedef in oylar[odaKodu]) {
        if (oylar[odaKodu][hedef]) {
          oylar[odaKodu][hedef] = oylar[odaKodu][hedef].filter(id => id !== socket.id);
          if (oylar[odaKodu][hedef].length === 0) {
            delete oylar[odaKodu][hedef];
          }
        }
      }
      
      io.to(odaKodu).emit("oyuncuListesi", odalar[odaKodu]);
      
      // Güncel oy sayılarını hesapla ve gönder
      const oySayilari = {};
      for (let hedef in oylar[odaKodu]) {
        oySayilari[hedef] = oylar[odaKodu][hedef].length;
      }
      io.to(odaKodu).emit("oySonucu", { oylar: oySayilari });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
