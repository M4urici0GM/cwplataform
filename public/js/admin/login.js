document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('adminLogin').addEventListener('submit', (event) => {
        event.preventDefault();
        const adminUser = document.getElementById('adminUser').value;
        const adminPass = document.getElementById('adminPass').value;

        if ( !adminUser || !adminPass ) {
            Swal.fire({
                title: "Erro!",
                text: "Insira seu usuário e sua senha!",
                type: 'error',
                confirmButtonText: '<i class="fas fa-check"></i> Continuar'
            });
            return;
        }
        (async () => {
            const rawResponse = await fetch('/admin/authenticate', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({adminUser: adminUser, adminPass: adminPass})
            });
            const content = await rawResponse.json();
            if ( !content.authenticated ) {
                Swal.fire({
                    title: "Erro!",
                    text: "Usuário ou senha inválidos, tente novamente.",
                    type: 'error',
                    confirmButtonText: '<i class="fas fa-check"></i> Continuar'
                });
            } else {
                Swal.fire({
                    title: "Sucesso!",
                    text: "Login efetuado com sucesso!.",
                    type: 'success',
                    confirmButtonText: '<i class="fas fa-check"></i> Continuar'
                }).then(result => {
                    setTimeout(() => {
                        location.href = '/admin';
                    }, 500);
                });
            }
        })();
    });
});