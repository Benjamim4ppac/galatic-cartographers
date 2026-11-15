// Tradução da apresentação. Os valores, nomes e regras do programa permanecem
// no idioma original; este módulo só altera texto e atributos de acessibilidade.
(() => {
    const textos = {
        'Navegação de superfície em Candor Chasma, Marte. Planejamento de rotas, terreno real e análise de recursos para a missão.': 'Surface navigation in Candor Chasma, Mars. Route planning, real terrain data and mission resource assessment.',
        'EXPLORAÇÃO DE SUPERFÍCIE / CANDOR OESTE': 'SURFACE OPERATIONS / WESTERN CANDOR',
        'Ir para o mapa': 'Skip to map',
        'Ir para a missão': 'Skip to mission',
        'Acesso aos instrumentos': 'Mission tools',
        'Camadas (Alt+C)': 'Layers (Alt+C)',
        'Missão (Alt+M)': 'Mission (Alt+M)',
        'OPERAÇÃO OFFLINE': 'OFFLINE OPERATIONS',
        'Camadas e dados do mapa': 'Map layers and data',
        'Camadas do mapa': 'Map layers',
        'Camadas do terreno': 'Terrain layers',
        'Fechar camadas': 'Close layers',
        'Camadas': 'Layers',
        'Restrições de rota': 'Route constraints',
        'Declividade real (QGIS) + paredes + geologia': 'QGIS slope data, canyon walls and geology',
        'Segura (custo 1×)': 'Safe terrain (cost 1×)',
        'Declividade alta: bloqueio': 'Steep slopes: impassable',
        'Geologia e água (USGS I-897)': 'Geology and water (USGS I-897)',
        'Ative a camada e inspecione o mapa com Enter': 'Enable this layer, then press Enter to inspect the map',
        'Potencial de água': 'Water potential',
        'Fechar detalhes da unidade': 'Close geologic unit details',
        'Missão no mapa': 'Mission overlay',
        'Base, alvo de água e rota': 'Landing site, water target and route',
        'Temperatura estimada': 'Estimated temperature',
        'Calculada pela altitude e latitude (modelo)': 'Modeled from elevation and latitude',
        'Imagem real': 'Local imagery',
        'Topo (online)': 'Topography (online)',
        'Dados de terreno': 'Terrain data',
        'Imagem e declividade: QGIS (equipe) · Geologia: USGS I-897': 'Imagery and slopes: QGIS (team) · Geology: USGS I-897',
        'Área: 237 × 237 km · Grade: 100 m': 'Coverage: 237 × 237 km · Grid: 100 m',
        'Pacote ': 'Data package ',
        'Altitude, ambiente e consumo são estimativas do modelo.': 'Elevation, environmental conditions and resource use are model estimates.',
        'Área de navegação cartográfica': 'Navigation chart',
        'Ilustração artística de Marte': 'Artist’s rendering of Mars',
        'Setor oeste': 'Western sector',
        'Imagem inteira': 'Full area',
        'Mapa interativo de Marte': 'Interactive Mars map',
        'Mapa de Marte: selecione dois pontos da rota com Enter': 'Mars map: press Enter to select each route endpoint',
        'Norte': 'North',
        'Mosaico online indisponível sem internet. A imagem real da área, o terreno e as rotas continuam funcionando.': 'Online basemap unavailable. Local imagery, terrain data and route planning remain available offline.',
        'Por que este pouso e este alvo': 'Landing site and water target selection',
        'Fechar diagnóstico': 'Close mission rationale',
        'Local de pouso': 'Landing site',
        'Alvo de água': 'Water target',
        'Calculando…': 'Calculating…',
        'Terreno: declividade derivada no QGIS pela equipe. Geologia: carta USGS I-897 (McCauley, 1978). Altitudes, temperatura e consumo são estimativas do modelo.': 'Terrain: slope data derived by the team in QGIS. Geology: USGS map I-897 (McCauley, 1978). Elevation, temperature and resource use are model estimates.',
        'Fundamentos da missão': 'Mission rationale',
        'Valles Marineris · Elevação estimada (modelo)': 'Valles Marineris · Modeled elevation',
        'Mova o mapa e pressione Enter para inspecionar': 'Move the map and press Enter to inspect its center',
        'Inspeção de terreno': 'Terrain inspection',
        'Inspecionar terreno': 'Inspect terrain',
        'Inspecionar centro': 'Inspect map center',
        'Marcar ponto': 'Set waypoint',
        'Missão ativa e planejamento de rotas': 'Active mission and route planning',
        'Missão ativa': 'Active mission',
        'Fechar missão': 'Close mission',
        'PARECER DA MISSÃO': 'MISSION STATUS',
        'ORIGEM / POUSO': 'START / LANDING SITE',
        'DESTINO / ÁGUA': 'TARGET / WATER',
        'Localizar base de pouso no mapa': 'Locate landing site on map',
        'Localizar alvo de água no mapa': 'Locate water target on map',
        'TRAVESSIA DE IDA': 'OUTBOUND TRAVERSE',
        'Ida + coleta + volta': 'Outbound + sampling + return',
        'Desnível estimado': 'Estimated elevation range',
        'Trechos de risco': 'Hazardous segments',
        'Bateria / ida e volta': 'Battery / round trip',
        'O₂ / missão completa': 'O₂ / full mission',
        'Retorno a pé / falha do rover': 'Emergency walk-back',
        'PERFIL DA ROTA': 'ROUTE PROFILE',
        'ALTITUDE ESTIMADA / m': 'MODELED ELEVATION / m',
        'Perfil de altitude estimada da missão': 'Modeled mission elevation profile',
        'Aguardando rota.': 'Waiting for a route.',
        'B / ÁGUA': 'B / WATER',
        'Modelo de altitude por unidade geológica.': 'Elevation modeled by geologic unit.',
        'CRITÉRIOS DE SEGURANÇA': 'SAFETY CHECKS',
        'Compare outro percurso sem alterar a missão.': 'Evaluate an alternative route without changing the active mission.',
        'Rota de teste': 'Route test',
        'Selecionar dois pontos': 'Select endpoints',
        'Selecione 2 pontos: clique ou Enter no centro do mapa': 'Select two endpoints: click the map or press Enter at its center',
        'Distância:': 'Distance:',
        'Tempo (ida + coleta + volta):': 'Duration (outbound, sampling, return):',
        'Bateria (ida e volta):': 'Battery (round trip):',
        'O₂ (missão completa):': 'O₂ (full mission):',
        'Volta a pé:': 'Walk-back:',
        'Destino:': 'Destination:',
        'Simulação e telemetria': 'Traverse simulation and telemetry',
        'Telemetria completa': 'Full telemetry',
        'Fechar telemetria': 'Close telemetry',
        'Progresso do percurso': 'Traverse progress',
        '+1 passo': '+1 step',
        'O₂ restante': 'O₂ remaining',
        'Bateria do rover': 'Rover battery',
        'Altitude est.': 'Est. elevation',
        'Alt. est.': 'Est. elev.',
        'ALT. EST.': 'EST. ELEV.',
        'Pressão est.': 'Est. pressure',
        'Temperatura est.': 'Est. temperature',
        'Radiação acumulada': 'Cumulative radiation',
        'Controles da travessia': 'Traverse controls',
        'Iniciar ou pausar simulação': 'Start or pause simulation',
        'Avançar um passo': 'Advance one step',
        'Reiniciar simulação': 'Reset simulation',
        'DA TRAVESSIA': 'OF TRAVERSE',
        'O₂ RESTANTE': 'O₂ REMAINING',
        'BATERIA': 'BATTERY',
        'Centralizar a visualização no rover durante a simulação': 'Keep the rover in view during the simulation',
        'Seguir rover': 'Follow rover',
        'Telemetria': 'Telemetry',
        'REFERÊNCIA DE OPERAÇÃO': 'OPERATING REFERENCE',
        'Fechar atalhos': 'Close keyboard shortcuts',
        'Comando por teclado': 'Keyboard controls',
        'Tab percorre os controles. Enter ou Espaço ativa botões. Setas selecionam opções de mapa; Espaço alterna camadas.': 'Use Tab to move between controls. Press Enter or Space to activate a button. Use arrow keys to select a basemap and Space to toggle a layer.',
        'W A S D / Setas': 'W A S D / Arrows',
        'Mover o mapa quando ele está em foco': 'Pan while the map has keyboard focus',
        'Aproximar / afastar': 'Zoom in / out',
        'Enter / Espaço': 'Enter / Space',
        'Inspecionar o centro ou marcar ponto da rota': 'Inspect the map center or set a route endpoint',
        'Abrir / fechar camadas': 'Open / close layers',
        'Abrir / fechar missão': 'Open / close mission',
        'Imagem da área / missão / base': 'Full area / mission / landing site',
        'Centralizar pouso / alvo de água': 'Center on landing site / water target',
        'Simular / alternar teste de rota': 'Start or pause simulation / toggle route test',
        'Restrições / geologia / alvos / temperatura': 'Constraints / geology / mission overlay / temperature',
        'Limpar rota de teste': 'Clear test route',
        'Fechar menu, janela ou diagnóstico': 'Close a panel, dialog or mission rationale',
        'Abrir esta referência': 'Open this reference',
        'Atalhos de teclado': 'Keyboard shortcuts',
        'Detalhes do ponto no mapa': 'Map location details',
        'Sem rota transitavel para apresentar.': 'No traversable route to display.',
        'SEM ROTA TRANSITAVEL': 'NO TRAVERSABLE ROUTE',
        'Marcar origem': 'Set start point',
        'Marcar destino': 'Set destination',
        'Iniciar nova rota': 'Start new route',
        'Rota de teste / percurso calculado': 'Route test / route calculated',
        'Sair do teste [M]': 'Exit route test [M]',
        'Testar rota [M]': 'Test route [M]',
        'Encerrar seleção': 'Finish selection',
        'CLIQUE EM 2 PONTOS': 'SELECT TWO ENDPOINTS',
        'SELECIONE 2 PONTOS': 'SELECT TWO ENDPOINTS',
        'ROTA SALVA': 'ROUTE SAVED',
        'FECHADO': 'CLOSED',
        'ROTA INVIÁVEL': 'NO TRAVERSABLE ROUTE',
        'BLOQUEADA': 'BLOCKED',
        'Todas as regras de segurança atendidas': 'All mission safety checks passed',
        'NÃO SAIR': 'NO-GO',
        'PODE SAIR': 'GO',
        'ATENÇÃO': 'CAUTION',
        'INVIÁVEL': 'NOT FEASIBLE',
        'NO LIMITE': 'AT LIMIT',
        'VIÁVEL': 'FEASIBLE',
        'Nenhum': 'None',
        'Fundo do cânion': 'Canyon floor',
        'Depósitos em camadas': 'Layered deposits',
        'Parede do cânion': 'Canyon wall',
        'Planície com cristas': 'Ridged plains',
        'Planície do planalto': 'Plateau plains',
        'Planalto craterizado': 'Cratered plateau',
        'Terreno fraturado': 'Fractured terrain',
        'Cratera antiga': 'Ancient crater',
        'Cratera de impacto': 'Impact crater',
        'Material plano no fundo do cânion, formado por deslizamentos das paredes cobertos por sedimentos. É o terreno mais seguro para pouso e deslocamento.': 'Flat canyon-floor material consisting of wall-slide debris covered by sediment. This is the safest terrain for landing and surface travel.',
        'Rochas em camadas interpretadas como sedimentos de antigos lagos. Em Candor, orbitadores detectaram sulfatos hidratados nesses depósitos: minerais que guardam água na própria estrutura.': 'Layered rocks interpreted as ancient lake sediments. Orbiters have detected hydrated sulfates in these deposits at Candor: minerals that retain water within their crystal structure.',
        'Faixa estreita entre o fundo do cânion e o planalto, com milhares de metros de desnível. No mapa de declividade do QGIS, essas paredes aparecem como declividade alta (bloqueada).': 'A narrow zone between the canyon floor and plateau, with thousands of meters of relief. The QGIS slope map classifies these walls as steep and impassable.',
        'Blocos fraturados e desabados, ligados à saída de água subterrânea no passado. Interessante para a ciência, perigoso para veículos.': 'Fractured and collapsed blocks associated with past groundwater release. Scientifically valuable, but hazardous for vehicles.',
        'Planície vulcânica do planalto, milhares de metros acima do fundo do cânion.': 'Volcanic plateau plains, thousands of meters above the canyon floor.',
        'Planície do planalto acima do cânion.': 'Plateau plains above the canyon.',
        'Terreno antigo do planalto com muitas crateras.': 'Ancient, heavily cratered plateau terrain.',
        'Planalto cortado por fraturas tectônicas.': 'Plateau terrain cut by tectonic fractures.',
        'Cratera de impacto antiga e degradada.': 'An ancient, eroded impact crater.',
        'Cratera de impacto com fundo modificado por erosão.': 'An impact crater with an erosion-modified floor.',
        'Pouso e trânsito': 'Landing and surface travel',
        'Alvo de água (aquecer o material libera H₂O)': 'Water extraction target (heating releases H₂O)',
        'Evitar: paredes do cânion': 'Avoid: canyon walls',
        'Evitar: terreno instável': 'Avoid: unstable terrain',
        'Fora do alcance a partir do cânion': 'Not accessible from the canyon floor',
        'Amostragem científica': 'Scientific sampling',
        'Faixa entre fundo e planalto': 'Zone between the canyon floor and plateau',
        'Sigla PC da carta': 'Map unit PC',
        'Sigla PLC da carta': 'Map unit PLC',
        'Sigla TF da carta': 'Map unit TF',
        'Nome na carta:': 'Map designation:',
        '(interpretação da equipe)': '(team interpretation)',
        'Uso na missão:': 'Mission use:',
        'Sem descrição': 'No description available',
        'Candor Chasma (oeste)': 'Western Candor Chasma',
        'Alvo fora das unidades mapeadas.': 'Target lies outside the mapped geologic units.',
        'A busca automática não encontrou um ponto do fundo do cânion com ': 'The automatic search found no canyon-floor landing site with ',
        ' km de folga e rota até um depósito em camadas. Usando ponto padrão.': ' km of clearance and a route to layered deposits. Using the fallback site.',
        '; quanto mais baixo, mais atmosfera acima da nave para frear no pouso e para proteger da radiação.': '; a lower site provides more atmosphere above the spacecraft for landing deceleration and radiation shielding.',
        '. É o depósito desse tipo mais próximo do pouso com rota ': '. This is the nearest deposit of this type reachable from the landing site via a route ',
        'possível (passa por declividade média)': 'that crosses moderate slopes',
        'inteiramente em terreno seguro': 'entirely on safe terrain',
        'Base de pouso': 'Landing site',
        'Ponto padrão': 'Fallback site',
        'Distância até o alvo de água pela rota:': 'Route distance to the water target:',
        'Terreno não mapeado': 'Unmapped terrain',
        'Fora da área com dados de terreno': 'Outside terrain data coverage',
        'Fora das unidades da carta geológica carregada.': 'Outside the loaded geologic map coverage.',
        'Terreno para a rota:': 'Route terrain:',
        'Inspeção': 'Inspection',
        'Pressão ~': 'Pressure ~',
        'Base a ': 'Distance to base: ',
        'Travessia bloqueada': 'Traverse blocked',
        'Ponto fora da área com dados de terreno': 'Endpoint outside terrain data coverage',
        'A origem está em declividade alta (bloqueada)': 'Start point lies on impassable steep slopes',
        'O destino está em declividade alta (bloqueada)': 'Destination lies on impassable steep slopes',
        'Não existe caminho sem cruzar declividade alta': 'No route avoids impassable steep slopes',
        'Declividade alta (bloqueada)': 'Steep slopes (impassable)',
        'DECLIVIDADE ALTA (BLOQUEADA)': 'STEEP SLOPES (IMPASSABLE)',
        'declividade alta (bloqueada)': 'steep slopes (impassable)',
        'Declividade média': 'Moderate slopes',
        'DECLIVIDADE MÉDIA': 'MODERATE SLOPES',
        'declividade média': 'moderate slopes',
        'Zona de desabamento': 'Rockfall hazard zone',
        'ZONA DE DESABAMENTO': 'ROCKFALL HAZARD ZONE',
        'zona de desabamento': 'rockfall hazard zone',
        'Terreno caótico': 'Chaotic terrain',
        'TERRENO CAÓTICO': 'CHAOTIC TERRAIN',
        'terreno caótico': 'chaotic terrain',
        'Segura': 'Safe',
        'SEGURA': 'SAFE',
        'MODERADO': 'MODERATE',
        'MÉDIO': 'MODERATE',
        'PROIBIDO': 'PROHIBITED',
        'BAIXO': 'LOW',
        'ALTO': 'HIGH',
        'Unidade': 'Unit',
        ', unidade ': ', unit ',
        ' (ida)': ' (outbound)',
        ' (ida ': ' (outbound ',
        'Iniciar': 'Start',
        'Pausar': 'Pause',
        'Reiniciar': 'Reset',
        'Limpar': 'Clear',
        'Fechar': 'Close',
        'Testar rota': 'Test route',
        'Missão': 'Mission',
        'MISSÃO': 'MISSION',
        'Alvo': 'Target',
        ' mover': ' pan',
        ' inspecionar': ' inspect',
        ' coleta': ' sampling'
    };

    const escapar = texto => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const padrao = new RegExp(Object.keys(textos).sort((a, b) => b.length - a.length).map(escapar).join('|'), 'g');
    const frases = [
        [/Bateria insuficiente para ida e volta \((\d+)%\)/g, 'Insufficient battery for the round trip ($1%)'],
        [/Bateria no limite \((\d+)% para ida e volta\)/g, 'Low battery margin ($1% required for the round trip)'],
        [/O₂ insuficiente para a missão completa \((\d+)%\)/g, 'Insufficient oxygen for the full mission ($1%)'],
        [/O₂ no limite \((\d+)% da reserva\)/g, 'Low oxygen margin ($1% of reserve required)'],
        [/Se o rover falhar no alvo, a volta a pé leva ([^:]+): mais que as (\d+) h do traje/g, 'A rover failure at the target would require a $1 walk back, exceeding the suit’s $2 h endurance'],
        [/Volta a pé de emergência no limite do traje \((\d+)%\)/g, 'Emergency walk-back approaches suit endurance ($1%)'],
        [/Desnível estimado de ([\d.]+) m: a rota transpõe a parede do cânion/g, 'Estimated elevation range of $1 m: the route crosses the canyon wall'],
        [/Missão de (\S+) não cabe nas ~(\d+) h de luz do dia/g, 'Mission duration of $1 exceeds the ~$2 h daylight window'],
        [/Missão de (\S+) passa da janela segura de (\d+) h \(ventos do amanhecer e do anoitecer\)/g, 'Mission duration of $1 exceeds the $2 h low-wind window (stronger winds near dawn and dusk)'],
        [/(\d+(?:\.\d+)?) km em /g, '$1 km across '],
        [/\. Escolhido automaticamente entre (\d+) pontos do fundo do cânion em terreno seguro\. Fica a /g, '. Automatically selected from $1 canyon-floor sites on safe terrain. Located '],
        [/ da área de declividade alta mais próxima \(mínimo exigido: ([\d.]+) km\)\. Altitude estimada: /g, ' from the nearest steep-slope area (required clearance: $1 km). Estimated elevation: '],
        [/Altitude estimada entre (-?\d+) e (-?\d+) metros\. Distancia de ida: ([\d.]+) km\. Modelo por unidade geologica; nao representa a declividade real\./g, 'Estimated elevation ranges from $1 to $2 m. Outbound distance: $3 km. Modeled by geologic unit; this is not measured slope data.'],
        [/Rota de teste \/ (\d+) de 2: origem/g, 'Route test / $1 of 2: start'],
        [/Rota de teste \/ (\d+) de 2: destino/g, 'Route test / $1 of 2: destination'],
        [/Unidade da carta de Coprates \(sigla ([^)]+)\)\./g, 'Coprates map unit (code $1).']
    ];

    function traduzir(texto, elemento) {
        let resultado = texto;
        for (const [expressao, substituicao] of frases) resultado = resultado.replace(expressao, substituicao);
        resultado = resultado.replace(padrao, trecho => textos[trecho]);
        resultado = resultado.replace(/\b(\d+)h(\d{2})\b/g, '$1h $2m')
            .replace(/(\d+h \d+m) de (\d+)h\b/g, '$1 of $2 h');
        // Só altitudes e desníveis usam separadores de milhar na apresentação.
        // As leituras decimais de radiação e distância mantêm a precisão original.
        resultado = resultado.replace(/(-?\d{1,3}(?:\.\d{3})+)(?= m\b)/g, valor => valor.replaceAll('.', ','));
        if (elemento?.closest('.profile-axis') && /^-?\d{1,3}(?:\.\d{3})+$/.test(resultado)) resultado = resultado.replaceAll('.', ',');
        if (elemento?.closest('#data-pack-date') && /^\d{2}\/\d{2}\/\d{4}$/.test(resultado)) {
            const [dia, mes, ano] = resultado.split('/').map(Number);
            resultado = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(ano, mes - 1, dia)));
        }
        return resultado;
    }

    const atributos = ['aria-label', 'aria-description', 'aria-valuetext', 'title', 'alt', 'placeholder'];
    function traduzirAtributos(elemento) {
        for (const atributo of atributos) {
            if (!elemento.hasAttribute(atributo)) continue;
            const original = elemento.getAttribute(atributo);
            const traduzido = traduzir(original, elemento);
            if (traduzido !== original) elemento.setAttribute(atributo, traduzido);
        }
    }
    function traduzirArvore(raiz) {
        if (raiz.nodeType === Node.TEXT_NODE) {
            const pai = raiz.parentElement;
            if (!pai || pai.closest('script, style, [translate="no"]')) return;
            const traduzido = traduzir(raiz.nodeValue, pai);
            if (traduzido !== raiz.nodeValue) raiz.nodeValue = traduzido;
            return;
        }
        if (raiz.nodeType !== Node.ELEMENT_NODE && raiz.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
        if (raiz.nodeType === Node.ELEMENT_NODE) {
            if (raiz.matches('script, style, [translate="no"]')) return;
            traduzirAtributos(raiz);
        }
        const nos = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        while (nos.nextNode()) {
            const no = nos.currentNode;
            if (no.nodeType === Node.TEXT_NODE) traduzirArvore(no);
            else if (!no.closest('script, style, [translate="no"]')) traduzirAtributos(no);
        }
    }
    function traduzirHTML(conteudo) {
        if (typeof conteudo !== 'string') return conteudo;
        const modelo = document.createElement('template');
        modelo.innerHTML = conteudo;
        traduzirArvore(modelo.content);
        return modelo.innerHTML;
    }

    // Traduz antes da medição do Leaflet para que posicionamento e rolagem
    // considerem as dimensões do conteúdo exibido em inglês.
    const definirConteudo = L.Popup.prototype.setContent;
    L.Popup.prototype.setContent = function (conteudo) {
        return definirConteudo.call(this, traduzirHTML(conteudo));
    };
    map.eachLayer(camada => {
        const popup = camada.getPopup?.();
        if (popup && typeof popup.getContent() === 'string') popup.setContent(popup.getContent());
    });
    traduzirArvore(document.body);
    const descricao = document.querySelector('meta[name="description"]');
    if (descricao) descricao.content = traduzir(descricao.content);

    new MutationObserver(alteracoes => {
        const raizes = new Set();
        for (const alteracao of alteracoes) {
            if (alteracao.type === 'attributes') traduzirAtributos(alteracao.target);
            else if (alteracao.type === 'characterData') traduzirArvore(alteracao.target);
            else alteracao.addedNodes.forEach(no => raizes.add(no));
        }
        raizes.forEach(traduzirArvore);
    }).observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: atributos });
})();
