const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const kelimeler = [
  "Elma","Bilgisayar","Masa","Futbol","Araba","Kedi","Deniz","Kalem","Telefon",
  "Lamba","Saat","Kitap","Sandalye","Köpek","Çanta","Tencere","Bardak","Çiçek","Pencere",
  "Dağ","Nehir","Göl","Köprü","Yol","Otel","Hastane","Okul","Ders","Tahta",
  "Bilet","Para","Cüzdan","Anahtar","Gözlük","Kamera","Mikrofon","Laptop","Tablet","Kulaklık",
  "Bot","Ayakkabı","Elbise","Şapka","Mont","Atkı","Eldiven","Kazak","Pantolon","Çorap",
  "Müzik","Film","Dizi","Kitaplık","Resim","Fotoğraf","Tiyatro","Müzikali","Senaryo","Karikatür",
  "Pizza","Makarna","Çorba","Salata","Ekmek","Peynir","Tereyağı","Bal","Reçel","Süt",
  "Hediye","Kart","Zarf","Pul","Posta","Mesaj","Video","Tren","Uçak","Gemi"
];

let odalar = {};
let oylar = {};

io.on("connection", (socket) => {
  console.log("Bir oyuncu bağlandı:", socket.id);

  socket.on("odaKatıl", ({ odaKodu, isim }) => {
    socket.join(odaKodu);
    if (!odalar[odaKodu]) odalar[odaKodu] = [];
    if (!oylar[odaKodu]) oylar[odaKodu] = {};

    odalar[odaKodu].push({ id: socket.id, isim });
    io.to(odaKodu).emit("oyuncuListesi", odalar[odaKodu]);
  });

  socket.on("oyunuBaslat", (odaKodu) => {
    const oyuncular = odalar[odaKodu];
    if (!oyuncular) return;

    oylar[odaKodu] = {}; // oyları sıfırla

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

  // ✅ OYLAMA
  socket.on("oyVer", ({ odaKodu, hedefId }) => {
    if (!odalar[odaKodu]) return;

    if (!oylar[odaKodu]) oylar[odaKodu] = {};

    // oyuncunun oyunu güncellenir
    oylar[odaKodu][socket.id] = hedefId;

    // sayım
    let sayim = {};
    Object.values(oylar[odaKodu]).forEach(h => {
      if (h) sayim[h] = (sayim[h] || 0) + 1;
    });

    io.to(odaKodu).emit("oySonucu", { oylar: sayim });
  });

  // ✅ CHAT
  socket.on("mesajGonder", ({ odaKodu, isim, mesaj }) => {
    io.to(odaKodu).emit("mesajAl", { isim, mesaj, id: socket.id });
  });

  // ✅ Çıkış
  socket.on("disconnect", () => {
    for (let oda in odalar) {
      odalar[oda] = odalar[oda].filter(o => o.id !== socket.id);

      if (oylar[oda]) {
        delete oylar[oda][socket.id];
      }

      let sayim = {};
      Object.values(oylar[oda] || {}).forEach(h => {
        if (h) sayim[h] = (sayim[h] || 0) + 1;
      });

      io.to(oda).emit("oyuncuListesi", odalar[oda]);
      io.to(oda).emit("oySonucu", { oylar: sayim });
    }
  });
});

server.listen(3000, () => {
  console.log("Sunucu 3000 portunda çalışıyor...");
});
