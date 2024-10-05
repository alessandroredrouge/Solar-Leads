const apiKey = config.googleMapsApiKey;

function initMap() {
    const mapOptions = {
      center: { lat: 37.7749, lng: -122.4194 }, // Example: San Francisco
      zoom: 12
    };
    const map = new google.maps.Map(document.getElementById('map'), mapOptions);
}

function loadGoogleMapsScript() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', loadGoogleMapsScript);