// ============================================================================
// PARÂMETROS DA MISSÃO
// Todos os valores ficam aqui para a equipe ajustar num só lugar.
// Onde há fonte, ela está indicada; o resto é estimativa de engenharia da equipe.
// ============================================================================

// Área de operação: o quadrado do terreno do QGIS (4–8°S, 76–80°W),
// que inclui a borda oeste de Candor Chasma (Valles Marineris).
const AREA_OPERACIONAL = {
    centro: { lat: -6.0, lon: -78.0 },
    sul: -8.0, norte: -4.0, oeste: -80.0, leste: -76.0
};

// Centro da missão: começa no centro da área e é trocado pelo ponto de pouso escolhido
const MISSION_CENTER = { lat: AREA_OPERACIONAL.centro.lat, lon: AREA_OPERACIONAL.centro.lon };

// Rover pressurizado (estimativas da equipe)
const ROVER = {
    velocidadeMaxKmh: 10,       // terreno plano
    velocidadeRiscoKmh: 4,      // trechos de declividade média
    fatorEnergiaRisco: 1.8,     // trechos de declividade média gastam mais bateria
    energiaPlanoKwhPorKm: 0.42,
    massaKg: 1800,
    eficiencia: 0.75,
    bateriaKwh: 45
};

// Tripulação dentro do rover
// ~0,84 kg de O₂ por pessoa por dia: referência de consumo metabólico usada pela NASA
// em projetos de suporte de vida (≈ 35 g/h por pessoa).
const TRIPULACAO = {
    pessoas: 2,
    o2GramasPorPessoaHora: 35,
    reservaO2Gramas: 1680       // 24 h para 2 pessoas
};

// Traje para retorno a pé em emergência (se o rover quebrar no destino)
// Trajes de caminhada espacial atuais são projetados para EVAs de cerca de 8 h.
const TRAJE = {
    velocidadeCaminhadaKmh: 3,
    velocidadeCaminhadaRiscoKmh: 1.5,
    autonomiaHoras: 8
};

// Ambiente (modelo simplificado)
// Radiação: o instrumento RAD do rover Curiosity mediu em média ~0,67 mSv/dia
// na cratera Gale, a cerca de -4.500 m de altitude.
const AMBIENTE = {
    radiacaoMsvDiaReferencia: 0.67,
    altitudeReferenciaM: -4500,
    pressaoReferenciaPa: 610,   // pressão média no nível de referência de Marte
    alturaEscalaM: 11100        // altura de escala da atmosfera marciana
};

// ============================================================================
// RESTRIÇÕES DE TERRENO (usadas pelo planejador de rota)
// A rota prioriza caminhos inteiramente seguros, mesmo que sejam mais longos.
// Só permite risco quando não há caminho seguro; nesse caso, os custos abaixo
// penalizam os trechos arriscados. Declividade alta é sempre bloqueio.
// ============================================================================
const RISCOS_TERRENO = {
    declividadeMedia: { custo: 4, nome: "Declividade média" },          // classe rosa do QGIS
    zonaDesabamento:  { custo: 3, nome: "Zona de desabamento", faixaM: 500 }, // faixa junto às paredes
    terrenoCaotico:   { custo: 4, nome: "Terreno caótico" }             // unidade CHT da USGS
};

// Distância mínima entre o ponto de pouso e qualquer área de declividade alta
const DISTANCIA_SEGURA_PAREDE_KM = 5;

// ============================================================================
// REGRAS DE DECISÃO (PODE SAIR / ATENÇÃO / NÃO SAIR)
// ============================================================================
const REGRAS = {
    tempoColetaHoras: 2,        // tempo parado no alvo coletando material
    janelaSeguraHoras: 6,       // meio do dia (≈10h–16h locais): longe dos ventos do amanhecer/anoitecer
    horasDeLuz: 12,             // um dia marciano tem ~24h40; ~12 h de luz
    limiteDesnivelM: 1000,      // subir ou descer mais que isso = transpor parede do cânion
    alertaRecursoPct: 80,       // bateria ou O₂ acima disso → ATENÇÃO
    alertaTrajePct: 75          // volta a pé usando mais que isso do traje → ATENÇÃO
};
