// randomizer.js
// Symuluje działanie czujników, generując dane w czasie

function updateSensors(isMajor) {
    let changed = false;
    rooms.forEach(room => {
        // Zmieniamy tylko z pewnym prawdopodobieństwem (częstsze zmiany przy major)
        if (Math.random() > (isMajor ? 0.2 : 0.5)) {
            // Zajętość (O) - odszumione do pełnych osób
            let currentPeople = Math.round(room.occupancy * room.capacity);
            let deltaPeople = 0;
            
            if (isMajor) {
                // Znaczne zmiany: do 40% pojemności sali (min. 2 osoby)
                let maxChange = Math.max(2, Math.floor(room.capacity * 0.4));
                deltaPeople = Math.floor(Math.random() * (2 * maxChange + 1)) - maxChange;
            } else {
                // Nieznaczne zmiany: wejście lub wyjście 1 osoby
                deltaPeople = Math.random() > 0.5 ? 1 : -1;
            }
            
            let newPeople = Math.max(0, Math.min(room.capacity, currentPeople + deltaPeople));
            room.occupancy = newPeople / room.capacity;

            // Szum i dynamika - wciąż zmiennoprzecinkowe (odpowiadają natężeniu dB i ruchom)
            const maxDelta = isMajor ? 0.3 : 0.05;
            const deltaS = (Math.random() * 2 - 1) * maxDelta;
            const deltaD = (Math.random() * 2 - 1) * maxDelta;
            
            room.noise = Math.max(0, Math.min(1, room.noise + deltaS));
            room.dynamics = Math.max(0, Math.min(1, room.dynamics + deltaD));
            changed = true;
        }
    });

    if (changed) {
        if (typeof addLog === "function") {
            addLog(`[Sensor Node] Otrzymano nową paczkę danych pomiarowych (${isMajor ? 'istotne zmiany' : 'korekty'}).`, isMajor ? "warning" : "info");
        }
        // Odświeżenie widoków aplikacji
        if (typeof initSliders === "function") initSliders();
        if (typeof runSearch === "function") runSearch();
        if (typeof renderMonitoring === "function") renderMonitoring();
    }
}

// Co minutę (60 000 ms) - drobne zmiany
setInterval(() => {
    updateSensors(false);
}, 60000);

// Co godzinę (3 600 000 ms) - znaczne zmiany
setInterval(() => {
    updateSensors(true);
}, 3600000);

// Globalna funkcja do testowania w konsoli: forceRandomize(true/false)
window.forceRandomize = (isMajor) => updateSensors(isMajor);
