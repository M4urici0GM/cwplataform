
document.addEventListener('DOMContentLoaded', (event) => {
    const socketIO = io();

    socketIO.on('connect', () => {
        socketIO.emit('GetOnlinePlayers');
    });

    socketIO.on('PlayerJoined', (data) => {

        if ( document.querySelectorAll(`tr.playerRow[player_id='${data.playerId}']`).length  > 0)
            return;

        var rowBase = document.getElementById('playerDivBase');
        var newRow  = rowBase.cloneNode(true);
        newRow.classList.remove('d-none');
        newRow.removeAttribute('id');
        newRow.setAttribute('player_id', data.playerId);
        newRow.querySelectorAll('td.playerImg img')[0].src = `https://minotar.net/avatar/${data.playerName}`;
        newRow.querySelectorAll('td.playerNick')[0].innerHTML = (data.newPlayer ? '<i class="material-icons align-middle text-success">fiber_new</i>&nbsp;' + data.playerName : data.playerName);
        newRow.querySelectorAll('td.playerServer')[0].innerHTML = data.serverName;
        Array.from(newRow.querySelectorAll('.ban-player')).forEach(element => {
            element.setAttribute('player_id', data.playerId);
            element.setAttribute('server_id', data.serverId);
        });
        Array.from(newRow.querySelectorAll('.kick-player')).forEach(element => {
            element.setAttribute('player_id', data.playerId);
            element.setAttribute('server_id', data.serverId);
        });

        document.querySelectorAll('table.playersTable tbody')[0].appendChild(newRow);

        if ( document.querySelectorAll('.playersTable tbody')[0].childElementCount > 1 ) {
            document.querySelectorAll('.playersTable')[0].style.display = "table";
            document.querySelectorAll('.noOnlinePlayers')[0].style.display = "none";
        }

        var onlinePlayers = parseInt(document.querySelectorAll('.onlinePlayers span')[0].innerHTML);
        document.querySelectorAll(`.row[server_id='${data.serverId}'] .onlinePlayers span`)[0].innerHTML = onlinePlayers + 1;
    });

    socketIO.on('PlayerQuitted', (data) => {
        document.querySelectorAll('.playersTable tbody')[0].removeChild(document.querySelectorAll(`tr.playerRow[player_id='${data.playerId}']`)[0]);        
        var onlinePlayers = parseInt(document.querySelectorAll('.onlinePlayers span')[0].innerHTML);
        document.querySelectorAll(`.row[server_id='${data.serverId}'] .onlinePlayers span`)[0].innerHTML = onlinePlayers - 1;

        if ( document.querySelectorAll('.playersTable tbody').length == 1 ) {
            document.querySelectorAll('.playersTable')[0].style.display = "none";
            document.querySelectorAll('.noOnlinePlayers')[0].style.display = "block";
        }
    });

    socketIO.on('ServerConnected', (serverId) => {
        updateServerStatus(serverId);
    });

    socketIO.on('ServerDisconnected', (serverId) => {
        updateServerStatus(serverId);
    });


    function updateServerStatus(serverId) {
        var serverElement = document.querySelectorAll(`[server_id='${serverId}']`)[0];
        var serverStatsElement =  serverElement.getElementsByClassName('server-status')[[0]];
        
        if ( !serverStatsElement.classList.contains('badge-success') ){
            serverStatsElement.classList.add('badge-success');
            serverStatsElement.classList.remove('badge-danger');
            serverStatsElement.innerHTML = 'online';
        } else {
            serverStatsElement.classList.remove('badge-success');
            serverStatsElement.classList.add('badge-danger');
            serverStatsElement.innerHTML = 'offline';
        }

    }

});