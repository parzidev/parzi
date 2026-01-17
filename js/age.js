// Dynamic Age Counter
// This script calculates and displays the age in real-time, updating continuously

(function () {
    // IMPORTANT: Change this to your actual birth date
    // Format: YYYY-MM-DD
    const birthDate = new Date('2000-01-24T00:00:00');

    // Milliseconds in a year (accounting for leap years)
    const millisecondsInYear = 1000 * 60 * 60 * 24 * 365.25;

    function updateAge() {
        const now = new Date();
        const ageInMilliseconds = now - birthDate;
        const age = ageInMilliseconds / millisecondsInYear;

        // Get the age element
        const ageElement = document.getElementById('live-age');
        if (ageElement) {
            // Display with 9 decimal places for the "live" effect
            ageElement.textContent = age.toFixed(9);
        }
    }

    // Update immediately on load
    updateAge();

    // Update every 50 milliseconds for smooth animation
    setInterval(updateAge, 12);
})();
