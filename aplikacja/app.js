// Dane sal ładowane są z osobnego pliku data.js

// Active State
let activeWeights = { O: 0.8, S: 1.0, D: 0.7 };
let activeQuery = { O: 0.1, S: 0.0, D: 0.1 };
let selectedAnswers = { q1: 'A', q2: 'A', q3: 'A' };
let activeProfile = 'badacz';

// DOM Elements
const rocchioLogs = document.getElementById('rocchio-logs');
const searchResultsList = document.getElementById('search-results-list');
const monitorList = document.getElementById('monitor-list');

// Init application on load
window.onload = () => {
    initSliders();
    updateUIFromState();
    renderMonitoring();
    setupScrollSpy();
};

// Add entry to logging terminal
function addLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerText = `[${time}] ${message}`;
    if (rocchioLogs) {
        rocchioLogs.appendChild(entry);
        rocchioLogs.scrollTop = rocchioLogs.scrollHeight;
    }
}

function clearLogs() {
    if (rocchioLogs) {
        rocchioLogs.innerHTML = '';
        addLog("Zresetowano terminal algorytmów.", "system");
    }
}

// Render dynamic room sliders (sensor outputs)
function initSliders() {
    const sensorRoomsContainer = document.getElementById('sensor-rooms');
    if (!sensorRoomsContainer) return;
    sensorRoomsContainer.innerHTML = '';
    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'sensor-room-card';
        card.id = `sensor-card-${room.id}`;
        card.innerHTML = `
            <div class="room-card-header">
                <h4>${room.name}</h4>
                <span class="room-cap-badge">Max: ${room.capacity} os.</span>
            </div>
            <div class="sliders-group">
                <div class="slider-container">
                    <div class="slider-label-row">
                        <span>Obłożenie (O):</span>
                        <span class="slider-value" id="val-${room.id}-O">${Math.round(room.occupancy * room.capacity)} os (${Math.round(room.occupancy * 100)}%)</span>
                    </div>
                    <input type="range" class="tech-range" min="0" max="1" step="0.05" value="${room.occupancy}" 
                        oninput="onSensorChange('${room.id}', 'O', this.value)">
                </div>
                <div class="slider-container">
                    <div class="slider-label-row">
                        <span>Szum (S):</span>
                        <span class="slider-value" id="val-${room.id}-S">${getNoiseLevelString(room.noise)}</span>
                    </div>
                    <input type="range" class="tech-range" min="0" max="1" step="0.05" value="${room.noise}" 
                        oninput="onSensorChange('${room.id}', 'S', this.value)">
                </div>
                <div class="slider-container">
                    <div class="slider-label-row">
                        <span>Dynamika (D):</span>
                        <span class="slider-value" id="val-${room.id}-D">${getDynamicsString(room.dynamics)}</span>
                    </div>
                    <input type="range" class="tech-range" min="0" max="1" step="0.05" value="${room.dynamics}" 
                        oninput="onSensorChange('${room.id}', 'D', this.value)">
                </div>
            </div>
        `;
        sensorRoomsContainer.appendChild(card);
    });
}

function getNoiseLevelString(val) {
    const dB = Math.round(30 + val * 55); // 30 dB - 85 dB
    let rating = "Cisza";
    if (val > 0.8) rating = "Hałas uciążliwy";
    else if (val > 0.5) rating = "Głośno";
    else if (val > 0.2) rating = "Średni gwar";
    return `${dB} dB (${rating})`;
}

function getDynamicsString(val) {
    let rating = "Statycznie";
    if (val > 0.7) rating = "Wysoki ruch";
    else if (val > 0.35) rating = "Umiarkowany ruch";
    return `${Math.round(val * 10)}/10 (${rating})`;
}

// Handle slider movements representing physical sensor updates
function onSensorChange(roomId, feature, value) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    room[feature] = parseFloat(value);
    
    // Update value label
    const label = document.getElementById(`val-${roomId}-${feature}`);
    if (label) {
        if (feature === 'O') {
            label.innerText = `${Math.round(room.occupancy * room.capacity)} os (${Math.round(room.occupancy * 100)}%)`;
        } else if (feature === 'S') {
            label.innerText = getNoiseLevelString(room.noise);
        } else if (feature === 'D') {
            label.innerText = getDynamicsString(room.dynamics);
        }
    }
    
    addLog(`Sensor ${feature === 'O' ? 'radaru mmWave (obłożenie)' : feature === 'S' ? 'mikrofonu (szum)' : 'radaru mmWave (dynamika)'} w [${room.name}] zgłosił nowy odczyt: ${value}`, "info");
    
    // Recalculate spatial search and animate changes
    runSearch();
}

// Handle clicking Profile Preset Buttons
function selectPresetProfile(profileType) {
    activeProfile = profileType;
    
    // Toggle active classes on profile buttons
    document.querySelectorAll('.btn-profile').forEach(btn => btn.classList.remove('active'));
    const targetBtn = document.getElementById(`prof-${profileType}`);
    if (targetBtn) targetBtn.classList.add('active');
    
    if (profileType === 'badacz') {
        activeWeights = { O: 0.8, S: 1.0, D: 0.7 };
        activeQuery = { O: 0.1, S: 0.0, D: 0.1 };
        selectedAnswers = { q1: 'A', q2: 'A', q3: 'A' };
        addLog("Wczytano gotowy model użytkownika: [Cicha nauka]. Parametryzacja optimal-focus.", "system");
    } else if (profileType === 'projektant') {
        activeWeights = { O: 0.3, S: 0.8, D: 0.4 };
        activeQuery = { O: 0.5, S: 0.6, D: 0.5 };
        selectedAnswers = { q1: 'B', q2: 'C', q3: 'B' };
        addLog("Wczytano gotowy model użytkownika: [Praca w grupie]. Parametryzacja maskowania rozmów.", "system");
    } else if (profileType === 'konsultant') {
        activeWeights = { O: 0.5, S: 0.3, D: 0.5 };
        activeQuery = { O: 0.4, S: 0.4, D: 0.4 };
        selectedAnswers = { q1: 'C', q2: 'B', q3: 'C' };
        addLog("Wczytano gotowy model użytkownika: [Relax]. Parametryzacja szybkiego dostępu.", "system");
    }
    
    updateUIFromState();
    showRecommendations();
}

// Handle clicking survey option cards
function selectOption(questionNum, optionId, weight, queryVal) {
    // Reset preset profiles highlight since we are custom tuning
    document.querySelectorAll('.btn-profile').forEach(btn => btn.classList.remove('active'));
    activeProfile = 'custom';
    
    selectedAnswers[`q${questionNum}`] = optionId;
    
    // Map answer directly to state
    if (questionNum === 1) {
        activeWeights.O = weight;
        activeQuery.O = queryVal;
        addLog(`Zmieniono cel wizyty: Opcja ${optionId}. Waga O: ${weight}, Zapytanie O: ${queryVal}`, "info");
    } else if (questionNum === 2) {
        activeWeights.S = weight;
        activeQuery.S = queryVal;
        addLog(`Zmieniono wrażliwość na hałas: Opcja ${optionId}. Waga S: ${weight}, Zapytanie S: ${queryVal}`, "info");
    } else if (questionNum === 3) {
        activeWeights.D = weight;
        activeQuery.D = queryVal;
        addLog(`Zmieniono tolerancję na ruch: Opcja ${optionId}. Waga D: ${weight}, Zapytanie D: ${queryVal}`, "info");
    }
    
    updateUIFromState();
    
    // Auto advance wizard
    setTimeout(() => {
        if (questionNum < 3) {
            goToStep(questionNum + 1);
        } else {
            showRecommendations();
        }
    }, 250);
}

function goToStep(stepNum) {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById(`step-${i}`);
        if (step) {
            step.style.display = (i === stepNum) ? 'flex' : 'none';
        }
    }
}

// Sync State variables into the HTML elements (survey visual active states)
function updateUIFromState() {
    for (let qNum = 1; qNum <= 3; qNum++) {
        const activeAns = selectedAnswers[`q${qNum}`];
        ['A', 'B', 'C'].forEach(opt => {
            const btn = document.getElementById(`opt-${qNum}-${opt}`);
            if (btn) {
                if (opt === activeAns) {
                    btn.classList.add('selected');
                } else {
                    btn.classList.remove('selected');
                }
            }
        });
    }
}

// Weighted Euclidean Distance Search & Recommendation Engine
function runSearch() {
    const results = rooms.map(room => {
        // Mathematical weighted Euclidean distance
        const d_sq = activeWeights.O * Math.pow(activeQuery.O - room.occupancy, 2) +
                     activeWeights.S * Math.pow(activeQuery.S - room.noise, 2) +
                     activeWeights.D * Math.pow(activeQuery.D - room.dynamics, 2);
        
        const distance = Math.sqrt(d_sq);
        
        // Custom Normalization to map weighted distance into a robust percentage (0% to 100%)
        const maxDist = Math.sqrt(activeWeights.O + activeWeights.S + activeWeights.D);
        const matchPercent = Math.max(0, Math.min(100, Math.round((1 - (distance / maxDist)) * 100)));
        
        return {
            room: room,
            distance: distance,
            matchPercent: matchPercent
        };
    });
    
    // Sort descending by matching percentage (best fits first)
    results.sort((a, b) => b.matchPercent - a.matchPercent);
    
    // Render search results
    renderRecommendations(results);
}

// Render the large circular matching gauge for the highest recommended room
function renderTopGauge(topResult) {
    const topMatchBadge = document.getElementById('top-room-match');
    const topNameLabel = document.getElementById('top-room-name');
    const outerRing = document.querySelector('.gauge-circle-outer');
    
    if (topResult && topMatchBadge && topNameLabel) {
        topMatchBadge.innerText = `${topResult.matchPercent}%`;
        topNameLabel.innerText = topResult.room.name;
        
        // Dynamically adjust conic gradient based on matching percentage!
        const percentVal = topResult.matchPercent;
        if (outerRing) {
            outerRing.style.background = `conic-gradient(
                var(--neon-green) 0%, 
                var(--emerald-match) ${percentVal * 0.6}%, 
                #0284c7 ${percentVal}%, 
                rgba(255, 255, 255, 0.05) ${percentVal}%,
                rgba(255, 255, 255, 0.05) 100%
            )`;
        }
    } else if (topMatchBadge && topNameLabel) {
        topMatchBadge.innerText = `--%`;
        topNameLabel.innerText = "Brak dopasowania";
    }
}

// Renders the structural 2D Floor Plan Minimap dynamically
function renderMinimap(results) {
    const minimapContainer = document.getElementById('minimap-container');
    if (!minimapContainer) return;
    minimapContainer.innerHTML = '';
    
    // Structural layout definition representing rooms on the floor plan
    const gridLayout = [
        { id: "107", style: "grid-column: 1; grid-row: 1;", shortName: "107" },
        { id: "bibl", style: "grid-column: 3; grid-row: 1;", shortName: "Bibl." },
        { id: "kor3", style: "grid-column: 1 / 4; grid-row: 2;", shortName: "Korytarz" },
        { id: "112", style: "grid-column: 1; grid-row: 3;", shortName: "Lab 112" },
        { id: "329", style: "grid-column: 3; grid-row: 3;", shortName: "329" }
    ];
    
    gridLayout.forEach(gridItem => {
        const matchRes = results.find(res => res.room.id === gridItem.id);
        if (!matchRes) return;
        
        let matchClass = 'map-high';
        if (matchRes.matchPercent < 45) matchClass = 'map-low';
        else if (matchRes.matchPercent < 75) matchClass = 'map-med';
        
        const block = document.createElement('div');
        block.className = `map-room-block ${matchClass}`;
        block.setAttribute('style', gridItem.style);
        block.setAttribute('onclick', `scrollToRoomCard('${gridItem.id}')`);
        
        if (gridItem.id === 'kor3') {
            block.className = `map-corridor ${matchClass}`;
            block.innerHTML = `<span>${gridItem.shortName} (${matchRes.matchPercent}%)</span>`;
        } else {
            block.innerHTML = `
                <h5>${gridItem.shortName}</h5>
                <span>${matchRes.matchPercent}%</span>
            `;
        }
        minimapContainer.appendChild(block);
    });
}

// Interactive tap to scroll/focus room card
function scrollToRoomCard(roomId) {
    addLog(`Wybrano salę [${roomId}] z planu 2D. Wyszukiwanie szczegółów...`, "info");
    
    // First, make sure we are on the recommendations screen tab!
    switchToTab('recommendations');
    
    const targetCard = document.getElementById(`rec-card-${roomId}`);
    if (targetCard) {
        setTimeout(() => {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Pulse effect
            targetCard.style.boxShadow = `0 0 15px var(--neon-green)`;
            targetCard.style.borderColor = `var(--neon-green)`;
            setTimeout(() => {
                targetCard.style.boxShadow = '';
                targetCard.style.borderColor = '';
            }, 1200);
        }, 100);
    }
}

// Renders the sorted matching rooms list
function renderRecommendations(results) {
    if (!searchResultsList) return;
    searchResultsList.innerHTML = '';
    
    results.forEach((res, index) => {
        const room = res.room;
        const card = document.createElement('div');
        card.id = `search-card-${room.id}`;
        
        let matchClass = 'match-high';
        if (res.matchPercent < 45) matchClass = 'match-low';
        else if (res.matchPercent < 75) matchClass = 'match-med';
        
        card.className = `rec-card`;
        card.style.animationDelay = `${index * 0.05}s`;
        
        card.innerHTML = `
            <div class="rec-card-main">
                <div class="rec-room-info">
                    <h4>${room.name}</h4>
                </div>
                <div class="rec-match-badge ${matchClass}">${res.matchPercent}%</div>
            </div>
            
            <div class="rec-features">
                <div class="rec-feat-col">
                    <span class="rec-feat-label">Zajętość</span>
                    <div class="rec-feat-bar-container">
                        <div class="rec-feat-bar" style="width: ${room.occupancy * 100}%; background-color: ${room.occupancy > 0.75 ? '#f87171' : '#a3e635'};"></div>
                    </div>
                </div>
                <div class="rec-feat-col">
                    <span class="rec-feat-label">Szum</span>
                    <div class="rec-feat-bar-container">
                        <div class="rec-feat-bar" style="width: ${room.noise * 100}%; background-color: ${room.noise > 0.65 ? '#f87171' : '#facc15'};"></div>
                    </div>
                </div>
                <div class="rec-feat-col">
                    <span class="rec-feat-label">Dynamika</span>
                    <div class="rec-feat-bar-container">
                        <div class="rec-feat-bar" style="width: ${room.dynamics * 100}%; background-color: ${room.dynamics > 0.65 ? '#f87171' : '#10b981'};"></div>
                    </div>
                </div>
            </div>
        `;
        
        searchResultsList.appendChild(card);
    });
}

// Renders the monitoring list of all rooms
function renderMonitoring() {
    if (!monitorList) return;
    monitorList.innerHTML = '';
    
    // Pokaż wszystkie sale posortowane alfabetycznie
    const sortedRooms = [...rooms].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedRooms.forEach((room, index) => {
        const card = document.createElement('div');
        card.id = `monitor-card-${room.id}`;
        card.className = `monitor-card`;
        card.style.animationDelay = `${index * 0.05}s`;
        
        let occupancyPercent = Math.round(room.occupancy * 100);
        let statusColor = 'var(--emerald-match)';
        let statusText = 'Wolna';
        
        if (room.occupancy > 0.75) {
            statusColor = 'var(--crimson-red)';
            statusText = 'Zajęta';
        } else if (room.occupancy > 0.4) {
            statusColor = 'var(--amber-gold)';
            statusText = 'Umiarkowanie';
        }
        
        card.innerHTML = `
            <div class="monitor-info">
                <h4>${room.name}</h4>
                <div class="monitor-meta">
                    <span class="status-dot" style="background-color: ${statusColor};"></span>
                    <span style="color: ${statusColor}; font-weight: 700;">${statusText}</span>
                    <span class="meta-divider">•</span>
                    <span>Max: ${room.capacity} os.</span>
                </div>
            </div>
            <div class="monitor-stats">
                <div class="monitor-stat-row">
                    <span>Zajętość (${occupancyPercent}%)</span>
                    <span>${Math.round(room.occupancy * room.capacity)} os.</span>
                </div>
                <div class="monitor-bar-bg">
                    <div class="monitor-bar-fill" style="width: ${occupancyPercent}%; background-color: ${statusColor};"></div>
                </div>
            </div>
        `;
        
        monitorList.appendChild(card);
    });
}

// Rocchio Relevance Feedback Logic (Chapter 5 under the hood)
function triggerRocchioFeedback(roomId, issueFeature) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    // Highlight the target sensor card temporarily to simulate physical connection
    const sensorCard = document.getElementById(`sensor-card-${roomId}`);
    if (sensorCard) {
        sensorCard.style.boxShadow = `0 0 20px rgba(248, 113, 113, 0.4)`;
        sensorCard.style.borderColor = `#f87171`;
        setTimeout(() => {
            sensorCard.style.boxShadow = '';
            sensorCard.style.borderColor = '';
        }, 1500);
    }
    
    addLog(`STUDENT zgłosił skargę na [${room.name}]: Za ${issueFeature === 'S' ? 'GŁOŚNO' : 'TŁOCZNO'}!`, "danger");
    
    // 1. CROWDSOURCED SENSOR OVERRIDE (Dynamic transient index updating)
    if (issueFeature === 'S') {
        const oldVal = room.noise;
        room.noise = Math.min(1.0, room.noise + 0.3); // Raise noise level by +30% because students reported it!
        addLog(`[System-Indeks] Zaktualizowano transient szumu dla ${room.name}: ${oldVal.toFixed(2)} -> ${room.noise.toFixed(2)}`, "warning");
    } else {
        const oldVal = room.occupancy;
        room.occupancy = Math.min(1.0, room.occupancy + 0.25); // Raise occupancy level by +25%
        addLog(`[System-Indeks] Zaktualizowano transient zajętości dla ${room.name}: ${oldVal.toFixed(2)} -> ${room.occupancy.toFixed(2)}`, "warning");
    }
    
    // Synchronize simulator inputs/sliders in UI
    initSliders();
    
    // 2. ROCCHIO QUERY VECTOR RE-WEIGHTING
    const beta = 0.35; // penalty weight
    
    if (issueFeature === 'S') {
        const oldQ = activeQuery.S;
        activeQuery.S = Math.max(0.0, activeQuery.S - beta * room.noise);
        activeWeights.S = Math.min(1.0, activeWeights.S + 0.15);
        addLog(`[Algorytm-Rocchio] Dostosowano zapytanie dla Szumu: cel ${oldQ.toFixed(2)} -> ${activeQuery.S.toFixed(2)} (Waga S wzrosła do ${activeWeights.S.toFixed(2)})`, "success");
    } else {
        const oldQ = activeQuery.O;
        activeQuery.O = Math.max(0.0, activeQuery.O - beta * room.occupancy);
        activeWeights.O = Math.min(1.0, activeWeights.O + 0.15);
        addLog(`[Algorytm-Rocchio] Dostosowano zapytanie dla Zajętości: cel ${oldQ.toFixed(2)} -> ${activeQuery.O.toFixed(2)} (Waga O wzrosła do ${activeWeights.O.toFixed(2)})`, "success");
    }
    
    // Refresh UI selections
    updateUIFromState();
    
    // Rerun search to present immediate alternative rooms
    runSearch();
    
    addLog(`Rekomendacje zaktualizowano w locie. Zaproponowano alternatywne, lepiej dopasowane sale.`, "success");
}

// Mobile Tab Switching Logic
function switchToTab(tabId) {
    const targetScreen = document.getElementById(`screen-${tabId}`);
    if (targetScreen) {
        targetScreen.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    addLog(`Przewinięto do ekranu: [${tabId.toUpperCase()}]`, "info");
}

function showRecommendations() {
    document.getElementById('survey-view').style.display = 'none';
    document.getElementById('results-view').style.display = 'flex';
    runSearch();
    const profileScreen = document.getElementById('screen-profile');
    if(profileScreen) profileScreen.scrollTop = 0;
}

function hideRecommendations() {
    document.getElementById('results-view').style.display = 'none';
    document.getElementById('survey-view').style.display = 'flex';
    goToStep(1); // Optional: reset to first question when going back
}

function setupScrollSpy() {
    const container = document.getElementById('app-content-scroll');
    if (!container) return;

    // Use a small timeout to throttle scroll events slightly if needed, but modern browsers handle this well
    container.addEventListener('scroll', () => {
        const screens = document.querySelectorAll('.app-screen');
        let activeId = null;
        let minDistance = Infinity;
        
        screens.forEach(screen => {
            const rect = screen.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            // distance to center of container
            const distance = Math.abs((rect.left + rect.width/2) - (containerRect.left + containerRect.width/2));
            if (distance < minDistance) {
                minDistance = distance;
                activeId = screen.id.replace('screen-', '');
            }
        });
        
        if (activeId) {
            // Update navbar
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const targetNav = document.getElementById(`tab-${activeId}`);
            if (targetNav) targetNav.classList.add('active');
        }
    });
}

// Toggle slide-up diagnostic log panel
function toggleDiagnostic() {
    const panel = document.getElementById('diag-panel');
    if (panel) {
        panel.classList.toggle('active');
        addLog("Przełączono stan panelu diagnostycznego.", "system");
    }
}
