let usuarios = [];
let usuariosFiltrados = [];
let usuarioParaExcluir = null;

// Carregar dados quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    carregarUsuarios();
    configurarEventos();
});

// Configurar eventos
function configurarEventos() {
    // Filtros
    document.getElementById('filtroNome').addEventListener('input', filtrarUsuarios);
    document.getElementById('filtroCPF').addEventListener('input', filtrarUsuarios);
    document.getElementById('filtroCEP').addEventListener('input', filtrarUsuarios);
    document.getElementById('filtroCidade').addEventListener('input', filtrarUsuarios);
    document.getElementById('filtroEstado').addEventListener('input', filtrarUsuarios);

    // Botões
    document.getElementById('limparFiltros').addEventListener('click', limparFiltros);
    document.getElementById('filtrarMesmoCEP').addEventListener('click', filtrarMesmoCEP);
    document.getElementById('recarregarDados').addEventListener('click', carregarUsuarios);

    // Modal
    document.getElementById('confirmarExclusao').addEventListener('click', excluirUsuario);
    document.getElementById('cancelarExclusao').addEventListener('click', fecharModal);

    // Fechar modal clicando fora
    document.getElementById('modalConfirmacao').addEventListener('click', function(e) {
        if (e.target === this) {
            fecharModal();
        }
    });
}

// Função para carregar usuários
async function carregarUsuarios() {
    try {
        mostrarLoading(true);

        const response = await fetch('../../backend/api/clientes.php');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            usuarios = data;
            usuariosFiltrados = [...usuarios];
            renderizarTabela();
            atualizarTotal();
        } else {
            throw new Error('Formato de dados inválido');
        }

    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showNotification('Erro ao carregar usuários. Tente novamente.', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Função para renderizar tabela
function renderizarTabela() {
    const tbody = document.getElementById('tabelaUsuarios');
    tbody.innerHTML = '';

    if (usuariosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="no-data">Nenhum usuário encontrado</td></tr>';
        return;
    }

    usuariosFiltrados.forEach(usuario => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${usuario.id}</td>
            <td>${usuario.nome}</td>
            <td>${usuario.cpf}</td>
            <td>${usuario.cep}</td>
            <td>${usuario.endereco}</td>
            <td>${usuario.numero}</td>
            <td>${usuario.bairro}</td>
            <td>${usuario.cidade}</td>
            <td>${usuario.estado}</td>
            <td>${usuario.usuarios_mesmo_cep || 1}</td>
            <td class="acoes">
                <img src="../icons/edit.png" alt="Editar" class="acao-icon edit-icon" onclick="editarUsuario(${usuario.id})">
                <img src="../icons/delete.png" alt="Excluir" class="acao-icon delete-icon" onclick="confirmarExclusao(${usuario.id})">
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Função para editar usuário
async function editarUsuario(id) {
    try {
        mostrarLoading(true);

        const response = await fetch(`../../backend/api/clientes.php?id=${id}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const usuario = await response.json();

        if (usuario.error) {
            throw new Error(usuario.error);
        }

        // Armazenar dados do usuário no localStorage
        localStorage.setItem('usuarioEditando', JSON.stringify(usuario));

        // Redirecionar para página de cadastro
        window.location.href = 'cadastro.html?edit=true';

    } catch (error) {
        console.error('Erro ao editar usuário:', error);
        showNotification('Erro ao carregar dados do usuário.', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// Função para confirmar exclusão
function confirmarExclusao(id) {
    usuarioParaExcluir = id;
    const modal = document.getElementById('modalConfirmacao');
    modal.style.display = 'block';
}

// Função para excluir usuário
async function excluirUsuario() {
    if (!usuarioParaExcluir) return;

    try {
        mostrarLoading(true);

        const response = await fetch(`../../backend/api/clientes.php?id=${usuarioParaExcluir}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            showNotification('Usuário excluído com sucesso!', 'success');
            await carregarUsuarios(); // Recarrega a lista
        } else {
            throw new Error(data.error || 'Erro ao excluir usuário');
        }

    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        showNotification('Erro ao excluir usuário. Tente novamente.', 'error');
    } finally {
        mostrarLoading(false);
        fecharModal();
    }
}

// Função para fechar modal
function fecharModal() {
    document.getElementById('modalConfirmacao').style.display = 'none';
    usuarioParaExcluir = null;
}

// Função para filtrar usuários
function filtrarUsuarios() {
    const filtroNome = document.getElementById('filtroNome').value.toLowerCase();
    const filtroCPF = document.getElementById('filtroCPF').value.toLowerCase();
    const filtroCEP = document.getElementById('filtroCEP').value.toLowerCase();
    const filtroCidade = document.getElementById('filtroCidade').value.toLowerCase();
    const filtroEstado = document.getElementById('filtroEstado').value.toLowerCase();

    usuariosFiltrados = usuarios.filter(usuario => {
        return (
            usuario.nome.toLowerCase().includes(filtroNome) &&
            usuario.cpf.toLowerCase().includes(filtroCPF) &&
            usuario.cep.toLowerCase().includes(filtroCEP) &&
            usuario.cidade.toLowerCase().includes(filtroCidade) &&
            usuario.estado.toLowerCase().includes(filtroEstado)
        );
    });

    renderizarTabela();
    atualizarTotal();
}

// Função para limpar filtros
function limparFiltros() {
    document.getElementById('filtroNome').value = '';
    document.getElementById('filtroCPF').value = '';
    document.getElementById('filtroCEP').value = '';
    document.getElementById('filtroCidade').value = '';
    document.getElementById('filtroEstado').value = '';

    usuariosFiltrados = [...usuarios];
    renderizarTabela();
    atualizarTotal();
}

// Função para filtrar usuários com mesmo CEP
function filtrarMesmoCEP() {
    usuariosFiltrados = usuarios.filter(usuario => {
        return parseInt(usuario.usuarios_mesmo_cep) > 1;
    });

    renderizarTabela();
    atualizarTotal();
}

// Função para atualizar total
function atualizarTotal() {
    const total = document.getElementById('totalUsuarios');
    total.textContent = `Total: ${usuariosFiltrados.length} usuários`;
}

// Função para mostrar loading
function mostrarLoading(show) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'block' : 'none';
}

// Função para mostrar notificação
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Verificar se há mensagens de sucesso na URL
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');

    if (success === '1') {
        showNotification('Usuário cadastrado com sucesso!', 'success');
    } else if (success === '2') {
        showNotification('Usuário atualizado com sucesso!', 'success');
    }

    // Limpar parâmetros da URL
    if (success) {
        const url = new URL(window.location);
        url.searchParams.delete('success');
        window.history.replaceState({}, '', url);
    }
});