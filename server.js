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
  // 800 kelimeye kadar ekleyebilirsiniz
];

let odalar = {};             // odaKodu -> [{id, isim}]
let votesByVoter = {};       // odaKodu -> { voterId: targetId|null }

function tallyForRoom(odaKodu) {
  const sayim = {};
  const votes = votesByVoter[odaKodu] || {};
  Object.values(votes).forEach(targetId => {
    if (!targetId) return;
    sayim[targetId] = (sayim[targetId] || 0) + 1;
  });
  return sayim;
}

io.on("connection", (socket) => {
  console.log("Bir oyuncu bağlandı:", socket.id);

  socket.on("odaKatıl", ({ odaKodu, isim }) => {
    socket.join(odaKodu);

    if (!odalar[odaKodu]) odalar[odaKodu] = [];
    if (!votesByVoter[odaKodu]) votesByVoter[odaKodu] = {};

    odalar[odaKodu].push({ id: socket.id, isim });
    io.to(odaKodu).emit("oyuncuListesi", odalar[odaKodu]);
    io.to(odaKodu).emit("oySonucu", { sayim: tallyForRoom(odaKodu) });
  });

  socket.on("oyunuBaslat", (odaKodu) => {
    const oyuncular = odalar[odaKodu];
    if (!oyuncular || oyuncular.length === 0) return;

    // Oyları sıfırla
    votesByVoter[odaKodu] = {};
    io.to(odaKodu).emit("oySonucu", { sayim: {} });

    // Roller & kelime
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

  // Oy ver / oy geri al (hedefId null ise geri al)
  socket.on("oyVer", ({ odaKodu, hedefId }) => {
    if (!odalar[odaKodu]) return;

    // hedef geçerli mi?
    if (hedefId && !odalar[odaKodu].some(o => o.id === hedefId)) return;

    if (!votesByVoter[odaKodu]) votesByVoter[odaKodu] = {};
    votesByVoter[odaKodu][socket.id] = hedefId || null; // tek aktif oy

    const sayim = tallyForRoom(odaKodu);
    io.to(odaKodu).emit("oySonucu", { sayim });
  });

  socket.on("disconnect", () => {
    for (const oda of Object.keys(odalar)) {
      const onceki = odalar[oda].length;
      odalar[oda] = odalar[oda].filter(o => o.id !== socket.id);
      if (votesByVoter[oda]) {
        delete votesByVoter[oda][socket.id]; // oyuncunun oyu düşsün
      }
      if (odalar[oda].length !== onceki) {
        io.to(oda).emit("oyuncuListesi", odalar[oda]);
        io.to(oda).emit("oySonucu", { sayim: tallyForRoom(oda) });
      }
    }
  });
});

server.listen(3000, () => {
  console.log("Sunucu 3000 portunda çalışıyor...");
});
