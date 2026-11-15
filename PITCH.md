# Roteiro do pitch — Mars Survival Guide

## 0. Regras da entrega (não esquecer)
- A demo é **um link público**: vídeo de até **30 segundos** OU apresentação de até **7 slides** (contando o título). Passou disso, fica fora do julgamento global.
- Página do projeto e slides **em inglês**. Vídeo pode ser falado em português, mas **com legenda em inglês**.
- Link do GitHub público junto.
- **Recomendação:** façam os 7 slides como demo oficial (cabe mais coisa e é mais seguro). Se sobrar tempo, gravem o vídeo de 30 s para usar na apresentação local.

---

## 1. O que vocês precisam entender (em 2 minutos)

**A ideia em uma frase:** em Marte não tem GPS, internet nem resgate; nosso mapa roda a bordo, sem internet, e responde "dá para ir buscar água e voltar vivo?".

**Onde:** oeste de Candor Chasma, dentro de Valles Marineris, o maior cânion do Sistema Solar (até 7 km de profundidade). Área de 237 × 237 km.

**Por que lá:** o fundo do cânion é plano (bom para pousar) e baixo (mais atmosfera para frear e proteger da radiação). Perto dele há **depósitos em camadas**, antigos sedimentos de lago onde satélites detectaram **sulfatos hidratados**: minerais com água presa na estrutura. Aquecendo o material, sai água.

**As três camadas de dados:**
1. **Imagem real da área** (exportada do QGIS). É o fundo do mapa.
2. **Declividade real** (QGIS, trabalho do Yoshida): o mapa foi dividido em 5,6 milhões de quadradinhos de 100 m. Cada um é *seguro*, *risco* (declividade média, rosa) ou *bloqueado* (declividade alta, roxo). O roxo cai exatamente nas paredes do cânion.
3. **Geologia da USGS** (carta I-897, de 1978): diz onde é fundo de cânion, parede, planalto e depósito com água.

**O que o app faz, em ordem:**
1. Procura um ponto de pouso no fundo do cânion, em terreno seguro e a pelo menos 5 km de qualquer parede. Achou um a 7,2 km.
2. Escolhe o depósito com água mais próximo que tenha rota segura.
3. Calcula a rota com o algoritmo **A\*** ("A estrela"): ele testa caminhos pela grade e acha o de menor custo. Roxo (declividade alta) nunca. Três tipos de risco deixam o caminho mais "caro": declividade média (4×), zona de desabamento junto às paredes (3×) e terreno caótico (4×). Rota com risco aparece tracejada. Conferimos com um algoritmo de referência: 25 de 25 rotas idênticas.
4. Calcula a **missão completa**: ida + 2 h de coleta + volta. Tempo, bateria, oxigênio e radiação.
5. Aplica as **regras de sobrevivência** e mostra na tela cada regra que disparou (lista completa no documento de parâmetros).
6. Dá o veredito: **PODE SAIR**, **ATENÇÃO** ou **NÃO SAIR**.

**Números da demo (missão automática):** 4,0 km de ida · 2h48 no total · 8% da bateria · 196 g de O₂ (12%) · volta a pé em 1h19 de 8h · nenhuma regra disparada → **PODE SAIR**.
**Contraexemplo (rota de teste do cânion até o planalto):** 133 km, 10 km de trechos de risco e **5 regras de bloqueio** ao mesmo tempo: bateria (295%), O₂ (133%), volta a pé de 48 h, desnível de 5.400 m (transpor a parede) e 32 h de missão → **NÃO SAIR**.

**O que é real e o que é estimativa (falem isso com segurança, honestidade conta ponto):**
- Real: imagem, declividade, geologia, regra de rota.
- Estimativa: altitude (modelo por tipo de terreno), temperatura, radiação, consumo do rover. Os valores de referência têm fonte (Curiosity RAD ~0,67 mSv/dia; NASA ~0,84 kg de O₂ por pessoa por dia).

---

## 2. Apresentação em 7 slides (texto em inglês + o que falar)

**Slide 1 — Title**
- *Mars Survival Guide: can we reach the water and still get home?*
- Team Cartógrafos das Galáxias · NASA Space Apps 2026 · Interplanetary Survival Guide
- Nomes dos integrantes.
- 🗣️ Apresentem o time e a pergunta central.

**Slide 2 — The problem**
- No GPS. No internet. No rescue. Up to 24 min to reach Earth.
- In a canyon 7 km deep, the shortest route can kill you.
- 🗣️ "O astronauta precisa decidir sozinho. Um mapa comum mostra o caminho mais curto; em Marte, isso pode significar descer uma parede de quilômetros."

**Slide 3 — Where and why**
- Western Candor Chasma, Valles Marineris (4–8°S, 76–80°W).
- Flat, low canyon floor for landing · layered deposits with hydrated minerals = water.
- Imagem: print da área com o ponto de pouso.
- 🗣️ "Água é a base de tudo: beber, respirar (oxigênio) e combustível."

**Slide 4 — Our solution**
- Onboard map, 100% offline: data prepared on Earth, decisions made on Mars.
- Print do app com a missão (painel PODE SAIR visível).
- 🗣️ "O app escolhe o pouso, acha a água, traça a rota e diz se é seguro sair."

**Slide 5 — How it works**
- Real slope from QGIS → 5.6 million cells of 100 m
- Risk layers: medium slope (4×), rockfall zone along walls (3×), chaotic terrain (4×); steep slopes blocked
- USGS geologic map → water targets
- Full mission check (out + sampling + back): battery, oxygen, daylight and wind window, wall crossing, and *can the crew walk back if the rover fails?*
- 🗣️ Expliquem a regra da volta a pé: é o diferencial.

**Slide 6 — Demo**
- Lado a lado: missão automática (**GO**: 4 km, 2h48 round trip, 8% battery, walk-back 1h19 of 8h) × rota até o planalto (**NO-GO**: 133 km, 5 survival rules broken at once).
- 🗣️ "O mesmo mapa que libera uma missão segura barra uma missão que mataria a tripulação."

**Slide 7 — Data, honesty and next steps**
- NASA/USGS data: QGIS slope + image, USGS I-897 geology, Curiosity RAD reference, NASA O₂ reference.
- Estimates: altitude, temperature, radiation.
- Next: real elevation for altitude, THEMIS thermal, CRISM minerals, dunes and rocks (HiRISE), communication windows, dust-storm forecast, **scout rover that checks the route before the crew**.
- GitHub link.
- 🗣️ "Sabemos o que é estimativa e mostramos isso no app. O próximo passo é um rover batedor que percorre a rota antes da tripulação."

---

## 3. Vídeo de 30 segundos (alternativa ou complemento)

Gravem a tela do app (OBS ou gravador do Windows: Win + G) e narrem por cima. Legenda em inglês obrigatória.

| Tempo | Tela | Narração (PT) | Legenda (EN) |
|---|---|---|---|
| 0–5 s | Visão "Área da missão" (tecla F) | "Somos os Cartógrafos das Galáxias. Em Marte não há GPS, internet nem resgate." | We are Cartógrafos das Galáxias. On Mars there is no GPS, no internet, no rescue. |
| 5–11 s | Ligar/desligar declividade (tecla V) | "Usamos dados reais de declividade: roxo é parede, rosa é risco." | Real slope data: purple is a wall, pink is risk. |
| 11–19 s | Tecla 1 e depois P (simulação) | "O app escolhe o pouso, acha a água mais próxima e traça a rota segura: pode sair." | It picks a landing site, finds the nearest water and plans a safe route: GO. |
| 19–26 s | Tecla M, clicar do cânion até o planalto | "Se a tripulação não conseguir voltar a pé caso o rover quebre, a resposta é: não saia." | If the crew can't walk back when the rover fails, the answer is: NO-GO. |
| 26–30 s | Painel lateral + nome do projeto | "Mars Survival Guide: funciona offline, a bordo." | Mars Survival Guide. Offline. Onboard. |

---

## 4. Perguntas que podem aparecer (e respostas)

- **"Os dados são reais?"** A imagem, a declividade e a geologia, sim. Altitude, temperatura e radiação são estimativas com valores de referência de missões reais, e o app escreve "estimada" em cada uma.
- **"Por que não usar a rota mais curta?"** Porque ela atravessa paredes. A nossa nunca cruza declividade alta e só passa por áreas de risco quando não há alternativa razoável, e avisa.
- **"Como sabem que a rota está certa?"** Comparamos o nosso algoritmo com um de referência, mais lento mas garantidamente correto: deu exatamente o mesmo custo em 25 de 25 rotas aleatórias. Os testes do gerador de terreno também passam (15 de 15).
- **"E os outros perigos do cânion?"** Paredes, encostas, deslizamentos e terreno caótico entram no cálculo da rota. Ventos do amanhecer e do anoitecer entram como janela de horário. Dunas, rochas, tempestades de poeira e sombra de comunicação estão nos próximos passos, porque ainda não temos dados dessa área.
- **"Os pesos (4×, 3×) vêm de onde?"** São escolhas de engenharia da equipe, todas num arquivo só (`parametros.js`). Um centro de controle real calibraria esses valores com testes de rover.
- **"Como funciona sem internet?"** Todo o processamento pesado é feito na Terra (QGIS e scripts). O app só lê o pacote pronto, que vai junto na missão.
- **"Por que a volta a pé?"** Porque o pior cenário é o rover quebrar longe da base. Se nesse caso a tripulação não volta antes do oxigênio do traje acabar, a missão não deveria sair.
- **"O que é o A\*?"** Um algoritmo que procura o caminho de menor custo numa grade, usando a distância até o destino como pista para não testar todas as possibilidades.
- **"Usaram IA?"** Sim, para ajudar a escrever e revisar código e textos. Escolha da região, dos dados e das regras e os testes foram da equipe.

---

## 5. Página do projeto (copiar e colar, em inglês)

**Title:** Mars Survival Guide

**Short summary:** An offline, onboard map for a crewed mission in western Candor Chasma, Valles Marineris. Using real slope data from QGIS, the USGS geologic map and an A* route planner on a 100 m grid, it picks a safe landing site, finds the nearest water-bearing deposit, plans a route that never crosses steep slopes, and gives the crew a GO / CAUTION / NO-GO decision based on battery, oxygen and whether they could walk back if the rover fails.

**How we used space agency data:** NASA/USGS geologic map I-897 (McCauley, 1978) for terrain units and water targets; Mars elevation data processed in QGIS into slope classes [PREENCHER: dataset]; Curiosity RAD radiation measurements and NASA life-support oxygen values as references for our estimates.

---

## 6. Checklist final
- [ ] Preencher os [PREENCHER] do README e desta página
- [ ] Testar o `index.html` em outro computador
- [ ] Subir no GitHub e deixar o repositório público
- [ ] Fazer os 7 slides (ou o vídeo) e deixar o link público
- [ ] Preencher a página do projeto em inglês, marcar o uso de IA e enviar antes do prazo
