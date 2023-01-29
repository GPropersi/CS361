import inquirer from "inquirer";
import figlet from "figlet";
import chalk from "chalk";
import chalkAnimation from "chalk-animation";
import gradient from "gradient-string";
import align_text from "align-text";
import center_align from "center-align";
import fs from 'fs';
import { createSpinner } from "nanospinner";
import PressToContinuePrompt from "inquirer-press-to-continue";
import { parseCommandLineArguments } from "./word_guess_cli_commands.js";

inquirer.registerPrompt('press-to-continue', PressToContinuePrompt)
const sleep = (ms = 1500) => new Promise((r) => setTimeout(r, ms));

const HELP_TEXT = `\n\n` + 
    `Welcome to.... Guess The Word!!\n\n` + 
    `The objective of the game is to guess a word by inputting letters, one at a time.\n` +
    `The number of guesses you get is the number of letters in the word, plus 2.\n\n` + 
    `At anytime during the game, if you need a hint, type "/hint", and a random correct letter will be given to you!\n` + 
    `If there are multiple instances of that same letter, all will be given to you!\n\n` +
    `You can set how long of a word you want to guess, and how many hints you receive\n from the "Settings" screen on the Main Menu!\n\n` +
    `Note that the max number of hints you can have is the length of the word, minus 2.\n\n` +
    `During the game, type in a single letter and press the return key to guess the letter.\n` + 
    `An error will pop up if you guess anything but a letter, or a letter that was already guessed.\n\n` +
    `Type "/help" to bring up this help menu again!`

const GUEST = 'WordGuesser3000';
const USERFILE = "./db_files/users.json";
const DB_FOLDER = "./db_files";
const PIPE_TO_API = "./listener_for_random_word.json";
const MIN_WORD_LENGTH = 3;
const MAX_WORD_LENGTH = 15;
const MAIN_MENU_LINES = '\n\n\n\n\n\n\n\n\n\n';
const SETTINGS_DELAY = 30;

let wordToGuess;
let bottomTitleTextMainMenu;
let bottomTitleTextGame;
let settingsText;
let currentUsername;
let menuChoice;
let menuSelection;
let letsPlay = true;
let isPlaying = false;

let defaultSettings = {
    word_length: 5,
    hints: 2,
    show_instructions: true,
    allow_repeats: true,
}

let user = {
    username: GUEST,
    wins: 0,
    losses: 0,
    settings: {
        word_length: 5,
        hints: 2,
        show_instructions: true,
        allow_repeats: true,
    },
    win_loss_details: {
        3: {W: 0, L: 0},
        4: {W: 0, L: 0},
        5: {W: 0, L: 0},
        6: {W: 0, L: 0},
        7: {W: 0, L: 0},
        8: {W: 0, L: 0},
        9: {W: 0, L: 0},
        10: {W: 0, L: 0},
        11: {W: 0, L: 0},
        12: {W: 0, L: 0},
        13: {W: 0, L: 0},
        14: {W: 0, L: 0},
        15: {W: 0, L: 0},
    },
    words_played: [],
}

let wordRequest = {
    request: {
        word_needed: false,
        word_length: 0
    },
    response: {
        word: null,
        new_word: false
    }
}

let gameData = {
    letters_guessed: [],
    hints_left: -1,
    word_array: [],
    correct_letters: [],
    guesses: -1,
}

function titleBlockMain() {
    console.clear()
    console.log(gradient.pastel.multiline(figlet.textSync(`Guess The Word! !\n`, {
        verticalLayout: 'full',
        horizontalLayout: 'full',
        width: 200,
    })));
};

async function titleBlock(underTitleText, toDoNext) {
    console.clear();
    titleBlockMain();
    console.log(chalk.green(
        center_align(
            `${underTitleText}\n`, 
            110
        )
    ));
    
    await toDoNext();
}

async function helpBlock(underTitleText) {
    console.clear();
    titleBlockMain();
    console.log(chalk.greenBright(
        center_align(
            `${underTitleText}\n`, 
            110
        )
    ));
    
    const {key: anyKey} = await inquirer.prompt({
        name: 'key',
        type: 'press-to-continue',
        anyKey: true,
        pressToContinueMessage: 'Press a key to continue...',
      });
}

async function askIfGuest() {
    const answers = await inquirer.prompt({
        name: 'type_of_user',
        type: 'list',
        prefix: '\n\n\n\n',
        message: '\n\n\n#############################################################################' + 
                     '\n## Registering or Logging in will save your Wins/Losses and User Settings. ##\n' +
                       '## Guests will not have their Wins/Losses and User Settings saved.         ##\n' +
                       '#############################################################################\n',
        choices: [
        'Login/Register with Username',
        'Play as Guest -- Jump Right In!',
        'Exit'
        ],
    });

    if (answers.type_of_user === 'Exit') {
        console.clear();
        process.exit(0);
    }

    await handleIfGuestOrUser(
        answers.type_of_user === 'Play as Guest -- Jump Right In!', 
    )
}

async function handleIfGuestOrUser(isGuest){
    if (isGuest) {
        currentUsername = GUEST;
        return;
    } else {
        const underTitleText = `Login/Register Below!\n` +
            `If You Haven't Made a Username Already, It Will Be Saved For You!`
        await titleBlock(underTitleText, loginOrRegister);
    };
}

async function loginOrRegister(){    
    const answer = await inquirer.prompt({
        name: 'user_username',
        type: 'input',
        prefix: '\n\n\n\n\n\n\n\n\n\nNote: Case Sensitive!\n',
        message: 'Enter your Username: ',
        validate(value) {
            const pass = value.match(
                /^[A-Za-z][A-Za-z0-9_]{2,29}$/
            );
            if (pass) {
                return true;
            }
            return 'Please enter a username, 3-29 characters in length, only alphanumeric or underscores allowed.\nMust start with a letter.';            
        }
    });
    currentUsername = answer.user_username;
    await getUserOrCreateUser(currentUsername)
}

async function getUserOrCreateUser(usernameToCheck) {
    await showLoadingSpinner("Getting User Ready...");

    let originalUserDataRaw;
    try {
        originalUserDataRaw = await fs.promises.readFile(USERFILE, 'utf8');
    } catch (err) {
        console.error("Error - unable to read the user file");
        process.exit(1);
    }

    const originalUserData = JSON.parse(originalUserDataRaw);
    // Find user in JSON file data, if exists set proper data
    for (let i = 0; i < originalUserData.length; i++) {
        if (originalUserData[i].username === usernameToCheck) {
            user = originalUserData[i];
            return;
        }
    }
        
    // Create user if not found
    user.username = usernameToCheck
    originalUserData.push(user)

    try {
        await fs.promises.writeFile(USERFILE, JSON.stringify(originalUserData));
    } catch (err) {
        console.error("Unable to append user data to database");
        process.exit(1)
    }
}

async function showLoadingSpinner(updateText, ms = 1500, success = true, error_message = '', error_ms = 500) {
    const spinner = createSpinner(updateText).start()
    await sleep(ms);
    
    if (success) {
        spinner.success();
        await sleep(error_ms)
    } else {
        spinner.error({text: error_message, mark: `:(`})
        await sleep(1000);
    }
}

async function mainMenuGuest() {
    const answers = await inquirer.prompt({
        name: 'main_menu_option',
        type: 'list',
        prefix: MAIN_MENU_LINES,
        message: 'Select an Option Below Using the Return Key:',
        choices: [
        'Guess A Word!',
        'Settings',
        'Exit'
        ],
    });

    menuSelection = answers.main_menu_option;
}

async function mainMenu() {
    const answers = await inquirer.prompt({
        name: 'main_menu_option',
        type: 'list',
        prefix: MAIN_MENU_LINES,
        message: 'Select an Option Below Using the Return Key:',
        choices: [
        {
            name: 'Guess A Word!',
            short: `Let's Play!`
        },
        {
            name: 'Settings',
            short: `Let's Edit Your Settings!`
        },
        {
            name: 'Records',
            short: `What's Too Much Play Time?`
        },
        {
            name: 'Save and Exit',
            short: `Come Again!`
        },
        ],
    });

    menuSelection = answers.main_menu_option;
}

async function handleMenu(menuOption) {
    switch (menuOption) {
        case 'Settings': {
            await showLoadingSpinner('Loading Settings...');
            updateSettingsText();
            console.clear()
            await titleBlock(settingsText, settings);
            break;
        }
        case 'Exit': {
            console.clear();
            process.exit(0);
            break;
        }
        case 'Save and Exit': {
            await saveUserData();
            await showLoadingSpinner('Saving User Data...');
            console.clear();
            process.exit(0);
            break;
        }
        case 'Guess A Word!': {
            isPlaying = true;
            await requestWord();
            break;
        }
    }
}

async function requestWord() {
    wordRequest.request.word_needed = true
    wordRequest.request.word_length = user.settings.word_length

    let waitingForWord = true;
    let pipeData;

    while (waitingForWord) {

        try {
            await fs.promises.writeFile(PIPE_TO_API, JSON.stringify(wordRequest));
        } catch (err) {
            console.error(`Error - game needs ${PIPE_TO_API} file`);
            process.exit(1);
        }

        await showLoadingSpinner(`Requesting a ${user.settings.word_length} letter word...`, 1500)
        try {
            pipeData = await fs.promises.readFile(PIPE_TO_API);
            wordRequest = JSON.parse(pipeData);

            if (wordRequest.response.word !== null && wordRequest.response.new_word) {
                wordToGuess = wordRequest.response.word;
                if (!user.settings.allow_repeats && user.words_played.includes(wordToGuess)) {
                    await showLoadingSpinner(`${wordToGuess} has already been played, trying again...`, 500, true);
                } else {
                    waitingForWord = false;
                    gameData.word_array = wordToGuess.split("");
                    gameData.hints_left = user.settings.hints;
                    gameData.guesses = wordToGuess.length + 2;
                    gameData.letters_guessed = [];
                    for (let i = 0; i < wordToGuess.length; i++) {
                        gameData.correct_letters[i] = "_"
                    }
    
                    await showLoadingSpinner(`Word found! Get Ready..`, 1000, true);
    
                    if (user.settings.show_instructions) {
                        await helpBlock(HELP_TEXT);
                    }
                }
            }
        } catch (err) {
            await showLoadingSpinner(`Error`, 1500, false, err);
            console.error(`Error reading ${PIPE_TO_API} for word`);
            process.exit(1);
        }
    }
}

async function runGame() {
    const guessingGame = await inquirer.prompt({
        name: 'game_guess',
        type: 'input',
        message: 'Guess a Letter: ', 
        validate(value) {
            if (value[0] === '/') {
                return true;
            }

            const validLetter = (value.length === 1 && value.match("^[a-zA-Z\(\)]+$"))
            if (!validLetter) {
                return "Please guess a single letter";
            }
            
            const alreadyGuessed = (gameData.letters_guessed.includes(value[0]))
            if (alreadyGuessed) {
                return `You already guessed "${value[0]}"`
            }

            return true
        }       
    })

    const lettGuess = guessingGame.game_guess[0].toLowerCase();
    const letterInWord = gameData.word_array.includes(lettGuess);
    
    if (lettGuess === '/') {
        let command = guessingGame.game_guess.split("/")[1].toLowerCase();

        switch (command) {
            case "help": {
                await helpBlock(HELP_TEXT);
                break
            }
            case "hint": {
                // Hint goes here;
                if (gameData.hints_left === 0) {
                    await showLoadingSpinner(`Checking for hints...`, 500, false, `No more hints left...`, 1500);
                } else {
                    gameData.hints_left -= 1
                    giveHint();
                }
                break;
            }
            default: {
                await showLoadingSpinner(`Invalid command... use "/help" for help or "/hint" for a hint`, 2000, false, `Invalid command... use "/help" for help or "/hint" for a hint`);
                break
            }
        }
    } else if (letterInWord) {
        gameData.guesses -= 1
        gameData.letters_guessed.push(lettGuess);
        gameData.letters_guessed.sort();
        for (let i = 0; i < gameData.word_array.length; i++) {
            if (gameData.word_array[i] === lettGuess) {
                gameData.correct_letters[i] = lettGuess
            }
        }
        
        if (checkIfWordGuessed()){
            await showLoadingSpinner(`Correctly guessed the word!`, 1500)
            const currentWordLength = user.settings.word_length.toString();
            user.wins += 1
            user.win_loss_details[currentWordLength].W += 1
            user.words_played.push(gameData.word_array.join(""))
            if (user.username !== GUEST) {
                await saveUserData();
            }
            await winningScreen();

        } else {
            await showLoadingSpinner(`Correctly guessed a letter`, 1250)
        }
    } else if (!letterInWord) {
        gameData.guesses -= 1
        gameData.letters_guessed.push(lettGuess);
        gameData.letters_guessed.sort();
        await showLoadingSpinner(`Incorrect letter`, 1250)
    }

    if (gameData.guesses === -1) {
        // Game over
        await showLoadingSpinner(`Game over :(`, 1500)
        user.losses += 1
        const currentWordLength = user.settings.word_length.toString();
        user.win_loss_details[currentWordLength].L += 1
        if (user.username !== GUEST) {
            await saveUserData();
        }
        await losingScreen();
    }
}

function checkIfWordGuessed(){
    for (let i = 0; i < gameData.word_array.length; i++) {
        if (gameData.word_array[i] !== gameData.correct_letters[i]){
            return false;
        }
    }
    return true;
}

function giveHint(){
    const currentWordLength = user.settings.word_length;
    let randomNum;
    do {
        randomNum = getRandomInt(currentWordLength); 
    } while (gameData.correct_letters[randomNum] !== '_');

    let charAtRandomNum = gameData.word_array[randomNum];
    for (let i = 0; i < currentWordLength; i++) {
        if (gameData.word_array[i] === charAtRandomNum) {
            gameData.correct_letters[i] = charAtRandomNum
        }
    }

    gameData.letters_guessed.push(charAtRandomNum);
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
            `The word was: "${wordToGuess}"\n\n` +
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
            `The word was: "${wordToGuess}"\n\n`,
            110
        )
    ));
    await afterGameScreenMenu();
}

async function afterGameScreenMenu() {
    let afterGameChoices;

    if (user.username === GUEST) {
        afterGameChoices = [
            {
                name: 'Play Again?',
                short: `Let's Play Again!!`
            },
            {
                name: 'Main Menu',
                short: `Heading Back to the Menu!`
            },
            ]
    } else {
        afterGameChoices = [
            {
                name: 'Play Again?',
                short: `Let's Play Again!!`
            },
            {
                name: 'Main Menu',
                short: `Heading Back to the Menu!`
            },
            {
                name: 'Save and Exit',
                short: `Come Again!`
            }
            ]
    }
    
    const answers = await inquirer.prompt({
        name: 'after_game_menu_option',
        type: 'list',
        prefix: MAIN_MENU_LINES,
        message: 'Select an Option Below Using the Return Key:',
        choices: afterGameChoices,
    });

    menuSelection = answers.after_game_menu_option;
    if (user.username !== GUEST) {
        await saveUserData();
    }

    switch (menuSelection) {
        case 'Play Again?': {
            isPlaying = true;
            await requestWord();
            break;
        }
        case 'Main Menu': {
            isPlaying = false;
            break;
        }
        case 'Save and Exit': {
            isPlaying = false;
            await showLoadingSpinner('Saving User Data', 500);
            console.clear();
            process.exit(0);
            break;
        }
    }
}

async function settings() {
    const settingsAnswer = await inquirer.prompt({
        name: 'settings_selection',
        type: 'list',
        prefix: MAIN_MENU_LINES,
        message: 'Select an Option Below Using the Arrow Keys and Return Key:',
        choices: [
        {
            name: 'Word Length',
            short: `Guess a New Word Length!`
        },
        {
            name: 'Word Hints',
            short: `Make the Game Harder or Easier!`
        },
        {
            name: 'Skip Instructions on New Game',
            short: `Don't Need These Anymore!`
        },
        {
            name: 'Okay to Repeat Words',
            short: `Groundhog Day, Let's Go!`
        },
        {
            name: 'Set Settings to Default',
            short: `Back to Default Settings it is!`
        },
        {
            name: 'Save and Return to Menu',
            short: `Good Options`         
        }],
    });

    
    switch (settingsAnswer.settings_selection) {
        case 'Word Length': {
            await showLoadingSpinner(`Getting Current Word Length`, SETTINGS_DELAY);
            await titleBlock(`Choose Your Word Length\nCurrent Word Length: ${user.settings.word_length}`, editWordLength)
            break;
        }
        case 'Word Hints': {
            await showLoadingSpinner('Getting Current Number of Word Hints', SETTINGS_DELAY);
            await titleBlock(`Choose Your Number of Hints\nCurrent Number of Hints: ${user.settings.hints}`, editWordHints)
            break;
        }
        case 'Skip Instructions on New Game': {
            await showLoadingSpinner('Getting Current Selection for Skipping Instructions...', SETTINGS_DELAY);
            await titleBlock('Want to Skip the Instructions?', editSkipInstructions)
            break;
        }
        case 'Okay to Repeat Words': {
            await showLoadingSpinner('Getting Current Selection for Repeating Words...', SETTINGS_DELAY);
            await titleBlock('Want to Allow Words to Repeat?', editRepeatWords)
            break;
        }
        case 'Set Settings to Default': {
            user.settings = defaultSettings;
            await titleBlock('Are you Sure You Want to Reset your Settings to Default?', resetToDefaultSettings)
            break;
        }
        case 'Save and Return to Menu': {
            await showLoadingSpinner('Saving Settings...', SETTINGS_DELAY);
            if (currentUsername !== GUEST) {
                await saveUserData();
            }
            updateBottomTitleMainMenuText()
            break;
        }
    }
}

async function resetToDefaultSettings() {
    const wordLengthAnswer = await inquirer.prompt({
        name: 'reset_to_default',
        type: 'list',
        prefix: MAIN_MENU_LINES,
        message: 'Select an Option Below Using the Arrow Keys and Return Key:',
        choices: [
            {
                name: 'Yes',
                short: `Let's Get Those Default Settings!`
            },
            {
                name: 'No',
                short: `It's Okay to Change Your Mind!`
            },],
    });

    if (wordLengthAnswer.reset_to_default === 'Yes'){
        user.settings = defaultSettings;

    }
    await showLoadingSpinner('Returning to Settings...', SETTINGS_DELAY);
    updateSettingsText();
    await titleBlock(settingsText, settings);
}

async function editWordLength() {
    const currentWordLength = user.settings.word_length;
    let newChoices = [];

    for (let i = MIN_WORD_LENGTH; i <= MAX_WORD_LENGTH; i++) {
        newChoices.push({
            name: `${i}`,
            short: `You want words ${i} characters long`
        })
    }

    const wordLengthAnswer = await inquirer.prompt({
        name: 'wordLengthSelection',
        type: 'list',
        prefix: MAIN_MENU_LINES,
        default: `${currentWordLength}`,
        message: 'Select an Option Below Using the Arrow Keys and Return Key:',
        choices: newChoices
    });

    user.settings.word_length = wordLengthAnswer.wordLengthSelection
    if (user.settings.hints >= user.settings.word_length - 1) {
        user.settings.hints = user.settings.word_length - 2
    }
    await showLoadingSpinner('Returning to Settings...', SETTINGS_DELAY);
    updateSettingsText();
    await titleBlock(settingsText, settings);
}

async function editWordHints() {
    const currentWordHints = user.settings.hints;
    const currentWordLength = user.settings.word_length;
    let newChoices = [];

    for (let i = 0; i < currentWordLength - 1; i++) {
        newChoices.push({
            name: `${i}`,
            value: `${i}`,
            short: `You want ${i} hints`
        })
    }

    const wordHintsAnswer = await inquirer.prompt({
        name: 'wordHintsSelection',
        type: 'list',
        prefix: MAIN_MENU_LINES,
        default: `${currentWordHints}`,
        message: 'Select an Option Below Using the Arrow Keys and Return Key:',
        choices: newChoices
    });

    user.settings.hints = wordHintsAnswer.wordHintsSelection
    await showLoadingSpinner('Returning to Settings...', SETTINGS_DELAY);
    updateSettingsText();
    await titleBlock(settingsText, settings);
}

async function editSkipInstructions() {
    const currentSelection = user.settings.show_instructions;
    
    let skipInstructionsOption = {
        name: `Yes`,
        short: `No More Instructions For You!`
    }
    let doNotSkipInstructionsOption = {
        name: `No`,
        short: `All of the Instructions!`
    }
    let defaultOption;

    if (currentSelection) {
        defaultOption = `No`
    } else {
        defaultOption = `Yes`
    }

    let newChoices = [skipInstructionsOption, doNotSkipInstructionsOption];

    const skipInstructionsAnswer = await inquirer.prompt({
        name: 'skipInstructionsSelection',
        type: 'list',
        prefix: MAIN_MENU_LINES,
        default: defaultOption,
        message: 'Want to Skip the Instructions Before Each Game?',
        choices: newChoices
    });

    if (skipInstructionsAnswer.skipInstructionsSelection === `Yes`) {
        user.settings.show_instructions = false
    } else {
        user.settings.show_instructions = true
    }

    await showLoadingSpinner('Returning to Settings...', SETTINGS_DELAY);
    updateSettingsText();
    await titleBlock(settingsText, settings);
}

async function editRepeatWords() {
    const currentSelection = user.settings.allow_repeats;
    
    let allowRepeatsOption = {
        name: `Yes`,
        short: `Deja Vu?!`
    }
    let doNotAllowRepeatsOption = {
        name: `No`,
        short: `Let's Get Fresh Words in Here!`
    }
    let defaultOption;

    if (currentSelection) {
        defaultOption = `Yes`
    } else {
        defaultOption = `No`
    }

    let newChoices = [allowRepeatsOption, doNotAllowRepeatsOption];

    const editRepeatsAnswer = await inquirer.prompt({
        name: 'editRepeatsSelection',
        type: 'list',
        prefix: MAIN_MENU_LINES,
        default: defaultOption,
        message: 'Want to Allow Words to Repeat?',
        choices: newChoices
    });

    if (editRepeatsAnswer.editRepeatsSelection === `Yes`) {
        user.settings.allow_repeats = true
    } else {
        user.settings.allow_repeats = false
    }

    await showLoadingSpinner('Returning to Settings...', SETTINGS_DELAY);
    updateSettingsText();
    await titleBlock(settingsText, settings);
}

async function saveUserData(){
    // Read in the users file
    let userDataRaw;

    try {
        userDataRaw = await fs.promises.readFile(USERFILE, 'utf8');
    } catch (err) {
        console.error("Error - unable to read the user file");
        process.exit(1);
    }

    const userData = JSON.parse(userDataRaw);

    // Find user in JSON file data
    for (let i = 0; i < userData.length; i++) {
        if (userData[i].username === currentUsername) {
            userData[i] = user;
            break;
        }
    }

    try {
        await fs.promises.writeFile(USERFILE, JSON.stringify(userData));
    } catch (err) {
        console.error("Unable to append user data to database");
        process.exit(1)
    }
}

async function makeFolderIfDoesNotExist() {
    // Make db folder if it doesn't exist
    try{
        await fs.promises.mkdir(DB_FOLDER);
    } catch (err) {
        if (err.code == 'EEXIST') {
            return
        }
        console.error(err)
        process.exit(1)
    }
}

async function prepareFilesForGame() {
    // Make user file if it doesn't exist
    const userFileExists = await checkIfFileExists(USERFILE);
    if (!userFileExists) {
        try {
            await fs.promises.writeFile(USERFILE, JSON.stringify[user]);
        } catch (err) {
            console.error(`Error - game needs ${file} file`);
            process.exit(1);
        }
    }

    // The pipe file should be reset at the start of a game, regardless if it exists
    try {
        await fs.promises.writeFile(PIPE_TO_API, JSON.stringify(wordRequest));
    } catch (err) {
        console.error(`Error - game needs ${file} file`);
        process.exit(1);
    }
}

function updateBottomTitleMainMenuText() {
    if (currentUsername === GUEST) {
        bottomTitleTextMainMenu = `Playing As: ${user.username}\n` +
            `Note: Your Win/Loss Record and User Settings Will not be Saved\n` +
            `Wins: ${user.wins}    Losses: ${user.losses}    Current Word Length: ${user.settings.word_length}    Hints Available: ${user.settings.hints}`
    } else {
        bottomTitleTextMainMenu = `Playing As: ${user.username}\n` +
            `Total Wins: ${user.wins}    Total Losses: ${user.losses}    Current Word Length: ${user.settings.word_length}    Hints Available: ${user.settings.hints}`
    }
}

function updateBottomTitleGameText() {
    bottomTitleTextGame = `Type /help for help! Type /hint for a hint!\n` +
        `Letters Guessed: ${gameData.letters_guessed.join(",")}\n` + 
        `Guesses Left: ${gameData.guesses}\n` +
        `Hints Left: ${gameData.hints_left}\n\n` +
        `YOUR WORD:\n${gameData.correct_letters.join(" ")}`
}

function updateSettingsText() {
    let instructionsBeforeGame;
    let allowRepeats;

    if (user.settings.show_instructions) {
        instructionsBeforeGame = "Yes";
    } else {
        instructionsBeforeGame = "No";
    }

    if (user.settings.allow_repeats) {
        allowRepeats = "Yes";
    } else {
        allowRepeats = "No";
    }

    settingsText = `Current Settings:\n` +
    `Word Length: ${user.settings.word_length}\nHints: ${user.settings.hints}\n` +
    `Instructions Before Game: ${instructionsBeforeGame}\n` +
    `Allow Repeat Words: ${allowRepeats}`
}

async function checkIfFileExists (path) {  
    try {
        await fs.promises.access(path);
        return true
    } catch {
        return false
    }
}
  

// Top line functions to begin CLI app
await makeFolderIfDoesNotExist();
await prepareFilesForGame();

if (process.argv.length === 2) {
    await titleBlock('A Node.js CLI Word Guessing Game - Made By Giovanni Propersi', askIfGuest);

    if (currentUsername === GUEST) {
        menuChoice = mainMenuGuest;
    } else {
        menuChoice = mainMenu;
    }
    
    while (letsPlay) {
        
        if (isPlaying) {
            updateBottomTitleGameText()
            await titleBlock(bottomTitleTextGame, runGame)
        } else {
            updateBottomTitleMainMenuText()
            await titleBlock(bottomTitleTextMainMenu, menuChoice);
            await handleMenu(menuSelection);
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
 