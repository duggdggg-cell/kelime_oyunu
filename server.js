const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname)); // index.html'i sunmak için

const kelimeler = ["Elma", "Bilgisayar", "Masa", "Futbol", "Araba", "Kedi", "Deniz", "Kalem", "Telefon"];
let odalar = {};

io.on("connection", (socket) => {
  console.log("Bir oyuncu bağlandı:", socket.id);

  socket.on("odaKatıl", (odaKodu) => {
    socket.join(odaKodu);
    if (!odalar[odaKodu]) odalar[odaKodu] = [];
    odalar[odaKodu].push(socket.id);
    console.log(`${socket.id} ${odaKodu} odasına katıldı.`);
  });

  socket.on("oyunuBaslat", (odaKodu) => {
    const oyuncular = odalar[odaKodu];
    if (!oyuncular) return;

    const kelime = kelimeler[Math.floor(Math.random() * kelimeler.length)];
    const impostorIndex = Math.floor(Math.random() * oyuncular.length);

    oyuncular.forEach((id, index) => {
      if (index === impostorIndex) {
        io.to(id).emit("rol", { rol: "IMPOSTER" });
      } else {
        io.to(id).emit("rol", { rol: "OYUNCU", kelime });
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("Oyuncu ayrıldı:", socket.id);
    for (let oda in odalar) {
      odalar[oda] = odalar[oda].filter((id) => id !== socket.id);
    }
  });
});

server.listen(3000, () => {
  console.log("Sunucu 3000 portunda çalışıyor...");
});
