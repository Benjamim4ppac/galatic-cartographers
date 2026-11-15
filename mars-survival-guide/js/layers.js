const nasaLayers = {
    // 1. Topográfico & Curvas de Nível (OpenPlanetary / NASA MOLA + USGS)
    topo: L.tileLayer(
        'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-2/all/{z}/{x}/{y}.png',
        {
            attribution: 'NASA / USGS / OpenPlanetary (Topo Basemap)',
            maxNativeZoom: 9,
            maxZoom: 16,
            noWrap: true
        }
    ),

    // 2. MOLA Altimetria Colorida (Mostra a profundidade extrema do cânion em cores)
    mola: L.tileLayer(
        'https://s3-eu-west-1.amazonaws.com/whereonmars.cartodb.net/mola-color/{z}/{x}/{y}.png',
        {
            attribution: 'NASA / GSFC / MOLA Colorized Elevation',
            tms: true,
            maxNativeZoom: 6,
            maxZoom: 16,
            noWrap: true
        }
    ),

    // 3. Mosaico Viking Óptico (Superfície real de Marte)
    viking: L.tileLayer(
        'https://s3-eu-west-1.amazonaws.com/whereonmars.cartodb.net/viking_mdim21_global/{z}/{x}/{y}.png',
        {
            attribution: 'NASA / JPL / USGS (Viking Mosaic)',
            tms: true,
            maxNativeZoom: 7,
            maxZoom: 16,
            noWrap: true
        }
    ),

    // 4. Overlay de Relevo Sombreado (Hillshade - Acentua paredes e encostas)
    hillshade: L.tileLayer(
        'https://s3-eu-west-1.amazonaws.com/whereonmars.cartodb.net/mola-gray/{z}/{x}/{y}.png',
        {
            attribution: 'NASA MOLA Shaded Relief',
            tms: true,
            maxNativeZoom: 6,
            maxZoom: 16,
            opacity: 0.45,
            noWrap: true
        }
    )
};