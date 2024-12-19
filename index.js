const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Construir la ruta al archivo config.json
console.log(__dirname)
const configPath = path.join(__dirname, "/", 'config.json'); // Ajusta según la estructura de tus carpetas

let data;
try {
    let rawdata = fs.readFileSync(configPath, 'utf8');
    data = JSON.parse(rawdata);
} catch (error) {
    console.error(`Error al leer el archivo config.json en ${configPath}:`, error.message);
    process.exit(1); // Termina el proceso si no puede leer el archivo de configuración
}

const pi = Math.PI;
const moveInterval = 2; // Intervalo de movimiento en segundos
const maxRandom = 5; // 0-5 segundos añadidos al intervalo de movimiento (aleatoriamente)

let connected = 0;
let lastTime = -1;
let moving = 0;
const actions = ['forward', 'back', 'left', 'right'];
let lastAction;

// Función para generar un nombre aleatorio para el bot
function generateRandomBotName() {
    const randomNum = Math.floor(Math.random() * 1000); // Número aleatorio de 0 a 999
    return `BOT${randomNum}`;
}

// Función para crear un bot
function createBot() {
    const botName = generateRandomBotName();
    const bot = mineflayer.createBot({
        host: data["ip"],
        username: botName
    });

    bot.on('login', () => {
        console.log(`Logged In with bot: ${botName}`);
    });

    bot.on('spawn', () => {
        connected = 1;
        // Obtener las coordenadas de spawn del archivo de configuración
        const { x, y, z } = data.spawnCoordinates;

        // Teletransportar el bot a las coordenadas especificadas
        bot.chat(`/tp ${x} ${y} ${z}`);
        console.log(`Teletransportando bot ${botName} a (${x}, ${y}, ${z})`);
    });

    bot.on('time', () => {
        if (connected < 1) {
            return;
        }
        if (lastTime < 0) {
            lastTime = bot.time.age;
        } else {
            const randomAdd = Math.random() * maxRandom * 20;
            const interval = moveInterval * 20 + randomAdd;
            if (bot.time.age - lastTime > interval) {
                if (moving === 1) {
                    bot.setControlState(lastAction, false);
                    moving = 0;
                    lastTime = bot.time.age;
                } else {
                    const yaw = Math.random() * pi - (0.5 * pi);
                    const pitch = Math.random() * pi - (0.5 * pi);
                    bot.look(yaw, pitch, false);
                    lastAction = actions[Math.floor(Math.random() * actions.length)];
                    bot.setControlState(lastAction, true);
                    moving = 1;
                    lastTime = bot.time.age;
                    bot.activateItem();
                }
            }
        }
    });

    bot.on('error', (err) => {
        console.log(`Error con el bot ${botName}: ${err.message}`);
    });

    bot.on('end', () => {
        connected = 0;
        console.log(`Bot ${botName} desconectado`);
    });
}

// Crear el menú interactivo
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showMenu() {
    rl.question('Choose an option:\n1. Create a single bot\n2. Create a bot every 15 minutes\n3. Exit\n', (answer) => {
        if (answer === '1') {
            createBot();
            rl.close();
        } else if (answer === '2') {
            console.log('Creating bot every 15 minutes...');
            createBot(); // Crear el primer bot inmediatamente
            setInterval(createBot, 15 * 60 * 1000); // Crear un bot cada 15 minutos
            rl.close();
        } else if (answer === '3') {
            console.log('Exiting...');
            rl.close();
        } else {
            console.log('Invalid option. Please choose again.');
            showMenu();
        }
    });
}

showMenu();
