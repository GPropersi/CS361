import figlet from "figlet";
import chalk from "chalk";
import gradient from "gradient-string";
import center_align from "center-align";
import { parseCommandLineArguments } from "./word_guess_cli_commands.js";
import { CONSTANTS, newGameData, newUserOrGuest, STRINGS, INGAME_COMMANDS} from "./constants.js";
import { HELP_TEXT } from "./text_constants.js";
import txtFuncs from "./title_text.js";
import users from "./users.js";
import { settingsMenu } from "./settings.js";
import { prepareForGame } from "./prepare_for_game.js";
import { showLoadingSpinner } from "./utils.js";
import prompts from "./inquirer_prompts.js";
import requestWords from "./word_request.js"

let user = newUserOrGuest;
let gameData = newGameData;

function titleBlockMain() {
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

export async function helpBlock(underTitleText) {
    console.clear();
    titleBlockMain();
    console.log(chalk.cyanBright(
        center_align(
            `${underTitleText}\n`, 
            110
        )
    ));
    
    const _ = await prompts.anyKeyToContinuePrompt();
}

async function askIfGuest() {
    const answers = await prompts.askIfGuestPrompt();

    if (answers.type_of_user === STRINGS.EXIT) {
        console.clear();
        process.exit(0);
    }

    await handleIfGuestOrUser(answers.type_of_user === STRINGS.PLAY_AS_GUEST)
}

async function handleIfGuestOrUser(isGuest){
    if (!isGuest) {
        const underTitleText = `Login/Register Below!\n` +
            `If You Haven't Made a Username Already, It Will Be Saved For You!`
        await titleBlock(underTitleText, loginOrRegister);
    };
}

async function loginOrRegister(){    
    const answer = await prompts.loginOrRegisterPrompt();
    user = await users.getUserOrCreateUser(answer.user_username);
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
            await showLoadingSpinner('Loading Settings...', 500);
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
            await saveUserData(user);
            await showLoadingSpinner('Saving User Data...', 500);
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
            await showLoadingSpinner('Getting your records...');
            console.clear();
            const userRecords = users.updateUserRecords(user);
            await titleBlock(userRecords, prompts.recordsScreenPrompt, true);
            break;
        }
    }
}

async function runGame() {
    const guessingGame = await prompts.runGamePrompt(gameData);

    const lettGuess = guessingGame.game_guess[0].toLowerCase();
    const letterInWord = gameData.wordArray.includes(lettGuess);
    
    if (lettGuess === '/') { 
        let command = guessingGame.game_guess.split("/")[1].toLowerCase();
        await handleInGameCommand(command);
    } else if (letterInWord) {

        handleGuessedLetter(lettGuess);
        for (let i = 0; i < gameData.wordArray.length; i++) {
            if (gameData.wordArray[i] === lettGuess) {
                gameData.correctLetters[i] = lettGuess
            }
        }
        
        if (checkIfWordGuessed()){
            await handleIfWordGuessed();
        } else {
            await showLoadingSpinner(`Correctly guessed a letter`, 800)
        }
    } else if (!letterInWord) {
        handleGuessedLetter(lettGuess)
        await showLoadingSpinner(`Incorrect letter`, 800)
    }

    if (gameData.guesses === -1) {
        // Game over
        handleIfWordNotGuessed();
    }
}

function handleGuessedLetter(guessedLetter) {
    gameData.guesses -= 1
    gameData.lettersGuessed.push(guessedLetter);
    gameData.lettersGuessed.sort();    
}

async function handleInGameCommand(command) {
    switch (command) {
        case INGAME_COMMANDS.HELP: {
            await helpBlock(HELP_TEXT);
            break;
        }
        case INGAME_COMMANDS.HINT: {
            // Hint goes here;
            if (gameData.hintsLeft === 0) {
                await showLoadingSpinner(`Checking for hints...`, 500, false, `No more hints left...`, 1500);
            } else {
                gameData.hintsLeft -= 1
                giveHint();

                if (checkIfWordGuessed()){
                    await handleIfWordGuessed();
                }
            }
            break;
        }
        case INGAME_COMMANDS.EXIT: {
            // Returns user to main menu
            gameData.isPlaying = false;
            break;
        }
        default: {
            await showLoadingSpinner(`Invalid command... use "/help" for help,` +
                        `"/hint" for a hint, "/exit" to return to main menu`, 
                        2000, 
                        false, 
                        `Invalid command... use "/help" for help or "/hint" for a hint`
                        );
            break;
        }
    }   
}

function checkIfWordGuessed() {
    for (let i = 0; i < gameData.wordArray.length; i++) {
        if (gameData.wordArray[i] !== gameData.correctLetters[i]){
            return false;
        }
    }
    return true;
}

function giveHint() {
    let randomNum = -1;
    do {
        randomNum = getRandomInt(gameData.correctWord.length); 
    } while (gameData.correctLetters[randomNum] !== '_');

    let charAtRandomNum = gameData.wordArray[randomNum];
    for (let i = 0; i < gameData.correctWord.length; i++) {
        if (gameData.wordArray[i] === charAtRandomNum) {
            gameData.correctLetters[i] = charAtRandomNum
        }
    }

    gameData.lettersGuessed.push(charAtRandomNum);
}

async function handleIfWordGuessed() {
    await showLoadingSpinner(`Correctly guessed the word!`, 1500)
    user.wins += 1
    user.winLossDetails[gameData.correctWord.length].W += 1
    user.wordsPlayed.push(gameData.wordArray.join(""))
    if (user.username !== CONSTANTS.GUEST) {
        await users.saveUserData(user);
    }
    await winningScreen();    
}

async function handleIfWordNotGuessed() {
    await showLoadingSpinner(`Game over :(`, 1000)
    user.losses += 1
    user.winLossDetails[gameData.correctWord.length].L += 1
    if (user.username !== CONSTANTS.GUEST) {
        await users.saveUserData(user);
    }
    await losingScreen();
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function winningScreenTitle() {
    console.clear()
    console.log(gradient.rainbow.multiline(figlet.textSync(`You Won!\n\n\n`, {
        verticalLayout: 'full',
        horizontalLayout: 'full',
        width: 200,
    })));
}

async function winningScreen() {
    console.clear();
    winningScreenTitle();
    console.log(chalk.green(
        center_align(
            `Great job!\nYou Guessed the Word!\n\n` +
            `The word was: "${gameData.correctWord}"\n\n` +
            `I'd Guess You're Great at This!`, 
            110
        )
    ));
    await afterGameScreenMenu();
}

function losingScreenTitle() {
    console.clear()
    console.log(gradient.passion.multiline(figlet.textSync(`You Lost :(\n\n\n`, {
        verticalLayout: 'full',
        horizontalLayout: 'full',
        width: 200,
    })));
}

async function losingScreen() {
    console.clear();
    losingScreenTitle();
    console.log(chalk.green(
        center_align(
            `\n\nYou'll Get it Next Time!\n\n` +
            `The word was: "${gameData.correctWord}"\n\n`,
            110
        )
    ));
    await afterGameScreenMenu();
}

async function afterGameScreenMenu() {
    const answers = await prompts.afterGameMenuPrompt(user);

    // menuSelection = answers.after_game_menu_option;
    if (user.username !== CONSTANTS.GUEST) {
        await users.saveUserData(user);
    }

    switch (answers.after_game_menu_option) {
        case STRINGS.PLAY_AGAIN: {
            gameData.isPlaying = true;
            if (gameData.isRandomGame) {
                await requestWords.requestWordofRandomLength(user, gameData);
                console.log(gameData);
            } else {
                await requestWords.requestWordOfDefinedLength(user, gameData);
            }
            break;
        }
        case STRINGS.MAIN_MENU: {
            gameData.isPlaying = false;
            break;
        }
        case STRINGS.SAVE_AND_EXIT: {
            gameData.isPlaying = false;
            await showLoadingSpinner('Saving User Data', 500);
            console.clear();
            process.exit(0);
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
            await titleBlock(bottomTitleText, runGame)
        } else {
            bottomTitleText = txtFuncs.updateBottomTitleMainMenuText(user);
            // bottomTitleText = updateBottomTitleMainMenuText();
            await titleBlock(bottomTitleText, menuChoice);
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
 