const apiKey = config.googleMapsApiKey;

let map;
let markers = [];
let visibleResponses = new Set();
let legendVisible = true;

const colorMap = {
    'Appointment set': 'green',
    'Positive conversation (Detailed)': 'lightblue',
    'Positive conversation (Initial)': 'blue',
    'Request to Return later': 'yellow',
    'Not interested (Homeowner)': 'red',
    'Not interested (Renter)': 'orange',
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
    title.textContent = 'Legend';
    title.style.margin = '0 0 5px 0';
    legend.appendChild(title);

    for (const [response, color] of Object.entries(colorMap)) {
        const div = document.createElement('div');
        div.innerHTML = `${createLegendIcon(response, color)} ${response}`;
        div.style.cursor = 'pointer';
        div.style.opacity = '1';
        div.style.marginBottom = '5px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        
        div.addEventListener('click', () => toggleMarkers(response, div));
        
        legend.appendChild(div);
        visibleResponses.add(response);
    }

    return legend;
}


function createLegendIcon(response, color) {
    return `<svg width="20" height="20" style="margin-right: 5px;">
        <circle cx="10" cy="10" r="8" fill="${color}" stroke="black" stroke-width="1"/>
    </svg>`;
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
                const marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location,
                    icon: getMarkerIcon(item.prospect_response)
                });

                marker.response = item.prospect_response;

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

function getMarkerIcon(prospectResponse) {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: colorMap[prospectResponse],
        fillOpacity: 1,
        strokeWeight: 1,
        strokeColor: '#000',
        scale: 8
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

function loadGoogleMapsScript() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', loadGoogleMapsScript);