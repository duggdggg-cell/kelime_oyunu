const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname)); // index.html'i sunmak için

const kelimeler = [
"Elma","Bilgisayar","Masa","Futbol","Araba","Kedi","Deniz","Kalem","Telefon",
"Kitap","Ayakkabı","Bardak","Çanta","Saat","Gözlük","Köpek","Bisiklet","Şemsiye",
"Kalp","Yıldız","Bulut","Dağ","Nehir","Orman","Ev","Oda","Kapı","Pencere",
"Televizyon","Radio","Mikrofon","Buzdolabı","Fırın","Tencere","Tabak","Kaşık",
"Çatal","Yastık","Battaniye","Havlu","Makas","Defter","Silgi","Kurşun Kalem",
"Tüy Kalem","Kalemtraş","Tahta","Sandalye","Koltuk","Buz","Kum","Çiçek","Ağaç",
"Top","Raket","Ay","Güneş","Yaprak","Kuş","Balık","Yılan","Aslan","Kaplan",
"Fil","Zebra","Maymun","Kelebek","Arı","Karınca","Kuşkonmaz","Havuç","Domates",
"Patates","Soğan","Sarımsak","Peynir","Süt","Yoğurt","Ekmek","Makarna","Pilav",
"Çorap","Pantolon","Gömlek","Ceket","Mont","Şapka","Eldiven","Atkı","Çorba","Tatlı"
];

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
