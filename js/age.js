// Dynamic Age Counter
// This script calculates and displays the age in real-time, updating continuously

(function () {

    const birthDate = new Date('2000-01-24T00:00:00+03:00');

    function updateAge() {
        const now = new Date();

        // precise calculation
        let age = now.getFullYear() - birthDate.getFullYear();

        // Create current year birthday object
        const birthdayThisYear = new Date(birthDate);
        birthdayThisYear.setFullYear(now.getFullYear());

        let lastBirthday, nextBirthday;

        if (now >= birthdayThisYear) {
            lastBirthday = birthdayThisYear;
            nextBirthday = new Date(birthdayThisYear);
            nextBirthday.setFullYear(now.getFullYear() + 1);
        } else {
            age--; // Not reached birthday yet
            nextBirthday = birthdayThisYear;
            lastBirthday = new Date(birthdayThisYear);
            lastBirthday.setFullYear(now.getFullYear() - 1);
        }

        const millisecondsInYear = nextBirthday - lastBirthday;
        const millisecondsSinceLastBirthday = now - lastBirthday;

        const preciseAge = age + (millisecondsSinceLastBirthday / millisecondsInYear);

        // Get the age element
        const ageElement = document.getElementById('live-age');
        if (ageElement) {
            // Display with 9 decimal places for the "live" effect
            ageElement.textContent = preciseAge.toFixed(9);
        }
    }

    // Update immediately on load
    updateAge();

    // Update every 50 milliseconds for smooth animation
    setInterval(updateAge, 50);
})();
