// Testowa baza danych sal i czujników
// W przyszłości ten plik może być generowany lub nadpisywany przez backend w Pythonie

const rooms = [
    {
        id: "107",
        name: "Sala 107 (Wykładowa)",
        capacity: 60,
        occupancy: 0.2, // 20% - 12 osób
        noise: 0.15,    // Cichy szum
        dynamics: 0.1,  // Niski ruch
        baseNoise: 0.15,
        baseOccupancy: 0.2,
        baseDynamics: 0.1
    },
    {
        id: "329",
        name: "Sala 329 (Projektowa)",
        capacity: 30,
        occupancy: 0.6, // 60% - 18 osób
        noise: 0.55,    // Umiarkowany gwar rozmów
        dynamics: 0.45, // Średni ruch
        baseNoise: 0.55,
        baseOccupancy: 0.6,
        baseDynamics: 0.45
    },
    {
        id: "bibl",
        name: "Salki w Bibliotece",
        capacity: 15,
        occupancy: 0.1, // 10% - 1-2 osoby
        noise: 0.05,    // Niemal idealna cisza
        dynamics: 0.05, // Bardzo statycznie
        baseNoise: 0.05,
        baseOccupancy: 0.1,
        baseDynamics: 0.05
    },
    {
        id: "112",
        name: "Komputery 112 (Laboratorium)",
        capacity: 24,
        occupancy: 0.5, // 80% - 19 osób
        noise: 0.2,     // Cichy gwar, szum komputerów
        dynamics: 0.2,  // Niski ruch
        baseNoise: 0.4,
        baseOccupancy: 0.8,
        baseDynamics: 0.3
    },
    {
        id: "jetbrains",
        name: "Strefa JETBRAINS",
        capacity: 25,
        occupancy: 0.6, // 40% - 48 osób
        noise: 0.7,     // Głośno, gwar kawiarniany
        dynamics: 0.8,  // Wysoki ruch (przejście)
        baseNoise: 0.7,
        baseOccupancy: 0.4,
        baseDynamics: 0.8
    },
    {
        id: "kanapy_dolne",
        name: "Strefa bilardowa",
        capacity: 15,
        occupancy: 0.4, // 40% - 48 osób
        noise: 0.8,     // Głośno, gwar kawiarniany
        dynamics: 0.9,  // Wysoki ruch (przejście)
        baseNoise: 0.7,
        baseOccupancy: 0.4,
        baseDynamics: 0.8
    }
];
