const apiKey = config.googleMapsApiKey;

function initMap() {
    console.log("initMap function called");
    const mapElement = document.getElementById('map');
    if (mapElement) {
        const mapOptions = {
            center: { lat: -28.0167, lng: 153.4000 },
            zoom: 11
        };
        const map = new google.maps.Map(mapElement, mapOptions);
        console.log("Map initialized");
    } else {
        console.log("No map element found, skipping map initialization");
    }
}

function initAutocomplete() {
    console.log("initAutocomplete function called");
    const input = document.getElementById('address');
    if (!input) {
        console.log("No address input found, skipping autocomplete initialization");
        return;
    }

    const options = {
        types: ['address'],
        fields: ['formatted_address', 'geometry']
    };

    console.log("Initializing autocomplete");
    const autocomplete = new google.maps.places.Autocomplete(input, options);

    autocomplete.addListener('place_changed', function() {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            console.log("No details available for input: '" + place.name + "'");
            return;
        }

        console.log('Selected address:', place.formatted_address);
        console.log('Latitude:', place.geometry.location.lat());
        console.log('Longitude:', place.geometry.location.lng());
    });

    console.log("Autocomplete initialized");
}

function loadGoogleMapsScript() {
    console.log("Loading Google Maps script");
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMapAndAutocomplete`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

function initMapAndAutocomplete() {
    console.log("initMapAndAutocomplete called");
    initMap();
    initAutocomplete();
}

console.log("maps.js loaded, adding DOMContentLoaded event listener");
document.addEventListener('DOMContentLoaded', loadGoogleMapsScript);