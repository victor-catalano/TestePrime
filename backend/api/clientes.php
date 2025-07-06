<?php
// Configurações do banco
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '1234');
define('DB_NAME', 'testeprime');

// Conexão com o banco
$conexao = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if (!$conexao) {
    die("Erro na conexão: " . mysqli_connect_error());
}

// Configurar charset
mysqli_set_charset($conexao, 'utf8');

// Função para validar CPF
function validarCPF($cpf) {
    $cpf = preg_replace('/[^0-9]/', '', $cpf);

    if (strlen($cpf) != 11 || preg_match('/(\d)\1{10}/', $cpf)) {
        return false;
    }

    for ($t = 9; $t < 11; $t++) {
        for ($d = 0, $c = 0; $c < $t; $c++) {
            $d += $cpf[$c] * (($t + 1) - $c);
        }
        $d = ((10 * $d) % 11) % 10;
        if ($cpf[$c] != $d) {
            return false;
        }
    }

    return true;
}

// Função para buscar ou criar bairro
function buscarOuCriarBairro($conexao, $nome_bairro, $cidade, $estado) {
    // Limpar dados
    $nome_bairro = trim($nome_bairro);
    $cidade = trim($cidade);
    $estado = trim(strtoupper($estado));

    // Buscar bairro existente
    $sql = "SELECT id FROM bairros WHERE nome = ? AND cidade = ? AND estado = ?";
    $stmt = mysqli_prepare($conexao, $sql);
    mysqli_stmt_bind_param($stmt, 'sss', $nome_bairro, $cidade, $estado);
    mysqli_stmt_execute($stmt);
    $resultado = mysqli_stmt_get_result($stmt);

    if ($row = mysqli_fetch_assoc($resultado)) {
        return $row['id'];
    }

    // Criar novo bairro
    $sql = "INSERT INTO bairros (nome, cidade, estado, created_at) VALUES (?, ?, ?, NOW())";
    $stmt = mysqli_prepare($conexao, $sql);
    mysqli_stmt_bind_param($stmt, 'sss', $nome_bairro, $cidade, $estado);

    if (mysqli_stmt_execute($stmt)) {
        return mysqli_insert_id($conexao);
    }

    return false;
}

// Função para buscar ou criar CEP
function buscarOuCriarCEP($conexao, $cep, $endereco, $bairro_id) {
    // Limpar dados
    $cep = trim($cep);
    $endereco = trim($endereco);

    // Buscar CEP existente
    $sql = "SELECT id FROM ceps WHERE cep = ?";
    $stmt = mysqli_prepare($conexao, $sql);
    mysqli_stmt_bind_param($stmt, 's', $cep);
    mysqli_stmt_execute($stmt);
    $resultado = mysqli_stmt_get_result($stmt);

    if ($row = mysqli_fetch_assoc($resultado)) {
        return $row['id'];
    }

    // Criar novo CEP
    $sql = "INSERT INTO ceps (cep, logradouro, bairro_id, created_at) VALUES (?, ?, ?, NOW())";
    $stmt = mysqli_prepare($conexao, $sql);
    mysqli_stmt_bind_param($stmt, 'ssi', $cep, $endereco, $bairro_id);

    if (mysqli_stmt_execute($stmt)) {
        return mysqli_insert_id($conexao);
    }

    return false;
}

// Processar requisições
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Validar e sanitizar dados
    $nome = mysqli_real_escape_string($conexao, trim($_POST['nome']));
    $cpf = preg_replace('/[^0-9]/', '', $_POST['cpf']);
    $cep = preg_replace('/[^0-9]/', '', $_POST['cep']);
    $endereco = mysqli_real_escape_string($conexao, trim($_POST['endereco']));
    $numero = mysqli_real_escape_string($conexao, trim($_POST['numero']));
    $bairro = mysqli_real_escape_string($conexao, trim($_POST['bairro']));
    $cidade = mysqli_real_escape_string($conexao, trim($_POST['cidade']));
    $estado = mysqli_real_escape_string($conexao, trim(strtoupper($_POST['estado'])));

    // Validações
    if (empty($nome) || empty($cpf) || empty($cep) || empty($endereco) || empty($numero) || empty($bairro) || empty($cidade) || empty($estado)) {
        header("Location: ../../frontend/pages/cadastro.html?error=2");
        exit();
    }

    if (!validarCPF($cpf)) {
        header("Location: ../../frontend/pages/cadastro.html?error=3");
        exit();
    }

    $id = isset($_POST['idusuario']) ? (int)$_POST['idusuario'] : null;

    // Verificar se CPF já existe (excluindo o próprio usuário em caso de edição)
    $sql = "SELECT idusuario FROM usuario WHERE cpf = ?";
    if ($id) {
        $sql .= " AND idusuario != ?";
    }

    $stmt = mysqli_prepare($conexao, $sql);
    $cpf_formatado = substr($cpf, 0, 3) . '.' . substr($cpf, 3, 3) . '.' . substr($cpf, 6, 3) . '-' . substr($cpf, 9, 2);

    if ($id) {
        mysqli_stmt_bind_param($stmt, 'si', $cpf_formatado, $id);
    } else {
        mysqli_stmt_bind_param($stmt, 's', $cpf_formatado);
    }

    mysqli_stmt_execute($stmt);
    $resultado = mysqli_stmt_get_result($stmt);

    if (mysqli_fetch_assoc($resultado)) {
        header("Location: ../../frontend/pages/cadastro.html?error=4");
        exit();
    }

    // Iniciar transação
    mysqli_begin_transaction($conexao);

    try {
        // Buscar ou criar bairro
        $bairro_id = buscarOuCriarBairro($conexao, $bairro, $cidade, $estado);
        if (!$bairro_id) {
            throw new Exception("Erro ao criar/buscar bairro");
        }

        // Buscar ou criar CEP
        $cep_formatado = substr($cep, 0, 5) . '-' . substr($cep, 5);
        $cep_id = buscarOuCriarCEP($conexao, $cep_formatado, $endereco, $bairro_id);
        if (!$cep_id) {
            throw new Exception("Erro ao criar/buscar CEP");
        }

        $numero_int = (int)$numero;

        if ($id) {
            // É um update
            $sql = "UPDATE usuario SET nome = ?, cpf = ?, cep = ?, endereco = ?, numero = ?, bairro = ?, cidade = ?, estado = ? WHERE idusuario = ?";
            $stmt = mysqli_prepare($conexao, $sql);
            mysqli_stmt_bind_param($stmt, 'ssssisssi', $nome, $cpf_formatado, $cep_formatado, $endereco, $numero_int, $bairro, $cidade, $estado, $id);

            if (!mysqli_stmt_execute($stmt)) {
                throw new Exception("Erro ao atualizar usuário");
            }

            mysqli_commit($conexao);
            header("Location: ../../frontend/pages/relatorio.html?success=2");
            exit();
        } else {
            // Inserir novo usuário
            $sql = "INSERT INTO usuario (nome, cpf, cep, endereco, numero, bairro, cidade, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = mysqli_prepare($conexao, $sql);
            mysqli_stmt_bind_param($stmt, 'ssssisss', $nome, $cpf_formatado, $cep_formatado, $endereco, $numero_int, $bairro, $cidade, $estado);

            if (!mysqli_stmt_execute($stmt)) {
                throw new Exception("Erro ao inserir usuário");
            }

            mysqli_commit($conexao);
            header("Location: ../../frontend/pages/relatorio.html?success=1");
            exit();
        }

    } catch (Exception $e) {
        mysqli_rollback($conexao);
        error_log("Erro no cadastro: " . $e->getMessage());
        header("Location: ../../frontend/pages/cadastro.html?error=1");
        exit();
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // Buscar usuário por ID (para edição)
    if (isset($_GET['id']) && !empty($_GET['id'])) {
        $id = (int) $_GET['id'];

        $sql = "SELECT * FROM usuario WHERE idusuario = ?";
        $stmt = mysqli_prepare($conexao, $sql);
        mysqli_stmt_bind_param($stmt, 'i', $id);
        mysqli_stmt_execute($stmt);
        $resultado = mysqli_stmt_get_result($stmt);

        if ($usuario = mysqli_fetch_assoc($resultado)) {
            header('Content-Type: application/json');
            echo json_encode($usuario);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Usuário não encontrado']);
        }
        exit();
    }

    // Verificar se é para buscar usuários por CEP
    if (isset($_GET['cep']) && !empty($_GET['cep'])) {
        $cep = mysqli_real_escape_string($conexao, $_GET['cep']);

        $sql = "SELECT u.idusuario as id, u.nome, u.cpf, u.cep, u.endereco, u.numero, u.bairro, u.cidade, u.estado,
                       c.logradouro, b.nome as bairro_nome, b.cidade as bairro_cidade, b.estado as bairro_estado
                FROM usuario u 
                LEFT JOIN ceps c ON u.cep = c.cep
                LEFT JOIN bairros b ON c.bairro_id = b.id
                WHERE u.cep = ?
                ORDER BY u.nome";

        $stmt = mysqli_prepare($conexao, $sql);
        mysqli_stmt_bind_param($stmt, 's', $cep);
        mysqli_stmt_execute($stmt);
        $resultado = mysqli_stmt_get_result($stmt);
    } else {
        // Listar todos os usuários
        $sql = "SELECT u.idusuario as id, u.nome, u.cpf, u.cep, u.endereco, u.numero, u.bairro, u.cidade, u.estado,
                       c.logradouro, b.nome as bairro_nome, b.cidade as bairro_cidade, b.estado as bairro_estado,
                       (SELECT COUNT(*) FROM usuario u2 WHERE u2.cep = u.cep) as usuarios_mesmo_cep
                FROM usuario u 
                LEFT JOIN ceps c ON u.cep = c.cep
                LEFT JOIN bairros b ON c.bairro_id = b.id
                ORDER BY u.nome";

        $resultado = mysqli_query($conexao, $sql);
    }

    if (!$resultado) {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao buscar usuários']);
        exit();
    }

    $usuarios = [];
    while ($row = mysqli_fetch_assoc($resultado)) {
        $usuarios[] = $row;
    }

    header('Content-Type: application/json');
    echo json_encode($usuarios);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {

    // Deletar usuário
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID não fornecido']);
        exit();
    }

    $sql = "DELETE FROM usuario WHERE idusuario = ?";
    $stmt = mysqli_prepare($conexao, $sql);
    mysqli_stmt_bind_param($stmt, 'i', $id);

    if (mysqli_stmt_execute($stmt)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Erro ao deletar usuário']);
    }

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
}
mysqli_close($conexao);
?>