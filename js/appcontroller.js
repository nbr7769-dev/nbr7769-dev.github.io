// App controler loads restaurant location json and lets you favorite places
// Uses Indexeddb to cache data and service worker for offline mode

let allLoc = [];
let currentV = 'main';

// SW registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./serviceworker.js')
            .then(reg => console.log('SW registered'))
            .catch(e => console.error('SW error:', e));
    });
}

// Avoid document.createElement every time (DontRepeatYourself principle)
function el(tag, className, text) {
    const elem = document.createElement(tag);
    if (className) elem.className = className;
    if (text) elem.textContent = text;
    return elem;
}

// favorites in localStorage
function getFavorites() {
    const saved = localStorage.getItem('bbq-favorites');
    if (!saved) return [];
    return JSON.parse(saved);
}

function isFavorite(id) {
    return getFavorites().includes(id);
}

function toggleFavorite(id) {
    let favs = getFavorites();
    
    if (favs.includes(id)) {
        favs = favs.filter(fid => fid !== id);
    } else {
        favs.push(id);
    }
    
    localStorage.setItem('bbq-favorites', JSON.stringify(favs));
}

function buildCard(location) {
    const card = el('div', 'location-card');
    card.dataset.id = location.id;
    
    const image = el('div', 'card-image');
    image.style.backgroundImage = `url('${location.image}')`;
    
    const content = el('div', 'card-content');

    const head = el('div', 'card-head');
    head.appendChild(el('h3', 'card-title', location.name));
    head.appendChild(el('span', 'card-rate', `★ ${location.rating}`));
    content.appendChild(head);

    content.appendChild(el('p', 'card-category', location.category));
    content.appendChild(el('p', 'card-desc', location.description));

    const foot = el('div', 'card-foot');
    foot.appendChild(el('span', 'card-price', location.priceRange));
    foot.appendChild(el('span', 'card-specialty', location.specialty));
    content.appendChild(foot);

    card.appendChild(image);
    card.appendChild(content);
    
    card.addEventListener('click', () => showDetails(location.id));
    
    return card;
}

function displayLocations(locations, container) {
    container.innerHTML = '';
    
    if (locations.length === 0) {
        container.appendChild(el('p', 'empty-message', 'No locations available'));
        return;
    }
    
    locations.forEach(loc => {
        container.appendChild(buildCard(loc));
    });
}

async function showDetails(locationId) {
    const loc = await getLocationById(locationId);
    
    if (!loc) {
        console.error('Location not found');
        changeView('main');
        return;
    }
    
    const maincontainer = document.getElementById('detail-content');
    maincontainer.innerHTML = '';
    
    const bImage = el('div', 'detail-image');
    bImage.style.backgroundImage = `url('${loc.image}')`;
    
    const info = el('div', 'detail-info');
    
    // top part head with name and fav button
    const head = el('div', 'detail-head');
    const titlesection = el('div');
    titlesection.appendChild(el('h2', 'detail-title', loc.name));
    titlesection.appendChild(el('p', 'detail-category', loc.category));
    
    const fav = el('button', 'favorite-button');
    fav.dataset.id = loc.id;
    if (isFavorite(loc.id)) {
        fav.textContent = '♥︎';
        fav.classList.add('favorited');
    } else {
        fav.textContent = '♡';
    }
    
    head.appendChild(titlesection);
    head.appendChild(fav);
    
    const ratingsection = el('div', 'detail-rate');
    ratingsection.appendChild(el('span', 'rate-stars', `★ ${loc.rating}`));
    ratingsection.appendChild(el('span', 'detail-price', loc.priceRange));
    
    info.appendChild(head);
    info.appendChild(ratingsection);
    info.appendChild(el('p', 'detail-desc', loc.description));
    
    // addresses
    const locationSection = el('div', 'detail-section');
    locationSection.appendChild(el('h3', 'section-title', '⚲ Location'));
    locationSection.appendChild(el('p', 'highlight', loc.address));
    info.appendChild(locationSection);
    
    // phone numbers
    const contactSection = el('div', 'detail-section');
    contactSection.appendChild(el('h3', 'section-title', ' Contact'));
    contactSection.appendChild(el('p', 'highlight', loc.phone));
    info.appendChild(contactSection);
    
    // hours
    const hourSection = el('div', 'detail-section');
    hourSection.appendChild(el('h3', 'section-title', '◴ Hours'));
    hourSection.appendChild(el('p', 'highlight', loc.hours));
    info.appendChild(hourSection);
    
    // specialties
    const specialtySection = el('div', 'detail-section');
    specialtySection.appendChild(el('h3', 'section-title', ' Specialty'));
    const specialtyText = el('p', 'highlight', loc.specialty);
    specialtySection.appendChild(specialtyText);
    info.appendChild(specialtySection);
    
    //Append last
    maincontainer.appendChild(bImage);
    maincontainer.appendChild(info);
    
    // handle favorite button click
    fav.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(loc.id);
        if (isFavorite(loc.id)) {
            fav.textContent = '♥︎';
            fav.classList.add('favorited');
        } else {
            fav.textContent = '♡';
            fav.classList.remove('favorited');
        }
    });
    
    changeView('detail');
}

function changeView(viewName) {
    // hide all trhe views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });
    
    // show the one I want
    const target = document.getElementById(`${viewName}-view`);
    if (target) {
        target.classList.add('active');
        currentV = viewName;
    }
    
    // update nav button styling
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (viewName === 'main') {
        const home = document.getElementById('nav-home');
        if (home) home.classList.add('active');
    } else if (viewName === 'favorites') {
        const fav = document.getElementById('nav-favorites');
        if (fav) fav.classList.add('active');
    }
}

function showFavorites() {
    const favids = getFavorites();
    const grid = document.getElementById('fav-grid');
    const empty = document.getElementById('empty-fav');
    
    if (favids.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
        grid.style.display = 'grid';
        
        const favorited = allLoc.filter(loc => favids.includes(loc.id));
        displayLocations(favorited, grid);
    }
    
    changeView('favorites');
}

async function loadData() {
    const hasdata = await hasLocations();
    
    if (hasdata) {
        allLoc = await getLocations();
        displayLocations(allLoc, document.getElementById('locations-grid'));
        document.getElementById('loading').style.display = 'none';
    } else {
        fetchLocations();
    }
}

function fetchLocations() {
    // try to use the service worker if it's ready
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        
        channel.port1.onmessage = async (event) => {
            if (event.data.type === 'DATA_FETCHED') {
                await storeLocations(event.data.data);
                allLoc = await getLocations();
                displayLocations(allLoc, document.getElementById('locations-grid'));
                document.getElementById('loading').style.display = 'none';
            } else {
                console.error('Error from SW:', event.data.error);
                // try fetch direct as backup
                fetchDirect();
            }
        };
        
        navigator.serviceWorker.controller.postMessage(
            { type: 'FETCH_DATA' },
            [channel.port2]
        );
    } else {
        // no SW available, fetch directly
        fetchDirect();
    }
}

// backup fetch method
async function fetchDirect() {
    try {
        const resp = await fetch('./locations.json');
        const data = await resp.json();
        
        await storeLocations(data.locations);
        allLoc = await getLocations();
        displayLocations(allLoc, document.getElementById('locations-grid'));
    } catch (err) {
        console.error('Fetch failed:', err);
        console.error('Could not load data');
    }
    
    document.getElementById('loading').style.display = 'none';
}

// setup when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    document.getElementById('nav-home').addEventListener('click', () => {
        changeView('main');
    });
    
    document.getElementById('nav-favorites').addEventListener('click', () => {
        showFavorites();
    });
    
    document.getElementById('back-to-list').addEventListener('click', () => {
        changeView('main');
    });
    
    document.getElementById('back-from-favorites').addEventListener('click', () => {
        changeView('main');
    });
});