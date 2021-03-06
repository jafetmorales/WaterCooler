/**
 * app.js
 *
 * This file contains some conventional defaults for working with Socket.io + Sails.
 * It is designed to get you up and running fast, but is by no means anything special.
 *
 * Feel free to change none, some, or ALL of this file to fit your needs!
 */

$(window).on('resize', function () {
    //vpw = $(window).width();
    vph = $(window).height();
    nbh = $('.navbar').height();
    mch = $('.controls').outerHeight();
    rih = $('#room-info').outerHeight();
    $('#content').css({'height': (vph-(nbh+mch+rih)) + 'px'});
});

$(window).resize();

var field = document.getElementById("field");
var sendBtn = document.getElementById("send");
var content = document.getElementById("content");

$(field).focus();

if (window.WaterCooler) {
    (function (io) {

        // as soon as this file is loaded, connect automatically,
        var socket = io.connect();
        if (typeof console !== 'undefined') {
            log('Connecting to WaterCooler server...');
        }

        socket.on('connect', function socketConnected() {
            log('Socket connected');
            if ($(content).text() != '') {
                $(content).append('<strong class="text-success">Connection Success!</strong><br />');
            }
            socket.get('/room/'+WaterCooler.room, function (room) {
                $(content).append('<strong class="text-info">Welcome to '+room.name+'!</strong><br />');
            });
            socket.get('/room/'+WaterCooler.room+'/subscribers', WaterCooler.handler.clientList);

            $.ajax({
                type: 'GET',
                url: '/room/'+WaterCooler.room+'/messages?limit=5',
                success: WaterCooler.handler.pastMessages
            }).fail(function (err) {
                log("Houston, we have a problem: ", err.responseJSON);
            });
        });

        socket.on('message', function(response) {
            if(response.model === "message" && response.verb === "create") {
                WaterCooler.handler.messageReceived(response.data, content);
            }
        });

        socket.on('github', WaterCooler.handler.githubPush);
        socket.on('bitbucket', WaterCooler.handler.bitbucketPush);

        socket.on('presence', function(data) {
            isMe = (data.user.id === activeUser.id ? true : false);
            if (data.state == 'online'){
                WaterCooler.handler.clientAdd(data.user, true, isMe);
            } else if(data.state == 'offline'){
                WaterCooler.handler.clientRemove(data.user, true);
            }
        });

        socket.on('disconnect', function socketDisconnected() {
            $(content).append('<strong class="text-error">Connection Lost! I\'ll try to reconnect...</strong><br />');
            $(content).scrollTop($(content)[0].scrollHeight);
        });



        // Expose connected `socket` instance globally so that it's easy
        // to experiment with from the browser console while prototyping.
        window.socket = socket;

        // Simple log function to keep the example simple
        function log() {
            if (typeof console !== 'undefined') {
                console.log.apply(console, arguments);
            }
        }

        $(sendBtn).on('click', function sendMessage(e) {
            e.preventDefault();
            var field = document.getElementById("field");
            if (field.value !== "") {
                var message = field.value;
                field.value = '';
                socket.post('/room/'+WaterCooler.room+'/message', { message: message });
                WaterCooler.handler.messageReceived({ user: activeUser, message:message, createdAt: new Date() }, content);
            }
        });

        $("#field").keyup(function(e) {
            if(e.keyCode == 13) {
                $(sendBtn).click();
            } else if(e.keyCode == 38) {
                // Get previous writebacks
            }
        });

        $("#control-form").submit(function (e) {
            e.preventDefault();
            $(sendBtn).click();
        });

    })(window.io);
}
