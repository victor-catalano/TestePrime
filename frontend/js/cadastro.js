let usuarioEditando = null;

document.addEventListener('DOMContentLoaded', function() {
    configurarEventos();
    verificarEdicao();
    verificarMensagensURL();
});

function configurarEventos() {
    // Máscaras de input
    document.getElementById('cpf').addEventListener('input', function(e) {
        e.target.value = aplicarMascaraCPF(e.target.value);
    });

    document.getElementById('cep').addEventListener('input', function(e) {
        e.target.value = aplicarMascaraCEP(e.target.value);
    });

    // Buscar CEP
    document.getElementById('cep').addEventListener('blur', buscarCEP);

    // Submissão do formulário
    document.getElementById('formularioCadastro').addEventListener('submit', function(e) {
        e.preventDefault();
        salvarUsuario();
    });

    // Botão cancelar
    document.getElementById('btnCancelar').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja cancelar? Os dados não salvos serão perdidos.')) {
            limparFormulario();
            window.location.href = 'relatorio.html';
        }
    });
}

function verificarEdicao() {
    // Verificar se há um usuário sendo editado
    const usuarioArmazenado = localStorage.getItem('usuarioEditando');

    if (usuarioArmazenado) {
        try {
            usuarioEditando = JSON.parse(usuarioArmazenado);
            preencherFormulario(usuarioEditando);

            // Alterar título e botão
            document.querySelector('h1').textContent = 'Editar Usuário';
            document.getElementById('btnSalvar').textContent = 'Atualizar';

            // Limpar localStorage
            localStorage.removeItem('usuarioEditando');

        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            showNotification('Erro ao carregar dados do usuário.', 'error');
        }
    }
}

function preencherFormulario(usuario) {
    document.getElementById('nome').value = usuario.nome || '';
    document.getElementById('cpf').value = usuario.cpf || '';
    document.getElementById('cep').value = usuario.cep || '';
    document.getElementById('endereco').value = usuario.endereco || '';
    document.getElementById('numero').value = usuario.numero || '';
    document.getElementById('bairro').value = usuario.bairro || '';
    document.getElementById('cidade').value = usuario.cidade || '';
    document.getElementById('estado').value = usuario.estado || '';
}

async function salvarUsuario() {
    try {
        const formData = new FormData();

        // Dados do formulário
        formData.append('nome', document.getElementById('nome').value.trim());
        formData.append('cpf', document.getElementById('cpf').value.trim());
        formData.append('cep', document.getElementById('cep').value.trim());
        formData.append('endereco', document.getElementById('endereco').value.trim());
        formData.append('numero', document.getElementById('numero').value.trim());
        formData.append('bairro', document.getElementById('bairro').value.trim());
        formData.append('cidade', document.getElementById('cidade').value.trim());
        formData.append('estado', document.getElementById('estado').value.trim());

        // Se está editando, adicionar ID
        if (usuarioEditando) {
            formData.append('idusuario', usuarioEditando.idusuario);
        }

        // Validações no frontend
        if (!validarFormulario(formData)) {
            return;
        }

        mostrarLoading(true);

        const response = await fetch('../../backend/api/clientes.php', {
            method: 'POST',
            body: formData
        });

        // Como o backend faz redirect, verificamos se houve erro
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Se chegou aqui, significa que deu certo
        const message = usuarioEditando ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!';
        showNotification(message, 'success');

        // Limpar formulário e redirecionar
        setTimeout(() => {
            limparFormulario();
            window.location.href = 'relatorio.html';
        }, 1500);

    } catch (error) {
        console.error('Erro ao salvar usuário:', error);
        showNotification('Erro ao salvar usuário. Tente novamente.', 'error');
    } finally {
        mostrarLoading(false);
    }
}

function validarFormulario(formData) {
    const nome = formData.get('nome');
    const cpf = formData.get('cpf');
    const cep = formData.get('cep');
    const endereco = formData.get('endereco');
    const numero = formData.get('numero');
    const bairro = formData.get('bairro');
    const cidade = formData.get('cidade');
    const estado = formData.get('estado');

    // Validar campos obrigatórios
    if (!nome || !cpf || !cep || !endereco || !numero || !bairro || !cidade || !estado) {
        showNotification('Todos os campos são obrigatórios.', 'error');
        return false;
    }

    // Validar CPF
    if (!validarCPF(cpf.replace(/[^0-9]/g, ''))) {
        showNotification('CPF inválido.', 'error');
        return false;
    }

    // Validar CEP
    if (cep.replace(/[^0-9]/g, '').length !== 8) {
        showNotification('CEP deve ter 8 dígitos.', 'error');
        return false;
    }

    return true;
}

function validarCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^0-9]/g, '');

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Calcula o primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let dv1 = resto < 2 ? 0 : resto;

    // Calcula o segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let dv2 = resto < 2 ? 0 : resto;

    // Verifica se os dígitos verificadores são válidos
    return parseInt(cpf.charAt(9)) === dv1 && parseInt(cpf.charAt(10)) === dv2;
}

async function buscarCEP() {
    const cep = document.getElementById('cep').value.replace(/[^0-9]/g, '');

    if (cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                document.getElementById('endereco').value = data.logradouro || '';
                document.getElementById('bairro').value = data.bairro || '';
                document.getElementById('cidade').value = data.localidade || '';
                document.getElementById('estado').value = data.uf || '';

                // Focar no campo número
                document.getElementById('numero').focus();
            } else {
                showNotification('CEP não encontrado.', 'error');
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            showNotification('Erro ao buscar CEP. Verifique sua conexão.', 'error');
        }
    }
}

function aplicarMascaraCPF(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
}

function aplicarMascaraCEP(value) {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
}

function limparFormulario() {
    document.getElementById('formularioCadastro').reset();
    usuarioEditando = null;

    // Restaurar título e botão
    document.querySelector('h1').textContent = 'Cadastro de Usuário';
    document.getElementById('btnSalvar').textContent = 'Salvar';
}

function mostrarLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.className = `notification ${type} show`; // Adiciona a classe 'show'

        // Remove a notificação após 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
}

function verificarMensagensURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
        let message = '';
        switch (error) {
            case '1':
                message = 'Erro interno do servidor. Tente novamente.';
                break;
            case '2':
                message = 'Todos os campos são obrigatórios.';
                break;
            case '3':
                message = 'CPF inválido.';
                break;
            case '4':
                message = 'CPF já cadastrado no sistema.';
                break;
            default:
                message = 'Erro desconhecido. Tente novamente.';
        }

        showNotification(message, 'error');

        // Limpar parâmetros da URL
        const url = new URL(window.location);
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url);
    }
};