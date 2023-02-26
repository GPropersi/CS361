import inquirer from "inquirer";
import figlet from "figlet";
import chalk from "chalk";
import gradient from "gradient-string";
import center_align from "center-align";
import fs from 'fs';
import { createSpinner } from "nanospinner";
import PressToContinuePrompt from "inquirer-press-to-continue";
import { parseCommandLineArguments } from "./word_guess_cli_commands.js";
import { CONSTANTS, newGameData, newUserOrGuest} from "./constants.js";
import { HELP_TEXT, TEXTS } from "./text_objects.js";
import txtFuncs from "./title_text.js";

inquirer.registerPrompt('press-to-continue', PressToContinuePrompt)
const sleep = (ms = 1500) => new Promise((r) => setTimeout(r, ms));

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

async function titleBlock(underTitleText, toDoNext, blue = false) {
    console.clear();
    titleBlockMain();
    let textForTitle;
    textForTitle = chalk.greenBright(center_align(`${underTitleText}\n`, 110));

    if (blue) {
        textForTitle = chalk.cyanBright(center_align(`${underTitleText}\n`, 110))
    }

    console.log(textForTitle);
    await toDoNext();
}

async function helpBlock(underTitleText) {
    console.clear();
    titleBlockMain();
    console.log(chalk.cyanBright(
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
    const guestAns = 'Play as Guest -- Jump Right In!';
    const answers = await inquirer.prompt({
        name: 'type_of_user',
        type: 'list',
        prefix: '\n\n\n\n',
        message: TEXTS.GUEST_TEXT,
        choices: [
        'Login/Register with Username',
        guestAns,
        'Exit'
        ],
    });

    if (answers.type_of_user === 'Exit') {
        console.clear();
        process.exit(0);
    }

    await handleIfGuestOrUser(answers.type_of_user === guestAns)
}

async function handleIfGuestOrUser(isGuest){
    if (!isGuest) {
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
    await getUserOrCreateUser(answer.user_username)
}

async function getUserOrCreateUser(usernameToCheck) {
    await showLoadingSpinner("Getting User Ready...", 500);

    let originalUserDataRaw;
    try {
        originalUserDataRaw = await fs.promises.readFile(CONSTANTS.USERFILE, 'utf8');
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
        await fs.promises.writeFile(CONSTANTS.USERFILE, JSON.stringify(originalUserData));
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
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        message: 'Select an Option Below Using the Return Key:',
        choices: [
        'Guess A Word!',
        'Guess A Random Length Word!',
        'Settings',
        'Exit'
        ],
    });

    gameData.menuSelection = answers.main_menu_option;
}

async function mainMenu() {
    const answers = await inquirer.prompt({
        name: 'main_menu_option',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        message: 'Select an Option Below Using the Return Key:',
        choices: [
        {
            name: 'Guess A Word!',
            short: `Let's Play!`
        },
        {
            name: 'Guess A Random Length Word!',
            short: `Let's Play, Randomly!`
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

    gameData.menuSelection = answers.main_menu_option;
}

async function handleMenu(menuOption) {
    switch (menuOption) {
        case 'Settings': {
            await showLoadingSpinner('Loading Settings...', 500);
            let settingsText = txtFuncs.updateSettingsText(user);
            console.clear();
            gameData.isSetting = true;
            while (gameData.isSetting) {
                await titleBlock(settingsText, settings);
            }
            break;
        }
        case 'Exit': {
            console.clear();
            process.exit(0);
            break;
        }
        case 'Save and Exit': {
            await saveUserData();
            await showLoadingSpinner('Saving User Data...', 500);
            console.clear();
            process.exit(0);
            break;
        }
        case 'Guess A Word!': {
            gameData.isPlaying = true;
            await requestWord();
            break;
        }
        case 'Guess A Random Length Word!': {
            gameData.isPlaying = true;
            await requestRandomWord();
            break;
        }
        case 'Records' : {
            await showLoadingSpinner('Getting your records...');
            console.clear();
            const userRecords = updateUserRecords();
            await titleBlock(userRecords, userRecordsScreen, true);
            break;
        }
    }
}

function updateUserRecords() {
    let wantsInstructions = "No";
    let wantsRepeats = "No";

    if (user.settings.allow_repeats) {
        wantsRepeats = "Yes";
    }

    if (user.settings.show_instructions) {
        wantsInstructions = "Yes";
    }

    let userRecords = `Username: ${user.username}\n` +
        `Total Wins: ${user.wins}\tTotal Losses: ${user.losses}\n` +
        `Current Word Length: ${user.settings.word_length}\t Current Hints: ${user.settings.hints}\n` +
        `Wants Instructions Before Game: ${wantsInstructions}\t Allows Repeat Words: ${wantsRepeats}\n` +
        `Specific Word Length Game Statistics:\n\n` 

    for (let i = CONSTANTS.MIN_WORD_LENGTH; i <= CONSTANTS.MAX_WORD_LENGTH; i++) {
        userRecords += ` ${i}: Wins=${user.win_loss_details[i].W} `
        userRecords += `Loss=${user.win_loss_details[i].L} `

        if (i % 2 == 0){
            userRecords += `\n`
        } else if (i != CONSTANTS.MAX_WORD_LENGTH ) {
            userRecords += ` ||`
        }
    }
    userRecords += `\n${user.words_played.join(" || ")}`

    console.clear();

    return userRecords;
}

async function userRecordsScreen() {
    const recordsScreen = await inquirer.prompt({
        name: 'recordsScreenOption',
        type: 'list',
        prefix: `\n\n\n`,
        message: 'Press Enter to Return to the Main Menu:',
        choices: ["Return to main menu"]
    })
}

function assignGameDataWithNewWord(newWord) {
    gameData.correctWord = newWord;
    gameData.word_array = newWord.split("");
    gameData.hints_left = user.settings.hints;
    gameData.guesses = newWord.length + 2;
    gameData.letters_guessed = [];
    for (let i = 0; i < newWord.length; i++) {
        gameData.correct_letters[i] = "_"
    }  
}

async function requestRandomWord() {
    let waitingForWord = true;

    while (waitingForWord) {

        try {
            await fs.promises.writeFile(CONSTANTS.PARTNER_MICROSERVICE, "run");
        } catch (err) {
            console.error(`Error - game needs ${CONSTANTS.PARTNER_MICROSERVICE} file`);
            process.exit(1);
        }

        await showLoadingSpinner(`Requesting a R-A-N-D-O-M letter word...`, 1500)
        try {
            let pipeData = await fs.promises.readFile(CONSTANTS.PARTNER_MICROSERVICE, 'utf-8');
            let newWord = pipeData.replace(/[^\w\s]/gi, '');
            newWord = newWord.replace((/  |\r\n|\n|\r/gm),"");

            if (!user.settings.allow_repeats && user.words_played.includes(newWord)) {
                await showLoadingSpinner(
                    `${newWord} has already been played, trying again...`, 
                    500, 
                    true);
            } else {
                waitingForWord = false;
                assignGameDataWithNewWord(newWord);
                gameData.isRandomGame = true;
                await showLoadingSpinner(`Word found! Get Ready..`, 1000, true);

                if (user.settings.show_instructions) {
                    await helpBlock(HELP_TEXT);
                }
            }

        } catch (err) {
            await showLoadingSpinner(`Error`, 1500, false, err);
            console.error(`Error reading ${CONSTANTS.PARTNER_MICROSERVICE} for word`);
            process.exit(1);
        }
    }
}

async function requestWord() {
    let wordRequest = {
        request: {
            word_needed: true,
            word_length: user.settings.word_length
        },
        response: {
            word: null,
            new_word: false
        }
    }

    let waitingForWord = true;
    while (waitingForWord) {

        try {
            await fs.promises.writeFile(CONSTANTS.PIPE_TO_API, JSON.stringify(wordRequest));
        } catch (err) {
            console.error(`Error - game needs ${CONSTANTS.PIPE_TO_API} file`);
            process.exit(1);
        }

        await showLoadingSpinner(`Requesting a ${user.settings.word_length} letter word...`, 1500)
        try {
            let pipeData = await fs.promises.readFile(CONSTANTS.PIPE_TO_API);
            wordRequest = JSON.parse(pipeData);

            if (wordRequest.response.word === null || !wordRequest.response.new_word) {
                console.error(`Unable to process new word.`);
                process.exit(1);
            }

            let wordToGuess = wordRequest.response.word;

            if (user.settings.allow_repeats || !user.words_played.includes(wordToGuess)) {
                waitingForWord = false;
                assignGameDataWithNewWord(wordToGuess);
                gameData.isRandomGame = false;

                await showLoadingSpinner(`Word found! Get Ready..`, 1000, true);

                if (user.settings.show_instructions) {
                    await helpBlock(HELP_TEXT);
                }

            } else {
                await showLoadingSpinner(
                    `${wordToGuess} has already been played, trying again...`, 
                    500, 
                    true
                    );
            }            
        } catch (err) {
            await showLoadingSpinner(`Error`, 1500, false, err);
            console.error(`Error reading ${CONSTANTS.PIPE_TO_API} for word`);
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

            return true;
        }       
    })

    const lettGuess = guessingGame.game_guess[0].toLowerCase();
    const letterInWord = gameData.word_array.includes(lettGuess);
    
    if (lettGuess === '/') { 
        let command = guessingGame.game_guess.split("/")[1].toLowerCase();
        await handleInGameCommand(command);
    } else if (letterInWord) {

        handleGuessedLetter(lettGuess);
        for (let i = 0; i < gameData.word_array.length; i++) {
            if (gameData.word_array[i] === lettGuess) {
                gameData.correct_letters[i] = lettGuess
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
    gameData.letters_guessed.push(guessedLetter);
    gameData.letters_guessed.sort();    
}

async function handleInGameCommand(command){
    switch (command) {
        case "help": {
            await helpBlock(HELP_TEXT);
            break;
        }
        case "hint": {
            // Hint goes here;
            if (gameData.hints_left === 0) {
                await showLoadingSpinner(`Checking for hints...`, 500, false, `No more hints left...`, 1500);
            } else {
                gameData.hints_left -= 1
                giveHint();

                if (checkIfWordGuessed()){
                    await handleIfWordGuessed();
                }
            }
            break;
        }
        case "exit": {
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

function checkIfWordGuessed(){
    for (let i = 0; i < gameData.word_array.length; i++) {
        if (gameData.word_array[i] !== gameData.correct_letters[i]){
            return false;
        }
    }
    return true;
}

function giveHint(){
    let randomNum = -1;
    do {
        randomNum = getRandomInt(gameData.correctWord.length); 
    } while (gameData.correct_letters[randomNum] !== '_');

    let charAtRandomNum = gameData.word_array[randomNum];
    for (let i = 0; i < gameData.correctWord.length; i++) {
        if (gameData.word_array[i] === charAtRandomNum) {
            gameData.correct_letters[i] = charAtRandomNum
        }
    }

    gameData.letters_guessed.push(charAtRandomNum);
}

async function handleIfWordGuessed() {
    await showLoadingSpinner(`Correctly guessed the word!`, 1500)
    user.wins += 1
    user.win_loss_details[gameData.correctWord.length].W += 1
    user.words_played.push(gameData.word_array.join(""))
    if (user.username !== CONSTANTS.GUEST) {
        await saveUserData();
    }
    await winningScreen();    
}

async function handleIfWordNotGuessed() {
    await showLoadingSpinner(`Game over :(`, 1000)
    user.losses += 1
    user.win_loss_details[gameData.correctWord.length].L += 1
    if (user.username !== CONSTANTS.GUEST) {
        await saveUserData();
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
    let afterGameChoices;

    if (user.username === CONSTANTS.GUEST) {
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
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        message: 'Select an Option Below Using the Return Key:',
        choices: afterGameChoices,
    });

    // menuSelection = answers.after_game_menu_option;
    if (user.username !== CONSTANTS.GUEST) {
        await saveUserData();
    }

    switch (answers.after_game_menu_option) {
        case 'Play Again?': {
            gameData.isPlaying = true;
            if (gameData.isRandomGame) {
                await requestRandomWord()
            } else {
                await requestWord();
            }
            break;
        }
        case 'Main Menu': {
            gameData.isPlaying = false;
            break;
        }
        case 'Save and Exit': {
            gameData.isPlaying = false;
            await showLoadingSpinner('Saving User Data', 500);
            console.clear();
            process.exit(0);
            break;
        }
    }
}

async function settings() {
    if (user.username !== CONSTANTS.GUEST) {
        await saveUserData();
    }

    const settingsAnswer = await inquirer.prompt({
        name: 'settings_selection',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
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
            await showLoadingSpinner(`Getting Current Word Length`, CONSTANTS.SETTINGS_DELAY);
            await titleBlock(`Choose Your Word Length\nCurrent Word Length: ${user.settings.word_length}`, editWordLength)
            break;
        }
        case 'Word Hints': {
            await showLoadingSpinner('Getting Current Number of Word Hints', CONSTANTS.SETTINGS_DELAY);
            await titleBlock(`Choose Your Number of Hints\nCurrent Number of Hints: ${user.settings.hints}`, editWordHints)
            break;
        }
        case 'Skip Instructions on New Game': {
            await showLoadingSpinner('Getting Current Selection for Skipping Instructions...', CONSTANTS.SETTINGS_DELAY);
            await titleBlock('Want to Skip the Instructions?', editSkipInstructions)
            break;
        }
        case 'Okay to Repeat Words': {
            await showLoadingSpinner('Getting Current Selection for Repeating Words...', CONSTANTS.SETTINGS_DELAY);
            await titleBlock('Want to Allow Words to Repeat?', editRepeatWords)
            break;
        }
        case 'Set Settings to Default': {
            await titleBlock('Are you Sure You Want to Reset your Settings to Default?', resetToDefaultSettings)
            //txtFuncs.updateSettingsText(user);
            break;
        }
        case 'Save and Return to Menu': {
            gameData.isSetting = false;
            await showLoadingSpinner('Saving Settings...', CONSTANTS.SETTINGS_DELAY);
            if (user.username !== CONSTANTS.GUEST) {
                await saveUserData();
            }
            break;
        }
    }
}

async function resetToDefaultSettings() {
    const defaultSettingsAnswer = await inquirer.prompt({
        name: 'reset_to_default',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        message: 'Are you Sure You Want to Reset your Settings to Default?:',
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

    if (defaultSettingsAnswer.reset_to_default === 'Yes'){
        resetSettingsToDefaultSettings();
    }

    await showLoadingSpinner('Returning to Settings...', CONSTANTS.SETTINGS_DELAY);
    const settingsText = txtFuncs.updateSettingsText(user);
    await titleBlock(settingsText, settings);
}

function resetSettingsToDefaultSettings() {
    user.settings.allow_repeats = true;
    user.settings.word_length = 5;
    user.settings.hints = 2;
    user.settings.allow_repeats = true;
}

async function editWordLength() {
    const currentWordLength = user.settings.word_length;
    let newChoices = [];

    for (let i = CONSTANTS.MIN_WORD_LENGTH; i <= CONSTANTS.MAX_WORD_LENGTH; i++) {
        newChoices.push({
            name: `${i}`,
            short: `You want words ${i} characters long`
        })
    }

    newChoices.push({
        name: "Return to Settings Menu",
        short: "Nevermind about this!"
    })

    const wordLengthAnswer = await inquirer.prompt({
        name: 'wordLengthSelection',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        default: `${currentWordLength}`,
        message: 'Select an Option Below Using the Arrow Keys and Return Key:',
        choices: newChoices
    });

    if (wordLengthAnswer.wordLengthSelection !== "Return to Settings Menu") {
        user.settings.word_length = wordLengthAnswer.wordLengthSelection
        if (user.settings.hints >= user.settings.word_length - 1) {
            user.settings.hints = user.settings.word_length - 2
        }
    }
    await showLoadingSpinner('Returning to Settings...', CONSTANTS.SETTINGS_DELAY);
    const settingsText = txtFuncs.updateSettingsText(user);
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

    newChoices.push({
        name: "Return to Settings Menu",
        short: "Nevermind about this!"
    })

    const wordHintsAnswer = await inquirer.prompt({
        name: 'wordHintsSelection',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        default: `${currentWordHints}`,
        message: 'Select an Option Below Using the Arrow Keys and Return Key:',
        choices: newChoices
    });

    if (wordHintsAnswer.wordHintsSelection !== "Return to Settings Menu") {
        user.settings.hints = wordHintsAnswer.wordHintsSelection
    }

    await showLoadingSpinner('Returning to Settings...', CONSTANTS.SETTINGS_DELAY);
    const settingsText = txtFuncs.updateSettingsText(user);
    await titleBlock(settingsText, settings);
}

async function editSkipInstructions() {
    const currentSelection = user.settings.show_instructions;

    const returnToMenuOption = {
        name: `Return To Menu`,
        short: `Nevermind about this!`
    }
    const skipInstructionsOption = {
        name: `Yes`,
        short: `No More Instructions For You!`
    }
    const doNotSkipInstructionsOption = {
        name: `No`,
        short: `All of the Instructions!`
    }

    let defaultOption = `Yes`;
    if (currentSelection) {
        defaultOption = `No`
    }

    let newChoices = [skipInstructionsOption, doNotSkipInstructionsOption, returnToMenuOption];

    const skipInstructionsAnswer = await inquirer.prompt({
        name: 'skipInstructionsSelection',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        default: defaultOption,
        message: 'Want to Skip the Instructions Before Each Game?',
        choices: newChoices
    });

    if (skipInstructionsAnswer.skipInstructionsSelection === `Yes`) {
        user.settings.show_instructions = false
    } else if (skipInstructionsAnswer.skipInstructionsSelection === `No`) {
        user.settings.show_instructions = true
    }

    await showLoadingSpinner('Returning to Settings...', CONSTANTS.SETTINGS_DELAY);
    const settingsText = txtFuncs.updateSettingsText(user);
    await titleBlock(settingsText, settings);
}

async function editRepeatWords() {
    const currentSelection = user.settings.allow_repeats;

    const returnToMenuOption = {
        name: `Return To Menu`,
        short: `Nevermind about this!`
    }
    
    const allowRepeatsOption = {
        name: `Yes`,
        short: `Deja Vu?!`
    }
    const doNotAllowRepeatsOption = {
        name: `No`,
        short: `Let's Get Fresh Words in Here!`
    }

    let defaultOption = `No`;
    if (currentSelection) {
        defaultOption = `Yes`
    }

    let newChoices = [allowRepeatsOption, doNotAllowRepeatsOption, returnToMenuOption];

    const editRepeatsAnswer = await inquirer.prompt({
        name: 'editRepeatsSelection',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        default: defaultOption,
        message: 'Want to Allow Words to Repeat?',
        choices: newChoices
    });

    if (editRepeatsAnswer.editRepeatsSelection === `Yes`) {
        user.settings.allow_repeats = true
    } else if (editRepeatsAnswer.editRepeatsSelection === `No`) {
        user.settings.allow_repeats = false
    }

    await showLoadingSpinner('Returning to Settings...', CONSTANTS.SETTINGS_DELAY);
    const settingsText = txtFuncs.updateSettingsText(user);
    await titleBlock(settingsText, settings);
}

async function saveUserData(){
    // Read in the users file
    let userDataRaw;

    try {
        userDataRaw = await fs.promises.readFile(CONSTANTS.USERFILE, 'utf8');
    } catch (err) {
        console.error("Error - unable to read the user file");
        process.exit(1);
    }

    const userData = JSON.parse(userDataRaw);

    // Find user in JSON file data
    for (let i = 0; i < userData.length; i++) {
        if (userData[i].username === user.username) {
            userData[i] = user;
            break;
        }
    }

    try {
        await fs.promises.writeFile(CONSTANTS.USERFILE, JSON.stringify(userData));
    } catch (err) {
        console.error("Unable to append user data to database");
        process.exit(1)
    }
}

async function makeFolderIfDoesNotExist() {
    // Make db folder if it doesn't exist
    try{
        await fs.promises.mkdir(CONSTANTS.DB_FOLDER);
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
    const userFileExists = await checkIfFileExists(CONSTANTS.USERFILE);
    if (!userFileExists) {
        try {
            await fs.promises.writeFile(CONSTANTS.USERFILE, JSON.stringify[user]);
        } catch (err) {
            console.error(`Error - game needs ${file} file`);
            process.exit(1);
        }
    }

    // The pipe file should be reset at the start of a game, regardless if it exists
    try {
        const startingWordRequest = {
            request: {
                word_needed: false,
                word_length: 0
            },
            response: {
                word: null,
                new_word: false
            }
        }
        await fs.promises.writeFile(CONSTANTS.PIPE_TO_API, JSON.stringify(startingWordRequest));
    } catch (err) {
        console.error(`Error - game needs ${file} file`);
        process.exit(1);
    }
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
 