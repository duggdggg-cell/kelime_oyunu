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
  "Hediye","Kart","Zarf","Pul","Posta","Mesaj","Video","Tren","Uçak","Gemi",
  // … 800 kelime tamamlanacak
];

let odalar = {};
let oylar = {};

io.on("connection", (socket) => {
  console.log("Bir oyuncu bağlandı:", socket.id);

  socket.on("odaKatıl", ({ odaKodu, isim }) => {
    socket.join(odaKodu);
    if (!odalar[odaKodu]) odalar[odaKodu] = [];
    if (!oylar[odaKodu]) oylar[odaKodu] = {};

    odalar[odaKodu].push({ id: socket.id, isim, oyVerdi: false });
    io.to(odaKodu).emit("oyuncuListesi", odalar[odaKodu]);
    io.to(odaKodu).emit("oySonucu", { oylar: {} });
  });

  socket.on("oyunuBaslat", (odaKodu) => {
    const oyuncular = odalar[odaKodu];
    if (!oyuncular) return;

    // Her oy sıfırlanır
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

    io.to(odaKodu).emit("oyuncuListesi", odalar[odaKodu]);
    io.to(odaKodu).emit("oySonucu", { oylar: oylar[odaKodu] });
  });

  socket.on("oyVer", ({ odaKodu, hedefId }) => {
    if (!oylar[odaKodu]) oylar[odaKodu] = {};
    if (odalar[odaKodu].find(o => o.id === socket.id).oyVerdi) return; // bir kez oy kullanabilir

    oylar[odaKodu][hedefId] = (oylar[odaKodu][hedefId] || 0) + 1;
    odalar[odaKodu].find(o => o.id === socket.id).oyVerdi = true;

    io.to(odaKodu).emit("oySonucu", { oylar: oylar[odaKodu] });
  });

  socket.on("oyIptal", ({ odaKodu, hedefId }) => {
    if (!oylar[odaKodu]) return;
    const oyuncu = odalar[odaKodu].find(o => o.id === socket.id);
    if (!oylar[odaKodu][hedefId] || !oyuncu.oyVerdi) return;

    oylar[odaKodu][hedefId] = Math.max((oylar[odaKodu][hedefId] || 1) - 1, 0);
    oyuncu.oyVerdi = false;

    io.to(odaKodu).emit("oyuncuListesi", odalar[odaKodu]);
    io.to(odaKodu).emit("oySonucu", { oylar: oylar[odaKodu] });
  });

  socket.on("disconnect", () => {
    for (let oda in odalar) {
      odalar[oda] = odalar[oda].filter(o => o.id !== socket.id);
      delete oylar[oda]?.[socket.id];
      io.to(oda).emit("oyuncuListesi", odalar[oda]);
      io.to(oda).emit("oySonucu", { oylar: oylar[oda] || {} });
    }
  });
});

server.listen(3000, () => {
  console.log("Sunucu 3000 portunda çalışıyor...");
});
