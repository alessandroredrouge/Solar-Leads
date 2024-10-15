const apiKey = config.geoapifyApiKey;
let map;
let markers = [];
let markerCluster;
let visibleResponses = new Set();
let legendVisible = true;

const colorMap = {
    'Appointment set': '%23008000',
    'Positive conversation (Detailed)': '%23add8e6',
    'Positive conversation (Initial)': '%230000ff',
    'Request to Return later': '%23ffff00',
    'Not interested (Homeowner)': '%23ff0000',
    'Not interested (Renter)': '%23ffa500',
    'No answer': '%23808080',
    'Undefined': '%23ffffff'
};

function initMap() {
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
        position: 'topright',
        content: '<button onclick="toggleLegend()">Toggle Legend</button>',
        classes: 'legend-toggle-btn',
    }).addTo(map);
    createLegend();
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

function createMarkers(data) {
    data.forEach(item => {
        const lat = parseFloat(item.latitude);
        const lng = parseFloat(item.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
            const markerColor = getMarkerColor(item.prospect_response);
            const markerInnerImage = getMarkerInnerImage(item.ML_model_pred_worth_returning);
            const markerIcon = L.icon({
                iconUrl: `https://api.geoapify.com/v1/icon?size=xx-large&type=awesome&color=${markerColor}&icon=${markerInnerImage}&apiKey=${apiKey}`,
                iconSize: [31, 46],
                iconAnchor: [15.5, 42],
                popupAnchor: [0, -45]
            });

            const marker = L.marker([lat, lng], {icon: markerIcon}).bindPopup(() => createPopupContent(item));
            markers.push({marker: marker, response: item.prospect_response});
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

function createLegend() {
    const legend = document.getElementById('map-legend');
    Object.entries(colorMap).forEach(([key, color]) => {
        const row = document.createElement('div');
        row.className = 'legend-item';
        const markerIcon = L.icon({
            iconUrl: `<img src="https://api.geoapify.com/v1/icon?size=xx-large&type=awesome&color=${color}&icon=sun&apiKey=${apiKey}"`,
            iconSize: [31, 46],
            iconAnchor: [15.5, 42],
            popupAnchor: [0, -45]
        });
        row.innerHTML = `
            ${markerIcon}
            <span>${key}</span>
            <input type="checkbox" checked onchange="toggleMarkers('${key}')">
        `;
        legend.appendChild(row);
    });
}

function toggleLegend() {
    const legend = document.getElementById('map-legend');
    legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
}

function toggleMarkers(response) {
    if (visibleResponses.has(response)) {
        visibleResponses.delete(response);
    } else {
        visibleResponses.add(response);
    }

    markerCluster.clearLayers();
    markers.forEach(({marker, response: markerResponse}) => {
        if (visibleResponses.has(markerResponse)) {
            markerCluster.addLayer(marker);
        }
    });
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

function addressAutocomplete(containerElement, callback, options) {
    const MIN_ADDRESS_LENGTH = 3;
    const DEBOUNCE_DELAY = 300;

    // Use the existing input element
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

function initAutocomplete() {
    addressAutocomplete(document.getElementById("autocomplete-container"), (data) => {
        if (data) {
            document.getElementById('latitude').value = data.lat;
            document.getElementById('longitude').value = data.lon;
        }
    }, {
        placeholder: "Enter an address here"
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    // initAutocomplete();
});
