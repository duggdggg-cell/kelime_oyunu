const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname)); // index.html'i sunmak için

const kelimeler = [
"Abajur","Acı","Ada","Ağaç","Ahşap","Akşam","Alışveriş","Anahtar","Ananas","Arı",
"Armut","Asansör","Ayna","Ayı","Bahçe","Balon","Banka","Barış","Başka","Baykuş",
"Bazı","Bebek","Benzin","Bere","Bilet","Bilgi","Bina","Birlik","Boğa","Boş",
"Boy","Buz","Cam","Can","Cep","Çanta","Çay","Çekiç","Çiçek","Çikolata",
"Daire","Dalga","Defter","Delik","Deniz","Ders","Diş","Dolap","Domates","Dondurma",
"Düş","Dünya","El","Ekmek","Elektrik","Eller","Ev","Fener","Fırın","Futbol",
"Gazete","Gemi","Göz","Gözlük","Güneş","Hediye","Hız","Hobi","Hava","Hayvan",
"Işık","Islak","Işın","İnek","İp","İş","Jambon","Jel","Kalem","Kale",
"Kamera","Kamp","Kapı","Kar","Karpuz","Kart","Kaşık","Kavanoz","Kayak","Kayısı",
"Kedi","Kelime","Kertenkele","Kırmızı","Kış","Klavye","Köprü","Köpek","Kum","Kupa",
"Kurabiye","Kuş","Lamba","Lastik","Lezzet","Limuzin","Limon","Lira","Makas","Masa",
"Meyve","Mikrofon","Mutfak","Müzik","Nane","Nehir","Nesne","Not","Numara","Oda",
"Okyanus","Olta","Orman","Oyun","Paket","Palto","Pantolon","Patates","Pencere","Pil",
"Pilav","Pijama","Pizza","Plaj","Poşet","Radyo","Raket","Renk","Reçel","Robot",
"Saat","Sandık","Sandalye","Sarı","Sarf","Sebze","Sepet","Şemsiye","Siyah","Sinek",
"Süt","Şeker","Taksi","Tatlı","Telefon","Televizyon","Top","Toprak","Torba","Trafik",
"Tren","Tütün","Uçak","Uçurtma","Uzay","Üzüm","Vale","Valiz","Varış","Vazo",
"Video","Yapboz","Yaprak","Yastık","Yaş","Yemek","Yol","Yumurta","Zebra","Zeytin",
"Zil","Zincir","Zor","Zümrüt","Araba","Aslan","At","Ayı","Balık","Biber",
"Bisiklet","Bomba","Böcek","Börek","Cam","Ceket","Çekmece","Çorap","Çorba","Defter",
"Dondurma","Ekmek","Elektronik","Fırın","Fırtına","Gaz","Gitar","Göz","Gözlük","Hediye",
"Helikopter","Hobi","Hücre","Işık","İnek","İp","İş","Jambon","Jel","Kalem",
"Kale","Kamera","Kamp","Kapı","Kar","Karpuz","Kart","Kaşık","Kavanoz","Kayak",
"Kedi","Kertenkele","Kırmızı","Kış","Klavye","Köprü","Köpek","Kum","Kupa","Kurabiye",
"Kuş","Lamba","Lastik","Lezzet","Limuzin","Limon","Lira","Makas","Masa","Meyve",
"Mikrofon","Mutfak","Müzik","Nane","Nehir","Nesne","Not","Numara","Oda","Okyanus",
"Olta","Orman","Oyun","Paket","Palto","Pantolon","Patates","Pencere","Pil","Pilav",
"Pijama","Pizza","Plaj","Poşet","Radyo","Raket","Renk","Reçel","Robot","Saat",
"Sandık","Sandalye","Sarı","Sarf","Sebze","Sepet","Şemsiye","Siyah","Sinek","Süt",
"Şeker","Taksi","Tatlı","Telefon","Televizyon","Top","Toprak","Torba","Trafik","Tren",
"Tütün","Uçak","Uçurtma","Uzay","Üzüm","Vale","Valiz","Varış","Vazo","Video",
"Yapboz","Yaprak","Yastık","Yaş","Yemek","Yol","Yumurta","Zebra","Zeytin","Zil",
"Zincir","Zor","Zümrüt","Ayakkabı","Bardak","Banka","Barış","Baykuş","Bebek","Bilgisayar",
"Bina","Bulut","Dağ","Deniz","Domates","Dondurma","Elma","Ekmek","Elektrik","Ev",
"Fener","Fırın","Futbol","Gazete","Gemi","Göz","Gözlük","Güneş","Hediye","Hız",
"Hobi","Hava","Hayvan","Işık","Islak","İş","Kalem","Kale","Kamera","Kapı",
"Kar","Karpuz","Kart","Kaşık","Kavanoz","Kayak","Kedi","Kelime","Kertenkele","Kırmızı",
"Kış","Klavye","Köprü","Köpek","Kum","Kupa","Kurabiye","Kuş","Lamba","Lastik",
"Lezzet","Limuzin","Limon","Lira","Makas","Masa","Meyve","Mikrofon","Mutfak","Müzik",
"Nane","Nehir","Nesne","Not","Numara","Oda","Okyanus","Olta","Orman","Oyun",
"Paket","Palto","Pantolon","Patates","Pencere","Pil","Pilav","Pijama","Pizza","Plaj",
"Poşet","Radyo","Raket","Renk","Reçel","Robot","Saat","Sandık","Sandalye","Sarı",
"Sarf","Sebze","Sepet","Şemsiye","Siyah","Sinek","Süt","Şeker","Taksi","Tatlı",
"Telefon","Televizyon","Top","Toprak","Torba","Trafik","Tren","Tütün","Uçak","Uçurtma",
"Uzay","Üzüm","Vale","Valiz","Varış","Vazo","Video","Yapboz","Yaprak","Yastık",
"Yaş","Yemek","Yol","Yumurta","Zebra","Zeytin","Zil","Zincir","Zor","Zümrüt"
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
