// This is how you get the API locally, but in the deployment environment another approach is needed
// const apiKey = config.geoapifyApiKey; 
let apiKey
let map;
let markers = [];
let markerCluster;
let visibleResponses = new Set();
let legendVisible = true;
let clusteringEnabled = true;
let tempMarker;
let isFullscreen = false;

const colorMap = {
    'Appointment set': '%23008000',
    'Positive conversation (Detailed)': '%23add8e6',
    'Positive conversation (Initial)': '%230000ff',
    'Request to Return later - worth returning (AI powered feature)': '%23FFD700',
    'Request to Return later': '%23FFD700',
    'Not interested (Homeowner)': '%23ff0000',
    'Not interested (Renter)': '%23ffa500',
    'No answer - worth returning (AI powered feature)': '%23808080',
    'No answer': '%23808080',
    'Undefined': '%23ffffff'
};

// Function to fetch the API key
function fetchApiKey() {
    return fetch('/get-api-key')
        .then(response => response.json())
        .then(data => data.apiKey)
        .catch(error => {
            console.error('Error fetching API key:', error);
            return null;
        });
}


async function initMap() {
    const apiKey = await fetchApiKey();
    if (!apiKey) {
        console.error('API key not set');
        return;
    }
    
    map = L.map('map').setView([-28.0167, 153.4000], 11);

    const isRetina = L.Browser.retina;
    const baseUrl = `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`;
    const retinaUrl = `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}@2x.png?apiKey=${apiKey}`;

    L.tileLayer(isRetina ? retinaUrl : baseUrl, {
        attribution: 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | © OpenStreetMap <a href="https://www.openstreetmap.org/copyright" target="_blank">contributors</a>',
        maxZoom: 20,
        id: 'osm-bright',
        useCache: true,
        crossOrigin: true
    }).addTo(map);

    markerCluster = L.markerClusterGroup();
    map.addLayer(markerCluster);

    // Add custom legend control
    legendControl = L.control({position: 'bottomleft'});
    legendControl.onAdd = function (map) {
        let div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = '<h4>Prospect Response</h4>';
        div.id = 'map-legend';
        return div;
    };
    legendControl.addTo(map);

    // Add legend toggle button
    L.control.custom({
        position: 'bottomright',
        content: '<button onclick="toggleLegend()">Toggle Legend</button>',
        classes: 'legend-toggle-btn',
    }).addTo(map);

    // Add clustering toggle button
    L.control.custom({
        position: 'bottomright',
        content: '<button onclick="toggleClustering()" id="clustering-toggle">Disable Clustering</button>',
        classes: 'clustering-toggle-btn',
    }).addTo(map);

    // Add address search control
    L.control.custom({
        position: 'topright',
        content: `
            <div id="autocomplete-container" class="geocoder-container" style="
                margin-left: 10px;
                width: calc(100% - 20px);
                max-width: 400px;
            ">
                <input type="text" id="address" placeholder="Enter an address here" style="
                    width: 100%;
                    padding: 5px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 14px;
                    height: 30px;
                    margin-bottom: 10px;
                ">
                <input type="hidden" id="latitude">
                <input type="hidden" id="longitude">
            </div>
        `,
        classes: 'address-search-control'
    }).addTo(map);

    // Add full-screen toggle button
    const fullscreenControl = L.control({position: 'topleft'});
    fullscreenControl.onAdd = function(map) {
        const button = L.DomUtil.create('button', 'fullscreen-button');
        button.innerHTML = `
            <svg class="fullscreen-icon" width="24" height="24">
                <use xlink:href="#fullscreen-enter-icon"></use>
            </svg>
        `;
        button.onclick = toggleFullScreen;
        return button;
    };
    fullscreenControl.addTo(map);

    initAutocomplete();

    fetchMapData();
}

function fetchMapData() {
    fetch('/get_map_data')
        .then(response => response.json())
        .then(data => {
            createMarkers(data);
            createLegend();
        })
        .catch(error => console.error('Error fetching map data:', error));
}

async function createMarkers(data) {
    if (!apiKey) {
        apiKey = await fetchApiKey();
        if (!apiKey) {
            console.error('API key not set');
            return;
        }
    }
    data.forEach(item => {
        const lat = parseFloat(item.latitude);
        const lng = parseFloat(item.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
            const markerColor = getMarkerColor(item.prospect_response);
            const markerInnerImage = getMarkerInnerImage(item.ML_model_pred_worth_returning);
            const markerResponse = getMarkerResponse(item.prospect_response, item.ML_model_pred_worth_returning);
            const markerIcon = L.icon({
                iconUrl: `https://api.geoapify.com/v1/icon?size=xx-large&type=awesome&color=${markerColor}&icon=${markerInnerImage}&apiKey=${apiKey}`,
                iconSize: [31, 46],
                iconAnchor: [15.5, 42],
                popupAnchor: [0, -45]
            });

            const marker = L.marker([lat, lng], {icon: markerIcon}).bindPopup(() => createPopupContent(item));
            markers.push({marker: marker, response: markerResponse});
            markerCluster.addLayer(marker);
        }
    });
    map.addLayer(markerCluster);
}

function getMarkerColor(response) {
    return colorMap[response] || colorMap['Undefined'];
}

function getMarkerInnerImage(worthReturning) {
    if (worthReturning === "Yes") {
        return 'robot';
    }
    return 'sun';
}

function getMarkerResponse(response, worthReturning) {
    if (response === 'No answer') {
        return worthReturning === 'Yes' ? 'No answer - worth returning (AI powered feature)' : 'No answer';
    }
    else if (response === 'Request to Return later') {
        return worthReturning === 'Yes' ? 'Request to Return later - worth returning (AI powered feature)' : 'Request to Return later';
    }
    else {
        return response;
    }
}

function createPopupContent(item) {
    let content = '<div class="popup-content">';
    for (const [key, value] of Object.entries(item)) {
        if (key !== '_id' && value !== null && value !== undefined) {
            content += `<strong>${formatKey(key)}:</strong> ${formatValue(value)}<br>`;
        }
    }
    content += '</div>';
    return content;
}

const aiPoweredResponses = [
    'Request to Return later - worth returning (AI powered feature)',
    'No answer - worth returning (AI powered feature)'
];

let touchStartY = 0;
let touchEndY = 0;
const minSwipeDistance = 10; // minimum distance for a swipe to be registered

function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    touchEndY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
    if (Math.abs(touchEndY - touchStartY) > minSwipeDistance) {
        // This was a swipe, not a tap
        return;
    }
    const response = e.target.closest('.legend-item').dataset.response;
    toggleMarkers(response);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedToggleMarkers = debounce(toggleMarkers, 250);

function toggleMarkers(response) {
    if (visibleResponses.has(response)) {
        visibleResponses.delete(response);
    } else {
        visibleResponses.add(response);
    }

    updateMarkerVisibility();
    updateLegendItemState(response);
}

function updateMarkerVisibility() {
    if (clusteringEnabled) {
        markerCluster.clearLayers();
        markers.forEach(({marker, response}) => {
            if (visibleResponses.has(response)) {
                markerCluster.addLayer(marker);
            }
        });
    } else {
        markers.forEach(({marker, response}) => {
            if (visibleResponses.has(response)) {
                map.addLayer(marker);
            } else {
                map.removeLayer(marker);
            }
        });
    }
}

function updateLegendItemState(response) {
    const legendItem = document.querySelector(`.legend-item[data-response="${response}"]`);
    if (legendItem) {
        const checkbox = legendItem.querySelector('input[type="checkbox"]');
        const textSpan = legendItem.querySelector('.legend-text');
        const isVisible = visibleResponses.has(response);
        
        checkbox.checked = isVisible;
        textSpan.style.textDecoration = isVisible ? 'none' : 'line-through';
        textSpan.style.opacity = isVisible ? '1' : '0.5';
    }
}

function createLegend() {
    const legend = document.getElementById('map-legend');
    legend.innerHTML = '<h4>Prospect Response</h4>'; // Clear existing content

    Object.entries(colorMap).forEach(([key, color]) => {
        const row = document.createElement('div');
        row.className = 'legend-item';
        row.dataset.response = key;
        
        // Create SVG marker
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '36');
        svg.setAttribute('viewBox', '0 0 24 36');
        
        // Create pin shape
        const pin = document.createElementNS(svgNS, "path");
        pin.setAttribute('d', 'M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24c0-6.6-5.4-12-12-12z');
        pin.setAttribute('fill', `#${color.substring(3)}`);
        pin.setAttribute('stroke', '#000');
        pin.setAttribute('stroke-width', '1');
        
        // Create white circle
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute('cx', '12');
        circle.setAttribute('cy', '12');
        circle.setAttribute('r', '9');
        circle.setAttribute('fill', '#FFFFFF');
        
        // Create icon (sun or robot)
        const icon = document.createElementNS(svgNS, "use");
        icon.setAttribute('href', aiPoweredResponses.includes(key) ? '#robot-icon' : '#sun-icon');
        icon.setAttribute('width', '12');
        icon.setAttribute('height', '12');
        icon.setAttribute('x', '6');
        icon.setAttribute('y', '6');
        
        svg.appendChild(pin);
        svg.appendChild(circle);
        svg.appendChild(icon);
        
        row.appendChild(svg);
        row.innerHTML += `
            <span class="legend-text">${key}</span>
            <input type="checkbox" checked>
        `;
        legend.appendChild(row);

        // Add touch event listeners for mobile devices
        row.addEventListener('touchstart', handleTouchStart, false);
        row.addEventListener('touchmove', handleTouchMove, false);
        row.addEventListener('touchend', handleTouchEnd, false);

        // Add click event listener for desktop devices
        row.addEventListener('click', (e) => {
            if (e.target !== row.querySelector('input[type="checkbox"]')) {
                debouncedToggleMarkers(key);
            }
        });
    });
    initVisibleResponses();
}

function toggleLegend() {
    const legend = document.getElementById('map-legend');
    legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
}

function toggleClustering() {
    clusteringEnabled = !clusteringEnabled;
    
    if (clusteringEnabled) {
        // Enable clustering
        markers.forEach(({marker}) => {
            map.removeLayer(marker); // Remove all individual markers from the map
        });
        markerCluster.clearLayers();
        markers.forEach(({marker, response}) => {
            if (visibleResponses.has(response)) {
                markerCluster.addLayer(marker);
            }
        });
        map.addLayer(markerCluster);
    } else {
        // Disable clustering
        map.removeLayer(markerCluster);
        markers.forEach(({marker, response}) => {
            if (visibleResponses.has(response)) {
                map.addLayer(marker);
            }
        });
    }
    
    // Update button text
    const button = document.getElementById('clustering-toggle');
    button.textContent = clusteringEnabled ? 'Disable Clustering' : 'Enable Clustering';
}

function toggleFullScreen() {
    const mapElement = document.getElementById('map');
    const fullscreenButton = document.querySelector('.fullscreen-button');
    const fullscreenIcon = fullscreenButton.querySelector('.fullscreen-icon use');

    isFullscreen = !isFullscreen;

    if (isFullscreen) {
        if (mapElement.requestFullscreen) {
            mapElement.requestFullscreen();
        } else if (mapElement.mozRequestFullScreen) {
            mapElement.mozRequestFullScreen();
        } else if (mapElement.webkitRequestFullscreen) {
            mapElement.webkitRequestFullscreen();
        } else if (mapElement.msRequestFullscreen) {
            mapElement.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    updateFullscreenState();
}

function updateFullscreenState() {
    const mapElement = document.getElementById('map');
    const fullscreenButton = document.querySelector('.fullscreen-button');
    const fullscreenIcon = fullscreenButton.querySelector('.fullscreen-icon use');

    fullscreenIcon.setAttribute('xlink:href', isFullscreen ? '#fullscreen-exit-icon' : '#fullscreen-enter-icon');
    mapElement.classList.toggle('map-fullscreen', isFullscreen);

    // Force a resize event on the map to update its size
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }
}

document.addEventListener('fullscreenchange', updateFullscreenState);
document.addEventListener('webkitfullscreenchange', updateFullscreenState);
document.addEventListener('mozfullscreenchange', updateFullscreenState);
document.addEventListener('MSFullscreenChange', updateFullscreenState);

async function initVisibleResponses() {
    const apiKey = await fetchApiKey();
    if (!apiKey) {
        console.error('API key not set');
        return;
    }
    visibleResponses = new Set(Object.keys(colorMap));
}

function formatKey(key) {
    return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatValue(value) {
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }
    return value;
}

async function addressAutocomplete(containerElement, callback, options) {
    if (!apiKey) {
        apiKey = await fetchApiKey();
        if (!apiKey) {
            console.error('API key not set');
            return;
        }
    }
    const MIN_ADDRESS_LENGTH = 3;
    const DEBOUNCE_DELAY = 100;

    // Find the input element within the container
    const inputElement = containerElement.querySelector("#address");
    const inputContainerElement = containerElement;

    // Set placeholder for input element
    inputElement.setAttribute("placeholder", options.placeholder);

    // add input field clear button
    const clearButton = document.createElement("div");
    clearButton.classList.add("clear-button");
    addIcon(clearButton);
    clearButton.addEventListener("click", (e) => {
        e.stopPropagation();
        inputElement.value = '';
        callback(null);
        clearButton.classList.remove("visible");
        closeDropDownList();
        if (tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }
    });
    inputContainerElement.appendChild(clearButton);

    /* We will call the API with a timeout to prevent unnecessary API activity.*/
    let currentTimeout;

    /* Save the current request promise reject function. To be able to cancel the promise when a new request comes */
    let currentPromiseReject;

    /* Focused item in the autocomplete list. This variable is used to navigate with buttons */
    let focusedItemIndex;

    /* Current autocomplete items data (GeoJSON.Feature) */
    let currentItems;

    /* Process a user input: */
    inputElement.addEventListener("input", function(e) {
        const currentValue = this.value;

        /* Close any already open dropdown list */
        closeDropDownList();

        // Cancel previous timeout
        if (currentTimeout) {
            clearTimeout(currentTimeout);
        }

        // Cancel previous request promise
        if (currentPromiseReject) {
            currentPromiseReject({
                canceled: true
            });
        }

        if (!currentValue) {
            clearButton.classList.remove("visible");
        }

        // Show clearButton when there is a text
        clearButton.classList.add("visible");

        // Skip empty or short address strings
        if (!currentValue || currentValue.length < MIN_ADDRESS_LENGTH) {
            return false;
        }

        /* Call the Address Autocomplete API with a delay */
        currentTimeout = setTimeout(() => {
            currentTimeout = null;

            /* Create a new promise and send geocoding request */
            const promise = new Promise((resolve, reject) => {
                currentPromiseReject = reject;

                const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(currentValue)}&format=json&limit=5&apiKey=${apiKey}`;

                fetch(url)
                    .then(response => {
                        currentPromiseReject = null;

                        // check if the call was successful
                        if (response.ok) {
                            response.json().then(data => resolve(data));
                        } else {
                            response.json().then(data => reject(data));
                        }
                    });
            });

            promise.then((data) => {
                // here we get address suggestions
                currentItems = data.results;

                /*create a DIV element that will contain the items (values):*/
                const autocompleteItemsElement = document.createElement("div");
                autocompleteItemsElement.setAttribute("class", "autocomplete-items");
                inputContainerElement.appendChild(autocompleteItemsElement);

                /* For each item in the results */
                data.results.forEach((result, index) => {
                    /* Create a DIV element for each element: */
                    const itemElement = document.createElement("div");
                    /* Set formatted address as item value */
                    itemElement.innerHTML = result.formatted;
                    autocompleteItemsElement.appendChild(itemElement);

                    /* Set the value for the autocomplete text field and notify: */
                    itemElement.addEventListener("click", function(e) {
                        inputElement.value = currentItems[index].formatted;
                        callback(currentItems[index]);
                        /* Close the list of autocompleted values: */
                        closeDropDownList();

                        // Center map on selected location and add temporary marker
                        const lat = currentItems[index].lat;
                        const lon = currentItems[index].lon;
                        map.setView([lat, lon], 15);

                        if (tempMarker) {
                            map.removeLayer(tempMarker);
                        }
                        tempMarker = L.marker([lat, lon]).addTo(map);
                    });
                });

            }, (err) => {
                if (!err.canceled) {
                    console.log(err);
                }
            });
        }, DEBOUNCE_DELAY);
    });

    /* Add support for keyboard navigation */
    inputElement.addEventListener("keydown", function(e) {
        var autocompleteItemsElement = containerElement.querySelector(".autocomplete-items");
        if (autocompleteItemsElement) {
            var itemElements = autocompleteItemsElement.getElementsByTagName("div");
            if (e.keyCode == 40) {
                e.preventDefault();
                /*If the arrow DOWN key is pressed, increase the focusedItemIndex variable:*/
                focusedItemIndex = focusedItemIndex !== itemElements.length - 1 ? focusedItemIndex + 1 : 0;
                /*and and make the current item more visible:*/
                setActive(itemElements, focusedItemIndex);
            } else if (e.keyCode == 38) {
                e.preventDefault();

                /*If the arrow UP key is pressed, decrease the focusedItemIndex variable:*/
                focusedItemIndex = focusedItemIndex !== 0 ? focusedItemIndex - 1 : focusedItemIndex = (itemElements.length - 1);
                /*and and make the current item more visible:*/
                setActive(itemElements, focusedItemIndex);
            } else if (e.keyCode == 13) {
                /* If the ENTER key is pressed and value as selected, close the list*/
                e.preventDefault();
                if (focusedItemIndex > -1) {
                    closeDropDownList();
                }
            }
        } else {
            if (e.keyCode == 40) {
                /* Open dropdown list again */
                var event = document.createEvent('Event');
                event.initEvent('input', true, true);
                inputElement.dispatchEvent(event);
            }
        }
    });

    function setActive(items, index) {
        if (!items || !items.length) return false;

        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove("autocomplete-active");
        }

        /* Add class "autocomplete-active" to the active element*/
        items[index].classList.add("autocomplete-active");

        // Change input value and notify
        inputElement.value = currentItems[index].formatted;
        callback(currentItems[index]);
    }

    function closeDropDownList() {
        const autocompleteItemsElement = inputContainerElement.querySelector(".autocomplete-items");
        if (autocompleteItemsElement) {
            inputContainerElement.removeChild(autocompleteItemsElement);
        }

        focusedItemIndex = -1;
    }

    function addIcon(buttonElement) {
        const svgElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
        svgElement.setAttribute('viewBox', "0 0 24 24");
        svgElement.setAttribute('height', "24");

        const iconElement = document.createElementNS("http://www.w3.org/2000/svg", 'path');
        iconElement.setAttribute("d", "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z");
        iconElement.setAttribute('fill', 'currentColor');
        svgElement.appendChild(iconElement);
        buttonElement.appendChild(svgElement);
    }

    /* Close the autocomplete dropdown when the document is clicked. 
      Skip, when a user clicks on the input field */
    document.addEventListener("click", function(e) {
        if (e.target !== inputElement) {
            closeDropDownList();
        } else if (!containerElement.querySelector(".autocomplete-items")) {
            // open dropdown list again
            var event = document.createEvent('Event');
            event.initEvent('input', true, true);
            inputElement.dispatchEvent(event);
        }
    });
}

async function initAutocomplete() {
    const apiKey = await fetchApiKey();
    if (!apiKey) {
        console.error('API key not set');
        return;
    }
    const container = document.getElementById("autocomplete-container");
    
    addressAutocomplete(container, (data) => {
        console.log("Selected address:", data);
        if (data) {
            document.getElementById('latitude').value = data.lat;
            document.getElementById('longitude').value = data.lon;
        }
    }, {
        placeholder: "Enter an address here"
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchApiKey();
    if (document.getElementById('map')) {
        initMap();
        initVisibleResponses();
    }
    if (document.getElementById('address')) {
        initAutocomplete();
    }
});

