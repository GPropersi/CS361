import chalk from "chalk";
import fs from 'fs';
import { TEXTS } from "./text_constants.js";
import { CONSTANTS, CLI_CONSTANTS, ARG_DEFINITIONS, SETTINGS_STRINGS, startingWordRequest } from "./constants.js";
import users from "./users.js";
import cliSettings from "./settings.js"
import { sleep } from "./utils.js"

export async function parseCommandLineArguments(passedArguments) {
    validateArguments(passedArguments);

    const mainArgsProp = ARG_DEFINITIONS.MAIN_ARGUMENTS;
    const followOnArgsProp = ARG_DEFINITIONS.FOLLOW_ON_ARGUMENTS;

    let userPassedArguments = splitArguments(passedArguments);
    let mainArgument = userPassedArguments.mainArgsProp;
    let followOnArguments = userPassedArguments.followOnArgsProp;
    await performCommandLineCommand(mainArgument, followOnArguments, passedArguments)
}

function validateArguments(passedArguments) {
    try {
        if (passedArguments[0][0] !== "-") {
            console.error(chalk.greenBright(`Invalid Arguments.\n`, TEXTS.CLI_HELP_TEXT));
            process.exit(1);
        }
    } catch (err) {
        console.error(chalk.greenBright(`Invalid Arguments.\n`, TEXTS.CLI_HELP_TEXT));
        process.exit(1);
    }
}


function splitArguments(passedArguments) {
    let main_argument = passedArguments[0].replace("-", "");;
    while (main_argument.includes("-")) {
        main_argument = main_argument.replace("-", "");
    }

    if (!CLI_CONSTANTS.VALID_COMMANDS.includes(main_argument)) {
        console.error(chalk.greenBright(`Invalid Arguments.\n`, TEXTS.CLI_HELP_TEXT));
        process.exit(1);
    }

    let additionalArgs = [];
    for (let i = 1; i < passedArguments.length; i++) {
        additionalArgs.push(passedArguments[i]);
    }

    const mainArgsProp = ARG_DEFINITIONS.MAIN_ARGUMENTS;
    const followOnArgsProp = ARG_DEFINITIONS.FOLLOW_ON_ARGUMENTS;

    let userPassedArguments = {
        mainArgsProp: main_argument, 
        followOnArgsProp: additionalArgs
    }

    return userPassedArguments;
}

async function performCommandLineCommand(mainArgs, followArgs, allArgs) {
    switch (mainArgs) {
        case "r":
        case "register": {
            await registerNewUser(followArgs);
            break;
        }
        case "g":
        case "get": {
            await readUserInfo(followArgs);
            break;
        }
        case "m": {
            await modifyAndValidateUserInfo(followArgs);
            break;
        }
        case "w":
        case "W": {
            await getAWord(allArgs)
            break;
        }
        case "game": {
            console.log("User wants a game explanation!")
            showGameHelp();
        }
        case "h":
        case "help": {
            console.log(chalk.greenBright(TEXTS.CLI_HELP_TEXT))
            process.exit(0);
        }
        default: {
            console.error(chalk.greenBright(`Invalid Arguments.\n`, TEXTS.CLI_HELP_TEXT))
            process.exit(1);
        }
    } 
}

function showGameHelp(){
    console.clear();
    console.log(chalk.cyanBright(TEXTS.CLI_GAME_HELP));
    process.exit(0);
}

async function registerNewUser(passedArguments) {
    validateArgumentsForNewUsername(passedArguments);
    let newUsername = passedArguments[0];
    validateUsername(newUsername);

    const alreadyExists = await users.findIfUsernameExists(newUsername);
    if (alreadyExists) {
        usernameAlreadyExists();
    }

    // Create user if not found
    await users.addUserToDatabase(newUsername);

    console.log(chalk.blueBright(
        `Success: ${newUsername} has been registered`
    ))
    process.exit(0);
}

function validateArgumentsForNewUsername(passedArguments) {
    const INVALID_USERNAME = `Please enter a username, 3-29 characters in length, only alphanumeric or underscores allowed.\nMust start with a letter.\n`;
    if (passedArguments.length !== 1) {
        console.error(chalk.greenBright(
            `Error: Must pass a single username.\n` + 
            INVALID_USERNAME + 
            `Example: "node index -r marypoppins"`))
        process.exit(1);
    }
}

function validateUsername(username) {
    const usernameIsValid = username.match(
        /^[A-Za-z][A-Za-z0-9_]{2,29}$/
    )

    if (!usernameIsValid) {
        console.error(chalk.greenBright(
            `Error: Invalid username entered.\n` +
            INVALID_USERNAME +
            `Example: "node index -r marypoppins"\n` +
            `Example: "node index -g marypoppins word_length"\n` +
            `Example: "node index -g marypoppins"\n`
            `Example: "node index -m marypoppins word_length 3"\n`
        ))
        process.exit(1);
    }
}

function usernameAlreadyExists() {
    console.error(chalk.greenBright(
        `Error: Username already exists. Please try again.\n`
    ))
    process.exit(1);
}

async function readUserInfo(passedArguments) {
    validateArgumentsForReadingUserInfo(passedArguments);

    let potentialUsername = passedArguments[0];

    validateUsername(potentialUsername);

    switch (passedArguments.length) {
        case 1: {
            // just a username passed
            await readAllUserInfo(potentialUsername);
            break
        }
        case 2: {
            // username and specific attribute
            if (!CLI_CONSTANTS.VALID_USER_SETTINGS.includes(passedArguments[1])) {
                invalidUserSettingRequested();
                break;
            } 

            await readSpecificUserInfo(potentialUsername, passedArguments[1])
            break;
        }
    }
    process.exit(0);
}

function validateArgumentsForReadingUserInfo(passedArguments) {
    const INVALID_USERNAME = `Please enter a username, 3-29 characters in length, only alphanumeric or underscores allowed.\nMust start with a letter.\n`;
    if (passedArguments.length < 1 || passedArguments.length > 2) {
        console.error(chalk.greenBright(
            `Error: Must pass a single username and/or single setting to read.\n` + 
            INVALID_USERNAME + 
            `Example: "node index -g marypoppins word_length"\n` +
            `Example: "node index -g marypoppins"\n`
        ))
        process.exit(1);
    }
}

function invalidUserSettingRequested() {
    console.error(chalk.greenBright(
        `Error: Invalid user setting requested.\n` +
        `Must include: ${CLI_CONSTANTS.VALID_USER_SETTINGS.join(" || ")}\n` +
        `Example: "node index -g marypoppins word_length"\n`
    ))
}

async function readAllUserInfo(username) {
    const userExists = await users.findIfUsernameExists(username);
    if (!userExists) {
        console.error(chalk.greenBright(`User does not exist.\n`));
        process.exit(1);
    }

    const user = await users.getSpecificUserData(username);
    const userRecords = users.updateUserRecords(user);

    console.log(chalk.blueBright(userRecords));
    process.exit(0)
}

async function readSpecificUserInfo(username, setting) {
    const userExists = await users.findIfUsernameExists(username);
    if (!userExists) {
        console.error(chalk.greenBright(`User does not exist.\n`));
        process.exit(1);
    }

    const user = await users.getSpecificUserData(username);
    displaySpecificUserSetting(user, setting);
}

function displaySpecificUserSetting(user, setting) {
    // Must include: word_length || hints || show_instructions || allow_repeats
    switch (setting) {
        case SETTINGS_STRINGS.WORD_LENGTH: {
            console.log(chalk.blueBright(
                `Word Length: ${user.settings.word_length}`
            ))
            break;
        }
        case SETTINGS_STRINGS.HINTS: {
            console.log(chalk.blueBright(
                `Number of Hints: ${user.settings.hints}`
            ))
            break;
        }
        case SETTINGS_STRINGS.SHOW_INSTRUCTIONS: {
            let wantsInstructions = "No";
            if (user.settings.show_instructions) {
                wantsInstructions = "Yes";
            } 
            console.log(chalk.blueBright(
                `Instructions Before Every Game: ${wantsInstructions}`
            ))
            break;
        }
        case SETTINGS_STRINGS.ALLOW_REPEATS: {
            let wantsRepeats = "No";
            if (user.settings.allow_repeats) {
                wantsRepeats = "Yes";
            } 

            console.log(chalk.blueBright(
                `Allows Repeat Words: ${wantsRepeats}`
            ))
            break;
        }
    }
    process.exit(0);
}

async function modifyAndValidateUserInfo(passedArguments) {
    validateArgumentsForModifyingUserInfo(passedArguments);

    const username = passedArguments[0];
    validateUsername(username);
    const userExists = await users.findIfUsernameExists(username);
    if (!userExists) {
        console.error(chalk.greenBright(`User does not exist.\n`));
        process.exit(1);
    }

    const settingToChange = passedArguments[1];
    validateUserSetting(settingToChange);

    const changeSettingTo = passedArguments[2];
    let userData = await users.getSpecificUserData(username);
    validateModifiedSettingValue(settingToChange, changeSettingTo, userData)

    switch (settingToChange) {
        case "word_length" : {
            let newWordLength = parseInt(changeSettingTo);
            userData = cliSettings.cliModifyWordLength(userData, newWordLength);
            break;
        }

        case "hints": {
            let newHints = parseInt(changeSettingTo);
            userData = cliSettings.cliModifyWordHints(userData, newHints)
            break;
        }

        case "show_instructions": {
            userData = cliSettings.cliModifyShowInstructions(userData, changeSettingTo);
            break;
        }
        case "allow_repeats": {
            userData = cliSettings.cliModifyAllowRepeats(userData, changeSettingTo);
            break;
        }

        default: {
            invalidArgumentsPassedForChangingSpecificSetting()
            break;
        }
    }

    await users.saveUserData(userData);
    process.exit(0);
}

function validateArgumentsForModifyingUserInfo(passedArguments) {
    const INVALID_USERNAME = `Please enter a username, 3-29 characters in length, only alphanumeric or underscores allowed.\nMust start with a letter.\n`;
    if (passedArguments.length !== 3) {
        console.error(chalk.greenBright(
            `Error: Must pass a single username, setting to modify, and what to change the setting to.\n` + 
            INVALID_USERNAME + 
            `Example: "node index -m marypoppins word_length 3"\n` +
            `Must include: ${CLI_CONSTANTS.VALID_USER_SETTINGS.join(" || ")}\n`
        ))
        process.exit(1);
    }
}

function validateUserSetting(settingToChange) {
    if (!CLI_CONSTANTS.VALID_USER_SETTINGS.includes(settingToChange)) {
        console.error(chalk.greenBright(
            `Error: Invalid user setting requested.\n` +
            `Must include: ${CLI_CONSTANTS.VALID_USER_SETTINGS.join(" || ")}\n` +
            `Example: "node index -m marypoppins word_length 3"\n`
        ))
        process.exit(1);
    }
}

function validateModifiedSettingValue(settingToChange, changeSettingTo, user) {
    switch (settingToChange) {
        case SETTINGS_STRINGS.WORD_LENGTH : {
            const newWordLength = parseInt(changeSettingTo);
            validateModifiedWordLength(newWordLength)  
            break;
        }

        case SETTINGS_STRINGS.HINTS: {
            const newHints = parseInt(changeSettingTo);
            const currentWordLength = user.settings.word_length;
            validateModifiedHintNumber(newHints, currentWordLength);
            break;
        }
        case SETTINGS_STRINGS.ALLOW_REPEATS:
        case SETTINGS_STRINGS.SHOW_INSTRUCTIONS: {
            validateBooleanForInstructionsOrHints(changeSettingTo);
            break;
        }
        default: {
            invalidArgumentsPassedForChangingSpecificSetting();
            break;
        }
    }
}

function validateModifiedWordLength(newWordLength) {
    const numIsNaN = Number.isNaN(newWordLength);
    const numIsLessThanMin = (newWordLength < CONSTANTS.MIN_WORD_LENGTH )
    const numIsMoreThanMax = (newWordLength > CONSTANTS.MAX_WORD_LENGTH)
    if (numIsNaN || numIsLessThanMin || numIsMoreThanMax) {
        console.error(chalk.greenBright(
            `Invalid entry for new word length.\n` +
            `Word length can be minimum ${CONSTANTS.MIN_WORD_LENGTH} characters, and max ${CONSTANTS.MAX_WORD_LENGTH} characters.\n`
        ))
        process.exit(1)
    }        
}

function validateModifiedHintNumber(newHintNumber, currentWordLength) {
    const numIsNaN = Number.isNaN(newHintNumber);
    const numGreaterThanZero = (newHintNumber < 0)
    const validNumForWordLength = (newHintNumber > currentWordLength - 2)
    if (numIsNaN || numGreaterThanZero || validNumForWordLength) {
        console.error(chalk.greenBright(
            `Invalid entry for new word length.\n` +
            `Number of hints must be greater than or equal to 0, and must be less than or equal to the number of \n` +
            `the current word length setting, minus 2.`
        ))
        process.exit(1)
    }     
}

function validateBooleanForInstructionsOrHints(potentialBoolean) {
    if (!CLI_CONSTANTS.VALID_BOOLEANS.includes(potentialBoolean)) {
        console.error(chalk.greenBright(
            `Invalid entry.\n` +
            `Must be either "true" or "false".\n`
        ))
        process.exit(1)    
    }
}

function invalidArgumentsPassedForChangingSpecificSetting() {
    console.error(chalk.greenBright(
        `Error: Must pass a single username, setting to modify, and what to change the setting to.\n` + 
        INVALID_USERNAME + 
        `Example: "node index -m marypoppins word_length 3"\n` +
        `Must include: ${CLI_CONSTANTS.VALID_USER_SETTINGS.join(" || ")}\n`
    ))
    process.exit(1);
}

function validateArgumentsForGettingRandomWord(passedArguments) {
    if (passedArguments.length < 1 || passedArguments.length > 2) {
        console.error(chalk.greenBright(
            `Error: Commands take a single integer argument, or no argument.\n` + 
            `Example: "node index -w 5"\n` + 
            `Example: "node index -w"\n`
            ))
        process.exit(1);
    }
}

function determineLengthOfRandomWordFromArgs(passedArguments) {
    let wordLengthRequested;
    if (passedArguments.length === 1) {
        wordLengthRequested = 5;
    } else {
        wordLengthRequested = parseInt(passedArguments[1]);
        const numIsNaN = Number.isNaN(wordLengthRequested);
        const numIsBelowMin = (wordLengthRequested < CONSTANTS.MIN_WORD_LENGTH);
        const numIsBelowMax = (wordLengthRequested > CONSTANTS.MAX_WORD_LENGTH) 
        if (numIsNaN || numIsBelowMin || numIsBelowMax) {
            console.error(chalk.greenBright(
                `Invalid entry for requested word length. Must be an integer.\n` +
                `Word length can be minimum ${CONSTANTS.MIN_WORD_LENGTH} characters, and max ${CONSTANTS.MAX_WORD_LENGTH} characters.\n`
            ))
            process.exit(1)
        } 
    }

    return wordLengthRequested;
}

async function getAWord(passedArguments) {
    validateArgumentsForGettingRandomWord(passedArguments);

    const wordLengthRequested = determineLengthOfRandomWordFromArgs(passedArguments);

    let waitingForWord = true;
    let pipeData;
    let wordToGuess;

    let wordRequest = startingWordRequest;
    wordRequest.request.wordNeeded = true;
    wordRequest.request.wordLength = wordLengthRequested;

    console.log(chalk.blueBright(`Requesting a ${wordLengthRequested} letter word...\n`))

    try {
        fs.writeFileSync(CONSTANTS.PIPE_TO_API, JSON.stringify(wordRequest));
    } catch (err) {
        console.error(`Error - game needs ${CONSTANTS.PIPE_TO_API} file`);
        process.exit(1);
    }

    while (waitingForWord) {
        try {
            await sleep(50);
            pipeData = fs.readFileSync(CONSTANTS.PIPE_TO_API, 'utf-8');
            wordRequest = JSON.parse(pipeData);

            if (wordRequest.response.word !== null && wordRequest.response.newWord) {
                wordToGuess = wordRequest.response.word;
                waitingForWord = false;
            }
        } catch (err) {
            console.error(`Error reading ${CONSTANTS.PIPE_TO_API} for word.\n${err}`);
            process.exit(1);
        }
    }

    console.log(chalk.blueBright(
        `${wordToGuess}`
    ))
    process.exit(0);
}
