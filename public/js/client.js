// Connect ssl sockets
var socket = io.connect('https://localhost:8000', {secure: true});

var CryptoHelper = new CryptoHelper();
var SessionHelper = new ConnectionHelper(socket, CryptoHelper);

var loading = false;

// Socket event listeners
socket.on('connect', function () {

    $('#messages').append('<li>Connected</li>');

}).on('public_key', function (response) {

    // Receive public key from server
    SessionHelper.publicKey = response;

}).on('request verify', function () {

    $('#login_screen').removeClass('hidden');
    $('#content').addClass('hidden');

}).on('login_attempt_callback', function (res) {

    loading = false;

    console.log('login callback: ' + res.success);
    console.log(res);

    if(res.success === false){
        $('#login_section').show();
        $('#login_button').removeClass('fa-spin fa-refresh').addClass('fa-sign-in');
    }else{
        $('#login_button').removeClass('fa-spin fa-refresh').addClass('fa-check');
    }

});

// Login attempt
$(document.body).on('submit', '#login_form', function () {

    if (1 == 1 || !loading) {
        loading = true;
        var username = $('#inputName').val();
        var password = $('#inputPassword').val();

        $('#login_section').hide();
        $('#login_button').addClass('fa-spin fa-refresh').removeClass('fa-sign-in');

        if (username.length > 3 && username.length < 16 && CryptoHelper.validPasswordType(password)) {

            setTimeout(function () {
                SessionHelper.loginAttempt(username, password);
            }, 100);

        } else {

            $('#login_section').show();
            $('#login_button').removeClass('fa-spin fa-refresh').addClass('fa-sign-in');

            console.log('Username length: ' + username.length + " password length: " + password);
        }
    }

    return false;
});