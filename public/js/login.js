
document.addEventListener('DOMContentLoaded', () => {
    

    document.getElementById('formLogin').addEventListener('submit', (event) => {
        event.preventDefault();
        var userTxt = document.getElementById('UsuarioTxt').value;
        var passwordTxt = document.getElementById('SenhaTxt').value;
        
        if (!userTxt || !passwordTxt) {
            Swal.fire({
                title: "Erro!",
                text: "Por favor, preencha seu usuario e senha!",
                type: 'error',
                confirmButtonText: '<i class="fas fa-check"></i> Continuar!'
            });
            return;
        }
    
        (async () => {
            const rawResponse = await fetch('/authenticate', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({user: userTxt, password: passwordTxt})
            });
            const content = await rawResponse.json();
            if (!content.authenticated) {
                Swal.fire({
                    title: "Erro!",
                    text: "Usuário ou senha inválidos.",
                    type: 'error',
                    confirmButtonText: '<i class="fas fa-check"></i> Continuar!'
                });
            }else {
                Swal.fire({
                    title: "Sucesso!",
                    text: "Login efetuado com sucesso!",
                    type: 'success',
                    confirmButtonText: '<i class="fas fa-check"></i> Continuar!'
                }).then(result => {
                    setTimeout(() => {
                        location.href = '/dashboard';
                    }, 500);
                });
            }
        })();
       
    });
});