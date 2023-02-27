import figlet from "figlet";
import chalk from "chalk";
import gradient from "gradient-string";
import center_align from "center-align";
import { parseCommandLineArguments } from "./word_guess_cli_commands.js";
import { CONSTANTS, newGameData, newUserOrGuest, STRINGS} from "./constants.js";
import { runGame } from "./run_game.js";
import txtFuncs from "./title_text.js";
import users from "./users.js";
import { settingsMenu } from "./settings.js";
import { prepareForGame } from "./prepare_for_game.js";
import utils from "./utils.js";
import prompts from "./inquirer_prompts.js";
import requestWords from "./word_request.js"


let user = newUserOrGuest;
let gameData = newGameData;

export function titleBlockMain() {
    console.clear()
    console.log(gradient.pastel.multiline(figlet.textSync(`Guess The Word! !\n`, {
        verticalLayout: 'full',
        horizontalLayout: 'full',
        width: 200,
    })));
};

export async function titleBlock(underTitleText, toDoNext, blue = false) {
    console.clear();
    titleBlockMain();
    let textForTitle;
    textForTitle = chalk.greenBright(center_align(`${underTitleText}\n`, 110));

    if (blue) {
        textForTitle = chalk.cyanBright(center_align(`${underTitleText}\n`, 110))
    }

    console.log(textForTitle);
    await toDoNext(user, gameData);
}

async function askIfGuest() {
    const answers = await prompts.askIfGuestPrompt();

    if (answers.typeOfUser === STRINGS.EXIT) {
        console.clear();
        process.exit(0);
    }

    await handleIfGuestOrUser(answers.typeOfUser === STRINGS.PLAY_AS_GUEST)
}

async function handleIfGuestOrUser(isGuest) {
    if (!isGuest) {
        const underTitleText = `Login/Register Below!\n` +
            `If You Haven't Made a Username Already, It Will Be Saved For You!`
        await titleBlock(underTitleText, loginOrRegister);
    };
}

async function loginOrRegister(){    
    const answer = await prompts.loginOrRegisterPrompt();
    user = await users.getUserOrCreateUser(answer.userUsername);
}

async function mainMenuGuest() {
    const answers = await prompts.mainMenuGuestPrompt();
    gameData.menuSelection = answers.main_menu_option;
}

async function mainMenu() {
    const answers = await prompts.mainMenuPrompt();
    gameData.menuSelection = answers.main_menu_option;
}

async function handleMenu(menuOption) {
    switch (menuOption) {
        case STRINGS.SETTINGS: {
            await utils.showLoadingSpinner('Loading Settings...', 500);
            let settingsText = txtFuncs.updateSettingsText(user);
            console.clear();
            gameData.isSetting = true;
            while (gameData.isSetting) {
                await titleBlock(settingsText, settingsMenu);
            }
            break;
        }
        case STRINGS.EXIT: {
            console.clear();
            process.exit(0);
            break;
        }
        case STRINGS.SAVE_AND_EXIT: {
            await users.saveUserData(user);
            await utils.showLoadingSpinner('Saving User Data...', 500);
            console.clear();
            process.exit(0);
            break;
        }
        case STRINGS.GUESS_WORD: {
            gameData.isPlaying = true;
            await requestWords.requestWordOfDefinedLength(user, gameData);
            break;
        }
        case STRINGS.GUESS_RANDOM_WORD: {
            gameData.isPlaying = true;
            await requestWords.requestWordofRandomLength(user, gameData);
            break;
        }
        case STRINGS.RECORDS : {
            await utils.showLoadingSpinner('Getting your records...');
            console.clear();
            const userRecords = users.updateUserRecords(user);
            await titleBlock(userRecords, prompts.recordsScreenPrompt, true);
            break;
        }
    }
}


// Top line functions to begin CLI app
await prepareForGame();

if (process.argv.length === 2) {
    await titleBlock('A Node.js CLI Word Guessing Game - Made By Giovanni Propersi', askIfGuest);

    let menuChoice = mainMenuGuest;

    if (user.username !== CONSTANTS.GUEST) {
        menuChoice = mainMenu;
    }

    let letsPlay = true;
    let bottomTitleText;
    while (letsPlay) {
        
        if (gameData.isPlaying) {
            bottomTitleText = txtFuncs.updateBottomTitleGameText(gameData);
            await titleBlock( bottomTitleText, runGame)
        } else {
            bottomTitleText = txtFuncs.updateBottomTitleMainMenuText(user);
            await titleBlock( bottomTitleText, menuChoice);
            await handleMenu(gameData.menuSelection);
        }
    }
} else if (process.argv.length > 2) {
    let argumentsToProcess = [];
    for (let i = 2; i < process.argv.length; i++) {
        argumentsToProcess.push(process.argv[i])
    }
    await parseCommandLineArguments(argumentsToProcess);
}

process.exit(0);
 