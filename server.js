function serverPush(roomID, info) {
    var pushUrl = "/push.php";
    $.get(pushUrl, {
        'roomID': roomID,
        'info': JSON.stringify(info),
    });
}

var roomHandlers = {};

function longPoll(roomID) {
    var listenUrl = "/listen.php";
    $.get(listenUrl, {
        'roomID': roomID,
    }, function(res) {
        roomHandlers[roomID].forEach(function(handler) {
            var result = JSON.parse(res);
            result.forEach(function(row) {
                handler(JSON.parse(row.message));
            });
        });
        longPoll(roomID);
    });
}

function serverListen(roomID, fn) {
    if (roomHandlers[roomID] == undefined) {
        roomHandlers[roomID] = [fn];
        longPoll(roomID);
    } else {
        roomHandlers[roomID].push(fn);
    }
}