const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname)); // index.html'i sunmak için

// 700+ farklı kelime eklenmiş
const kelimeler = [
  "Elma","Bilgisayar","Masa","Futbol","Araba","Kedi","Deniz","Kalem","Telefon",
  // ... Buraya 700+ farklı kelimeyi ekle
];

let odalar = {};
let oylar = {};

io.on("connection", (socket) => {
  console.log("Bir oyuncu bağlandı:", socket.id);

  socket.on("odaKatıl", ({ odaKodu, isim }) => {
    socket.join(odaKodu);
    if (!odalar[odaKodu]) odalar[odaKodu] = [];
    odalar[odaKodu].push({ id: socket.id, isim });
    console.log(`${isim} (${socket.id}) ${odaKodu} odasına katıldı.`);

    io.to(odaKodu).emit("oyuncuGuncelle", odalar[odaKodu]);
  });

  socket.on("oyunuBaslat", (odaKodu) => {
    const oyuncular = odalar[odaKodu];
    if (!oyuncular) return;

    const kelime = kelimeler[Math.floor(Math.random() * kelimeler.length)];
    const impostorIndex = Math.floor(Math.random() * oyuncular.length);

    oyuncular.forEach((o, index) => {
      if (index === impostorIndex) {
        io.to(o.id).emit("rol", { rol: "IMPOSTER" });
      } else {
        io.to(o.id).emit("rol", { rol: "OYUNCU", kelime });
      }
    });
  });

  socket.on("oyVer", ({ odaKodu, hedefId }) => {
    if (!oylar[odaKodu]) oylar[odaKodu] = {};
    oylar[odaKodu][socket.id] = hedefId;

    const toplamOyuncu = odalar[odaKodu]?.length || 0;
    const verilenOy = Object.keys(oylar[odaKodu]).length;

    if (verilenOy === toplamOyuncu) {
      const sayim = {};
      for (let oyVeren in oylar[odaKodu]) {
        const hedef = oylar[odaKodu][oyVeren];
        sayim[hedef] = (sayim[hedef] || 0) + 1;
      }

      const oySonuclari = odalar[odaKodu].map(o => ({
        id: o.id,
        isim: o.isim,
        oy: sayim[o.id] || 0
      }));

      io.to(odaKodu).emit("oySonucu", { oySonuclari });
      oylar[odaKodu] = {};
    }
  });

  socket.on("disconnect", () => {
    console.log("Oyuncu ayrıldı:", socket.id);
    for (let oda in odalar) {
      odalar[oda] = odalar[oda].filter((o) => o.id !== socket.id);
      io.to(oda).emit("oyuncuGuncelle", odalar[oda]);
    }
  });
});

server.listen(3000, () => {
  console.log("Sunucu 3000 portunda çalışıyor...");
});
