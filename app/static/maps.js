const apiKey = config.googleMapsApiKey;

let map;
let markers = [];
let visibleResponses = new Set();
let legendVisible = true;

const colorMap = {
    'Appointment set': 'green',
    'Positive conversation (Detailed)': 'lightblue',
    'Positive conversation (Initial)': 'blue',
    'Request to Return later: worth returning (AI powered feature)': 'yellow',
    'Request to Return later': 'yellow',
    'Not interested (Homeowner)': 'red',
    'Not interested (Renter)': 'orange',
    'No answer: worth returning (AI powered feature)': 'gray',
    'No answer': 'gray',
    'Undefined': 'white'
};

function initMap() {
    const mapOptions = {
        center: { lat: -28.0167, lng: 153.4000 },
        zoom: 11
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);

    const legend = createLegend();
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);

    const toggleButton = createToggleButton();
    map.controls[google.maps.ControlPosition.TOP_RIGHT].push(toggleButton);

    fetchAllMapData();
}

function createLegend() {
    const legend = document.createElement('div');
    legend.id = 'legend';
    legend.style.backgroundColor = 'white';
    legend.style.padding = '10px';
    legend.style.margin = '10px';
    legend.style.border = '1px solid #999';
    legend.style.borderRadius = '3px';
    legend.style.fontSize = '12px';
    legend.style.maxHeight = '50%';
    legend.style.overflowY = 'auto';

    const title = document.createElement('h4');
    title.textContent = 'Prospect response';
    title.style.margin = '0 0 5px 0';
    legend.appendChild(title);

    const orderedResponses = [
        'Appointment set',
        'Positive conversation (Detailed)',
        'Positive conversation (Initial)',
        'Request to Return later: worth returning (AI powered feature)',
        'Request to Return later',
        'Not interested (Homeowner)',
        'Not interested (Renter)',
        'No answer: worth returning (AI powered feature)',
        'No answer',
        'Undefined'
    ];

    orderedResponses.forEach(response => {
        const div = document.createElement('div');
        div.innerHTML = `${createLegendIcon(response)} ${response}`;
        div.style.cursor = 'pointer';
        div.style.opacity = '1';
        div.style.marginBottom = '5px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        
        div.addEventListener('click', () => toggleMarkers(response, div));
        
        legend.appendChild(div);
        visibleResponses.add(response);
    });

    return legend;
}

function createLegendIcon(response) {
    const color = colorMap[response];
    const isWorthReturning = response.includes('worth returning');
    
    let svg = `<svg width="20" height="20" style="margin-right: 5px;">
        <circle cx="10" cy="10" r="8" fill="${color}" stroke="black" stroke-width="1"/>`;
    
    if (isWorthReturning) {
        svg += `<line x1="6" y1="10" x2="14" y2="10" stroke="green" stroke-width="2"/>
                <line x1="10" y1="6" x2="10" y2="14" stroke="green" stroke-width="2"/>`;
    }
    
    svg += '</svg>';
    
    return svg;
}

function createToggleButton() {
    const button = document.createElement('button');
    button.textContent = 'Toggle Legend';
    button.style.backgroundColor = 'gray';
    button.style.border = '1px solid #999';
    button.style.padding = '5px 10px';
    button.style.margin = '10px';
    button.style.cursor = 'pointer';

    button.addEventListener('click', () => {
        const legend = document.getElementById('legend');
        legendVisible = !legendVisible;
        legend.style.display = legendVisible ? 'block' : 'none';
    });

    return button;
}

function toggleMarkers(response, legendItem) {
    if (visibleResponses.has(response)) {
        visibleResponses.delete(response);
        legendItem.style.opacity = '0.5';
    } else {
        visibleResponses.add(response);
        legendItem.style.opacity = '1';
    }

    markers.forEach(marker => {
        if (marker.response === response) {
            marker.setVisible(visibleResponses.has(response));
        }
    });
}

function fetchAllMapData() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    fetch('/get_all_map_data')
        .then(response => response.json())
        .then(data => {
            createMarkers(data);
        })
        .catch(error => console.error('Error:', error));
}

function createMarkers(data) {
    const geocoder = new google.maps.Geocoder();
    data.forEach(item => {
        geocoder.geocode({ 'address': item.address }, function(results, status) {
            if (status === 'OK') {
                const isWorthReturning = item.ML_model_pred_worth_returning === 'Yes';
                let prospectResponse = item.prospect_response;
                if (isWorthReturning) {
                    if (prospectResponse === 'Request to Return later') {
                        prospectResponse = 'Request to Return later: worth returning (AI powered feature)';
                    } else if (prospectResponse === 'No answer') {
                        prospectResponse = 'No answer: worth returning (AI powered feature)';
                    }
                }

                const marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location,
                    icon: getMarkerIcon(prospectResponse, isWorthReturning)
                });

                marker.response = prospectResponse;

                const infoWindow = new google.maps.InfoWindow({
                    content: createInfoWindowContent(item)
                });

                marker.addListener('click', function() {
                    infoWindow.open(map, marker);
                });

                markers.push(marker);
            } else {
                console.error('Geocode was not successful for the following reason: ' + status);
            }
        });
    });
}

function getMarkerIcon(prospectResponse, isWorthReturning) {
    const color = colorMap[prospectResponse];
    const size = 20;
    const halfSize = size / 2;
    
    let svgPath = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${halfSize}" cy="${halfSize}" r="${halfSize - 1}" fill="${color}" stroke="black" stroke-width="1"/>`;
    
    if (isWorthReturning) {
        svgPath += `<line x1="${halfSize - 4}" y1="${halfSize}" x2="${halfSize + 4}" y2="${halfSize}" stroke="green" stroke-width="2"/>
                    <line x1="${halfSize}" y1="${halfSize - 4}" x2="${halfSize}" y2="${halfSize + 4}" stroke="green" stroke-width="2"/>`;
    }
    
    svgPath += '</svg>';

    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgPath),
        scaledSize: new google.maps.Size(size, size),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(halfSize, halfSize)
    };
}

function createInfoWindowContent(item) {
    let content = '<div style="max-width: 300px; word-wrap: break-word;">';
    for (const [key, value] of Object.entries(item)) {
        content += `<p><strong>${key}:</strong> ${value}</p>`;
    }
    content += '</div>';
    return content;
}

// Address autocomplete function in the Data Collection page
function initAutocomplete() {
    const input = document.getElementById('address');
    if (!input) return; // Exit if the address input doesn't exist on the page

    const options = {
        types: ['address'],
        //componentRestrictions: { country: 'au' }, // Restrict to Australia
        fields: ['formatted_address', 'geometry']
    };

    const autocomplete = new google.maps.places.Autocomplete(input, options);

    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            console.log("No details available for input: '" + place.name + "'");
            return;
        }

        // You can access the selected place's details here
        const address = place.formatted_address;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        console.log('Selected address:', address);
        console.log('Latitude:', lat);
        console.log('Longitude:', lng);

        if (window.map) {
            window.map.setCenter(place.geometry.location);
            window.map.setZoom(15);
        }

    });
}

function loadGoogleMapsScript() {
    if (window.google && window.google.maps) {
        // Google Maps API is already loaded
        initGoogleMapsFeatures();
    } else {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsFeatures`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }
}

function initGoogleMapsFeatures() {
    console.log("Initializing Google Maps features");
    if (document.getElementById('map')) {
        console.log("Initializing map");
        initMap();
    }
    if (document.getElementById('address')) {
        console.log("Initializing autocomplete");
        initAutocomplete();
    }
}

document.addEventListener('DOMContentLoaded', loadGoogleMapsScript);