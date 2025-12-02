
const inputs = document.querySelectorAll('.toggle');
const notification = document.getElementById('notification-bar');
let timeoutId;


inputs.forEach(input => {
    input.addEventListener('change', function () {

        if (this.checked) {


            notification.classList.add('active');


            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                notification.classList.remove('active');
            }, 1500);
        }
    });
});


function createSnowflake() {

    const snow = document.createElement('div');
    snow.classList.add('snowflake');


    snow.innerHTML = '❄';


    snow.style.left = Math.random() * 100 + 'vw';
    snow.style.fontSize = Math.random() * 10 + 10 + 'px';
    snow.style.opacity = Math.random();


    const duration = Math.random() * 3 + 2;
    snow.style.animationDuration = duration + 's';


    document.body.appendChild(snow);


    setTimeout(() => {
        snow.remove();
    }, duration * 1000);
}


setInterval(createSnowflake, 100);


window.addEventListener('load', function () {
    const audio = document.getElementById("myAudio");
    audio.volume = 0.5;


    setTimeout(function () {


        var playPromise = audio.play();


        if (playPromise !== undefined) {
            playPromise.then(_ => {
                console.log("Otomatik oynatma başarılı.");
            })
                .catch(error => {

                    console.log("Otomatik oynatma engellendi, tıklama bekleniyor.");


                    document.addEventListener('click', function () {
                        audio.play();
                    }, { once: true });
                });
        }
    }, 500);
});