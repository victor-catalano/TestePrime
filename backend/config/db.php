<?php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '1234');
define('DB_NAME', 'testeprime');

$conexao = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if (!$conexao) {
    die("Erro na conexão: " . mysqli_connect_error());
}

echo "Conexão feita com sucesso!";
?>