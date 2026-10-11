require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    AttachmentBuilder,
    PermissionFlagsBits,
    ApplicationCommandOptionType
} = require('discord.js');

const express = require('express');
const fs = require('fs');
const path = require('path');

// ============================================================
// BRAINROT / REGLAS CONFIGURATION (del primer index.js)
// ============================================================
const CLP_POR_USD = 959.47;
const CANAL_REGLAS = '1549237877186236476';
const GIF_NUEVO = 'https://www.image2url.com/r2/default/gifs/1791161891343-374344e5-6588-4ba9-8aa1-3ebb6eacea57.gif';
const GIF_REGLAS = GIF_NUEVO;
const GIF_COMANDOS = GIF_NUEVO;
const CERBERUS_PATH = path.join(__dirname, 'cerberus.png');
const CANAL_REGISTROS_MIDDLEMAN = '1555339131964489899';


const app = express();

app.get('/', (req, res) => {
    res.send('🤖 Bot Middleman & Soporte - Activo 24/7');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('🌐 Servidor Express iniciado.');
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.User
    ]
});

// ============================================================
// EMOJIS DE MUTACIONES
// ============================================================

const emojisCache = new Map();

const EMOJIS_VARIANTES = {
    Normal: '1550522090950627398',
    Oro: '1550522057878540400',
    Diamante: '1550522010730365029',
    Rainbow: '1550521972461670490',
    Eclipse: '1556077350767173692',
    Crystal: '1550521934612009131',
    Phantom: '1550521898016964670',
    Cyber: '1550521857449656430',
    Divino: '1550520520087445695',
    Cursed: '1550521786247020574',
    Radioactivo: '1550521756706410506',
    'Yin Yang': '1550521727040233695',
    Galaxy: '1550521693926199317',
    Lava: '1550521638808854618',
    Candy: '1550521666684068030',
    Bloodroot: '1550521604302311534'
};

// ============================================================
// BRAINROTS
// ============================================================

const BRAINROTS = {

    'Burguro and Fryuro': {
        imagen:
            'https://cdn.phototourl.com/free/2026-09-19-9cdf1fa7-760b-49ce-b716-a5dbbc2c2b56.jpg',

        valores: {
            Normal: '800 - 1K CLP',
            Oro: '950 - 1150 CLP',
            Diamante: '1150 - 1.3K CLP',
            Rainbow: '1.5K - 1.6K CLP',
            Eclipse: '2K - 2.2K CLP',
            Crystal: '1.8K CLP',
            Phantom: '1.8K CLP',
            Cyber: '1.7K CLP',
            Divino: '1.8K CLP',
            Cursed: '1.8K CLP',
            Radioactivo: '1.8K CLP',
            'Yin Yang': '1.7K CLP',
            Galaxy: '1.7K CLP',
            Lava: '1.5K CLP',
            Candy: '1.5K CLP',
            Bloodroot: '2.2K - 2.4K CLP'
        }
    },

    'CAPITANO MOBY': {
        imagen:
            'https://cdn.phototourl.com/free/2026-09-18-69e1dfe5-3955-46f2-ad2c-bd5880592e9b.jpg',

        valores: {
            Normal: '800 - 1K CLP',
            Oro: '950 - 1150 CLP',
            Diamante: '1150 - 1.3K CLP',
            Rainbow: '1.5K - 1.6K CLP',
            Eclipse: '2K - 2.2K CLP',
            Crystal: '1.8K CLP',
            Phantom: '1.8K CLP',
            Cyber: '1.7K CLP',
            Divino: '1.8K CLP',
            Cursed: '1.8K CLP',
            Radioactivo: '1.8K CLP',
            'Yin Yang': '1.7K CLP',
            Galaxy: '1.7K CLP',
            Lava: '1.5K CLP',
            Candy: '1.5K CLP',
            Bloodroot: '2.2K - 2.4K CLP'
        }
    },

    'Cash or Card': {
        imagen:
            'https://cdn.phototourl.com/member/2026-09-19-66017601-5fb4-491d-a6a9-58edbc8987f0.webp',

        valores: {
            Normal: '400 CLP',
            Oro: '500 CLP',
            Diamante: '600 CLP',
            Rainbow: '1.3K CLP',
            Eclipse: '2.3K CLP',
            Crystal: '1.8K - 2K CLP',
            Phantom: '1.8K - 2K CLP',
            Cyber: '1.8K CLP',
            Divino: '1.8K CLP',
            Cursed: '1.8K CLP',
            Radioactivo: '1.6K CLP',
            'Yin Yang': '1.7K CLP',
            Galaxy: '1.7K CLP',
            Lava: '1.3K CLP',
            Candy: '1.3K CLP',
            Bloodroot: '2.2K CLP'
        }
    },

    'Cerberus': {
        imagen: null,

        valores: {
            Normal: '1.5K - 1.7K CLP',
            Oro: '1.8K CLP',
            Diamante: '2K CLP',
            Rainbow: '2.8K - 3K CLP',
            Eclipse: '4.6K CLP',
            Crystal: '4.4K CLP',
            Phantom: '4.4K CLP',
            Cyber: '4.3K CLP',
            Divino: '4.2K CLP',
            Cursed: '4.2K CLP',
            Radioactivo: '4K CLP',
            'Yin Yang': '4K CLP',
            Galaxy: '4K CLP',
            Lava: '3.7K CLP',
            Candy: '3.7K CLP',
            Bloodroot: '4.5K CLP'
        }
    },

    'Cooki and milki': {
        imagen:
            'https://cdn.phototourl.com/free/2026-09-19-37abb7e0-4cc4-4cfc-a4db-5bde0056e850.jpg',

        valores: {
            Normal: '2K - 2.5K CLP',
            Oro: '2.5K - 2.6K CLP',
            Diamante: '2.5K - 2.7K CLP',
            Rainbow: '3K - 3.5K CLP',
            Eclipse: 'NO HAY EXISTENCIAS',
            Crystal: 'NO HAY EXISTENCIAS',
            Phantom: 'NO HAY EXISTENCIAS',
            Cyber: 'NO HAY EXISTENCIAS',
            Divino: '6K CLP',
            Cursed: '6K CLP',
            Radioactivo: '4K CLP',
            'Yin Yang': '4K CLP',
            Galaxy: '4K CLP',
            Lava: '3.7K CLP',
            Candy: '3.7K CLP',
            Bloodroot: '4.5K CLP'
        }
    },

    'Dragon Cannelloni': {
        imagen:
            'https://cdn.phototourl.com/free/2026-09-18-20490fbc-3425-4401-8060-f7948eff136c.jpg',

        valores: {
            Normal: '7.5K - 8K CLP',
            Oro: '8.5K - 9K CLP',
            Diamante: '9.5K - 10K CLP',
            Rainbow: '15K CLP',
            Eclipse: '22K CLP',
            Crystal: '19K - 20K CLP',
            Phantom: '19K - 20K CLP',
            Cyber: '18.5K - 19.5K CLP',
            Divino: '18K - 18.5K CLP',
            Cursed: '18K - 18.5K CLP',
            Radioactivo: '17.5K - 18K CLP',
            'Yin Yang': '18K - 18.5K CLP',
            Galaxy: '18K - 18.5K CLP',
            Lava: '15K - 16K CLP',
            Candy: '15K - 16K CLP',
            Bloodroot: '23K CLP'
        }
    },

    'Festive 67': {
        imagen:
            'https://cdn.phototourl.com/free/2026-09-19-7cd4e713-1e6c-4b05-8a97-bddf9466f1b0.jpg',

        valores: {
            Normal: '1K CLP',
            Oro: 'NO EXISTE',
            Diamante: 'NO EXISTE',
            Rainbow: 'NO EXISTE',
            Eclipse: 'NO EXISTE',
            Crystal: 'NO EXISTE',
            Phantom: 'NO EXISTE',
            Cyber: 'NO EXISTE',
            Divino: 'NO EXISTE',
            Cursed: 'NO EXISTE',
            Radioactivo: 'NO EXISTE',
            'Yin Yang': 'NO EXISTE',
            Galaxy: 'NO EXISTE',
            Lava: 'NO EXISTE',
            Candy: 'NO EXISTE',
            Bloodroot: 'NO EXISTE'
        }
    },

    'Garama and Madungdung': {
        imagen:
            'https://cdn.phototourl.com/free/2026-09-18-c964cf36-969a-4f18-a071-88c9213dc519.jpg',

        valores: {
            Normal: '450 CLP',
            Oro: '550 CLP',
            Diamante: '650 CLP',
            Rainbow: '2.2K - 2.4K CLP',
            Eclipse: '2.7K - 3K CLP',
            Crystal: '2.5K - 2.6K CLP',
            Phantom: '2.5K - 2.6K CLP',
            Cyber: '2.5K CLP',
            Divino: '2.5K CLP',
            Cursed: '2.5K CLP',
            Radioactivo: '2.5K CLP',
            'Yin Yang': 'Precio no especificado',
            Galaxy: '2.5K CLP',
            Lava: '2.2K CLP',
            Candy: '2.2K CLP',
            Bloodroot: '2.6K - 2.8K CLP'
        }
    },

    'La secret combinación': {
        imagen:
            'https://cdn.phototourl.com/free/2026-09-19-ad906f1d-da8e-4b4a-bd3b-e1696bd39c3d.jpg',

        valores: {
            Normal: '800 - 1K CLP',
            Oro: '950 - 1150 CLP',
            Diamante: '1150 - 1.3K CLP',
            Rainbow: '1.5K - 1.6K CLP',
            Eclipse: '2K - 2.2K CLP',
            Crystal: '1.8K CLP',
            Phantom: '1.8K CLP',
            Cyber: '1.7K CLP',
            Divino: '1.8K CLP',
            Cursed: '1.8K CLP',
            Radioactivo: '1.8K CLP',
            'Yin Yang': '1.7K CLP',
            Galaxy: '1.7K CLP',
            Lava: '1.5K CLP',
            Candy: '1.5K CLP',
            Bloodroot: '2.2K - 2.4K CLP'
        }
    }
};

// ============================================================
// ORDEN DE BRAINROTS
// ============================================================

const NOMBRES_BRAINROTS = [
    'Burguro and Fryuro',
    'CAPITANO MOBY',
    'Cash or Card',
    'Cerberus',
    'Cooki and milki',
    'Dragon Cannelloni',
    'Festive 67',
    'Garama and Madungdung',
    'La secret combinación'
];

// ============================================================
// ORDEN DE MUTACIONES
// ============================================================

const VARIANTES = [
    'Normal',
    'Oro',
    'Diamante',
    'Rainbow',
    'Eclipse',
    'Crystal',
    'Phantom',
    'Cyber',
    'Divino',
    'Cursed',
    'Radioactivo',
    'Yin Yang',
    'Galaxy',
    'Lava',
    'Candy',
    'Bloodroot'
];

// ============================================================
// CONVERSIÓN CLP -> USD
// ============================================================

function convertirPrecioUSD(texto) {

    if (
        texto === 'NO EXISTE' ||
        texto === 'NO HAY EXISTENCIAS' ||
        texto === 'Precio no especificado'
    ) {
        return texto;
    }

    return texto.replace(
        /(\d+(?:\.\d+)?)(K)?/gi,
        (match, numero, k) => {

            let valor =
                Number(numero);

            if (k) {
                valor *= 1000;
            }

            const usd =
                valor / CLP_POR_USD;

            if (usd >= 1000) {
                return `$${(usd / 1000).toFixed(1)}K`;
            }

            if (usd >= 100) {
                return `$${Math.round(usd)}`;
            }

            return `$${usd.toFixed(2)}`;
        }
    );
}

// ============================================================
// CARGAR EMOJIS
// ============================================================

async function cargarEmojisBrainrot() {

    for (
        const guild of client.guilds.cache.values()
    ) {

        try {

            const emojis =
                await guild.emojis.fetch();

            for (
                const emoji of emojis.values()
            ) {

                emojisCache.set(
                    emoji.id,
                    emoji
                );
            }

            console.log(
                `Emojis cargados de ${guild.name}: ${emojis.size}`
            );

        } catch (error) {

            console.error(
                `No se pudieron cargar los emojis de ${guild.name}:`,
                error.message
            );
        }
    }
}

function obtenerEmoji(nombre) {

    const id =
        EMOJIS_VARIANTES[nombre];

    if (!id) {
        return '';
    }

    const emoji =
        emojisCache.get(id);

    if (emoji) {
        return `<:${emoji.name}:${emoji.id}>`;
    }

    return `<:emoji:${id}>`;
}

// ============================================================
// ARCHIVOS DEL BRAINROT
// ============================================================

function obtenerArchivosBrainrot(nombre) {

    if (
        nombre === 'Cerberus' &&
        fs.existsSync(CERBERUS_PATH)
    ) {

        return [
            new AttachmentBuilder(
                CERBERUS_PATH,
                {
                    name: 'cerberus.png'
                }
            )
        ];
    }

    return [];
}


// ============================================================
// PANEL PRINCIPAL DE REGLAS
// ============================================================

function crearMenuReglasEmbed() {

    return new EmbedBuilder()

        .setTitle(
            'Reglamento del servidor'
        )

        .setDescription(
            'Bienvenido al reglamento del servidor.\n\n' +
            'Selecciona en el menú la categoría de reglas que quieres consultar.\n\n' +
            '**Importante:** al seleccionar una opción, se abrirá un panel privado que solamente tú podrás ver.'
        )

        .setImage(
            GIF_REGLAS
        )

        .setFooter({
            text:
                'Selecciona una categoría para comenzar.'
        });
}

// ============================================================
// REGLAS GENERALES
// ============================================================

function crearReglasGeneralesEmbed() {

    return new EmbedBuilder()

        .setTitle(
            'Reglas en General'
        )

        .setDescription(`
**1. Respeto mutuo entre los miembros**
- No insultarse.
- No burlarse de alguien.
- No sacar cosas personales.
- No sacar a relucir ni utilizar asuntos personales de otras personas.
- No involucrar ni mencionar a familiares ajenos con intención de molestar, provocar o generar conflictos.

**2. Hostigamiento o bromas**
- No molestar excesivamente con la misma broma.
- No hostigar a alguien para hacer algo.
- No pasarse del límite con alguna broma o llevarla a mayores.
- Si alguien pide que dejen de molestarlo, se debe respetar.

**3. No generar conflictos**
- Evitar crear conflictos innecesarios.
- Resolver respetuosamente o acudir a staff/ticket.
- No continuar una discusión solamente para provocar.
- Las diferencias entre miembros no deben afectar al resto de la comunidad.

**4. Contenido inapropiado**
- Está prohibido mostrar o consumir contenido +18, ya que hay menores en el servidor.
- No mostrar contenido brutal, real o ficticio, como asesinatos, violaciones o contenido sangriento.
- No enviar contenido incómodo o acosador.
- No compartir contenido ilegal.

**5. Publicidad y enlaces**
- No publicitar otros servidores, redes sociales, canales o proyectos sin autorización del staff.
- No enviar enlaces sospechosos.
- No enviar un enlace sin saber qué contiene o qué hace.

**6. Respeto al staff**
- Respetar las decisiones del staff en votaciones, anuncios y situaciones de moderación.
- Si no estás de acuerdo con una sanción, puedes hablar con el staff.
- No acosar, insultar ni provocar al staff por una sanción.

**7. Trampas, estafas o engaños**
- No engañar, estafar ni hacer trampas contra miembros u otras personas.
- Realizar transacciones con precaución; se puede utilizar un Middleman.
- Reportar inmediatamente las estafas o acciones prohibidas aportando pruebas.

**8. Sentido común**
- No todo comportamiento negativo tiene que estar escrito explícitamente.
- El staff puede intervenir cuando una acción perjudique a la comunidad.
- Piensa antes de actuar.

**9. Sanciones**
Las sanciones pueden incluir:
- Advertencia.
- Eliminación de mensajes.
- Restricción temporal de canales.
- Timeout.
- Kick.
- Ban temporal o permanente.

La gravedad y duración de una sanción dependerá de la situación y de la decisión de moderación.

**Importante:**
Estas reglas existen para mantener una comunidad tranquila, segura y respetuosa, no para limitar innecesariamente a los miembros.

Al permanecer en el servidor se entiende que conoces y respetas estas reglas.
        `)

        .setImage(
            GIF_REGLAS
        )

        .setFooter({
            text:
                'Panel privado de reglas generales'
        });
}

// ============================================================
// REGLAS MIDDLEMAN
// ============================================================

function crearReglasMiddlemanEmbed() {

    return new EmbedBuilder()

        .setTitle(
            'Reglas Middleman'
        )

        .setDescription(`
**1. Evitar estafas y acudir a algo más confiable**
- Utiliza Middleman para ventas o compras.
- Solicita un Middleman para PVP o apuestas.

**2. Pagar al Middleman por la duración del ticket**
- El Middleman recibe una recompensa por el tiempo y trabajo realizado.
- Después de 5-10 minutos, corresponde una recompensa por el tiempo empleado.
- La recompensa debe entregarse de buena voluntad.
- Si se trata de un PVP y el Middleman debe esperar durante mucho tiempo, debe recibir un pago.

**3. Respeto al Middleman**
- Respeta al Middleman, ya que hace que las ventas, compras, PVP y apuestas sean más confiables.
- No insultar al Middleman si tarda en atender o menospreciar su trabajo.

**4. Tickets Middleman**
- Crea un ticket cuando necesites una solicitud seria de Middleman.
- No crear tickets para molestar, trolear o jugar.

**5. Entrega de objetos**
- El vendedor entrega el objeto vendido al Middleman para que lo mantenga mientras el comprador paga la cantidad acordada.
- En cuentas de juegos o aplicaciones, el Middleman mantiene el dinero mientras el vendedor transfiere la cuenta y cambia el correo, contraseña y correo de recuperación. Una vez realizados todos los cambios, el vendedor recibe el pago.
        `)

        .setImage(
            GIF_REGLAS
        )

        .setFooter({
            text:
                'Panel privado de reglas Middleman'
        });
}

// ============================================================
// MENÚ PÚBLICO DE REGLAS
// ============================================================

function crearMenuReglas() {

    return new StringSelectMenuBuilder()

        .setCustomId(
            'reglas_menu_publico'
        )

        .setPlaceholder(
            'Selecciona una categoría'
        )

        .addOptions(

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Reglas en General'
                )
                .setDescription(
                    'Consulta las reglas generales del servidor.'
                )
                .setValue(
                    'general'
                )
                .setEmoji(
                    '📜'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Reglas Middleman'
                )
                .setDescription(
                    'Consulta las reglas para Middleman.'
                )
                .setValue(
                    'middleman'
                )
                .setEmoji(
                    '🤝'
                )
        );
}

// ============================================================
// MENÚ PRIVADO DE REGLAS
// ============================================================

function crearMenuReglasPrivado() {

    return new StringSelectMenuBuilder()

        .setCustomId(
            'reglas_privado'
        )

        .setPlaceholder(
            'Cambiar categoría de reglas'
        )

        .addOptions(

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Reglas en General'
                )
                .setDescription(
                    'Ver las reglas generales.'
                )
                .setValue(
                    'general'
                )
                .setEmoji(
                    '📜'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Reglas Middleman'
                )
                .setDescription(
                    'Ver las reglas Middleman.'
                )
                .setValue(
                    'middleman'
                )
                .setEmoji(
                    '🤝'
                )
        );
}


// ============================================================
// MENÚ DE MONEDA
// ============================================================

function crearMenuMoneda(userId) {

    return new StringSelectMenuBuilder()

        .setCustomId(
            `brainrot_currency_${userId}`
        )

        .setPlaceholder(
            'Selecciona una moneda'
        )

        .addOptions(

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Pesos chilenos (CLP)'
                )
                .setDescription(
                    'Ver los precios en pesos chilenos.'
                )
                .setValue(
                    'CLP'
                ),

            new StringSelectMenuOptionBuilder()
                .setLabel(
                    'Dólares (USD)'
                )
                .setDescription(
                    'Ver los precios convertidos a dólares.'
                )
                .setValue(
                    'USD'
                )
        );
}

// ============================================================
// MENÚ DE BRAINROTS
// ============================================================

function crearMenuBrainrots(
    userId,
    moneda
) {

    return new StringSelectMenuBuilder()

        .setCustomId(
            `brainrot_select_${userId}_${moneda}`
        )

        .setPlaceholder(
            'Selecciona un brainrot'
        )

        .addOptions(

            NOMBRES_BRAINROTS.map(
                nombre =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(nombre)
                        .setValue(nombre)
            )
        );
}

// ============================================================
// EMBED BRAINROT
// ============================================================

function crearEmbedBrainrot(
    nombre,
    moneda
) {

    const brainrot =
        BRAINROTS[nombre];

    if (!brainrot) {

        return new EmbedBuilder()
            .setTitle(
                'Brainrot no encontrado'
            )
            .setDescription(
                'No se encontraron datos para ese brainrot.'
            );
    }

    const embed =
        new EmbedBuilder()
            .setTitle(
                nombre
            )
            .setFooter({
                text:
                    `Moneda: ${moneda}`
            });

    if (
        nombre === 'Cerberus'
    ) {

        embed.setImage(
            'attachment://cerberus.png'
        );

    } else {
        // Las imágenes principales se muestran grandes; si falta una URL, se usa el GIF general como respaldo.
        embed.setImage(
            brainrot.imagen || GIF_NUEVO
        );
    }

    let descripcion = '';

    for (
        const variante of VARIANTES
    ) {

        let precio =
            brainrot.valores[variante] ??
            'NO EXISTE';

        if (
            moneda === 'USD'
        ) {

            precio =
                convertirPrecioUSD(
                    precio
                );
        }

        const emoji =
            obtenerEmoji(
                variante
            );

        descripcion +=
            `${emoji} **${variante}:** ${precio}\n`;
    }

    embed.setDescription(
        descripcion
    );

    return embed;
}


// ============================================================
// IDS DE CANALES
// ============================================================

const CANAL_PANEL_MIDDLEMAN = '1498096496992845834';
const CANAL_LOGS_ID = '1542284565714968586';
const CANAL_RESENAS_ID = '1535036437865566348';

// ============================================================
// ROLES
// ============================================================

const ROLE_MIDDLEMAN_ID = '1499596482322501802';

const ROLES_STAFF_IDS = [
    '1499596482322501802',
    '1517988091653259364',
    '1499595987411406998',
    '1499606642898112612',
    '1499597074642243686',
    '1498106196589154334'
];

const ROLES_SOPORTE_IDS = [
    '1517988091653259364',
    '1499595987411406998',
    '1499606642898112612',
    '1499597074642243686',
    '1498106196589154334'
];

// ============================================================
// BASES DE DATOS
// ============================================================

const ticketsBD = new Map();
const resenasBD = new Map();

let contadorMiddleman = 1;
let contadorSoporte = 1;

// ============================================================
// ESTILOS
// ============================================================

const BTN_STYLE = {
    PRIMARY: 1,
    SECONDARY: 2,
    SUCCESS: 3,
    DANGER: 4
};

// ============================================================
// FECHA
// ============================================================

function formatearFecha(fecha) {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = String(fecha.getFullYear());

    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');

    return dia + '/' + mes + '/' + anio + ' ' + horas + ':' + minutos;
}

// ============================================================
// COMPROBAR STAFF
// ============================================================

function esStaff(member) {
    if (!member) return false;

    return (
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        ROLES_STAFF_IDS.some(function(rolId) {
            return member.roles.cache.has(rolId);
        })
    );
}

// ============================================================
// COMPROBAR STAFF SUPERIOR
// ============================================================

function esStaffSuperior(member) {
    if (!member) return false;

    return (
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        ROLES_SOPORTE_IDS.some(function(rolId) {
            return member.roles.cache.has(rolId);
        })
    );
}

// ============================================================
// READY
// ============================================================

client.once('ready', async function() {

    console.log('✅ Bot conectado como: ' + client.user.tag);

    try {

        await client.application.commands.set([

            {
                name: 'panel_middleman',
                description: 'Enviar el panel de Middleman (Solo Admin)'
            },

            {
                name: 'panel_soporte',
                description: 'Enviar el panel de Soporte General (Solo Admin)'
            },

            {
                name: 'añadir',
                description: 'Añadir un usuario al ticket',

                default_member_permissions:
                    PermissionFlagsBits.ManageChannels.toString(),

                options: [
                    {
                        name: 'usuario',
                        description: 'Usuario a añadir al ticket',
                        type: ApplicationCommandOptionType.User,
                        required: true
                    }
                ]
            },

            {
                name: 'force_ticket',
                description: 'Forzar el cierre del ticket sin necesidad de reseña'
            },

            {
                name: 'reseñar',
                description: 'Calificar al Middleman asignado al ticket',

                options: [
                    {
                        name: 'usuario',
                        description: 'Selecciona al Middleman asignado',
                        type: ApplicationCommandOptionType.User,
                        required: true
                    },

                    {
                        name: 'estrellas',
                        description: 'Calificación de 1 a 5',
                        type: ApplicationCommandOptionType.Integer,
                        required: true,
                        min_value: 1,
                        max_value: 5
                    },

                    {
                        name: 'comentario',
                        description: 'Comentario u opinión',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    }
                ]
            },

            {
                name: 'reseñas',
                description: 'Ver todas las reseñas de un usuario',

                options: [
                    {
                        name: 'usuario',
                        description: 'Usuario a consultar',
                        type: ApplicationCommandOptionType.User,
                        required: true
                    }
                ]
            },

            {
                name: 'repuntuaciones',
                description: 'Muestra el Top 10 de mejores calificaciones'
            },

            {
                name: 'spin',
                description: 'Ruleta del perdón 50/50'
            },
            {
                name: 'comandos',
                description: 'Muestra los comandos disponibles.'
            },
            {
                name: 'value_brainrot',
                description: 'Consulta el valor de los brainrots.'
            },
            {
                name: 'reglas',
                description: 'Muestra las reglas del servidor.'
            },
            {
                name: 'registro',
                description: 'Registrar una experiencia de un ticket de Middleman',
                options: [
                    { name: 'ticket', description: 'Canal del ticket que se va a registrar', type: ApplicationCommandOptionType.Channel, required: true, channel_types: [0] },
                    { name: 'resultado', description: 'Resultado del caso', type: ApplicationCommandOptionType.String, required: true, choices: [
                        { name: 'Positivo', value: 'Positivo' },
                        { name: 'Negativo', value: 'Negativo' }
                    ]},
                    { name: 'relato', description: 'Relata la experiencia y qué pasó', type: ApplicationCommandOptionType.String, required: true },
                    { name: 'motivo', description: 'Motivo del registro', type: ApplicationCommandOptionType.String, required: true }
                ]
            }

        ]);

        console.log('🤖 Comandos Slash registrados correctamente.');

    } catch (err) {

        console.error('❌ Error al registrar comandos:', err);

    }
});

// ============================================================
// INTERACTIONS
// ============================================================

client.on('interactionCreate', async function(interaction) {

    // ========================================================
    // COMANDOS SLASH
    // ========================================================

    if (interaction.isChatInputCommand()) {

        const commandName = interaction.commandName;
        const options = interaction.options;
        const channel = interaction.channel;
        const user = interaction.user;
        const member = interaction.member;
        const guild = interaction.guild;

        // ====================================================
        // COMANDOS BRAINROT Y REGLAS
        // ====================================================

        if (commandName === 'comandos') {
            return interaction.reply({
                embeds: [new EmbedBuilder().setTitle('Comandos disponibles').setDescription(
                    '`/value_brainrot` — consulta precios de brainrots en CLP o USD.'
                ).setImage(GIF_COMANDOS)]
            });
        }

        if (commandName === 'registro') {
            const ticket = options.getChannel('ticket', true);
            const resultado = options.getString('resultado', true);
            const relato = options.getString('relato', true).trim();
            const motivo = options.getString('motivo', true).trim();

            // Solo se permite registrar desde el canal designado, pero el registro
            // se basa en el ticket seleccionado por el Middleman.
            if (channel.id !== CANAL_REGISTROS_MIDDLEMAN) {
                return interaction.reply({ content: `Por seguridad, usa /registro en <#${CANAL_REGISTROS_MIDDLEMAN}>.`, ephemeral: true });
            }

            const datosTicket = ticketsBD.get(ticket.id);
            if (!ticket.name.startsWith('ticket-') || !datosTicket || datosTicket.tipo !== 'middleman') {
                return interaction.reply({ content: '❌ No encuentro los datos de ese ticket. Selecciona un ticket de Middleman activo que el bot haya creado y que no se haya perdido por reiniciar el bot.', ephemeral: true });
            }

            if (!esStaff(member) || !datosTicket.reclamadoPor || datosTicket.reclamadoPor.id !== user.id) {
                return interaction.reply({ content: '❌ Solo el Middleman que reclamó ese ticket puede registrar su experiencia.', ephemeral: true });
            }

            const creador = datosTicket.creador;
            const compradorVendedor = datosTicket.usuarioAñadido;
            if (!creador || !compradorVendedor || creador.id === compradorVendedor.id) {
                return interaction.reply({ content: '❌ No puedo identificar a los dos involucrados. Comprueba que el ticket tenga creador y que el Middleman haya usado /añadir para agregar al otro involucrado.', ephemeral: true });
            }

            const registroEmbed = new EmbedBuilder()
                .setTitle(`📋 Registro Middleman: ${resultado}`)
                .setColor(resultado === 'Positivo' ? 0x2ECC71 : 0xE74C3C)
                .addFields(
                    { name: '🎫 Ticket', value: `<#${ticket.id}>`, inline: false },
                    { name: '👤 Involucrado 1 (creador del ticket)', value: `${creador} (\`${creador.id}\`)`, inline: true },
                    { name: '👤 Involucrado 2 (añadido al ticket)', value: `${compradorVendedor} (\`${compradorVendedor.id}\`)`, inline: true },
                    { name: '🤝 Middleman que atendió', value: `${user} (\`${user.id}\`)`, inline: false },
                    { name: '📝 Relato', value: relato.slice(0, 1024) || 'Sin relato', inline: false },
                    { name: '📌 Motivo', value: motivo.slice(0, 1024) || 'Sin motivo', inline: false },
                    { name: '📅 Fecha', value: new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' }), inline: true }
                )
                .setFooter({ text: 'Registro creado por el Middleman que atendió el ticket' });

            await interaction.reply({ embeds: [registroEmbed], allowedMentions: { parse: [] } });
            return;
        }

        if (commandName === 'value_brainrot') {
            return interaction.reply({
                ephemeral: true,
                embeds: [new EmbedBuilder().setTitle('Valor de Brainrots').setDescription('Selecciona la moneda para consultar los precios.')],
                components: [new ActionRowBuilder().addComponents(crearMenuMoneda(user.id))]
            });
        }

        if (commandName === 'reglas') {
            if (channel.id !== CANAL_REGLAS) {
                return interaction.reply({content: `Usa este comando en <#${CANAL_REGLAS}>.`, ephemeral: true});
            }
            return interaction.reply({
                embeds: [crearMenuReglasEmbed()],
                components: [new ActionRowBuilder().addComponents(crearMenuReglas())]
            });
        }

        // ====================================================
        // PANEL MIDDLEMAN
        // ====================================================

        if (commandName === 'panel_middleman') {

            if (
                !member.permissions.has(
                    PermissionFlagsBits.Administrator
                )
            ) {

                return interaction.reply({
                    content: '❌ Solo administradores.',
                    ephemeral: true
                });

            }

            const embedPanel = new EmbedBuilder()
                .setTitle('🤝 Servicio Oficial de Middleman')
                .setColor(0x2ECC71)
                .setDescription(
                    '¿Quieres hacer tus trades, ventas, pvps, confiables pero no sabes como?, pues nosotros tenemos un equipo de intermediarios que te ayudará en todo lo necesario para que tus trades, ventas y pvps sean 100% legales. Están 100% recomendados por la comunidad. Los intermediarios, más conocidos como middleman, estarán siempre disponibles cuando necesites ayuda.\n\n' +
                    'Haz clic en el botón para solicitar un **Middleman** oficial para tu transacción.'
                )
                .setFooter({
                    text: 'Sistema de Tickets'
                })
                .setTimestamp();

            const filaBoton =
                new ActionRowBuilder().addComponents(

                    new ButtonBuilder()
                        .setCustomId('ticket_middleman')
                        .setLabel('middleman')
                        .setEmoji('🎟️')
                        .setStyle(BTN_STYLE.SUCCESS)

                );

            await interaction.channel.send({
                embeds: [embedPanel],
                components: [filaBoton]
            });

            return interaction.reply({
                content: '✅ Panel enviado correctamente.',
                ephemeral: true
            });
        }

        // ====================================================
        // PANEL SOPORTE
        // ====================================================

        if (commandName === 'panel_soporte') {

            if (
                !member.permissions.has(
                    PermissionFlagsBits.Administrator
                )
            ) {

                return interaction.reply({
                    content: '❌ Solo administradores.',
                    ephemeral: true
                });

            }

            const embedSoporte = new EmbedBuilder()
                .setTitle('🛠️ Centro de Soporte y Atención')
                .setColor(0x3498DB)
                .setDescription(
                    '¡Hola! ¿Te gustaría solucionar algún problema, resolver alguna pregunta o reportar algo? Te invito a abrir un ticket de soporte para que nuestro equipo de staff te ayude.\n\n' +
                    'Recuerda que el staff siempre intentará estar a disposición para ayudar a todos los miembros que lo necesiten. También pedimos no abrir un ticket sin razón o para molestar. Los miembros del staff darán lo mejor para mantener un excelente ambiente entre todos.\n\n' +
                    'Esperamos que le hayas prestado atención a esto. Si deseas abrir un ticket, ¡te invitamos a seleccionarlo abajo!'
                )
                .setFooter({
                    text: 'Sistema de Soporte'
                })
                .setTimestamp();

            const filaBotonesSoporte =
                new ActionRowBuilder().addComponents(

                    new ButtonBuilder()
                        .setCustomId('ticket_soporte')
                        .setLabel('soporte')
                        .setEmoji('🎟️')
                        .setStyle(BTN_STYLE.DANGER),

                    new ButtonBuilder()
                        .setCustomId('ticket_pregunta')
                        .setLabel('pregunta')
                        .setEmoji('👀')
                        .setStyle(BTN_STYLE.PRIMARY),

                    new ButtonBuilder()
                        .setCustomId('ticket_ayuda')
                        .setLabel('ayuda')
                        .setEmoji('⚠️')
                        .setStyle(BTN_STYLE.SUCCESS),

                    new ButtonBuilder()
                        .setCustomId('ticket_reportar')
                        .setLabel('reportar')
                        .setEmoji('❌')
                        .setStyle(BTN_STYLE.DANGER)

                );

            await interaction.channel.send({
                embeds: [embedSoporte],
                components: [filaBotonesSoporte]
            });

            return interaction.reply({
                content: '✅ Panel de soporte enviado correctamente.',
                ephemeral: true
            });
        }

        // ====================================================
        // AÑADIR
        // ====================================================

        if (commandName === 'añadir') {

            const esTicket =
                channel.name.startsWith('ticket-') ||
                ticketsBD.has(channel.id);

            if (!esTicket) {

                return interaction.reply({
                    content:
                        '❌ Este comando solo funciona dentro de un ticket activo.',
                    ephemeral: true
                });

            }

            if (!esStaff(member)) {

                return interaction.reply({
                    content:
                        '❌ Solo un **Middleman o superior** puede añadir usuarios al ticket.',
                    ephemeral: true
                });

            }

            const usuarioAAñadir =
                options.getUser('usuario');

            try {

                await channel.permissionOverwrites.edit(
                    usuarioAAñadir.id,
                    {
                        ViewChannel: true,
                        SendMessages: true,
                        AttachFiles: true
                    }
                );

                const datosTicket = ticketsBD.get(channel.id);
                if (datosTicket) {
                    datosTicket.usuarioAñadido = usuarioAAñadir;
                    datosTicket.usuarioAñadidoPor = user;
                }

                return interaction.reply({
                    content:
                        '✅ <@' +
                        usuarioAAñadir.id +
                        '> ha sido añadido al ticket.'
                });

            } catch (err) {

                console.error(err);

                return interaction.reply({
                    content:
                        '❌ Error al intentar dar permisos al usuario.',
                    ephemeral: true
                });

            }
        }

        // ====================================================
        // FORCE TICKET
        // ====================================================

        if (commandName === 'force_ticket') {

            const datos =
                ticketsBD.get(channel.id);

            const esCanalTicket =
                channel.name.startsWith('ticket-') ||
                !!datos;

            if (!esCanalTicket) {

                return interaction.reply({
                    content:
                        '❌ Este comando solo se puede usar dentro de un canal de ticket.',
                    ephemeral: true
                });

            }

            if (!esStaff(member)) {

                return interaction.reply({
                    content:
                        '❌ Solo el Staff o Administradores pueden forzar el cierre de un ticket.',
                    ephemeral: true
                });

            }

            await interaction.reply({
                content:
                    '⚠️ **Cierre forzado iniciado.** Guardando log y borrando canal en 5 segundos...'
            });

            const creadorMencion =
                datos && datos.creador
                    ? '<@' + datos.creador.id + '>'
                    : 'Desconocido';

            const atendidoMencion =
                datos && datos.reclamadoPor
                    ? '<@' + datos.reclamadoPor.id + '>'
                    : 'Sin reclamar';

            const fechaApertura =
                datos && datos.fechaApertura
                    ? formatearFecha(datos.fechaApertura)
                    : 'Desconocida';

            const embedLog =
                new EmbedBuilder()
                    .setTitle(
                        '📋 Log - ' +
                        channel.name +
                        ' (Cierre Forzado)'
                    )
                    .setColor(0xE74C3C)
                    .addFields(

                        {
                            name: '👤 Creador',
                            value: creadorMencion,
                            inline: true
                        },

                        {
                            name: '📌 Atendido por',
                            value: atendidoMencion,
                            inline: true
                        },

                        {
                            name: '🔒 Cerrado por',
                            value:
                                '<@' +
                                user.id +
                                '> (Forzado)',
                            inline: true
                        },

                        {
                            name: '🕒 Creado',
                            value: fechaApertura,
                            inline: false
                        },

                        {
                            name: '⏰ Cerrado',
                            value:
                                formatearFecha(new Date()),
                            inline: false
                        }

                    )
                    .setFooter({
                        text:
                            'Ticket cerrado mediante /force_ticket'
                    })
                    .setTimestamp();

            const canalLogs =
                guild.channels.cache.get(CANAL_LOGS_ID);

            if (canalLogs) {

                await canalLogs.send({
                    embeds: [embedLog]
                });

            }

            setTimeout(
                async function() {

                    ticketsBD.delete(channel.id);

                    await channel
                        .delete()
                        .catch(function() {});

                },
                5000
            );

            return;
        }

        // ====================================================
        // SPIN
        // ====================================================

        if (commandName === 'spin') {

            const esPerdonado =
                Math.random() < 0.5;

            const resultado =
                esPerdonado
                    ? 'PERDONADO 🟢'
                    : 'NO PERDONADO 🔴';

            const embedRuleta =
                new EmbedBuilder()
                    .setTitle('🎰 Ruleta del Perdón')
                    .setColor(
                        esPerdonado
                            ? 0x2ECC71
                            : 0xE74C3C
                    )
                    .setDescription(
                        '**Juzgando a:** ' +
                        '<@' +
                        user.id +
                        '>\n\n' +
                        '**Resultado:** ' +
                        resultado
                    );

            return interaction.reply({
                embeds: [embedRuleta]
            });
        }

        // ====================================================
        // RESEÑAR
        // ====================================================

        if (commandName === 'reseñar') {

            const datos =
                ticketsBD.get(channel.id);

            const esCanalTicket =
                channel.name.startsWith(
                    'ticket-middleman-'
                ) ||
                !!datos;

            if (!esCanalTicket) {

                return interaction.reply({
                    content:
                        '❌ Este comando solo se puede utilizar dentro de un ticket activo de Middleman.',
                    ephemeral: true
                });

            }

            if (datos && datos.tipo !== 'middleman') {

                return interaction.reply({
                    content:
                        '❌ Las reseñas solo pueden hacerse en tickets de Middleman.',
                    ephemeral: true
                });

            }

            const objetivo =
                options.getUser('usuario');

            const origen =
                '🎟️ Ticket';

            if (
                datos &&
                datos.reclamadoPor &&
                objetivo.id !== datos.reclamadoPor.id
            ) {

                return interaction.reply({
                    content:
                        '❌ Solo puedes reseñar al Middleman asignado: <@' +
                        datos.reclamadoPor.id +
                        '>.',
                    ephemeral: true
                });

            }

            if (
                datos &&
                user.id !== datos.creador.id
            ) {

                return interaction.reply({
                    content:
                        '❌ Solo el creador del ticket puede hacer la reseña.',
                    ephemeral: true
                });

            }

            if (
                datos &&
                datos.resenaHecha
            ) {

                return interaction.reply({
                    content:
                        '❌ Ya has registrado tu reseña para este ticket.',
                    ephemeral: true
                });

            }

            const estrellas =
                options.getInteger('estrellas');

            const comentario =
                options.getString('comentario') ||
                'Sin comentario.';

            if (!resenasBD.has(objetivo.id)) {

                resenasBD.set(
                    objetivo.id,
                    []
                );

            }

            resenasBD
                .get(objetivo.id)
                .push({

                    autorId: user.id,
                    estrellas: estrellas,
                    comentario: comentario,
                    tipoOrigen: origen

                });

            if (datos) {

                datos.resenaHecha = true;

            }

            const estrellasStr =
                '⭐'.repeat(estrellas);

            const embedResena =
                new EmbedBuilder()
                    .setTitle(
                        '⭐ Reseña Guardada (' +
                        origen +
                        ')'
                    )
                    .setColor(0xF1C40F)
                    .setDescription(
                        '**Cliente:** <@' +
                        user.id +
                        '>\n' +
                        '**Middleman Reseñado:** <@' +
                        objetivo.id +
                        '>\n' +
                        '**Calificación:** ' +
                        estrellasStr +
                        ' (' +
                        estrellas +
                        '/5)\n' +
                        '**Comentario:** ' +
                        comentario
                    )
                    .setTimestamp();

            return interaction.reply({
                embeds: [embedResena]
            });
        }

        // ====================================================
        // RESEÑAS
        // ====================================================

        if (commandName === 'reseñas') {

            if (
                channel.id !== CANAL_RESENAS_ID
            ) {

                return interaction.reply({
                    content:
                        '❌ Usa este comando únicamente en <#' +
                        CANAL_RESENAS_ID +
                        '>.',
                    ephemeral: true
                });

            }

            const usuario =
                options.getUser('usuario');

            const lista =
                resenasBD.get(usuario.id) || [];

            if (lista.length === 0) {

                return interaction.reply({
                    content:
                        'ℹ️ El usuario <@' +
                        usuario.id +
                        '> aún no tiene reseñas.'
                });

            }

            const promedio =
                (
                    lista.reduce(
                        function(acc, r) {
                            return acc + r.estrellas;
                        },
                        0
                    ) /
                    lista.length
                ).toFixed(1);

            let texto = '';

            lista
                .slice(-10)
                .forEach(function(r, i) {

                    const tagOrigen =
                        r.tipoOrigen ||
                        '⭐ General';

                    texto +=
                        '**' +
                        (i + 1) +
                        '.** [' +
                        tagOrigen +
                        '] Por <@' +
                        r.autorId +
                        '> - ' +
                        '⭐'.repeat(r.estrellas) +
                        '\n> *' +
                        r.comentario +
                        '*\n\n';

                });

            const embedHistorial =
                new EmbedBuilder()
                    .setTitle(
                        '⭐ Historial Global de Reseñas - ' +
                        usuario.username
                    )
                    .setColor(0xF1C40F)
                    .setThumbnail(
                        usuario.displayAvatarURL({
                            dynamic: true
                        })
                    )
                    .setDescription(
                        '**Promedio Global:** ' +
                        promedio +
                        ' / 5.0 ⭐\n' +
                        '**Total de Reseñas:** ' +
                        lista.length +
                        '\n\n' +
                        texto
                    )
                    .setFooter({
                        text:
                            'Reseñas consolidadas de Tickets y Subastas'
                    })
                    .setTimestamp();

            return interaction.reply({
                embeds: [embedHistorial]
            });
        }

        // ====================================================
        // REPUNTUACIONES
        // ====================================================

        if (
            commandName === 'repuntuaciones'
        ) {

            if (
                resenasBD.size === 0
            ) {

                return interaction.reply({
                    content:
                        'ℹ️ Aún no hay reseñas registradas en la base de datos.'
                });

            }

            const listaUsuarios = [];

            resenasBD.forEach(
                function(lista, usuarioId) {

                    const total =
                        lista.length;

                    const promedio =
                        lista.reduce(
                            function(acc, r) {
                                return acc + r.estrellas;
                            },
                            0
                        ) / total;

                    listaUsuarios.push({
                        usuarioId: usuarioId,
                        promedio: promedio,
                        total: total
                    });

                }
            );

            listaUsuarios.sort(
                function(a, b) {

                    if (
                        b.promedio !==
                        a.promedio
                    ) {

                        return (
                            b.promedio -
                            a.promedio
                        );

                    }

                    return (
                        b.total -
                        a.total
                    );

                }
            );

            const medallas =
                ['🥇', '🥈', '🥉'];

            let descripcionTop = '';

            const top10 =
                listaUsuarios.slice(0, 10);

            top10.forEach(
                function(item, index) {

                    const emojiMedalla =
                        medallas[index] ||
                        '🎖️';

                    const promFormat =
                        item.promedio.toFixed(1);

                    descripcionTop +=
                        emojiMedalla +
                        ' **#' +
                        (index + 1) +
                        '** <@' +
                        item.usuarioId +
                        '>\n' +
                        '> **Calificación:** ' +
                        promFormat +
                        ' / 5.0 ⭐ | **Reseñas:** ' +
                        item.total +
                        '\n\n';

                }
            );

            const embedTop =
                new EmbedBuilder()
                    .setTitle(
                        '🏆 Top 10 Mejores Reseñados y Puntuaciones'
                    )
                    .setColor(0xF1C40F)
                    .setDescription(
                        descripcionTop
                    )
                    .setFooter({
                        text:
                            'Tabla de Clasificación de Middlemans y Staff'
                    })
                    .setTimestamp();

            return interaction.reply({
                embeds: [embedTop]
            });
        }
    }

    // ========================================================
    // MENÚS DESPLEGABLES: REGLAS Y VALORES BRAINROT
    // ========================================================

    if (interaction.isStringSelectMenu()) {
        const customId = interaction.customId;

        if (customId === 'reglas_menu_publico' || customId === 'reglas_privado') {
            const embed = interaction.values[0] === 'general'
                ? crearReglasGeneralesEmbed()
                : crearReglasMiddlemanEmbed();
            const components = [new ActionRowBuilder().addComponents(crearMenuReglasPrivado())];
            if (customId === 'reglas_menu_publico') {
                return interaction.reply({embeds: [embed], components, ephemeral: true});
            }
            return interaction.update({embeds: [embed], components});
        }

        if (customId.startsWith('brainrot_currency_')) {
            const ownerId = customId.slice('brainrot_currency_'.length);
            if (interaction.user.id !== ownerId) {
                return interaction.reply({content: 'Este menú no te pertenece.', ephemeral: true});
            }
            const moneda = interaction.values[0];
            return interaction.update({
                embeds: [new EmbedBuilder().setTitle('Selecciona un Brainrot').setDescription(`Selecciona un brainrot para ver el precio en ${moneda}.`)],
                components: [new ActionRowBuilder().addComponents(crearMenuBrainrots(ownerId, moneda))]
            });
        }

        if (customId.startsWith('brainrot_select_')) {
            const partes = customId.split('_');
            const ownerId = partes[2];
            const moneda = partes[3];
            if (interaction.user.id !== ownerId) {
                return interaction.reply({content: 'Este menú no te pertenece.', ephemeral: true});
            }
            const nombre = interaction.values[0];
            const files = obtenerArchivosBrainrot(nombre);
            return interaction.update({
                embeds: [crearEmbedBrainrot(nombre, moneda)],
                components: [new ActionRowBuilder().addComponents(crearMenuBrainrots(ownerId, moneda))],
                files
            });
        }
    }

    // ========================================================
    // BOTONES
    // ========================================================

    if (interaction.isButton()) {

        const customId = interaction.customId;
        const guild = interaction.guild;
        const user = interaction.user;
        const channel = interaction.channel;
        const member = interaction.member;

        // ====================================================
        // CREAR TICKET MIDDLEMAN
        // ====================================================

        if (
            customId ===
            'ticket_middleman'
        ) {

            await interaction.deferReply({
                ephemeral: true
            });

            const nombreCanal =
                'ticket-middleman-' +
                contadorMiddleman++;

            const permissionOverwrites = [

                {
                    id: guild.roles.everyone.id,
                    deny: [
                        PermissionFlagsBits.ViewChannel
                    ]
                },

                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles
                    ]
                }

            ];

            ROLES_STAFF_IDS.forEach(
                function(rolId) {

                    permissionOverwrites.push({

                        id: rolId,

                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AttachFiles
                        ]

                    });

                }
            );

            try {

                const ticketChannel =
                    await guild.channels.create({

                        name: nombreCanal,
                        type: 0,
                        permissionOverwrites: permissionOverwrites

                    });

                ticketsBD.set(
                    ticketChannel.id,
                    {

                        tipo: 'middleman',
                        creador: user,
                        reclamadoPor: null,
                        fechaApertura: new Date(),
                        resenaHecha: false

                    }
                );

                const filaBotonesTicket =
                    new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()
                                .setCustomId(
                                    'btn_reclamar'
                                )
                                .setLabel(
                                    'Reclamar Ticket'
                                )
                                .setEmoji('📜')
                                .setStyle(
                                    BTN_STYLE.SECONDARY
                                ),

                            new ButtonBuilder()
                                .setCustomId(
                                    'btn_cerrar'
                                )
                                .setLabel(
                                    'Cerrar Ticket'
                                )
                                .setEmoji('🔒')
                                .setStyle(
                                    BTN_STYLE.DANGER
                                )

                        );

                const embedBienvenida =
                    new EmbedBuilder()
                        .setTitle(
                            '🎟️ Ticket de MIDDLEMAN'
                        )
                        .setColor(0x2ECC71)
                        .setDescription(
                            '<@' +
                            user.id +
                            '> abrió un ticket para **middleman**. Un miembro del staff te atenderá en breve.'
                        )
                        .setFooter({
                            text:
                                'Sistema de Tickets'
                        })
                        .setTimestamp();

                const mencionesRoles =
                    ROLES_STAFF_IDS
                        .map(
                            function(id) {
                                return '<@&' + id + '>';
                            }
                        )
                        .join(' ');

                await ticketChannel.send({

                    content:
                        '<@' +
                        user.id +
                        '> ' +
                        mencionesRoles,

                    embeds: [
                        embedBienvenida
                    ],

                    components: [
                        filaBotonesTicket
                    ]

                });

                return interaction.editReply({

                    content:
                        '✅ Ticket creado en: <#' +
                        ticketChannel.id +
                        '>'

                });

            } catch (err) {

                console.error(err);

                return interaction.editReply({

                    content:
                        '❌ Error al crear canal.'

                });

            }
        }

        // ====================================================
        // CREAR TICKET SOPORTE
        // ====================================================

        if (
            [
                'ticket_soporte',
                'ticket_pregunta',
                'ticket_ayuda',
                'ticket_reportar'
            ].includes(customId)
        ) {

            await interaction.deferReply({
                ephemeral: true
            });

            const detallesCategorias = {

                ticket_soporte: {
                    nombre: 'soporte',
                    emoji: '🎫',
                    titulo: 'Ticket de SOPORTE',
                    color: 0xE74C3C
                },

                ticket_pregunta: {
                    nombre: 'pregunta',
                    emoji: '❓',
                    titulo: 'Ticket de PREGUNTA',
                    color: 0x3498DB
                },

                ticket_ayuda: {
                    nombre: 'ayuda',
                    emoji: '⚠️',
                    titulo: 'Ticket de AYUDA',
                    color: 0x2ECC71
                },

                ticket_reportar: {
                    nombre: 'reportar',
                    emoji: '🚨',
                    titulo: 'Ticket de REPORTE',
                    color: 0x95A5A6
                }

            };

            const info =
                detallesCategorias[customId];

            const nombreCanal =
                'ticket-' +
                info.nombre +
                '-' +
                contadorSoporte++;

            const permissionOverwrites = [

                {
                    id: guild.roles.everyone.id,
                    deny: [
                        PermissionFlagsBits.ViewChannel
                    ]
                },

                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.AttachFiles
                    ]
                },

                {
                    id: ROLE_MIDDLEMAN_ID,
                    deny: [
                        PermissionFlagsBits.ViewChannel
                    ]
                }

            ];

            ROLES_SOPORTE_IDS.forEach(
                function(rolId) {

                    permissionOverwrites.push({

                        id: rolId,

                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.AttachFiles
                        ]

                    });

                }
            );

            try {

                const ticketChannel =
                    await guild.channels.create({

                        name: nombreCanal,
                        type: 0,
                        permissionOverwrites: permissionOverwrites

                    });

                ticketsBD.set(
                    ticketChannel.id,
                    {

                        tipo: info.nombre,
                        creador: user,
                        reclamadoPor: null,
                        fechaApertura: new Date(),
                        resenaHecha: true

                    }
                );

                const filaBotonesTicket =
                    new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()
                                .setCustomId(
                                    'btn_reclamar'
                                )
                                .setLabel(
                                    'Reclamar Ticket'
                                )
                                .setEmoji('📜')
                                .setStyle(
                                    BTN_STYLE.SECONDARY
                                ),

                            new ButtonBuilder()
                                .setCustomId(
                                    'btn_cerrar'
                                )
                                .setLabel(
                                    'Cerrar Ticket'
                                )
                                .setEmoji('🔒')
                                .setStyle(
                                    BTN_STYLE.DANGER
                                )

                        );

                const embedBienvenida =
                    new EmbedBuilder()
                        .setTitle(
                            info.emoji +
                            ' ' +
                            info.titulo
                        )
                        .setColor(info.color)
                        .setDescription(
                            '<@' +
                            user.id +
                            '> abrió un ticket para **' +
                            info.nombre +
                            '**. Un miembro del staff te atenderá en breve.'
                        )
                        .setFooter({
                            text:
                                'Sistema de Soporte'
                        })
                        .setTimestamp();

                const mencionesRoles =
                    ROLES_SOPORTE_IDS
                        .map(
                            function(id) {
                                return '<@&' + id + '>';
                            }
                        )
                        .join(' ');

                await ticketChannel.send({

                    content:
                        '<@' +
                        user.id +
                        '> ' +
                        mencionesRoles,

                    embeds: [
                        embedBienvenida
                    ],

                    components: [
                        filaBotonesTicket
                    ]

                });

                return interaction.editReply({

                    content:
                        '✅ Ticket de ' +
                        info.nombre +
                        ' creado en: <#' +
                        ticketChannel.id +
                        '>'

                });

            } catch (err) {

                console.error(err);

                return interaction.editReply({

                    content:
                        '❌ Error al crear el canal de ticket.'

                });

            }
        }

        // ====================================================
        // RECLAMAR TICKET
        // ====================================================

        if (
            customId ===
            'btn_reclamar'
        ) {

            const datos =
                ticketsBD.get(channel.id);

            if (!datos) {

                return interaction.reply({

                    content:
                        '❌ Datos de ticket no encontrados.',

                    ephemeral: true

                });

            }

            const esAdministrador =
                member.permissions.has(
                    PermissionFlagsBits.Administrator
                );

            const tieneRolStaff =
                ROLES_STAFF_IDS.some(
                    function(rolId) {
                        return member.roles.cache.has(rolId);
                    }
                );

            if (
                !tieneRolStaff &&
                !esAdministrador
            ) {

                return interaction.reply({

                    content:
                        '❌ No tienes permiso para reclamar este ticket.',

                    ephemeral: true

                });

            }

            const esTicketSoporte = [

                'soporte',
                'pregunta',
                'ayuda',
                'reportar'

            ].includes(datos.tipo);

            const esMiddleman =
                member.roles.cache.has(
                    ROLE_MIDDLEMAN_ID
                );

            const tieneRolSuperior =
                ROLES_SOPORTE_IDS.some(
                    function(rolId) {
                        return member.roles.cache.has(rolId);
                    }
                );

            if (
                esTicketSoporte &&
                esMiddleman &&
                !tieneRolSuperior &&
                !esAdministrador
            ) {

                return interaction.reply({

                    content:
                        '❌ Los Middleman sin un rol superior solo pueden reclamar tickets de **Middleman**.',

                    ephemeral: true

                });

            }

            if (datos.reclamadoPor) {

                return interaction.reply({

                    content:
                        '⚠️ Este ticket ya fue reclamado por <@' +
                        datos.reclamadoPor.id +
                        '>.',

                    ephemeral: true

                });

            }

            datos.reclamadoPor =
                user;

            try {

                // =================================================
                // TICKET SOPORTE
                // =================================================

                if (esTicketSoporte) {

                    await channel.permissionOverwrites.edit(
                        ROLE_MIDDLEMAN_ID,
                        {
                            ViewChannel: false
                        }
                    ).catch(function() {});

                    for (
                        const rolId
                        of ROLES_SOPORTE_IDS
                    ) {

                        await channel.permissionOverwrites.edit(
                            rolId,
                            {
                                ViewChannel: true,
                                SendMessages: true,
                                AttachFiles: true
                            }
                        ).catch(function() {});

                    }

                    await channel.permissionOverwrites.edit(
                        datos.creador.id,
                        {
                            ViewChannel: true,
                            SendMessages: true,
                            AttachFiles: true
                        }
                    ).catch(function() {});

                }

                // =================================================
                // TICKET MIDDLEMAN
                // =================================================

                else {

                    for (
                        const rolId
                        of ROLES_STAFF_IDS
                    ) {

                        if (
                            rolId ===
                            '1517988091653259364'
                        ) {

                            await channel.permissionOverwrites.edit(
                                rolId,
                                {
                                    ViewChannel: true,
                                    SendMessages: true,
                                    AttachFiles: true
                                }
                            ).catch(function() {});

                        } else {

                            await channel.permissionOverwrites.edit(
                                rolId,
                                {
                                    ViewChannel: false
                                }
                            ).catch(function() {});

                        }
                    }

                    await channel.permissionOverwrites.edit(
                        user.id,
                        {
                            ViewChannel: true,
                            SendMessages: true,
                            AttachFiles: true
                        }
                    ).catch(function() {});

                    await channel.permissionOverwrites.edit(
                        datos.creador.id,
                        {
                            ViewChannel: true,
                            SendMessages: true,
                            AttachFiles: true
                        }
                    ).catch(function() {});

                }

                // =================================================
                // ACTUALIZAR BOTÓN
                // =================================================

                const filaActualizada =
                    new ActionRowBuilder()
                        .addComponents(

                            new ButtonBuilder()
                                .setCustomId(
                                    'btn_reclamar'
                                )
                                .setLabel(
                                    'Ticket Reclamado'
                                )
                                .setEmoji('📜')
                                .setStyle(
                                    BTN_STYLE.SECONDARY
                                )
                                .setDisabled(true),

                            new ButtonBuilder()
                                .setCustomId(
                                    'btn_cerrar'
                                )
                                .setLabel(
                                    'Cerrar Ticket'
                                )
                                .setEmoji('🔒')
                                .setStyle(
                                    BTN_STYLE.DANGER
                                )

                        );

                await interaction.update({

                    components: [
                        filaActualizada
                    ]

                });

                if (esTicketSoporte) {

                    return channel.send({

                        content:
                            '📌 **Ticket reclamado por <@' +
                            user.id +
                            '>.**\n' +
                            '👥 El ticket continúa visible para todo el Staff autorizado.'

                    });

                }

                return channel.send({

                    content:
                        '📌 **Reclamado por <@' +
                        user.id +
                        '>.**\n' +
                        '🔒 Solo el creador, el miembro que reclamó y el rol Staff autorizado tienen acceso.'

                });

            } catch (error) {

                console.error(
                    '❌ Error al reclamar ticket:',
                    error
                );

            }
        }

        // ====================================================
        // CERRAR TICKET
        // ====================================================

        if (
            customId ===
            'btn_cerrar'
        ) {

            const datos =
                ticketsBD.get(channel.id);

            if (!datos) {

                return interaction.reply({

                    content:
                        '❌ Datos no encontrados.',

                    ephemeral: true

                });

            }

            if (!esStaff(member)) {

                return interaction.reply({

                    content:
                        '❌ Solo un **Middleman o superior** puede cerrar tickets.',

                    ephemeral: true

                });

            }

            if (!datos.reclamadoPor) {

                return interaction.reply({

                    content:
                        '⚠️ Un encargado debe reclamar el ticket antes de cerrarlo.',

                    ephemeral: true

                });

            }

            if (
                datos.tipo === 'middleman' &&
                !datos.resenaHecha
            ) {

                return interaction.reply({

                    content:
                        '⚠️ **ESPERA** Antes de cerrar el ticket, <@' +
                        datos.creador.id +
                        '> debe reseñar a: <@' +
                        datos.reclamadoPor.id +
                        '>',

                    ephemeral: false

                });

            }

            const btnConfirmar =
                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()
                            .setCustomId(
                                'btn_confirmar_cierre'
                            )
                            .setLabel(
                                '⚠️ Confirmar Cierre'
                            )
                            .setStyle(
                                BTN_STYLE.DANGER
                            )

                    );

            return interaction.reply({

                content:
                    '¿Estás seguro de cerrar este ticket?',

                components: [
                    btnConfirmar
                ]

            });
        }

        // ====================================================
        // CONFIRMAR CIERRE
        // ====================================================

        if (
            customId ===
            'btn_confirmar_cierre'
        ) {

            const datos =
                ticketsBD.get(channel.id);

            if (!datos) {

                return interaction.reply({

                    content:
                        '❌ Datos del ticket no encontrados.',

                    ephemeral: true

                });

            }

            if (!esStaff(member)) {

                return interaction.reply({

                    content:
                        '❌ Solo un **Middleman o superior** puede cerrar tickets.',

                    ephemeral: true

                });

            }

            if (!datos.reclamadoPor) {

                return interaction.reply({

                    content:
                        '❌ El ticket no tiene un encargado.',

                    ephemeral: true

                });

            }

            if (
                datos.tipo === 'middleman' &&
                !datos.resenaHecha
            ) {

                return interaction.reply({

                    content:
                        '⚠️ <@' +
                        datos.creador.id +
                        '> todavía debe realizar la reseña.',

                    ephemeral: true

                });

            }

            await interaction.update({

                content:
                    '🔒 Guardando log y cerrando en 5s...',

                components: []

            });

            const embedLog =
                new EmbedBuilder()
                    .setTitle(
                        '📋 Log - ' +
                        channel.name
                    )
                    .setColor(0x2ECC71)
                    .addFields(

                        {
                            name: '👤 Creador',
                            value:
                                '<@' +
                                datos.creador.id +
                                '>',
                            inline: true
                        },

                        {
                            name: '📌 Atendido por',
                            value:
                                '<@' +
                                datos.reclamadoPor.id +
                                '>',
                            inline: true
                        },

                        {
                            name: '🔒 Cerrado por',
                            value:
                                '<@' +
                                user.id +
                                '>',
                            inline: true
                        },

                        {
                            name: '🕒 Creado',
                            value:
                                formatearFecha(
                                    datos.fechaApertura
                                ),
                            inline: false
                        },

                        {
                            name: '⏰ Cerrado',
                            value:
                                formatearFecha(
                                    new Date()
                                ),
                            inline: false
                        }

                    )
                    .setTimestamp();

            const canalLogs =
                guild.channels.cache.get(
                    CANAL_LOGS_ID
                );

            if (canalLogs) {

                await canalLogs.send({

                    embeds: [
                        embedLog
                    ]

                });

            }

            setTimeout(
                async function() {

                    ticketsBD.delete(
                        channel.id
                    );

                    await channel
                        .delete()
                        .catch(function() {});

                },
                5000
            );
        }
    }
});

// ============================================================
// LOGIN
// ============================================================

const DISCORD_TOKEN = process.env.TOKEN;
if (!DISCORD_TOKEN) {
    console.error('❌ Falta TOKEN en el archivo .env');
    process.exit(1);
}

client.login(DISCORD_TOKEN);
