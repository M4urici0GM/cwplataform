document.addEventListener('DOMContentLoaded', () => {
    Array.from(document.querySelectorAll('.ban-player')).forEach(element => {
        element.addEventListener('click', () => {
            confirmAction('Deseja realmente BANIR esse jogador ?');
        });
    });
    Array.from(document.querySelectorAll('.kick-player')).forEach(element => {
        element.addEventListener('click', () => {
            confirmAction('Deseja realmente kickar esse jogador ?');
        });
    });

    function confirmAction(msg, callback) {
        Swal.fire({
            title: "Tem certeza?",
            text: msg,
            type: 'question',
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-check"></i> Continuar',
            cancelButtonText: '<i class="fas fa-times"></i> Fechar',
            cancelButtonColor: '#d33'
        }).then(callback);
    }
});