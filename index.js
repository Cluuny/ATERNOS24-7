const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log(__dirname);
const configPath = path.join(__dirname, 'config.json');

let data;
try {
    let rawdata = fs.readFileSync(configPath, 'utf8');
    data = JSON.parse(rawdata);
} catch (error) {
    console.error(`Error al leer el archivo config.json en ${configPath}:`, error.message);
    process.exit(1);
}

const pi = Math.PI;
const moveInterval = 2;
const maxRandom = 5;
const disconnectTime = 30 * 60 * 1000;

let connected = 0;
let lastTime = -1;
let moving = 0;
const actions = ['forward', 'back', 'left', 'right'];
let lastAction;

function generateRandomBotName() {
    const randomNum = Math.floor(Math.random() * 1000);
    return `BOT${randomNum}`;
}

function createBot() {
    const botName = generateRandomBotName();
    const bot = mineflayer.createBot({
        host: data["ip"],
        username: botName
    });

    let disconnectTimer = null;

    bot.on('login', () => {
        console.log(`Logged In with bot: ${botName}`);
    });

    bot.on('spawn', () => {
        connected = 1;
        let randomAppear = Math.ceil(Math.random() * 2);
        if (randomAppear === 1) {
            const zombies = data.spawnCoordinates.zombies;
            bot.chat(`/tp ${zombies[0]} ${zombies[1]} ${zombies[2]}`);
            console.log(`Teletransportando bot ${botName} a las coordenadas de zombies: (${zombies[0]}, ${zombies[1]}, ${zombies[2]})`);
        } else {
            const base = data.spawnCoordinates.base;
            bot.chat(`/tp ${base[0]} ${base[1]} ${base[2]}`);
            console.log(`Teletransportando bot ${botName} a las coordenadas de base: (${base[0]}, ${base[1]}, ${base[2]})`);
        }

        disconnectTimer = setTimeout(() => {
            if (bot.connected) {
                console.log(`Desconectando bot ${botName} después de 30 minutos.`);
                bot.quit('Tiempo de sesión completado (30 minutos).');
            }
        }, disconnectTime);
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
        if (disconnectTimer) {
            clearTimeout(disconnectTimer);
            disconnectTimer = null;
        }
    });
}

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
            createBot();
            setInterval(createBot, 15 * 60 * 1000);
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
