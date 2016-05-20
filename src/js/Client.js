// Connect ssl sockets
$('#content').hide();

var socket = io.connect('https://' + window.location.host, {secure: true});
var debugSetting = true;
var warn = console.warn.bind(window.console),
    error = console.error.bind(window.console),
    log = console.log.bind(window.console),
    debug = console.debug.bind(window.console),
    info = console.info.bind(window.console);
var loginLoading = false,
    messageLoading = false,
    sendingFile = false;
var serverTime;
var CryptoHelper = new CryptoHelper();
var SessionHelper = new ConnectionHelper(socket, CryptoHelper);

setInterval(function () {
    // stay alive through heartbeat
    socket.emit('heart_beat', 'oi');
}, 5000);

// a user has disconnected
socket.on('user_disconnect', function (username, user_list) {
    debug('User disconnected: ' + username);
    // first update the userlist
    if (!SessionHelper.updateUserList(user_list)) {
        // current target is gone so reset the target input box
        $('#inputTarget').val('');
    }
    loadKeyListDiv();
});

// Receive public key from server
socket.on('public_key', function (response) {
    SessionHelper.setServerPublicKey(response);
});

// Server returns the user's salt
socket.on('login_salt_callback', function (salt) {
    debug('Salt callback');
    // send to session handler
    SessionHelper.loginSaltCallback(salt);
});

// Message server callback
socket.on('message_callback', function (res) {
    messageLoading = false;
    $('#message_button').removeClass('fa-spin fa-refresh').addClass('fa-mail-forward');
});

// Received a message from server
socket.on('message', function (res) {
    SessionHelper.receiveMessage(res, function (callbackMessage) {
        if (callbackMessage !== false) {
            addMessage(res.from, callbackMessage);
        }
    });
});

// TODO allow user to verify and accept request manually first
// someone wants to chat and is requesting that we create a new aes key to use
socket.on('aesKeyRequest', function (request) {
    info('Received AES request');
    SessionHelper.createNewAes(request);
});

// the client a aes key was requested from has sent a response
socket.on('aesKeyResponse', function (response) {
    SessionHelper.setAesKey(response, function (success) {
        if (success) {
            loadKeyListDiv();
        }
    });
    info('Received AES response');
    debug(response);
});

// other client wants a confirmation for this request
socket.on('confirm_aes', function (response) {
    info('Received AES confirmation');
    debug(response);
    SessionHelper.aesConfirmation(response, function (success) {
        loadKeyListDiv();
    });
});

// the client has sent a response to our confirmation request
socket.on('confirm_aes_response', function (response) {
    info('Received AES confirmation response');
    debug(response);
    SessionHelper.aesConfirmationResponse(response, function (success) {
        loadKeyListDiv();
    });
});

// add a message to the list
function addMessage(username, text, customid) {
    debug(username + ' Message: ' + text);
    if (text) {
        if (SessionHelper.getUsername() === username) {
            $('#messages').prepend('<p id="' + customid + '"><strong>' + curDate() + " - " + escapeHtml(username) + "</strong>: " + escapeHtml(text) + '</p>');
        } else {
            $('#messages').prepend('<p id="' + customid + '">' + curDate() + " - " + escapeHtml(username) + ": " + escapeHtml(text) + '</p>');
        }
    }
}

// Message attempt
$(document.body).on('submit', '#message_form', function (e) {
    e.preventDefault();
    if (!messageLoading && SessionHelper.hasTarget()) {
        messageLoading = true;
        var message = $('#inputMessage').val().trim();

        $('#inputMessage').val('');

        $('#message_button').addClass('fa-spin fa-refresh').removeClass('fa-mail-forward');

        if (message.length > 0 && message.length < 255) {
            if (SessionHelper.sendMessage(message)) {
                addMessage(SessionHelper.getUsername(), message);
            }
        } else {
            $('#message_button').removeClass('fa-spin fa-refresh').addClass('fa-mail-forward');
            debug('Message length: ' + message.length);
            messageLoading = false;
        }
    }
    return false;
});

// select a user
// $(document.body).on('click', '.user-select', function () {
//     if (SessionHelper.isVerified()) {
//         var userName = $(this).data('user');
//         if (SessionHelper.setTarget(userName)) {
//             $('#inputTarget').val(userName);
//         }
//     } else {
//         warn('Not verified, can\'t select target');
//     }
//     return false;
// });

// file transfer setting checkbox
$('#file_upload_setting').on('click', function () {
    SessionHelper.setFileSetting(this.checked);
    $("#messages_file_transfer_div").toggle(this.checked);
    socket.emit('')
});

// TODO consent before file sharing
// file upload testing
$('#file_upload').on('click', function () {
    // check if no other file is being sent, if we have a target and
    // if a aes key has been established and if we allow file transfers
    if (!sendingFile && SessionHelper.hasTarget() && SessionHelper.hasAesKey() && SessionHelper.getFileSetting()) {

        // basic file info
        var file_info = getFileinfo('file_upload_test');

        // 1b < file-size < 1mb
        if (file_info && file_info.size > 0 && file_info.size < 1024 * 1024) {

            // update status
            sendingFile = true;

            // button text update to loader icon
            $('#file_upload').html('<i class="fa fa-spin fa-refresh"></i>');

            // get contents from input
            getFileContents('file_upload_test', function (res) {
                var packages = stringToPackage(res.result, 1024 * 10);

                SessionHelper.sendFile(packages, function (result) {
                    log(result);
                    if (result === true) {
                        resetFormElement($('#file_upload_test'));
                        $('#file_upload').html('Send a file');
                        addMessage(SessionHelper.getUsername(), 'File has succesfully been sent a to ' + SessionHelper.getTarget());
                        sendingFile = false;

                    } else if (result === false) {
                        resetFormElement($('#file_upload_test'));
                        $('#file_upload').html('Send a file');
                        addMessage(SessionHelper.getUsername(), 'File has NOT succesfully been sent a to ' + SessionHelper.getTarget());
                        sendingFile = false;

                    } else {
                        // $('#file_upload').html('Progress: ' + Math.round(result) + '%');
                        $('#file_upload').html('Progress: ' + result.toFixed(2) + '%');
                    }
                });
            });
        } else {
            warn('Invalid file size, max file size is 5mb');
        }
    } else {
        debug(sendingFile, SessionHelper.hasTarget(), SessionHelper.hasAesKey());
        warn('Already sending file or no target/key');
    }
});

// create new encryption key set
$('#new_encryption_keypair').on('click', function () {
    SessionHelper.newKeySet(function (keys) {
        $('#public_key_input').val(keys.publicKey);
        $('#private_key_input').val(keys.privateKey);
        debug('Generated new encryption key set');
        updateChecksums();
    });
    return false;
});

// create new signing key set
$('#new_encryption_sign_keypair').on('click', function () {
    SessionHelper.newKeySetSign(function (keys) {
        $('#public_key_sign_input').val(keys.publicKeySign);
        $('#private_key_sign_input').val(keys.privateKeySign);
        debug('Generated new signing key set');
        updateChecksums();
    });
    return false;
});

// toggle div collapse
$('.body_toggle').on('click', function () {
    var targetDiv = $(this).data('toggle');
    $('#' + targetDiv).slideToggle();
});

// update hash values
$('#update_md5_hashes').on('click', function () {
    updateChecksums();
});

// local storage buttons
$('.save_set_data').on('click', function () {
    // get values for this element
    var save_key = $(this).data('save_key');
    var target_field = $(this).data('save_target_field');
    var value = $(target_field).val();
    // get the data for the given key
    storageSet(save_key, value);
});
$('.save_delete_data').on('click', function () {
    // get values for this element
    var remove_key = $(this).data('remove_key');
    // get the data for the given key
    storageDelete(remove_key);
});
$('.save_get_data').on('click', function () {
    // get values from data values
    var save_key = $(this).data('save_key');
    var target_field = $(this).data('save_target_field');
    // get the data for the given key
    $(target_field).val(storageGet(save_key));
});

// save and load keypairs for settings tab
$('.save_keypair').on('click', function () {
    if ($(this).data('type') === "encryption") {
        storageSet('encryption_private_key', $('#private_key_input').val());
        storageSet('encryption_public_key', $('#public_key_input').val());
    } else {
        storageSet('encryption_private_sign_key', $('#private_key_sign_input').val());
        storageSet('encryption_public_sign_key', $('#public_key_sign_input').val());
    }
});
$('.load_keypair').on('click', function () {
    if ($(this).data('type') === "encryption") {
        $('#private_key_input').val(storageGet('encryption_private_key'));
        $('#public_key_input').val(storageGet('encryption_public_key'));
    } else {
        $('#private_key_sign_input').val(storageGet('encryption_private_sign_key'));
        $('#public_key_sign_input').val(storageGet('encryption_public_sign_key'));
    }
});

// load aes key list divs
function loadKeyListDiv() {
    // create stored aes keys div
    var keyList = SessionHelper.getKeyList();
    var resultDiv = "";
    for (var key in keyList) {
        resultDiv +=
            '<div class="panel panel-primary">' +
            '<div class="panel-heading body_toggle">' +
            "Username: " + key +
            '</div>' +
            '<div class="panel-body">' +
            '<div class="col-xs-12">' +
            '<div class="row">' +
            '<label for="inputTarget">AES key</label>' +
            '<input class="form-control" type="text" value="' + keyList[key]['key'] + '">' +
            '</div>' +
            '</div>' +
            '<div class="col-xs-12 col-sm-6">' +
            '<div class="row">' +
            '<label for="inputTarget">Encryption key</label>' +
            '<textarea class="form-control key-text">' + keyList[key]['rsa_keys']['public_key'] + '</textarea>' +
            '<p class="checksum-text">Checksum: ' + CryptoJS.SHA256(keyList[key]['rsa_keys']['public_key']).toString() + '</p>' +
            '</div>' +
            '</div>' +
            '<div class="col-xs-12 col-sm-6">' +
            '<div class="row">' +
            '<label for="inputTarget">Verification key</label>' +
            '<textarea class="form-control key-text">' + keyList[key]['rsa_keys']['public_key_sign'] + '</textarea>' +
            '<p class="checksum-text">Checksum: ' + CryptoJS.SHA256(keyList[key]['rsa_keys']['public_key_sign']).toString() + '</p>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>';
    }
    $('#stored_key_div').html(resultDiv);
}

// update the md5 fingerprints for rsa keys
function updateChecksums() {
    debug('Updating checksums');
    $('#private_key_md5hash').text("Checksum: " + CryptoJS.SHA256($('#private_key_input').val()));
    $('#public_key_md5hash').text("Checksum: " + CryptoJS.SHA256($('#public_key_input').val()));
    $('#private_key_sign_md5hash').text("Checksum: " + CryptoJS.SHA256($('#private_key_sign_input').val()));
    $('#public_key_sign_md5hash').text("Checksum: " + CryptoJS.SHA256($('#public_key_sign_input').val()));
}