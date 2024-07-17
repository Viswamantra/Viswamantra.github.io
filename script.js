document.getElementById('userForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const mobile = document.getElementById('mobile').value;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        document.getElementById('result').innerText = "Geolocation is not supported by this browser.";
    }

    function showPosition(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const url = `https://apis.mappls.com/advancedmaps/v1/    <script src="https://apis.mappls.com/advancedmaps/api/<key or token>/map_sdk?v=3.0&layer=vector"></script>/rev_geocode?lat=${lat}&lng=${lon}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.responseCode === 200) {
                    const location = data.results[0].formatted_address;
                    document.getElementById('result').innerHTML = `
                        <p>Name: ${name}</p>
                        <p>Mobile: ${mobile}</p>
                        <p>Location: ${location}</p>
                    `;
                } else {
                    document.getElementById('result').innerText = 'Error fetching location data';
                }
            })
            .catch(error => {
                document.getElementById('result').innerText = 'Error fetching location data';
            });
    }

    function showError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                document.getElementById('result').innerText = "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                document.getElementById('result').innerText = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                document.getElementById('result').innerText = "The request to get user location timed out.";
                break;
            case error.UNKNOWN_ERROR:
                document.getElementById('result').innerText = "An unknown error occurred.";
                break;
        }
    }
});
