document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const mobile = document.getElementById('mobile').value;
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        document.getElementById('location').innerText = "Geolocation is not supported by this browser.";
    }
    
    function showPosition(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        document.getElementById('location').innerText = `Latitude: ${lat}, Longitude: ${lon}`;
        
        // Integrate with Ola Cabs API (example request)
        fetch(`https://developers.olacabs.com/api/{endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_OLA_API_KEY'
            },
            body: JSON.stringify({
                latitude: lat,
                longitude: lon,
                // other required parameters
            })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Ola API Response:', data);
            sendWhatsAppMessage(lat, lon);
        })
        .catch(error => console.error('Error:', error));
    }

    function showError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                document.getElementById('location').innerText = "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                document.getElementById('location').innerText = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                document.getElementById('location').innerText = "The request to get user location timed out.";
                break;
            case error.UNKNOWN_ERROR:
                document.getElementById('location').innerText = "An unknown error occurred.";
                break;
        }
    }
    
    function sendWhatsAppMessage(lat, lon) {
        const whatsappNumber = '+917386361725';
        const message = `Name: ${name}, Mobile: ${mobile}, Location: Latitude ${lat}, Longitude ${lon}`;
        const whatsappURL = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
        
        window.open(whatsappURL, '_blank');
    }
});
