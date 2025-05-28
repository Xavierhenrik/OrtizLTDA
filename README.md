# Site Institucional Ortiz Ltda

Site institucional para a Ortiz Ltda, com painel administrativo para gerenciar e exibir projetos com múltiplas imagens.

## Tecnologias Utilizadas

*   **Backend:** Node.js, Express.js, MongoDB (com Mongoose)
*   **Frontend:** HTML, CSS, JavaScript
*   **Outras:** bcryptjs, express-session, connect-mongo, dotenv, multer

## Configuração e Execução

1.  Clone este repositório:
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd ortizltda-site
    ```

2.  Instale as dependências:
    ```bash
    npm install
    ```

3.  Certifique-se de ter o **MongoDB** instalado e rodando na sua máquina.

4.  Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
    ```env
    MONGODB_URI=mongodb://127.0.0.1:27017/ortizltda
    SESSION_SECRET=sua_chave_secreta_muito_segura
    ADMIN_EMAIL=seu_email@exemplo.com
    ADMIN_PASSWORD=sua_senha_segura
    ```
    Substitua `sua_chave_secreta_muito_segura`, `seu_email@exemplo.com` e `sua_senha_segura` pelas suas credenciais desejadas para o usuário administrador inicial.

5.  Crie o usuário administrador inicial executando:
    ```bash
    node scripts/createAdmin.js
    ```

6.  Inicie o servidor:
    ```bash
    npm start
    ```

7.  Acesse o site e o painel administrativo no seu navegador:
    *   Site: `http://localhost:3000`
    *   Página de Projetos: `http://localhost:3000/projetos`
    *   Login Administrativo: `http://localhost:3000/admin/login`

## Funcionalidades

*   Exibição pública de projetos com galeria de imagens.
*   Painel administrativo para CRUD de projetos.
*   Upload de múltiplas imagens por projeto.
*   Autenticação de administrador.
*   Categorização de projetos.

## Contribuição

Instruções sobre como contribuir para o projeto (opcional).

## Licença

Informações sobre a licença do projeto (opcional). 