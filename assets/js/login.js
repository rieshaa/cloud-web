$(document).ready(function() {
    var timeStamp = new Date().getTime()
    var fp = new Fingerprint({
        canvas: true,
        ie_activex: true,
        screen_resolution: true
    });
    
    var uid = fp.get() + timeStamp;

    checkLogin(uid)
    $('#loadQr').attr('src', 'https://chart.googleapis.com/chart?cht=qr&chs=264x264&chl='+uid)
})


function checkLogin(uid) {
    const dbRef = firebase.database().ref('webchat');
    dbRef.on('child_added', function(snapshot) {
        if(snapshot.key == uid) {
            console.log(snapshot.key)
            localStorage.setItem('clientId', uid)
            window.location.href = 'message.html'
        }
    });
}