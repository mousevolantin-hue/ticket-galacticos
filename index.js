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
    ApplicationCommandOptionType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
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

// ============================================================
// SISTEMA DE SORTEOS THE GALACTICS
// ============================================================
const ARCHIVO_SORTEOS = path.join(__dirname, 'sorteos.json');
let sorteos = [];
try {
    if (fs.existsSync(ARCHIVO_SORTEOS)) {
        const datos = JSON.parse(fs.readFileSync(ARCHIVO_SORTEOS, 'utf8') || '[]');
        sorteos = Array.isArray(datos) ? datos : [];
    }
} catch (error) {
    console.error('No se pudo cargar sorteos.json:', error);
}
function guardarSorteos() {
    fs.writeFileSync(ARCHIVO_SORTEOS, JSON.stringify(sorteos, null, 2), 'utf8');
}
function parsearDuracionSorteo(valor) {
    const m = String(valor || '').trim().match(/^(\d+)\s*(s|m|h|d|w|y)$/i);
    if (!m) return null;
    const n = Number(m[1]);
    const unidades = { s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000, y: 31536000000 };
    const ms = n * unidades[m[2].toLowerCase()];
    return Number.isSafeInteger(ms) && ms > 0 && ms <= 31536000000 ? ms : null;
}
function colorSorteo(valor) {
    return ({ rojo: 0xE74C3C, verde: 0x2ECC71, azul: 0x3498DB, amarillo: 0xF1C40F, morado: 0x9B59B6, naranja: 0xE67E22, negro: 0x2B2D31 })[valor] || 0xE67E22;
}
function embedSorteo(s) {
    const e = new EmbedBuilder()
        .setColor(colorSorteo(s.color))
        .setTitle(`🎉 ${s.titulo}`)
        .setDescription(`**Organizado por:** <@${s.hostId}>\n\nPulsa el botón para participar.\n\n**Participantes:** ${s.participantes.length}\n**Finaliza:** <t:${Math.floor(s.termina / 1000)}:R>`)
        .setFooter({ text: `The Galactics • Sorteo ${s.id}` })
        .setTimestamp(new Date(s.creado));
    if (s.imagen) e.setImage(s.imagen);
    return e;
}
function filaParticipar(s) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sorteo:entrar:${s.id}`).setLabel('Participar').setEmoji('🎉').setStyle(3)
    );
}
function filaPanelSorteo(s) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`sorteo:reclamado:${s.id}`).setLabel('Reclamado').setStyle(3),
        new ButtonBuilder().setCustomId(`sorteo:reroll:${s.id}`).setLabel('Reroll').setStyle(2),
        new ButtonBuilder().setCustomId(`sorteo:cancelar:${s.id}`).setLabel('Cancelar sorteo').setStyle(4)
    );
}
async function finalizarSorteo(s, reroll = false) {
    if (!s || s.estado === 'cancelado') return;
    const guild = await client.guilds.fetch(s.guildId).catch(() => null);
    const canal = guild ? await guild.channels.fetch(s.canalId).catch(() => null) : null;
    if (!guild || !canal || !canal.isTextBased()) return;
    if (s.timer) { clearTimeout(s.timer); s.timer = null; }

    const anteriores = Array.isArray(s.ganadoresAnteriores) ? s.ganadoresAnteriores : [];
    const elegibles = s.participantes.filter(id => !anteriores.includes(id));
    if (!elegibles.length) {
        s.estado = 'finalizado';
        s.ganadorId = null;
        guardarSorteos();
        await canal.send(`🎉 El sorteo **${s.titulo}** terminó, pero no quedan participantes elegibles para otro ganador.`);
    } else {
        const ganadorId = elegibles[Math.floor(Math.random() * elegibles.length)];
        s.ganadorId = ganadorId;
        s.ganadoresAnteriores = [...anteriores, ganadorId];
        s.estado = 'finalizado';
        guardarSorteos();

        const resultado = new EmbedBuilder()
            .setColor(colorSorteo(s.color))
            .setTitle('🏆 ¡Sorteo finalizado!')
            .setDescription(`¡Felicidades <@${ganadorId}>! Has ganado **${s.titulo}**.\n\nEscribe **claim** en este canal para reclamar tu premio.`)
            .setTimestamp();
        if (s.imagen) resultado.setImage(s.imagen);
        await canal.send({ content: `<@${ganadorId}>`, embeds: [resultado], allowedMentions: { users: [ganadorId] } });

        const ganador = await client.users.fetch(ganadorId).catch(() => null);
        if (ganador) {
            const dm = new EmbedBuilder()
                .setColor(colorSorteo(s.color))
                .setTitle('🎉 ¡Felicitaciones!')
                .setDescription(`¡Enhorabuena! Has ganado el sorteo **${s.titulo}** en **${guild.name}**.\n\nDirígete a <#${s.canalId}> y escribe **claim** para reclamar tu premio.`)
                .setImage(GIF_NUEVO)
                .setFooter({ text: 'The Galactics Bot' });
            await ganador.send({ embeds: [dm] }).catch(() => null);
        }
    }

    // El panel se envía inmediatamente al organizador por DM al terminar.
    const host = await client.users.fetch(s.creadorId).catch(() => null);
    if (host) {
        const panel = new EmbedBuilder()
            .setColor(0xF1C40F)
            .setTitle('Panel de sorteo')
            .setDescription(s.ganadorId
                ? `<@${s.ganadorId}> ha ganado **${s.titulo}**.\nGestiona el resultado con los botones.`
                : `El sorteo **${s.titulo}** terminó sin ganador disponible.`);
        await host.send({ embeds: [panel], components: [filaPanelSorteo(s)] }).catch(() => null);
    }

    if (s.contador && !s.contadorEnviado) {
        s.contadorEnviado = true;
        guardarSorteos();
        // El contador siempre se publica en el canal general configurado,
        // nunca en el canal donde se publicó el sorteo.
        const canalGeneral = await guild.channels.fetch('1498090090386161765').catch(() => null);
        if (!canalGeneral || !canalGeneral.isTextBased() || !canalGeneral.send) {
            console.error('No se pudo encontrar o enviar al canal general 1498090090386161765. Revisa que el bot tenga acceso y permisos.');
        }
        if (canalGeneral && canalGeneral.isTextBased() && canalGeneral.send) {
            // Publica diez mensajes independientes: solo el número, uno por segundo.
            for (let i = 1; i <= 10; i++) {
                await canalGeneral.send(String(i)).catch(err => {
                    console.error(`No se pudo enviar el número ${i} del contador al canal general:`, err);
                    return null;
                });
                if (i < 10) await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
}
function programarSorteo(s) {
    if (s.estado !== 'activo') return;
    const restante = s.termina - Date.now();
    if (restante <= 0) return void finalizarSorteo(s);
    s.timer = setTimeout(() => finalizarSorteo(s).catch(err => console.error('Error finalizando sorteo:', err)), restante);
}



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


function crearReglasSancionesEmbed() {
    return new EmbedBuilder()
        .setTitle('Reglas de sanciones')
        .setDescription(`
**1. Pruebas y contexto**
- Toda sanción debe basarse en pruebas verificables y en el contexto completo de lo ocurrido.
- Antes de decidir, el staff debe revisar la conversación y los mensajes relevantes, no solo una captura aislada.

**2. Imparcialidad**
- Está prohibido sancionar por venganza, favoritismo o conflictos personales.
- El staff debe actuar con imparcialidad y explicar claramente el motivo de sus decisiones.

**3. Analizar el conflicto**
- No corresponde abrir un ticket para sancionar a alguien únicamente porque respondió después de que otra persona lo provocara.
- Se debe distinguir entre quién inició el conflicto y cómo respondió cada participante. Esto no exime automáticamente a ninguna persona de responsabilidad.

**4. Proporcionalidad**
- Las sanciones deben ser proporcionales a la gravedad, las pruebas disponibles y los antecedentes relevantes.
- Se debe priorizar la coherencia entre casos similares y prevenir futuros conflictos.

**5. Denuncias y pruebas**
- Las denuncias falsas, las pruebas manipuladas y las capturas editadas para engañar al staff pueden ser sancionables.
- Aporta el contexto necesario y no ocultes mensajes relevantes.

**6. Objetivo**
- El sistema busca justicia, coherencia y prevención, no alimentar discusiones ni tomar partido por amistades.
        `)
        .setImage(GIF_REGLAS)
        .setFooter({ text: 'Panel privado de reglas de sanciones' });
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
                ),
            new StringSelectMenuOptionBuilder()
                .setLabel('Reglas de sanciones')
                .setDescription('Consulta los criterios para aplicar sanciones.')
                .setValue('sanciones')
                .setEmoji('⚖️')
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
                ),
            new StringSelectMenuOptionBuilder()
                .setLabel('Reglas de sanciones')
                .setDescription('Consulta los criterios para aplicar sanciones.')
                .setValue('sanciones')
                .setEmoji('⚖️')
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

// Las reseñas se guardan en un JSON junto al index.js para sobrevivir reinicios.
const ARCHIVO_RESENAS = path.join(__dirname, 'resenas.json');

function cargarResenas() {
    try {
        if (!fs.existsSync(ARCHIVO_RESENAS)) return;
        const contenido = fs.readFileSync(ARCHIVO_RESENAS, 'utf8');
        const guardadas = JSON.parse(contenido || '{}');
        for (const [usuarioId, reseñas] of Object.entries(guardadas)) {
            if (Array.isArray(reseñas)) resenasBD.set(usuarioId, reseñas);
        }
        console.log('✅ Reseñas cargadas desde resenas.json');
    } catch (error) {
        console.error('❌ No se pudieron cargar las reseñas:', error);
    }
}

function guardarResenas() {
    fs.writeFileSync(
        ARCHIVO_RESENAS,
        JSON.stringify(Object.fromEntries(resenasBD.entries()), null, 2),
        'utf8'
    );
}

cargarResenas();

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
// MODERACIÓN: almacenamiento persistente y validaciones
// ============================================================
const crypto = require('crypto');
const ARCHIVO_CASOS = path.join(__dirname, 'casos.json');
const ARCHIVO_SANCIONES = path.join(__dirname, 'sanciones.json');
const confirmacionesModeracion = new Map();
let colaGuardadoModeracion = Promise.resolve();

function leerJsonSeguro(archivo, valorInicial) {
    try {
        if (!fs.existsSync(archivo)) return valorInicial;
        const raw = fs.readFileSync(archivo, 'utf8');
        if (!raw.trim()) return valorInicial;
        return JSON.parse(raw);
    } catch (error) {
        console.error(`JSON inválido en ${path.basename(archivo)}. Se intentará preservar una copia de respaldo:`, error.message);
        try {
            const respaldo = `${archivo}.corrupto-${Date.now()}.bak`;
            fs.copyFileSync(archivo, respaldo, fs.constants.COPYFILE_EXCL);
            console.error(`Copia de respaldo creada: ${path.basename(respaldo)}`);
        } catch (backupError) {
            console.error('No se pudo crear el respaldo del JSON inválido:', backupError.message);
        }
        return valorInicial;
    }
}
let casosModeracion = leerJsonSeguro(ARCHIVO_CASOS, []);
let advertenciasModeracion = leerJsonSeguro(ARCHIVO_SANCIONES, []);
if (!Array.isArray(casosModeracion)) casosModeracion = [];
if (!Array.isArray(advertenciasModeracion)) advertenciasModeracion = [];

function guardarJsonAtomico(archivo, datos) {
    const temporal = `${archivo}.${process.pid}.${crypto.randomUUID()}.tmp`;
    fs.writeFileSync(temporal, JSON.stringify(datos, null, 2), { encoding: 'utf8', flag: 'wx' });
    fs.renameSync(temporal, archivo);
}
function persistirModeracion() {
    // Operación síncrona y atómica por archivo: no hay escrituras concurrentes que se pisen.
    guardarJsonAtomico(ARCHIVO_CASOS, casosModeracion);
    guardarJsonAtomico(ARCHIVO_SANCIONES, advertenciasModeracion);
}
function nuevoIdCaso() {
    let id;
    do { id = `C-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`; }
    while (casosModeracion.some(c => c.id === id) || advertenciasModeracion.some(c => c.id === id));
    return id;
}
function validarMotivo(motivo) {
    return typeof motivo === 'string' && motivo.trim().length >= 3 && motivo.trim().length <= 1000;
}
function parsearDuracion(texto) {
    const match = /^(\d+)\s*(m|min|minuto|minutos|h|hr|hora|horas|d|dia|dias|w|semana|semanas|y|a|ano|años)$/i.exec(String(texto || '').trim());
    if (!match) return null;
    const n = Number(match[1]);
    if (!Number.isSafeInteger(n) || n < 1) return null;
    const unidad = match[2].toLowerCase();
    const factor = /^(m|min|minuto|minutos)$/.test(unidad) ? 60000
        : /^(h|hr|hora|horas)$/.test(unidad) ? 3600000
        : /^(d|dia|dias)$/.test(unidad) ? 86400000
        : /^(w|semana|semanas)$/.test(unidad) ? 604800000
        : 31536000000;
    const ms = n * factor;
    return Number.isFinite(ms) ? ms : null;
}
function duracionLegible(ms) {
    if (!ms) return 'Permanente';
    const min = Math.round(ms / 60000);
    if (min % 525600 === 0) return `${min / 525600} año(s)`;
    if (min % 10080 === 0) return `${min / 10080} semana(s)`;
    if (min % 1440 === 0) return `${min / 1440} día(s)`;
    if (min % 60 === 0) return `${min / 60} hora(s)`;
    return `${min} minuto(s)`;
}
function tienePermisoModeracion(member) {
    return esStaff(member);
}
function jerarquiaPermite(actor, objetivo, botMember) {
    if (!actor || !objetivo || !botMember) return false;
    if (actor.id === objetivo.id || objetivo.id === client.user.id) return false;
    if (actor.id === actor.guild.ownerId) return true;
    if (objetivo.id === actor.guild.ownerId) return false;
    if (actor.roles.highest.comparePositionTo(objetivo.roles.highest) <= 0) return false;
    if (botMember.roles.highest.comparePositionTo(objetivo.roles.highest) <= 0) return false;
    return true;
}
async function obtenerMiembro(interactionOrMessage, userId) {
    const guild = interactionOrMessage.guild;
    if (!guild) return null;
    return guild.members.fetch(userId).catch(() => null);
}
function embedCaso(caso) {
    return new EmbedBuilder()
        .setTitle(`Caso ${caso.id}`)
        .setColor(caso.estado === 'activo' ? 0xE74C3C : 0x5865F2)
        .addFields(
            { name: 'Usuario', value: `${caso.usuarioNombre || 'Desconocido'} (\`${caso.usuarioId}\`)`, inline: false },
            { name: 'Tipo', value: caso.tipo, inline: true },
            { name: 'Estado', value: caso.estado, inline: true },
            { name: 'Motivo', value: String(caso.motivo || 'Sin motivo').slice(0, 1024), inline: false },
            { name: 'Moderador', value: `${caso.moderadorNombre || 'Desconocido'} (\`${caso.moderadorId}\`)`, inline: false },
            { name: 'Creado', value: `<t:${Math.floor(new Date(caso.creadoEn).getTime()/1000)}:F>`, inline: true },
            { name: 'Duración', value: caso.duracionMs ? duracionLegible(caso.duracionMs) : 'No aplica / permanente', inline: true },
            { name: 'Expira', value: caso.expiraEn ? `<t:${Math.floor(new Date(caso.expiraEn).getTime()/1000)}:F>` : 'No aplica', inline: false },
            { name: 'Retirada', value: caso.retirada ? `Por <@${caso.retirada.moderadorId}> el <t:${Math.floor(new Date(caso.retirada.fecha).getTime()/1000)}:F>\nMotivo: ${caso.retirada.motivo}` : 'No retirada', inline: false }
        ).setTimestamp();
}
async function enviarLogModeracion(guild, caso, accion) {
    try {
        const canal = await guild.channels.fetch(CANAL_LOGS_ID).catch(() => null);
        if (canal && canal.isTextBased()) {
            await canal.send({ content: `🛡️ ${accion}`, embeds: [embedCaso(caso)], allowedMentions: { parse: [] } });
        }
    } catch (error) { console.error('No se pudo enviar el log de moderación:', error.message); }
}
async function aplicarCasoModeracion(guild, actorMember, targetUser, tipo, motivo, duracionMs = null) {
    if (!validarMotivo(motivo)) throw new Error('El motivo debe tener entre 3 y 1000 caracteres.');
    const objetivo = await guild.members.fetch(targetUser.id).catch(() => null);
    const botMember = await guild.members.fetchMe().catch(() => null);
    if (!objetivo) throw new Error('El usuario no está actualmente en el servidor.');
    if (!jerarquiaPermite(actorMember, objetivo, botMember)) throw new Error('La jerarquía no permite sancionar a ese usuario. No puedes sancionarte a ti mismo ni sancionar al dueño, a un superior o al bot.');
    const caso = {
        id: nuevoIdCaso(), guildId: guild.id, usuarioId: targetUser.id,
        usuarioNombre: targetUser.tag || targetUser.username, tipo, motivo: motivo.trim(),
        moderadorId: actorMember.id, moderadorNombre: actorMember.user.tag,
        creadoEn: new Date().toISOString(), duracionMs,
        expiraEn: duracionMs ? new Date(Date.now() + duracionMs).toISOString() : null,
        estado: 'activo', retirada: null, metodo: null
    };
    if (tipo === 'ban') {
        if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) throw new Error('El bot necesita el permiso Ban Members.');
        await objetivo.ban({ reason: `[${caso.id}] ${motivo.trim()}` });
        caso.metodo = 'ban';
    } else if (tipo === 'sancion' && duracionMs > 28 * 86400000) {
        if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) throw new Error('El bot necesita el permiso Ban Members para sanciones superiores a 28 días.');
        await objetivo.ban({ reason: `[${caso.id}] Sanción temporal: ${motivo.trim()}` });
        caso.metodo = 'ban_temporal';
    } else {
        if (!botMember.permissions.has(PermissionFlagsBits.ModerateMembers)) throw new Error('El bot necesita el permiso Moderate Members.');
        await objetivo.timeout(duracionMs, `[${caso.id}] ${motivo.trim()}`);
        caso.metodo = 'timeout';
    }
    casosModeracion.push(caso);
    persistirModeracion();
    await enviarLogModeracion(guild, caso, `Caso creado: ${tipo}`);
    return caso;
}
async function procesarVencimientosBan() {
    for (const caso of casosModeracion) {
        if (caso.estado !== 'activo' || caso.metodo !== 'ban_temporal' || !caso.expiraEn || Date.now() < new Date(caso.expiraEn).getTime()) continue;
        try {
            const guild = await client.guilds.fetch(caso.guildId);
            await guild.bans.remove(caso.usuarioId, `Expiró la sanción temporal ${caso.id}`);
            caso.estado = 'expirado';
            caso.expiradoEn = new Date().toISOString();
            persistirModeracion();
            await enviarLogModeracion(guild, caso, 'Baneo temporal expirado y retirado');
        } catch (error) {
            // Se mantiene activo para reintentar en la siguiente comprobación.
            console.error(`No se pudo retirar el ban temporal ${caso.id}:`, error.message);
        }
    }
}
function crearOpcionesUsuarioMotivo() {
    return [
        { name: 'usuario', description: 'Usuario objetivo', type: ApplicationCommandOptionType.User, required: true },
        { name: 'motivo', description: 'Motivo obligatorio', type: ApplicationCommandOptionType.String, required: true, max_length: 1000 }
    ];
}
function definicionesComandosModeracion() {
    return [
        { name: 'advertir', description: 'Registrar una advertencia', options: crearOpcionesUsuarioMotivo() },
        { name: 'sancion', description: 'Aplicar sanción temporal; requiere confirmación', options: [...crearOpcionesUsuarioMotivo(), { name: 'duracion', description: 'Ej.: 30m, 12h, 7d, 1y', type: ApplicationCommandOptionType.String, required: true }] },
        { name: 'historial', description: 'Consultar advertencias y sanciones de un usuario', options: [{ name: 'usuario', description: 'Usuario a consultar', type: ApplicationCommandOptionType.User, required: true }] },
        { name: 'kick', description: 'Expulsar a un usuario', options: crearOpcionesUsuarioMotivo() },
        { name: 'ban', description: 'Banear a un usuario; requiere confirmación', options: crearOpcionesUsuarioMotivo() },
        { name: 'timeout', description: 'Aplicar timeout de hasta 28 días', options: [...crearOpcionesUsuarioMotivo(), { name: 'duracion', description: 'Ej.: 10m, 3h, 7d, 28d', type: ApplicationCommandOptionType.String, required: true }] },
        { name: 'quitar_sancion', description: 'Retirar una sanción por ID de caso', options: [{ name: 'caso', description: 'ID del caso', type: ApplicationCommandOptionType.String, required: true }, { name: 'motivo', description: 'Motivo de retirada', type: ApplicationCommandOptionType.String, required: true, max_length: 1000 }] },
        { name: 'caso', description: 'Consultar un caso', options: [{ name: 'id', description: 'Identificador del caso', type: ApplicationCommandOptionType.String, required: true }] },
        { name: 'limpiar', description: 'Eliminar mensajes recientes', options: [{ name: 'cantidad', description: 'Cantidad entre 1 y 100', type: ApplicationCommandOptionType.Integer, required: true, min_value: 1, max_value: 100 }] },
    ];
}
async function ejecutarModeracion(nombre, datos, contexto, esSlash) {
    const { guild, user, member, channel } = contexto;
    const responder = async (payload) => {
        if (esSlash) {
            const resultado = (contexto.deferred || contexto.replied) ? await contexto.followUp(payload) : await contexto.reply(payload);
            if (payload.components && payload.components.some(row => row.components?.some(c => String(c.customId || '').startsWith('modconfirm:')))) {
                setTimeout(async () => {
                    try {
                        const filas = payload.components.map(row => ActionRowBuilder.from(row).setComponents(
                            row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
                        ));
                        await contexto.editReply({ components: filas, content: '⌛ La confirmación expiró. No se aplicó ninguna acción.' });
                    } catch (_) {}
                }, 60000);
            }
            return resultado;
        }
        const sent = await channel.send(payload);
        if (payload.components && payload.components.some(row => row.components?.some(c => String(c.customId || '').startsWith('modconfirm:')))) {
            setTimeout(async () => {
                try {
                    const filas = payload.components.map(row => ActionRowBuilder.from(row).setComponents(
                        row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
                    ));
                    await sent.edit({ components: filas, content: '⌛ La confirmación expiró. No se aplicó ninguna acción.' });
                } catch (_) {}
            }, 60000);
        }
        return sent;
    };
    if (!guild) return responder({ content: 'Este comando solo se puede usar dentro de un servidor.', ephemeral: esSlash });
    if (nombre === 'comandos') {
        const sub = datos.subcomando;
        if (sub === 'staff') {
            if (!esStaff(member)) return responder({ content: '❌ Solo el staff autorizado puede ver esta ayuda.', ephemeral: esSlash });
            return responder({ embeds: [new EmbedBuilder().setTitle('Comandos del staff').setDescription('**Moderación**\n`/advertir` `.advertir` — advertencia\n`/sancion` `.sancion` — sanción temporal con confirmación\n`/historial` `.historial` — historial\n`/kick` `.kick` — expulsar\n`/ban` `.ban` — ban con confirmación\n`/timeout` `.timeout` — timeout\n`/quitar_sancion` `.quitar_sancion` — retirar caso\n`/caso` `.caso` — consultar caso\n`/limpiar` `.limpiar` — borrar 1–100 mensajes\n\n**Tickets:** `/panel_middleman`, `/panel_soporte`, `/añadir`, `/force_ticket`, `/registro`, `/reseñar`, `/reseñas`, `/repuntuaciones`').setImage(GIF_COMANDOS)], ephemeral: esSlash });
        }
        return responder({ embeds: [new EmbedBuilder().setTitle('Comandos generales').setDescription('`/reglas` — consultar reglas\n`/value_brainrot` — consultar precios de Brainrots\n`/spin` — ruleta del perdón\n`/reseñas` — consultar reseñas cuando corresponda\n`/comandos general` — mostrar esta ayuda').setImage(GIF_COMANDOS)], ephemeral: esSlash });
    }
    if (!tienePermisoModeracion(member)) return responder({ content: '❌ No tienes permisos para usar comandos de moderación.', ephemeral: esSlash });
    const motivo = datos.motivo;
    if (['advertir','sancion','kick','ban','timeout'].includes(nombre) && !validarMotivo(motivo)) return responder({ content: '❌ El motivo es obligatorio y debe tener entre 3 y 1000 caracteres.', ephemeral: esSlash });
    if (nombre === 'advertir') {
        const objetivo = datos.usuario;
        if (objetivo.id === user.id || objetivo.id === client.user.id) return responder({ content: '❌ No puedes advertirte a ti mismo ni al bot.', ephemeral: esSlash });
        const caso = { id: nuevoIdCaso(), guildId: guild.id, usuarioId: objetivo.id, usuarioNombre: objetivo.tag || objetivo.username, tipo: 'advertencia', motivo: motivo.trim(), moderadorId: user.id, moderadorNombre: user.tag, creadoEn: new Date().toISOString(), duracionMs: null, expiraEn: null, estado: 'registrada', retirada: null };
        advertenciasModeracion.push(caso); casosModeracion.push(caso); persistirModeracion(); await enviarLogModeracion(guild, caso, 'Advertencia registrada');
        return responder({ content: `⚠️ Advertencia registrada para <@${objetivo.id}>. Caso: **${caso.id}**`, ephemeral: esSlash });
    }
    if (nombre === 'sancion' || nombre === 'timeout') {
        const ms = parsearDuracion(datos.duracion);
        if (!ms || ms < 60000 || (nombre === 'timeout' && ms > 28*86400000) || (nombre === 'sancion' && ms > 365*86400000)) return responder({ content: nombre === 'timeout' ? '❌ Duración inválida. Usa de 1 minuto a 28 días (ej.: 30m, 2h, 7d, 28d).' : '❌ Duración inválida. Usa de 1 minuto a 1 año (ej.: 30m, 12h, 7d, 1y).', ephemeral: esSlash });
        if (nombre === 'timeout') {
            try {
                const caso = await aplicarCasoModeracion(guild, member, datos.usuario, 'timeout', motivo, ms);
                return responder({ content: `✅ Timeout aplicado a <@${datos.usuario.id}>. Caso **${caso.id}**, duración ${duracionLegible(ms)}.`, ephemeral: esSlash });
            } catch (e) { return responder({ content: `❌ ${e.message}`, ephemeral: esSlash }); }
        }
        const token = crypto.randomUUID();
        const embed = new EmbedBuilder().setTitle('Confirmar sanción').setColor(0xE67E22).setDescription(`**Usuario:** <@${datos.usuario.id}>\n**Motivo:** ${motivo.trim()}\n**Duración:** ${duracionLegible(ms)}\n\nSi supera 28 días, se aplicará un ban temporal que el bot intentará retirar al vencer.\nEsta operación expira en 60 segundos.`);
        confirmacionesModeracion.set(token, { actorId: user.id, guildId: guild.id, usuarioId: datos.usuario.id, tipo: 'sancion', motivo: motivo.trim(), duracionMs: ms, expira: Date.now()+60000, usado: false });
        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`modconfirm:${token}`).setLabel('Confirmar').setStyle(BTN_STYLE.DANGER),
            new ButtonBuilder().setCustomId(`modcancel:${token}`).setLabel('Cancelar').setStyle(BTN_STYLE.SECONDARY)
        );
        return responder({ embeds: [embed], components: [fila], ephemeral: esSlash });
    }
    if (nombre === 'ban') {
        const token = crypto.randomUUID();
        confirmacionesModeracion.set(token, { actorId: user.id, guildId: guild.id, usuarioId: datos.usuario.id, tipo: 'ban', motivo: motivo.trim(), duracionMs: null, expira: Date.now()+60000, usado: false });
        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`modconfirm:${token}`).setLabel('Confirmar').setStyle(BTN_STYLE.DANGER),
            new ButtonBuilder().setCustomId(`modcancel:${token}`).setLabel('Cancelar').setStyle(BTN_STYLE.SECONDARY)
        );
        return responder({ embeds: [new EmbedBuilder().setTitle('Confirmar ban').setColor(0xE74C3C).setDescription(`**Usuario:** <@${datos.usuario.id}>\n**Motivo:** ${motivo.trim()}\n**Duración:** Permanente\n\nEsta operación expira en 60 segundos.`)], components: [fila], ephemeral: esSlash });
    }
    if (nombre === 'kick') {
        try {
            const objetivo = await guild.members.fetch(datos.usuario.id).catch(() => null);
            const botMember = await guild.members.fetchMe();
            if (!objetivo) throw new Error('El usuario no está actualmente en el servidor.');
            if (!jerarquiaPermite(member, objetivo, botMember)) throw new Error('La jerarquía no permite expulsar a ese usuario.');
            if (!botMember.permissions.has(PermissionFlagsBits.KickMembers)) throw new Error('El bot necesita el permiso Kick Members.');
            await objetivo.kick(motivo.trim());
            const caso = { id: nuevoIdCaso(), guildId:guild.id, usuarioId:datos.usuario.id, usuarioNombre:datos.usuario.tag || datos.usuario.username, tipo:'kick', motivo:motivo.trim(), moderadorId:user.id, moderadorNombre:user.tag, creadoEn:new Date().toISOString(), duracionMs:null, expiraEn:null, estado:'ejecutada', retirada:null };
            casosModeracion.push(caso); persistirModeracion(); await enviarLogModeracion(guild, caso, 'Usuario expulsado');
            return responder({ content: `👢 Usuario expulsado. Caso **${caso.id}**.`, ephemeral: esSlash });
        } catch(e) { return responder({ content: `❌ ${e.message}`, ephemeral: esSlash }); }
    }
    if (nombre === 'historial') {
        const objetivo = datos.usuario;
        const encontrados = casosModeracion.filter(c => c.guildId === guild.id && c.usuarioId === objetivo.id);
        if (!encontrados.length) return responder({ content: `No hay advertencias ni sanciones registradas para <@${objetivo.id}>.`, ephemeral: esSlash });
        const desc = encontrados.slice(-15).reverse().map(c => `**${c.id}** · ${c.tipo} · ${c.estado}\nMotivo: ${c.motivo}\nModerador: <@${c.moderadorId}> · <t:${Math.floor(new Date(c.creadoEn).getTime()/1000)}:f>\nDuración: ${c.duracionMs ? duracionLegible(c.duracionMs) : 'No aplica'}${c.expiraEn ? ` · Expira <t:${Math.floor(new Date(c.expiraEn).getTime()/1000)}:R>` : ''}`).join('\n\n');
        return responder({ embeds: [new EmbedBuilder().setTitle(`Historial de ${objetivo.tag || objetivo.username}`).setDescription(desc.slice(0,4000))], ephemeral: esSlash });
    }
    if (nombre === 'caso') {
        const caso = casosModeracion.find(c => c.guildId === guild.id && c.id.toLowerCase() === String(datos.id).toLowerCase());
        return responder(caso ? { embeds: [embedCaso(caso)], ephemeral: esSlash } : { content: 'No se encontró ese ID de caso en este servidor.', ephemeral: esSlash });
    }
    if (nombre === 'quitar_sancion') {
        const caso = casosModeracion.find(c => c.guildId === guild.id && c.id.toLowerCase() === String(datos.id).toLowerCase());
        if (!caso) return responder({ content: '❌ No se encontró ese caso.', ephemeral: esSlash });
        if (!['activo','registrada'].includes(caso.estado)) return responder({ content: `Ese caso ya está en estado "${caso.estado}".`, ephemeral: esSlash });
        try {
            if (caso.metodo === 'timeout') {
                const target = await guild.members.fetch(caso.usuarioId).catch(() => null);
                if (target) await target.timeout(null, `Retirada ${caso.id}: ${datos.motivo}`);
            } else if (caso.metodo === 'ban' || caso.metodo === 'ban_temporal') {
                await guild.bans.remove(caso.usuarioId, `Retirada ${caso.id}: ${datos.motivo}`);
            }
            caso.estado = 'retirada'; caso.retirada = { moderadorId:user.id, moderadorNombre:user.tag, fecha:new Date().toISOString(), motivo:datos.motivo.trim() };
            persistirModeracion(); await enviarLogModeracion(guild, caso, 'Sanción retirada');
            return responder({ content: `✅ Caso **${caso.id}** marcado como retirado. Se conserva el historial.`, ephemeral: esSlash });
        } catch(e) { return responder({ content: `❌ No se pudo retirar la sanción: ${e.message}`, ephemeral: esSlash }); }
    }
    if (nombre === 'limpiar') {
        const cantidad = Number(datos.cantidad);
        if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 100) return responder({ content: 'La cantidad debe estar entre 1 y 100.', ephemeral: esSlash });
        if (!channel || !channel.isTextBased() || !channel.messages) return responder({ content: 'Este canal no permite limpiar mensajes.', ephemeral: esSlash });
        const botMember = await guild.members.fetchMe();
        if (!botMember.permissionsIn(channel).has(PermissionFlagsBits.ManageMessages)) return responder({ content: 'El bot necesita Manage Messages en este canal.', ephemeral: esSlash });
        if (!member.permissions.has(PermissionFlagsBits.ManageMessages) && !esStaff(member)) return responder({ content: 'Necesitas permiso para gestionar mensajes.', ephemeral: esSlash });
        try {
            const fetched = await channel.messages.fetch({ limit: cantidad });
            const eliminables = fetched.filter(m => Date.now() - m.createdTimestamp < 14*24*60*60*1000);
            const antiguas = fetched.size - eliminables.size;
            const borradas = eliminables.size ? await channel.bulkDelete(eliminables, true) : new Map();
            return responder({ content: `🧹 Eliminados ${borradas.size} de ${cantidad} mensajes recientes.${antiguas ? ` ${antiguas} mensaje(s) tenían más de 14 días y no se pueden borrar en lote.` : ''}`, ephemeral: esSlash });
        } catch(e) { return responder({ content: `❌ No se pudieron eliminar todos los mensajes: ${e.message}`, ephemeral: esSlash }); }
    }
}


// ============================================================
// SISTEMA DE POSTULACIONES
// ============================================================
const CANAL_POSTULACIONES_ACTIVAS = '1562599831204008007';
const CANAL_LOGS_POSTULACIONES_ID = '1562622099745415258';
const ROLE_POSTULAR_CUALQUIER_RANGO_ID = '1543766939833339990';
const ARCHIVO_POSTULACIONES = path.join(__dirname, 'postulaciones.json');
const ROLES_POSTULACION = {
    middleman: { id: '1499596482322501802', nombre: 'Middleman', color: 0x3498DB, estilo: 1 },
    moderador: { id: '1499595987411406998', nombre: 'Moderador', color: 0x2ECC71, estilo: 3 },
    administrador: { id: '1499606642898112612', nombre: 'Administrador', color: 0x9B59B6, estilo: 1 },
    'co-owner': { id: '1499597074642243686', nombre: 'Co-owner', color: 0xE74C3C, estilo: 4 }
};
const ORDEN_POSTULACION = ['middleman', 'moderador', 'administrador', 'co-owner'];
let rangosPostulacion = [];
let postulaciones = [];
const postulacionesPendientes = new Map();

function cargarPostulaciones() {
    try {
        if (!fs.existsSync(ARCHIVO_POSTULACIONES)) {
            fs.writeFileSync(ARCHIVO_POSTULACIONES, JSON.stringify({ rangos: [], postulaciones: [] }, null, 2));
        }
        const data = JSON.parse(fs.readFileSync(ARCHIVO_POSTULACIONES, 'utf8') || '{}');
        rangosPostulacion = Array.isArray(data.rangos) ? data.rangos : [];
        postulaciones = Array.isArray(data.postulaciones) ? data.postulaciones : [];
    } catch (e) { console.error('Error cargando postulaciones:', e.message); }
}
function guardarPostulaciones() {
    fs.writeFileSync(ARCHIVO_POSTULACIONES, JSON.stringify({ rangos: rangosPostulacion, postulaciones }, null, 2), 'utf8');
}
cargarPostulaciones();

function rangoMasAltoPostulacion(member) {
    if (!member) return -1;
    // El dueño del servidor equivale al nivel más alto.
    if (member.id === member.guild.ownerId) return 4;
    for (let i = ORDEN_POSTULACION.length - 1; i >= 0; i--) {
        if (member.roles.cache.has(ROLES_POSTULACION[ORDEN_POSTULACION[i]].id)) return i;
    }
    return -1;
}
function rangosPermitidosPara(member) {
    // Este rol especial puede postularse a cualquier rango habilitado, sin importar su jerarquía.
    if (member && member.roles.cache.has(ROLE_POSTULAR_CUALQUIER_RANGO_ID)) return [...rangosPostulacion];
    const nivel = rangoMasAltoPostulacion(member);
    // Los miembros base (incluido el rango Watones si no tiene un ID configurado aquí)
    // solo pueden solicitar Middleman; cada rango staff avanza exactamente un nivel.
    const objetivo = nivel < 0 ? 0 : nivel + 1;
    return rangosPostulacion.filter(r => ORDEN_POSTULACION.indexOf(r) === objetivo);
}
function esAdminPostulaciones(member) {
    return !!member && (member.id === member.guild.ownerId ||
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        member.roles.cache.has(ROLES_POSTULACION['co-owner'].id) ||
        member.roles.cache.has(ROLES_POSTULACION.administrador.id));
}
function crearPanelPostulaciones() {
    return {
        embeds: [new EmbedBuilder()
            .setColor(0xF39C12)
            .setTitle('🎃 Postulaciones | The Galactics')
            .setDescription('¿Quieres crecer dentro del equipo? Inicia tu postulación desde el botón de abajo.\\n\\nEl sistema solo mostrará los rangos disponibles según tu rango actual y el stock habilitado por la administración.')
            .setImage(GIF_NUEVO)
            .setFooter({ text: 'The Galactics • Sistema oficial de postulaciones' })],
        components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('postulacion:iniciar').setLabel('Iniciar postulación').setEmoji('📝').setStyle(4)
        )]
    };
}
function crearBotonesRangos(member) {
    const permitidos = rangosPermitidosPara(member);
    const fila = new ActionRowBuilder();
    for (const rango of rangosPostulacion) {
        const info = ROLES_POSTULACION[rango];
        const permitido = permitidos.includes(rango);
        fila.addComponents(new ButtonBuilder()
            .setCustomId(`postulacion:rango:${rango}`)
            .setLabel(info.nombre)
            .setStyle(info.estilo)
            .setDisabled(!permitido));
    }
    return fila;
}
async function logPostulacion(guild, texto, postulacion = null) {
    try {
        const canal = await guild.channels.fetch(CANAL_LOGS_POSTULACIONES_ID).catch(() => null);
        if (!canal || !canal.isTextBased()) return;
        const embed = new EmbedBuilder().setColor(0xF39C12).setTitle('📋 Registro de postulaciones')
            .setDescription(texto).setTimestamp();
        if (postulacion) embed.addFields(
            { name: 'Postulante', value: `<@${postulacion.usuarioId}>`, inline: true },
            { name: 'Rango solicitado', value: ROLES_POSTULACION[postulacion.rango]?.nombre || postulacion.rango, inline: true },
            { name: 'Respuesta', value: String(postulacion.respuesta || 'Pendiente').slice(0, 1024), inline: false }
        );
        await canal.send({ embeds: [embed], allowedMentions: { parse: [] } });
    } catch (e) { console.error('Error enviando log de postulación:', e.message); }
}
function textoPostulacion(p) {
    return `Postulante: <@${p.usuarioId}> (${p.usuarioNombre})\\nRango solicitado: ${ROLES_POSTULACION[p.rango]?.nombre || p.rango}\\nFecha: ${p.fecha}\\nEstado: ${p.estado}\\n¿Por qué te quieres postular?:\\n${p.respuesta || '(sin respuesta)'}\\n${'-'.repeat(50)}\\n`;
}
async function enviarPostulacionesTXT(interaction, rango) {
    const lista = postulaciones.filter(p => p.guildId === interaction.guildId && p.rango === rango);
    const postulantes = lista.length ? lista.map(p => `${p.usuarioNombre} (<@${p.usuarioId}>)\\n¿Por qué se quiere postular?: ${p.respuesta}\\nFecha: ${p.fecha}\\n`).join('\\n') : '';
    const contenido = `POSTULANTES:\\n\\n${postulantes}\\n\\n${'_'.repeat(90)}\\n\\n` +
        `${ROLES_POSTULACION[rango].nombre.toUpperCase()} (elegidos)\\n\\n\\n${'_'.repeat(90)}\\n\\n` +
        `NO ELEGIDOS (${rango})\\n\\n\\n${'_'.repeat(90)}\\n`;
    const adjunto = new AttachmentBuilder(Buffer.from(contenido, 'utf8'), { name: 'TXT RESULTADOS.txt' });
    return interaction.reply({ content: `📄 Resultados de postulaciones para **${ROLES_POSTULACION[rango].nombre}** (${lista.length}).`, files: [adjunto], ephemeral: true });
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
                description: 'Muestra los comandos disponibles.',
                options: [
                    { type: ApplicationCommandOptionType.Subcommand, name: 'general', description: 'Comandos para miembros' },
                    { type: ApplicationCommandOptionType.Subcommand, name: 'staff', description: 'Comandos exclusivos del staff' }
                ]
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
            },
            {
                name: 'panel_postulaciones',
                description: 'Publicar el panel de postulaciones'
            },
            {
                name: 'añadir_rangos',
                description: 'Añadir un rango al stock de postulaciones',
                options: [{ name: 'rango', description: 'Rango que deseas habilitar', type: ApplicationCommandOptionType.String, required: true, choices: [
                    { name: 'Middleman', value: 'middleman' }, { name: 'Moderador', value: 'moderador' }, { name: 'Administrador', value: 'administrador' }, { name: 'Co-owner', value: 'co-owner' }
                ]}]
            },
            {
                name: 'eliminar_rangos',
                description: 'Eliminar un rango del stock de postulaciones',
                options: [{ name: 'rango', description: 'Rango añadido que deseas deshabilitar', type: ApplicationCommandOptionType.String, required: true, choices: [
                    { name: 'Middleman', value: 'middleman' }, { name: 'Moderador', value: 'moderador' }, { name: 'Administrador', value: 'administrador' }, { name: 'Co-owner', value: 'co-owner' }
                ]}]
            },
            {
                name: 'postulaciones_activas',
                description: 'Consultar las postulaciones activas de un rango',
                options: [{ name: 'rango', description: 'Rango de la postulación', type: ApplicationCommandOptionType.String, required: true, choices: [
                    { name: 'Middleman', value: 'middleman' }, { name: 'Moderador', value: 'moderador' }, { name: 'Administrador', value: 'administrador' }, { name: 'Co-owner', value: 'co-owner' }
                ]}]
            },
            {
                name: 'clear_postulaciones_activas',
                description: 'Borrar todas las postulaciones registradas y reiniciar el contador'
            },
            {
                name: 'cmds', description: 'Ayuda de comandos por categoría',
                options: [{ type: ApplicationCommandOptionType.Subcommand, name: 'postulaciones', description: 'Comandos y funciones del sistema de postulaciones' }]
            },
            {
                name: 'crear',
                description: 'Crear un sorteo de The Galactics',
                options: [{
                    type: ApplicationCommandOptionType.Subcommand,
                    name: 'sorteo',
                    description: 'Configura y publica un sorteo',
                    options: [
                        { name: 'duracion', description: 'Ejemplo: 1m, 1h, 1d, 1w, 1y', type: ApplicationCommandOptionType.String, required: true },
                        { name: 'host', description: 'Persona que presenta el sorteo', type: ApplicationCommandOptionType.User, required: true },
                        { name: 'canal', description: 'Canal donde se publicará', type: ApplicationCommandOptionType.Channel, required: true, channel_types: [0, 5] },
                        { name: 'titulo', description: 'Premio o título del sorteo', type: ApplicationCommandOptionType.String, required: true, max_length: 200 },
                        { name: 'color', description: 'Color del sorteo', type: ApplicationCommandOptionType.String, required: true, choices: [
                            { name: 'Rojo', value: 'rojo' }, { name: 'Verde', value: 'verde' }, { name: 'Azul', value: 'azul' },
                            { name: 'Amarillo', value: 'amarillo' }, { name: 'Morado', value: 'morado' }, { name: 'Naranja', value: 'naranja' }, { name: 'Negro', value: 'negro' }
                        ]},
                        { name: 'contador', description: 'Mostrar cuenta regresiva de 10 segundos en general', type: ApplicationCommandOptionType.String, required: true, choices: [
                            { name: 'Sí', value: 'si' }, { name: 'No', value: 'no' }
                        ]},
                        { name: 'imagen', description: 'Adjunta una imagen para el sorteo', type: ApplicationCommandOptionType.Attachment, required: false }
                    ]
                }]
            },
            ...definicionesComandosModeracion()

        ]);

        console.log('🤖 Comandos Slash registrados correctamente.');
        setInterval(() => procesarVencimientosBan().catch(err => console.error('Error revisando baneos temporales:', err)), 60 * 1000);
        procesarVencimientosBan().catch(err => console.error('Error inicial revisando baneos temporales:', err));
        for (const sorteo of sorteos) programarSorteo(sorteo);

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
        if (commandName === 'crear' && interaction.options.getSubcommand() === 'sorteo') {
            const opcionesSorteo = interaction.options;
            const servidorSorteo = interaction.guild;
            const usuarioSorteo = interaction.user;
            if (!servidorSorteo) return interaction.reply({ content: 'Este comando solo se puede usar dentro de un servidor.', ephemeral: true });
            const duracionTexto = opcionesSorteo.getString('duracion', true);
            const duracionMs = parsearDuracionSorteo(duracionTexto);
            if (!duracionMs) return interaction.reply({ content: 'Duración inválida. Usa formatos como `1m`, `1h`, `1d`, `1w` o `1y` (máximo 1 año).', ephemeral: true });
            const archivoImagen = opcionesSorteo.getAttachment('imagen');
            const imagen = archivoImagen ? archivoImagen.url : null;
            const host = opcionesSorteo.getUser('host', true);
            const canalDestino = opcionesSorteo.getChannel('canal', true);
            if (!canalDestino.isTextBased() || !canalDestino.send) return interaction.reply({ content: 'Selecciona un canal de texto válido.', ephemeral: true });
            const titulo = opcionesSorteo.getString('titulo', true).trim();
            const color = opcionesSorteo.getString('color', true);
            const contador = opcionesSorteo.getString('contador', true) === 'si';
            const s = {
                id: require('crypto').randomUUID().slice(0, 10),
                guildId: servidorSorteo.id, canalId: canalDestino.id, creadorId: usuarioSorteo.id, hostId: host.id,
                titulo, imagen, color, contador, contadorEnviado: false,
                creado: Date.now(), termina: Date.now() + duracionMs, participantes: [],
                ganadoresAnteriores: [], ganadorId: null, estado: 'activo'
            };
            const publicado = await canalDestino.send({ embeds: [embedSorteo(s)], components: [filaParticipar(s)] }).catch(() => null);
            if (!publicado) return interaction.reply({ content: '❌ No pude publicar el sorteo. Revisa mis permisos en ese canal.', ephemeral: true });
            s.mensajeId = publicado.id;
            sorteos.push(s);
            guardarSorteos();
            programarSorteo(s);
            return interaction.reply({ content: `✅ Sorteo **${titulo}** publicado en <#${canalDestino.id}>. Termina <t:${Math.floor(s.termina / 1000)}:R>.`, ephemeral: true });
        }

        const options = interaction.options;
        const channel = interaction.channel;
        const user = interaction.user;
        const member = interaction.member;
        if (customId.startsWith('sorteo:')) {
            const [, accion, sorteoId] = customId.split(':');
            const s = sorteos.find(x => x.id === sorteoId);
            if (!s) return interaction.reply({ content: 'Este sorteo ya no está disponible.', ephemeral: true });

            if (accion === 'entrar') {
                if (s.estado !== 'activo' || Date.now() >= s.termina) return interaction.reply({ content: 'Este sorteo ya terminó.', ephemeral: true });
                if (s.participantes.includes(user.id)) return interaction.reply({ content: 'Ya estás participando en este sorteo.', ephemeral: true });
                s.participantes.push(user.id);
                guardarSorteos();
                const msg = await channel.messages.fetch(s.mensajeId).catch(() => null);
                if (msg) await msg.edit({ embeds: [embedSorteo(s)], components: [filaParticipar(s)] }).catch(() => null);
                return interaction.reply({ content: '🎉 ¡Ya estás participando!', ephemeral: true });
            }

            if (user.id !== s.creadorId) return interaction.reply({ content: '❌ Solo quien creó este sorteo puede usar este panel.', ephemeral: true });
            if (accion === 'reclamado') {
                s.reclamado = true;
                guardarSorteos();
                return interaction.update({ content: `🟢 El premio de **${s.titulo}** quedó marcado como reclamado.`, embeds: [], components: [] });
            }
            if (accion === 'reroll') {
                if (s.estado !== 'finalizado') return interaction.reply({ content: 'Este sorteo no está finalizado.', ephemeral: true });
                await interaction.deferUpdate();
                s.estado = 'activo';
                s.ganadorId = null;
                s.termina = Date.now();
                await finalizarSorteo(s, true);
                return interaction.editReply({ content: '🟡 Se realizó el reroll. Revisa el nuevo ganador en el canal del sorteo.', embeds: [], components: [] });
            }
            if (accion === 'cancelar') {
                const fila = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`sorteo:confirmarcancelar:${s.id}`).setLabel('Sí, cancelar').setStyle(4),
                    new ButtonBuilder().setCustomId(`sorteo:volver:${s.id}`).setLabel('Volver').setStyle(2)
                );
                return interaction.reply({ content: `¿Confirmas cancelar el sorteo **${s.titulo}**?`, components: [fila], ephemeral: true });
            }
            if (accion === 'confirmarcancelar') {
                s.estado = 'cancelado';
                if (s.timer) clearTimeout(s.timer);
                guardarSorteos();
                const guildObj = await client.guilds.fetch(s.guildId).catch(() => null);
                const canalObj = guildObj ? await guildObj.channels.fetch(s.canalId).catch(() => null) : null;
                const msg = canalObj ? await canalObj.messages.fetch(s.mensajeId).catch(() => null) : null;
                if (msg) await msg.edit({ content: '🚫 Este sorteo fue cancelado.', embeds: [], components: [] }).catch(() => null);
                return interaction.update({ content: '🔴 Sorteo cancelado correctamente.', components: [] });
            }
            if (accion === 'volver') return interaction.update({ content: 'Cancelación descartada.', components: [] });
        }

        const guild = interaction.guild;

        if (['panel_postulaciones', 'añadir_rangos', 'eliminar_rangos', 'postulaciones_activas', 'clear_postulaciones_activas'].includes(commandName)) {
            if (!guild) return interaction.reply({ content: 'Este comando solo se puede usar en un servidor.', ephemeral: true });
            const actor = await guild.members.fetch(user.id).catch(() => null);
            if (commandName === 'panel_postulaciones') {
                if (!esAdminPostulaciones(actor)) return interaction.reply({ content: '❌ Solo administración puede publicar el panel.', ephemeral: true });
                await channel.send(crearPanelPostulaciones());
                return interaction.reply({ content: '✅ Panel de postulaciones publicado.', ephemeral: true });
            }
            if (commandName === 'añadir_rangos' || commandName === 'eliminar_rangos') {
                if (!esAdminPostulaciones(actor)) return interaction.reply({ content: '❌ Solo administrador, co-owner o dueño puede configurar los rangos.', ephemeral: true });
                const rango = options.getString('rango', true);
                if (commandName === 'añadir_rangos') {
                    if (rangosPostulacion.includes(rango)) return interaction.reply({ content: `⚠️ **${ROLES_POSTULACION[rango].nombre}** ya está habilitado.`, ephemeral: true });
                    rangosPostulacion = [...rangosPostulacion, rango].sort((a,b) => ORDEN_POSTULACION.indexOf(a)-ORDEN_POSTULACION.indexOf(b));
                    guardarPostulaciones();
                    await logPostulacion(guild, `<@${user.id}> añadió **${ROLES_POSTULACION[rango].nombre}** al stock de postulaciones.`);
                    return interaction.reply({ content: `✅ **${ROLES_POSTULACION[rango].nombre}** fue añadido al stock de postulaciones.`, ephemeral: true });
                }
                if (!rangosPostulacion.includes(rango)) return interaction.reply({ content: `⚠️ **${ROLES_POSTULACION[rango].nombre}** no está habilitado actualmente.`, ephemeral: true });
                rangosPostulacion = rangosPostulacion.filter(r => r !== rango);
                guardarPostulaciones();
                await logPostulacion(guild, `<@${user.id}> eliminó **${ROLES_POSTULACION[rango].nombre}** del stock de postulaciones.`);
                return interaction.reply({ content: `✅ **${ROLES_POSTULACION[rango].nombre}** fue eliminado del stock de postulaciones.`, ephemeral: true });
            }
            if (commandName === 'postulaciones_activas') {
                if (channel.id !== CANAL_POSTULACIONES_ACTIVAS) return interaction.reply({ content: `❌ Usa este comando en <#${CANAL_POSTULACIONES_ACTIVAS}>.`, ephemeral: true });
                if (!esAdminPostulaciones(actor)) return interaction.reply({ content: '❌ Solo administración puede consultar postulaciones activas.', ephemeral: true });
                const rango = options.getString('rango', true);
                const lista = postulaciones.filter(p => p.guildId === guild.id && p.rango === rango && p.estado === 'activa');
                if (!lista.length) return interaction.reply({ content: `No hay postulaciones activas para ${ROLES_POSTULACION[rango].nombre}.`, ephemeral: true });
                const embeds = [];
                for (const p of lista) embeds.push(new EmbedBuilder().setColor(ROLES_POSTULACION[rango].color).setTitle(`Postulación ${ROLES_POSTULACION[rango].nombre}`).addFields(
                    { name: 'Postulante', value: `<@${p.usuarioId}> (${p.usuarioNombre})`, inline: false },
                    { name: 'Fecha', value: p.fecha, inline: true },
                    { name: '¿Por qué te quieres postular?', value: String(p.respuesta || 'Sin respuesta').slice(0, 1024), inline: false }
                ).setFooter({ text: `ID: ${p.id}` }));
                return interaction.reply({ content: `Postulaciones activas: **${lista.length}**`, embeds: embeds.slice(0, 10), ephemeral: true });
            }
            if (commandName === 'clear_postulaciones_activas') {
                if (!esAdminPostulaciones(actor)) return interaction.reply({ content: '❌ Solo administrador, co-owner o dueño puede borrar las postulaciones.', ephemeral: true });
                const cantidadAnterior = postulaciones.length;
                postulaciones = [];
                guardarPostulaciones();
                await logPostulacion(guild, `<@${user.id}> reinició el registro de postulaciones y eliminó **${cantidadAnterior}** postulación(es).`);
                return interaction.reply({ content: `🧹 Se borraron **${cantidadAnterior}** postulaciones. El contador quedó en **0**. El stock de rangos habilitados se mantiene igual.`, ephemeral: true });
            }
        }
        if (commandName === 'cmds') {
            const sub = options.getSubcommand(true);
            if (sub !== 'postulaciones') return interaction.reply({ content: 'Usa `/cmds postulaciones`.', ephemeral: true });
            return interaction.reply({ embeds: [new EmbedBuilder().setTitle('Comandos de postulaciones').setColor(0xF39C12).setDescription('`/panel_postulaciones` — publica el panel con el GIF de Halloween.\n`/añadir_rangos rango` — añade un rango al stock mediante opciones.\n`/eliminar_rangos rango` — elimina un rango del stock mediante opciones.\n`/postulaciones_activas rango` — consulta las postulaciones activas y sus respuestas; úsalo en el canal designado.\n`/clear_postulaciones_activas` — elimina todas las postulaciones registradas y deja el contador en 0; solo administración.\n\nPor defecto, los miembros avanzan un rango por jerarquía. Quienes tengan el rol especial configurado pueden postularse a cualquier rango habilitado.')], ephemeral: true });
        }

        const nombresModeracion = ['advertir','sancion','historial','kick','ban','timeout','quitar_sancion','caso','limpiar','comandos'];
        if (nombresModeracion.includes(commandName)) {
            const actorMember = guild ? await guild.members.fetch(user.id).catch(() => null) : null;
            const datos = {};
            if (['advertir','sancion','kick','ban','timeout'].includes(commandName)) {
                datos.usuario = options.getUser('usuario', true);
                datos.motivo = options.getString('motivo', true);
                if (['sancion','timeout'].includes(commandName)) datos.duracion = options.getString('duracion', true);
            } else if (commandName === 'historial') datos.usuario = options.getUser('usuario', true);
            else if (commandName === 'caso') datos.id = options.getString('id', true);
            else if (commandName === 'quitar_sancion') {
                datos.id = options.getString('caso', true);
                datos.motivo = options.getString('motivo', true);
            } else if (commandName === 'limpiar') datos.cantidad = options.getInteger('cantidad', true);
            else if (commandName === 'comandos') datos.subcomando = options.getSubcommand(true);
            return ejecutarModeracion(commandName, datos, {
                guild, user, member: actorMember, channel, deferred: interaction.deferred, replied: interaction.replied,
                reply: interaction.reply.bind(interaction), followUp: interaction.followUp.bind(interaction), editReply: interaction.editReply.bind(interaction)
            }, true);
        }

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

            // También comprueba reseñas guardadas, incluso después de reiniciar el bot.
            const ticketIdResena = channel.id;
            const reseñaDuplicada = Array.from(resenasBD.values())
                .flat()
                .some((resena) =>
                    resena.ticketId === ticketIdResena &&
                    resena.autorId === user.id
                );

            if (reseñaDuplicada) {
                return interaction.reply({
                    content: '❌ Ya has registrado tu reseña para este ticket.',
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
                    tipoOrigen: origen,
                    ticketId: channel.id,
                    fecha: new Date().toISOString()

                });

            try {
                guardarResenas();
            } catch (error) {
                const reseñasUsuario = resenasBD.get(objetivo.id) || [];
                const indice = reseñasUsuario.findIndex((resena) =>
                    resena.ticketId === channel.id && resena.autorId === user.id
                );
                if (indice !== -1) reseñasUsuario.splice(indice, 1);
                if (reseñasUsuario.length === 0) resenasBD.delete(objetivo.id);
                console.error('❌ Error guardando reseña:', error);
                return interaction.reply({
                    content: '❌ No se pudo guardar la reseña en el archivo. Inténtalo de nuevo.',
                    ephemeral: true
                });
            }

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

    if (interaction.isModalSubmit() && interaction.customId.startsWith('postulacion:respuesta:')) {
        const rango = interaction.customId.split(':')[2];
        const respuesta = interaction.fields.getTextInputValue('respuesta').trim();
        if (!ROLES_POSTULACION[rango] || !rangosPostulacion.includes(rango)) return interaction.reply({ content: 'Ese rango ya no está habilitado. Vuelve a iniciar la postulación.', ephemeral: true });
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!rangosPermitidosPara(member).includes(rango)) return interaction.reply({ content: 'Tu rango cambió o ya no cumples los requisitos para postularte.', ephemeral: true });
        const token = crypto.randomUUID();
        postulacionesPendientes.set(token, { guildId: interaction.guildId, usuarioId: interaction.user.id, usuarioNombre: interaction.user.tag, rango, respuesta, creado: Date.now() });
        await logPostulacion(interaction.guild, `El usuario <@${interaction.user.id}> respondió la pregunta de su postulación a ${ROLES_POSTULACION[rango].nombre}.`, { usuarioId: interaction.user.id, usuarioNombre: interaction.user.tag, rango, respuesta });
        const fila = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`postulacion:confirmar:${token}`).setLabel('Enviar respuestas').setStyle(3),
            new ButtonBuilder().setCustomId(`postulacion:editar:${token}`).setLabel('Volver a responder').setStyle(1),
            new ButtonBuilder().setCustomId(`postulacion:cancelar:${token}`).setLabel('Cancelar').setStyle(4)
        );
        return interaction.reply({ content: `**Rango:** ${ROLES_POSTULACION[rango].nombre}\n**¿Por qué te quieres postular?**\n${respuesta}\n\nRevisa tu respuesta y elige **Enviar respuestas** para registrar la postulación.`, components: [fila], ephemeral: true });
    }

    // ========================================================
    // MENÚS DESPLEGABLES: REGLAS Y VALORES BRAINROT
    // ========================================================

    if (interaction.isStringSelectMenu()) {
        const customId = interaction.customId;

        if (customId === 'reglas_menu_publico' || customId === 'reglas_privado') {
            const categoria = interaction.values[0];
            const embed = categoria === 'general'
                ? crearReglasGeneralesEmbed()
                : categoria === 'middleman'
                    ? crearReglasMiddlemanEmbed()
                    : crearReglasSancionesEmbed();
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

        if (customId === 'postulacion:iniciar') {
            if (!rangosPostulacion.length) return interaction.reply({ content: 'Por ahora no hay rangos habilitados para postulaciones. Consulta con la administración.', ephemeral: true });
            const freshMember = await guild.members.fetch(user.id).catch(() => null);
            const puedeTodos = !!freshMember && freshMember.roles.cache.has(ROLE_POSTULAR_CUALQUIER_RANGO_ID);
            const permitted = rangosPermitidosPara(freshMember);
            if (!permitted.length) return interaction.reply({ content: '❌ Tu rango actual no puede postularse a ninguno de los rangos habilitados. Solo puedes avanzar un nivel.', ephemeral: true });
            return interaction.reply({ content: puedeTodos ? 'Selecciona cualquier rango que esté habilitado para postulaciones.' : 'Selecciona el siguiente rango al que deseas postularte. Los rangos que no corresponden a tu jerarquía estarán deshabilitados.', components: [crearBotonesRangos(freshMember)], ephemeral: true });
        }
        if (customId.startsWith('postulacion:rango:')) {
            const rango = customId.split(':')[2];
            const freshMember = await guild.members.fetch(user.id).catch(() => null);
            if (!rangosPostulacion.includes(rango) || !rangosPermitidosPara(freshMember).includes(rango)) {
                return interaction.reply({ content: '❌ No puedes postularte a ese rango. Debes avanzar solo al rango inmediatamente superior.', ephemeral: true });
            }
            const modal = new ModalBuilder().setCustomId(`postulacion:respuesta:${rango}`).setTitle(`Postulación: ${ROLES_POSTULACION[rango].nombre}`);
            const respuesta = new TextInputBuilder().setCustomId('respuesta').setLabel(`¿Por qué te quieres postular a ${ROLES_POSTULACION[rango].nombre}?`).setStyle(TextInputStyle.Paragraph).setMinLength(10).setMaxLength(1800).setRequired(true).setPlaceholder('Explica tus motivos, experiencia y qué aportarías al equipo.');
            modal.addComponents(new ActionRowBuilder().addComponents(respuesta));
            return interaction.showModal(modal);
        }

        if (customId.startsWith('postulacion:confirmar:') || customId.startsWith('postulacion:cancelar:') || customId.startsWith('postulacion:editar:')) {
            const partesCustom = customId.split(':');
            const accion = partesCustom[1];
            const token = partesCustom[2];
            const pending = postulacionesPendientes.get(token);
            if (!pending) return interaction.reply({ content: 'Esta postulación ya fue procesada o expiró.', ephemeral: true });
            if (pending.usuarioId !== user.id) return interaction.reply({ content: 'Esta confirmación no te pertenece.', ephemeral: true });
            if (accion === 'cancelar') {
                postulacionesPendientes.delete(token);
                await logPostulacion(guild, `El usuario <@${user.id}> canceló una postulación a ${ROLES_POSTULACION[pending.rango].nombre}.`);
                return interaction.update({ content: 'Postulación cancelada. No se guardó.', components: [] });
            }
            if (accion === 'editar') {
                const modal = new ModalBuilder().setCustomId(`postulacion:respuesta:${pending.rango}`).setTitle(`Postulación: ${ROLES_POSTULACION[pending.rango].nombre}`);
                modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('respuesta').setLabel(`¿Por qué te quieres postular a ${ROLES_POSTULACION[pending.rango].nombre}?`).setStyle(TextInputStyle.Paragraph).setMinLength(10).setMaxLength(1800).setRequired(true).setValue(pending.respuesta.slice(0, 1800))));
                postulacionesPendientes.delete(token);
                return interaction.showModal(modal);
            }
            postulacionesPendientes.delete(token);
            const p = { id: crypto.randomUUID().slice(0, 8).toUpperCase(), guildId: pending.guildId, usuarioId: pending.usuarioId, usuarioNombre: pending.usuarioNombre, rango: pending.rango, respuesta: pending.respuesta, fecha: formatearFecha(new Date()), estado: 'activa' };
            postulaciones.push(p);
            guardarPostulaciones();
            await logPostulacion(guild, `Nueva postulación registrada: <@${user.id}> → ${ROLES_POSTULACION[p.rango].nombre}.`, p);
            return interaction.update({ content: `✅ Tu postulación a **${ROLES_POSTULACION[p.rango].nombre}** fue enviada correctamente. La administración la revisará.`, components: [] });
        }

        if (customId.startsWith('modconfirm:') || customId.startsWith('modcancel:')) {
            const token = customId.split(':')[1];
            const pending = confirmacionesModeracion.get(token);
            if (!pending) return interaction.reply({ content: 'Esta confirmación ya no existe o expiró.', ephemeral: true });
            if (interaction.user.id !== pending.actorId) return interaction.reply({ content: '❌ Solo el moderador que inició esta operación puede confirmarla o cancelarla.', ephemeral: true });
            if (pending.usado || Date.now() > pending.expira) {
                confirmacionesModeracion.delete(token);
                return interaction.update({ content: '⌛ La confirmación expiró. No se aplicó ninguna acción.', components: [] });
            }
            if (customId.startsWith('modcancel:')) {
                pending.usado = true; confirmacionesModeracion.delete(token);
                return interaction.update({ content: 'Operación cancelada. No se aplicó ninguna sanción.', components: [] });
            }
            pending.usado = true;
            confirmacionesModeracion.delete(token);
            await interaction.update({ content: '⏳ Ejecutando la acción confirmada…', components: [] });
            try {
                const actor = await guild.members.fetch(pending.actorId);
                const targetUser = await client.users.fetch(pending.usuarioId);
                const caso = await aplicarCasoModeracion(guild, actor, targetUser, pending.tipo, pending.motivo, pending.duracionMs);
                return interaction.followUp({ content: `✅ Acción aplicada a <@${pending.usuarioId}>. Caso **${caso.id}**.`, ephemeral: true });
            } catch (error) {
                return interaction.followUp({ content: `❌ No se pudo aplicar la acción: ${error.message}`, ephemeral: true });
            }
        }

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
// COMANDOS DE MODERACIÓN CON PREFIJO "."
// ============================================================
client.on('messageCreate', async (message) => {
    if (message.guild && !message.author.bot && message.content.trim().toLowerCase() === 'claim') {
        const s = sorteos.find(x => x.guildId === message.guild.id && x.canalId === message.channel.id && x.estado === 'finalizado' && x.ganadorId === message.author.id && !x.reclamado);
        if (s) {
            s.reclamado = true;
            guardarSorteos();
            await message.reply('✅ ¡Tu premio quedó reclamado! El organizador ya puede confirmarlo en su panel.');
        }
    }
    if (!message.guild || message.author.bot || !message.content.startsWith('.')) return;
    const partes = message.content.trim().slice(1).split(/\s+/);
    const nombre = (partes.shift() || '').toLowerCase();
    const aliases = {
        advertir: 'advertir', sancion: 'sancion', historial: 'historial',
        kick: 'kick', ban: 'ban', timeout: 'timeout',
        quitar_sancion: 'quitar_sancion', caso: 'caso', limpiar: 'limpiar',
        comandos: 'comandos'
    };
    if (!aliases[nombre]) return;
    const member = message.member;
    const datos = {};
    const obtenerUsuario = async (arg) => {
        const id = String(arg || '').replace(/[<@!>]/g, '');
        if (!/^\d{15,22}$/.test(id)) return null;
        return message.client.users.fetch(id).catch(() => null);
    };
    if (['advertir','sancion','kick','ban','timeout'].includes(nombre)) {
        const usuario = await obtenerUsuario(partes.shift());
        if (!usuario) return message.reply('Uso: `.' + nombre + ' @usuario motivo`' + (['sancion','timeout'].includes(nombre) ? ' (duración primero: `.'+nombre+' @usuario 7d motivo`)' : ''));
        datos.usuario = usuario;
        if (['sancion','timeout'].includes(nombre)) datos.duracion = partes.shift();
        datos.motivo = partes.join(' ').trim();
    } else if (nombre === 'historial') {
        datos.usuario = await obtenerUsuario(partes.shift());
        if (!datos.usuario) return message.reply('Uso: `.historial @usuario`');
    } else if (nombre === 'caso') {
        datos.id = partes.shift();
        if (!datos.id) return message.reply('Uso: `.caso ID-DEL-CASO`');
    } else if (nombre === 'quitar_sancion') {
        datos.id = partes.shift();
        datos.motivo = partes.join(' ').trim();
        if (!datos.id || !datos.motivo) return message.reply('Uso: `.quitar_sancion ID-DEL-CASO motivo`');
    } else if (nombre === 'limpiar') {
        datos.cantidad = Number(partes.shift());
    } else if (nombre === 'comandos') {
        datos.subcomando = (partes.shift() || 'general').toLowerCase();
    }
    try {
        await ejecutarModeracion(nombre, datos, { guild: message.guild, user: message.author, member, channel: message.channel, deferred: false, replied: false }, false);
    } catch (error) {
        console.error(`Error en .${nombre}:`, error);
        await message.reply('❌ Ocurrió un error procesando el comando.').catch(() => {});
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
