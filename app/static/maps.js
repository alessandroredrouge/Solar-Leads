const apiKey = config.googleMapsApiKey;

let map;

function initMap() {
    const mapOptions = {
        center: { lat: -28.0167, lng: 153.4000 }, // Gold Coast coordinates, where the pre-populated dataset is set
        zoom: 11
    };
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    fetchAllMapData();
}

function fetchAllMapData() {
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

                const infoWindow = new google.maps.InfoWindow({
                    content: createInfoWindowContent(item)
                });

                marker.addListener('click', function() {
                    infoWindow.open(map, marker);
                });
            } else {
                console.error('Geocode was not successful for the following reason: ' + status);
            }
        });
    });
}
// TODO: change colors for better clarity
function getMarkerIcon(prospectResponse) {
    // Define color mapping based on prospect_response
    const colorMap = {
        'Appointment set': 'green',
        'Positive conversation (Detailed)': 'pink',
        'Positive conversation (Initial)': 'yellow',
        'Request to Return later': 'blue',
        'Not interested (Homeowner)': 'red',
        'Not interested (Renter)': 'orange',
        'No answer': 'gray',
    };

    const color = colorMap[prospectResponse] || 'purple'; // Default color
    return `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
}

function createInfoWindowContent(item) {
    let content = '<div style="max-width: 300px; word-wrap: break-word;">';
    for (const [key, value] of Object.entries(item)) {
        content += `<p><strong>${key}:</strong> ${value}</p>`;
    }
    content += '</div>';
    return content;
}

// Load the Google Maps script
function loadGoogleMapsScript() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

// TODO: add Legend for the maps colors

// TODO: allow to select the visualization of the results of one specific user

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', loadGoogleMapsScript)