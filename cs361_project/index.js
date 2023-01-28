import inquirer from "inquirer";
import figlet from "figlet";
import chalk from "chalk";
import chalkAnimation from "chalk-animation";
import gradient from "gradient-string";
import align_text from "align-text";
import center_align from "center-align";
import fs from 'fs';
import { createSpinner } from "nanospinner";

const sleep = (ms = 1500) => new Promise((r) => setTimeout(r, ms));

const GUEST = 'WordGuesser3000';
const USERFILE = "./db_files/users.json";
const DB_FOLDER = "./db_files";
const PIPE_TO_API = "./listener_for_random_word.json";
const ui = new inquirer.ui.BottomBar();
const SETTINGS_TEXT = "Settings Menu - Use Arrow Keys to Select and Modify Your Settings";
const MIN_WORD_LENGTH = 3;
const MAX_WORD_LENGTH = 15;
const MAIN_MENU_LINES = '\n\n\n\n\n\n\n\n\n\n\n';

let bottomTitleText;
let current_username;
let menuChoice;
let menuSelection;
let letsPlay = true;

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
        answers.type_of_user === 'Login/Register with Username'
    )
}

async function handleIfGuestOrUser(isGuest, wantsLogin){
    if (isGuest) {
        current_username = GUEST;
        return;
    }
    
    if (wantsLogin) {
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
            return 'Please enter a username, 3-29 characters in length, only alphanumeric or underscores allowed';            
        }
    });
    current_username = answer.user_username;
    await getUserOrCreateUser(current_username)
}

async function getUserOrCreateUser(usernameToCheck) {
    await showLoadingSpinner("Getting User Ready");

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

async function showLoadingSpinner(updateText) {
    const spinner = createSpinner(updateText).start()
    await sleep();
    spinner.success();
}

async function showBottomBar(barText) {
    ui.updateBottomBar(barText);
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
            await showLoadingSpinner('Loading Settings');
            console.clear()
            await titleBlock(SETTINGS_TEXT, settings);
            break;
        }
        case 'Exit': {
            console.clear();
            process.exit(0);
            break;
        }
        case 'Save and Exit': {
            await saveUserData();
            await showLoadingSpinner('Saving User Data');
            console.clear();
            process.exit(0);
            break;
        }
        case 'Guess A Word!': {
            await requestWord();
            await playGame();
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
            name: 'Save and Return to Menu',
            short: `Good Options`         
        }],
    });

    switch (settingsAnswer.settings_selection) {
        case 'Word Length': {
            await showLoadingSpinner(`Getting Current Word Length`);
            await titleBlock(`Choose Your Word Length\nCurrent Word Length: ${user.settings.word_length}`, editWordLength)
            break;
        }
        case 'Word Hints': {
            await showLoadingSpinner('Getting Current Number of Word Hints');
            await titleBlock(`Choose Uour Number of Hints\nCurrent Number of Hints: ${user.settings.hints}`, editWordHints)
            break;
        }
        case 'Skip Instructions on New Game': {
            await showLoadingSpinner('Getting Current Selection for Skipping Instructions');
            await titleBlock('Want to Skip the Instructions?', editSkipInstructions)
            break;
        }
        case 'Okay to Repeat Words': {
            await showLoadingSpinner('Getting Current Selection for Repeating Words');
            await titleBlock('Want to Allow Words to Repeat?', editRepeatWords)
            break;
        }
        case 'Save and Return to Menu': {
            await showLoadingSpinner('Saving Settings...');
            if (current_username !== GUEST) {
                await saveUserData();
            }
            updateBottomTitleText()
            break;
        }
    }
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
    await showLoadingSpinner('Returning to Settings...');
    await titleBlock(SETTINGS_TEXT, settings);
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
    await showLoadingSpinner('Returning to Settings...');
    await titleBlock(SETTINGS_TEXT, settings);
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

    await showLoadingSpinner('Returning to Settings...');
    await titleBlock(SETTINGS_TEXT, settings);
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

    await showLoadingSpinner('Returning to Settings...');
    await titleBlock(SETTINGS_TEXT, settings);
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
        if (userData[i].username === current_username) {
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

async function makeFolderIfDoNotExist() {
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

async function makeFilesIfDoNotExist() {
    const necessary_files = [USERFILE, PIPE_TO_API];
    let data_to_append;
    for (const file of necessary_files) {
        // Make user and pipe file if they do not exist
        let fileExists = await checkIfFileExists(file);
        if (!fileExists) {
            if (file === USERFILE) {
                data_to_append = JSON.stringify([user]);
            } else {
                data_to_append = JSON.stringify('{}')
            }
            
            try {
                await fs.promises.appendFile(file, data_to_append);
            } catch (err) {
                console.error(`Error - game needs ${file} file`);
                process.exit(1);
            }
        }
    }
}

function updateBottomTitleText() {
    if (current_username === GUEST) {
        bottomTitleText = `Playing As: ${user.username}\n` +
            `Note: Your Win/Loss Record and User Settings Will not be Saved\n` +
            `Wins: ${user.wins}    Losses: ${user.losses}    Current Word Length: ${user.settings.word_length}    Hints Available: ${user.settings.hints}`
    } else {
        bottomTitleText = `Playing As: ${user.username}\n` +
            `Total Wins: ${user.wins}    Total Losses: ${user.losses}    Current Word Length: ${user.settings.word_length}    Hints Available: ${user.settings.hints}`
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
await makeFolderIfDoNotExist();
await makeFilesIfDoNotExist();

await titleBlock('A Node.js CLI Word Guessing Game - Made By Giovanni Propersi', askIfGuest);

if (current_username === GUEST) {
    menuChoice = mainMenuGuest;
} else {
    menuChoice = mainMenu;
}

while (letsPlay) {
    updateBottomTitleText()
    await titleBlock(bottomTitleText, menuChoice);
    await handleMenu(menuSelection);
}
// console.log("Ending?")
