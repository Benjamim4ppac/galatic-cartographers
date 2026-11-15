# Versão final mesclada (Benjamim + Yoshida)

## O que veio de cada projeto
- **Do Yoshida:** a declividade real do QGIS (grade de 100 m), a imagem real da área, o gerador da grade (`gerar_matriz.js`) e os testes dele, a regra de nunca atravessar declividade alta nem cortar cantos, e a rota de risco desenhada tracejada.
- **Do Benjamim (já corrigido):** missão base → água, geologia da USGS, escolha automática do pouso e do alvo, decisão PODE SAIR / ATENÇÃO / NÃO SAIR, volta a pé, simulação, inspeção do terreno, teclado e visual.

## O que mudou em relação às duas versões
- A missão saiu do centro de Candor e foi para o quadrado do Yoshida (4–8°S, 76–80°W), que inclui o oeste de Candor.
- O mapa de fundo agora é a imagem real do QGIS e funciona sem internet. Os mosaicos online viraram opcionais.
- A rota agora é A* sobre as 5,6 milhões de células de 100 m (antes era uma grade de 28 × 28 sobre altitude inventada).
- Declividade média custa 4× mais, então a rota só arrisca quando o desvio seguro é bem mais longo. Isso evita os desvios gigantes da regra "só marrom" do Yoshida.
- O pouso exige 5 km de distância da declividade alta real.
- "Inclinação máxima" (que vinha do modelo) virou "Trechos de risco" (que vem do dado real). Rota com trecho de risco recebe ATENÇÃO.
- As zonas de declividade aparecem coloridas no mapa (rosa = risco, roxo = bloqueio), o que faltava no projeto do Yoshida.
- O furo da borda foi corrigido: a faixa de 500 m na beirada do mapa é bloqueada.
- Coordenadas sempre em latitude e longitude, e o nome real do lugar aparece na tela.
- Removidos: o link quebrado "Baixar projeto completo", o Google Fonts, a pasta `dist/` duplicada e o `.gitignore.txt` com nome errado.

## Pendências do time (5 minutos)
- No README, preencher os campos [PREENCHER]: modelo de elevação usado pelo Yoshida, limites em graus de "média" e "alta", fonte da imagem e papéis de cada pessoa.
- Abrir com internet uma vez para confirmar que os mosaicos online (opcionais) carregam.
- Commitar e subir no GitHub.

# Atualização: novas condições de segurança
- **Missão completa:** bateria, O₂ e tempo agora contam ida + 2 h de coleta + volta (antes era só a ida).
- **Zona de desabamento:** faixa de 500 m junto às paredes (declividade alta) virou risco, por deslizamentos, queda de rochas e tremores.
- **Terreno caótico** (unidade CHT da USGS) virou risco.
- **Transpor parede:** se a diferença de altitude estimada ao longo da rota passar de 1.000 m → NÃO SAIR.
- **Janela de luz e vento:** missão acima de 6 h → ATENÇÃO (ventos do amanhecer e do anoitecer); acima de 12 h → NÃO SAIR.
- **Alertas na tela:** cada regra que disparou aparece listada abaixo da missão e da rota de teste.
- **Verificação:** `tools/verificar_rota.js` compara a rota com um Dijkstra de referência (25/25 iguais).
- Todos os parâmetros estão em `data/parametros.js` e explicados no documento de parâmetros.
