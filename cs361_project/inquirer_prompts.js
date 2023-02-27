import inquirer from "inquirer";
import PressToContinuePrompt from "inquirer-press-to-continue";
import { TEXTS } from "./text_constants.js";
import { CONSTANTS, STRINGS, SETTINGS_MENU } from "./constants.js";

inquirer.registerPrompt('press-to-continue', PressToContinuePrompt)

export async function askIfGuestPrompt(){
    return await inquirer.prompt({
        name: 'typeOfUser',
        type: 'list',
        prefix: '\n\n\n\n',
        message: TEXTS.GUEST_TEXT,
        choices: [
        'Login/Register with Username',
        STRINGS.PLAY_AS_GUEST,
        'Exit'
        ],
    });
}

export async function loginOrRegisterPrompt() {
    return await inquirer.prompt({
        name: 'userUsername',
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
    })
}

export async function mainMenuGuestPrompt() {
    return await inquirer.prompt({
        name: 'main_menu_option',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        message: 'Select an Option Below Using the Return Key:',
        choices: [
        STRINGS.GUESS_WORD,
        STRINGS.GUESS_RANDOM_WORD,
        STRINGS.SETTINGS,
        STRINGS.EXIT
        ],
    })
}

export async function mainMenuPrompt() {
    return await inquirer.prompt({
        name: 'main_menu_option',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        message: 'Select an Option Below Using the Return Key:',
        choices: [
        {
            name: STRINGS.GUESS_WORD,
            short: `Let's Play!`
        },
        {
            name: STRINGS.GUESS_RANDOM_WORD,
            short: `Let's Play, Randomly!`
        },
        {
            name: STRINGS.SETTINGS,
            short: `Let's Edit Your Settings!`
        },
        {
            name: STRINGS.RECORDS,
            short: `What's Too Much Play Time?`
        },
        {
            name: STRINGS.SAVE_AND_EXIT,
            short: `Come Again!`
        },
        ],
    })
}

export async function recordsScreenPrompt() {
    return await inquirer.prompt({
        name: 'recordsScreenOption',
        type: 'list',
        prefix: `\n\n\n`,
        message: 'Press Enter to Return to the Main Menu:',
        choices: ["Return to main menu"]
    });
}

export async function runGamePrompt(gameData) {
    return await inquirer.prompt({
        name: 'gameGuess',
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
            const alreadyGuessed = (gameData.lettersGuessed.includes(value[0]))
            if (alreadyGuessed) {
                return `You already guessed "${value[0]}"`
            }
            return true;
        }       
    });
}

export async function afterGameMenuPrompt(user) {
    let afterGameChoices;

    if (user.username === CONSTANTS.GUEST) {
        afterGameChoices = [
            {
                name: STRINGS.PLAY_AGAIN,
                short: `Let's Play Again!!`
            },
            {
                name: STRINGS.MAIN_MENU,
                short: `Heading Back to the Menu!`
            },
            ]
    } else {
        afterGameChoices = [
            {
                name: STRINGS.PLAY_AGAIN,
                short: `Let's Play Again!!`
            },
            {
                name: STRINGS.MAIN_MENU,
                short: `Heading Back to the Menu!`
            },
            {
                name: STRINGS.SAVE_AND_EXIT,
                short: `Come Again!`
            }
            ]
    }

    return await inquirer.prompt({
        name: 'afterGameMenuOption',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        message: 'Select an Option Below Using the Return Key:',
        choices: afterGameChoices,
    })
}

export async function settingsPrompt() {
    return await inquirer.prompt({
        name: 'settingsSelection',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        message: 'Select an Option Below Using the Arrow Keys and Return Key:',
        choices: [
        {
            name: SETTINGS_MENU.WORD_LENGTH,
            short: `Guess a New Word Length!`
        },
        {
            name: SETTINGS_MENU.WORD_HINTS,
            short: `Make the Game Harder or Easier!`
        },
        {
            name: SETTINGS_MENU.SKIP_INSTRUCTIONS,
            short: `Don't Need These Anymore!`
        },
        {
            name: SETTINGS_MENU.REPEAT_WORDS,
            short: `Groundhog Day, Let's Go!`
        },
        {
            name: SETTINGS_MENU.DEFAULT_SETTINGS,
            short: `Back to Default Settings it is!`
        },
        {
            name: SETTINGS_MENU.SAVE_AND_RETURN,
            short: `Good Options`         
        }],
    })
}

export async function wordLengthPrompt(currentWordLength, choices) {
    return await inquirer.prompt({
        name: 'wordLengthSelection',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        default: `${currentWordLength}`,
        message: 'Select an Option Below Using the Arrow Keys and Return Key:',
        choices: choices
    })
}

export async function wordHintsPrompt(currentWordHints, choices) {
    return await inquirer.prompt({
        name: 'wordHintsSelection',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        default: `${currentWordHints}`,
        message: 'Select an Option Below Using the Arrow Keys and Return Key:',
        choices: choices
    })
}

export async function skipInstructionsPrompt(defaultOption, choices) {
    return await inquirer.prompt({
        name: 'skipInstructionsSelection',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        default: defaultOption,
        message: 'Want to Skip the Instructions Before Each Game?',
        choices: choices
    })
}

export async function repeatWordsPrompt(defaultOption, choices) {
    return await inquirer.prompt({
        name: 'editRepeatsSelection',
        type: 'list',
        prefix: CONSTANTS.MAIN_MENU_LINES.repeat(10),
        default: defaultOption,
        message: 'Want to Allow Words to Repeat?',
        choices: choices
    })
}

export async function anyKeyToContinuePrompt() {
    return inquirer.prompt({
        name: 'key',
        type: 'press-to-continue',
        anyKey: true,
        pressToContinueMessage: 'Press a key to continue...',
      })
}


export default {
    askIfGuestPrompt,
    loginOrRegisterPrompt,
    mainMenuGuestPrompt,
    mainMenuPrompt,
    recordsScreenPrompt,
    runGamePrompt,
    afterGameMenuPrompt,
    settingsPrompt,
    wordLengthPrompt,
    wordHintsPrompt,
    skipInstructionsPrompt,
    repeatWordsPrompt,
    anyKeyToContinuePrompt,
}