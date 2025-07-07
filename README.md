# TestePrime

Sistema web para cadastro, edição, listagem e exclusão de usuários com integração de CEP e validação de CPF.

## Tecnologias Utilizadas

- Frontend: HTML, CSS, JavaScript (puro)
- Backend: PHP (puro)
- Banco de Dados: MySQL
- API de CEP: ViaCEP
- Versionamento: Git + GitHub

---

## Funcionalidades

- Cadastro de usuários com validação de CPF e CEP
- Edição de usuários existentes
- Máscaras para CPF e CEP no formulário
- Busca automática de endereço via CEP
- Notificações de sucesso/erro
- Exclusão de usuários com confirmação
- Tela de relatório com listagem e filtro

---

## Estrutura de Pastas
TestePrime/
├── backend/
│   └── api/
│       └── clientes.php
├── frontend/
│   ├── css/
│   │   └── style.css
│   ├── icons/
│   │   ├── delete.png
│   │   ├── edit.png
│   │   ├── patient_list.png
│   │   └── person_add.png
│   ├── js/
│   │   ├── cadastro.js
│   │   └── relatorio.js
│   └── pages/
│       ├── cadastro.html
│       └── relatorio.html
├── index.html
└── README.md


## Pré requisitos
- PHP 7.4+
- MySQL 5.7+
- Servidor local
- Python3

## Como rodar o projeto
- git clone https://github.com/victor-catalano/TestePrime.git
- No arquivo clientes.php, configure a conexão com o banco de dados:

// Configurações do banco
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'testeprime');

// Conexão com o banco
$conexao = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if (!$conexao) {
    die("Erro na conexão: " . mysqli_connect_error());
}

- php -S localhost:8000
- acesse: http://localhost:8000/frontend/pages/cadastro.html

## Telas do sistema
### Tela de Cadastro
![image](https://github.com/user-attachments/assets/533abd81-f05f-4495-886b-c2ef19b7d44c)
### Tela de Relatórios
![image](https://github.com/user-attachments/assets/77e44444-36e5-41c2-a235-508df6fbfe0e)
### Filtro de mesmo CEP para N usuarios
![image](https://github.com/user-attachments/assets/2c6c1193-eb85-44ba-81e1-05d4e370bc5e)
### Filtro por nome
![image](https://github.com/user-attachments/assets/a1c51302-94b4-4f11-8a72-3fbe40840bcc)
### Filtro por cpf
![image](https://github.com/user-attachments/assets/95799966-c88f-426b-ba24-2c38a2fb7622)
### Filtro por cep
![image](https://github.com/user-attachments/assets/9862cc43-e29e-4a66-a62a-5161978ffb31)
### Filtro por cidade
![image](https://github.com/user-attachments/assets/d82f04f9-c785-4a6d-b5e5-ce8ce23768c7)
### Filtro por estado
![image](https://github.com/user-attachments/assets/1c79c4f0-0917-45a2-90d2-a192b1348b20)

## Comandos SQL para criar estrutura do Banco de Dados
### Tabela usuario
CREATE TABLE usuario (
    idusuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    cep VARCHAR(45) NOT NULL,
    endereco VARCHAR(45) NOT NULL,
    numero SMALLINT NOT NULL,
    bairro VARCHAR(45) NOT NULL,
    cidade VARCHAR(45) NOT NULL,
    estado VARCHAR(45) NOT NULL
);
ALTER TABLE usuario ADD UNIQUE (cpf);

### Tabela bairros
CREATE TABLE bairros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

### Tabela ceps
CREATE TABLE ceps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cep VARCHAR(10) NOT NULL,
    logradouro VARCHAR(255),
    bairro_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bairro_id) REFERENCES bairros(id)
);


