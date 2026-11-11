# Crônicas de Éter — Solo (fundação 0.1)

Projeto solo: sem salas, sincronização em tempo real ou infraestrutura multiplayer. A campanha roda no navegador, enquanto o servidor mantém as chaves das APIs e salva os dados em SQLite.

## O que já existe nesta fundação

- Protótipo visual anterior preservado em `public/legado.html`.
- Nova área **Mestre IA · Solo** integrada ao site.
- Campanhas com premissa, cânone/história, descrição do mundo e regras da casa editáveis.
- Banco SQLite persistente (`data/cronicas-eter.sqlite`).
- Três funções separadas: Mestre (narração), Administrador (ações estruturadas) e Ilustrador (geração opcional de imagem).
- Motor determinístico valida dano, cura, XP, itens, registros e sinalizadores antes de salvar.
- Histórico de turnos e estado da campanha persistidos.
- Rolagem D20 no servidor.
- Chaves das APIs ficam no servidor, nunca no navegador.

## Requisitos

- Node.js 20 ou superior.
- Um provedor de texto compatível com `/v1/chat/completions`. Pode ser local (por exemplo, Ollama) ou remoto.
- Um provedor de imagem compatível com `/v1/images/generations` para ilustração. É opcional.

> “Gratuito e ilimitado” depende do provedor e do hardware. O software não promete franquia ilimitada. Rodar modelos localmente evita cobrança por chamada, mas consome memória, CPU/GPU e energia.

## Instalação local

1. Instale Node.js 20+.
2. Na pasta do projeto, execute `npm install`.
3. Copie `.env.example` para `.env` e configure o provedor de IA.
4. Execute `npm start`.
5. Abra `http://localhost:3000`.
6. Entre em **Mestre IA · Solo**, defina suas regras e história e crie uma campanha.

### Exemplo de IA local com Ollama

- Inicie o Ollama e baixe um modelo de chat compatível com seu computador.
- Configure `MASTER_AI_BASE_URL` e `ADMIN_AI_BASE_URL` como `http://127.0.0.1:11434/v1`.
- Use `MASTER_AI_MODEL` e `ADMIN_AI_MODEL` com os identificadores exatos dos modelos instalados. `ollama` pode ser usado como chave local.
- A geração de imagens pode ficar desativada inicialmente.

## Segurança e limites atuais

- Não exponha o servidor diretamente à internet sem autenticação, HTTPS, limites de requisição e política de backup.
- SQLite é apropriado para o modo solo/local inicial. Para hospedagem multiusuário futura, reavaliar banco e autenticação.
- O adaptador de imagem requer endpoint compatível; provedores diferentes podem exigir adaptação específica.
- As respostas das IAs são tratadas como propostas. O motor de regras valida os efeitos antes de persistir.
- A versão atual é uma base executável, não um serviço público hospedado nem uma integração de API já autenticada. Você precisará fornecer/configurar o provedor escolhido.

## Próximas etapas

1. Formalizar o sistema de regras de Crônicas de Éter e o formato de ficha oficial.
2. Integrar o estado de personagem/inventário do protótipo antigo ao estado persistente do novo motor.
3. Implementar bestiário, iniciativa, turnos de combate, testes com CD, condições e loot com validação.
4. Adicionar armazenamento local das imagens geradas e galeria de cenas.
5. Criar backup/exportação e restauração de campanhas.
6. Revisar segurança e empacotar como PWA instalável no Android.
