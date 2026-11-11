# Arquitetura funcional

## Responsabilidades

- **Mestre:** recebe contexto da campanha, estado atual, últimas cenas e ação do jogador; devolve narração, opções, prompt visual e propostas de efeitos.
- **Administrador:** recebe as regras e propostas do Mestre; normaliza operações estruturadas. Não grava diretamente.
- **Motor determinístico:** valida e aplica somente operações permitidas, com limites numéricos e inventário controlado.
- **Ilustrador:** recebe o prompt visual e gera uma imagem por endpoint configurado. Se indisponível, a campanha continua sem imagem.

## Persistência

- `campaigns`: premissa, cânone, regras, estado atual e datas.
- `turns`: ação do jogador, narração, opções, ações aplicadas e imagem da cena.
- `assets`: reservado para itens, monstros e imagens catalogadas.

## Princípio de autoridade

A pessoa criadora da campanha define cânone e regras. O Mestre interpreta a ficção. O Administrador propõe operações. O motor de regras é a única camada autorizada a modificar o estado persistido. Quando uma regra não estiver definida, o sistema deve pedir decisão ao jogador em vez de inventar uma regra permanente.
