import chalk from "chalk";
import fs from 'fs';
import { TEXTS } from "./text_objects.js";
import { CONSTANTS, CLI_CONSTANTS, newUserOrGuest } from "./constants.js";

let user = newUserOrGuest;

export async function parseCommandLineArguments(passedArguments) {
    try {
        if (passedArguments[0][0] !== "-") {
            console.error(chalk.greenBright(`Invalid Arguments.\n`, TEXTS.CLI_HELP_TEXT));
            process.exit(1);
        }
    } catch (err) {
        console.error(chalk.greenBright(`Invalid Arguments.\n`, TEXTS.CLI_HELP_TEXT));
        process.exit(1);
    }

    let main_argument = passedArguments[0].replace("-", "");;
    while (main_argument.includes("-")) {
        main_argument = main_argument.replace("-", "");
    }

    if (!CLI_CONSTANTS.VALID_COMMANDS.includes(main_argument)) {
        console.error(chalk.greenBright(`Invalid Arguments.\n`, TEXTS.CLI_HELP_TEXT));
        process.exit(1);
    }

    let followOnArguments = [];
    for (let i = 1; i < passedArguments.length; i++) {
        followOnArguments.push(passedArguments[i]);
    }
    
    switch (main_argument) {
        case "r":
        case "register": {
            registerNewUser(followOnArguments);
            break;
        }
        case "g":
        case "get": {
            readUserInfo(followOnArguments);
            break;
        }
        case "m": {
            modifyUserInfo(followOnArguments);
            break;
        }
        case "w":
        case "W": {
            await getAWord(passedArguments)
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
    console.log(chalk.cyanBright(CLI.GAME_HELP_TEXT));
    process.exit(0);
}

function registerNewUser(passedArguments) {
    const INVALID_USERNAME = `Please enter a username, 3-29 characters in length, only alphanumeric or underscores allowed.\nMust start with a letter.\n`;
    if (passedArguments.length !== 1) {
        console.error(chalk.greenBright(
            `Error: Must pass a single username.\n` + 
            INVALID_USERNAME + 
            `Example: "node index -r marypoppins"`))
        process.exit(1);
    }

    let potentialUsername = passedArguments[0];
    validateUsername(potentialUsername);
    let originalUserData = findIfUsernameAlreadyExists(potentialUsername);

    // Create user if not found
    addUserToDatabase(originalUserData, potentialUsername)

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
        ))
        process.exit(1);
    }
}

function findIfUsernameAlreadyExists(username) {
    let originalUserDataRaw;
    try {
        originalUserDataRaw = fs.readFileSync(CONSTANTS.USERFILE, 'utf8');
    } catch (err) {
        console.error(`Error - unable to read the user file\n${err}`);
        process.exit(1);
    }

    const originalUserData = JSON.parse(originalUserDataRaw);
    // Find user in JSON file data, if exists set proper data
    for (let i = 0; i < originalUserData.length; i++) {
        if (originalUserData[i].username === username) {
            console.error(chalk.greenBright(
                `Error: Username already exists. Please try again.\n`
            ))
            process.exit(1);
        }
    }

    return originalUserData;
}

function addUserToDatabase(originalUserData, newUsername) {
    user.username = newUsername;
    originalUserData.push(user)

    try {
        fs.writeFileSync(CONSTANTS.USERFILE, JSON.stringify(originalUserData));
    } catch (err) {
        console.error(`Error: Unable to append user data to database\n${err}`);
        process.exit(1)
    }

    console.log(chalk.blueBright(
        `Success: ${newUsername} has been registered`
    ))
    process.exit(0);
}

function readUserInfo(passedArguments) {
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

    let potentialUsername = passedArguments[0];

    validateUsername(potentialUsername);

    switch (passedArguments.length) {
        case 1: {
            // just a username passed
            readAllUserInfo(potentialUsername);
            break
        }
        case 2: {
            // username and specific attribute
            if (!CLI_CONSTANTS.VALID_SETTINGS.includes(passedArguments[1])) {
                console.error(chalk.greenBright(
                    `Error: Invalid user setting requested.\n` +
                    `Must include: ${CLI_CONSTANTS.VALID_SETTINGS.join(" || ")}\n` +
                    `Example: "node index -g marypoppins word_length"\n`
                ))
            } else {
                readSpecificUserInfo(potentialUsername, passedArguments[1])
            }
            break;
        }
    }
    process.exit(0);
}

function readAllUserInfo(username) {
    let allUserData;
    try {
        allUserData = fs.readFileSync(CONSTANTS.USERFILE, 'utf-8')
    } catch (err) {
        console.error(`Error reading user database.\n${err}`)
        process.exit(1);
    }

    let userInData = false;

    const originalUserData = JSON.parse(allUserData);
    // Find user in JSON file data, if exists set proper data
    for (let i = 0; i < originalUserData.length; i++) {
        if (originalUserData[i].username === username) {
            user = originalUserData[i];
            userInData = true;
            break;
        }
    }

    if (!userInData) {
        console.error(chalk.greenBright(`User does not exist.\n`));
        process.exit(1);
    }

    let wantsInstructions = "No";
    let wantsRepeats = "No";

    if (user.settings.allow_repeats) {
        wantsRepeats = "Yes";
    }

    if (user.settings.show_instructions) {
        wantsInstructions = "Yes";
    }

    let textToLog = `Username: ${user.username}\n` +
        `Total Wins: ${user.wins}\tTotal Losses: ${user.losses}\n` +
        `Current Word Length: ${user.settings.word_length}\t Current Hints: ${user.settings.hints}\n` +
        `Wants Instructions Before Game: ${wantsInstructions}\t Allows Repeat Words: ${wantsRepeats}\n` +
        `Specific Word Length Statistics:\n` 

    for (let i = CONSTANTS.MIN_WORD_LENGTH; i <= CONSTANTS.MAX_WORD_LENGTH; i++) {
        textToLog += ` ${i}: Wins=${user.win_loss_details[i].W} `
        textToLog += ` Loss=${user.win_loss_details[i].L} `

        if (i % 2 == 0){
            textToLog += `\n`
        } else if (i != CONSTANTS.MAX_WORD_LENGTH ) {
            textToLog += `|| `
        }
    }
    textToLog += `\n${user.words_played.join(" || ")}`
    console.log(chalk.blueBright(textToLog));
    process.exit(0)
}

function readSpecificUserInfo(username, setting) {
    let allUserData;
    try {
        allUserData = fs.readFileSync(CONSTANTS.USERFILE, 'utf-8')
    } catch (err) {
        console.error(`Error reading user database.\n${err}`)
        process.exit(1);
    }

    let userInData = false;

    const originalUserData = JSON.parse(allUserData);
    // Find user in JSON file data, if exists set proper data
    for (let i = 0; i < originalUserData.length; i++) {
        if (originalUserData[i].username === username) {
            user = originalUserData[i];
            userInData = true;
            break;
        }
    }

    if (!userInData) {
        console.error(chalk.greenBright(`User does not exist.\n`));
        process.exit(1);
    }

    // Must include: word_length || hints || show_instructions || allow_repeats
    switch (setting) {
        case "word_length": {
            console.log(chalk.blueBright(
                `Word Length: ${user.settings.word_length}`
            ))
            break;
        }
        case "hints": {
            console.log(chalk.blueBright(
                `Number of Hints: ${user.settings.hints}`
            ))
            break;
        }
        case "show_instructions": {
            let wantsInstructions;
            if (user.settings.show_instructions) {
                wantsInstructions = "Yes";
            } else {
                wantsInstructions = "No";
            }
            console.log(chalk.blueBright(
                `Instructions Before Every Game: ${wantsInstructions}`
            ))
            break;
        }
        case "allow_repeats": {
            let wantsRepeats;
            if (user.settings.allow_repeats) {
                wantsRepeats = "Yes";
            } else {
                wantsRepeats = "No;"
            }
            console.log(chalk.blueBright(
                `Allows Repeat Words: ${wantsRepeats}`
            ))
            break;
        }
    }
    process.exit(0);
}

function modifyUserInfo(passedArguments) {
    const INVALID_USERNAME = `Please enter a username, 3-29 characters in length, only alphanumeric or underscores allowed.\nMust start with a letter.\n`;
    if (passedArguments.length !== 3) {
        console.error(chalk.greenBright(
            `Error: Must pass a single username, setting to modify, and what to change the setting to.\n` + 
            INVALID_USERNAME + 
            `Example: "node index -m marypoppins word_length 3"\n` +
            `Must include: ${CLI_CONSTANTS.VALID_SETTINGS.join(" || ")}\n`
        ))
        process.exit(1);
    }

    let username = passedArguments[0];
    let settingToChange = passedArguments[1];
    let changeSettingTo = passedArguments[2];

    const usernameIsValid = username.match(
        /^[A-Za-z][A-Za-z0-9_]{2,29}$/
    )

    if (!usernameIsValid) {
        console.error(chalk.greenBright(
            `Error: Invalid username entered.\n` +
            INVALID_USERNAME +
            `Example: "node index -m marypoppins word_length 3"\n`
        ))
        process.exit(1);
    }

    if (!CLI_CONSTANTS.VALID_SETTINGS.includes(settingToChange)) {
        console.error(chalk.greenBright(
            `Error: Invalid user setting requested.\n` +
            `Must include: ${CLI_CONSTANTS.VALID_SETTINGS.join(" || ")}\n` +
            `Example: "node index -m marypoppins word_length 3"\n`
        ))
    }

    let allUserData;
    try {
        allUserData = fs.readFileSync(CONSTANTS.USERFILE, 'utf-8')
    } catch (err) {
        console.error(`Error reading user database.\n${err}`)
        process.exit(1);
    }

    let userInData = false;

    const originalUserData = JSON.parse(allUserData);
    // Find user in JSON file data, if exists set proper data
    for (let i = 0; i < originalUserData.length; i++) {
        if (originalUserData[i].username === username) {
            user = originalUserData[i];
            userInData = true;
            break;
        }
    }

    if (!userInData) {
        console.error(chalk.greenBright(`User does not exist.\n`));
        process.exit(1);
    }

    let previousUserData;
    let newUserData;
    switch (settingToChange) {
        case "word_length" : {
            let newWordLength = parseInt(changeSettingTo);
            if (Number.isNaN(newWordLength) || newWordLength < 3 || newWordLength > 15) {
                console.error(chalk.greenBright(
                    `Invalid entry for new word length.\n` +
                    `Word length can be minimum 3 characters, and max 15 characters.\n`
                ))
                process.exit(1)
            } 

            previousUserData = user.settings.word_length;
            newUserData = newWordLength;

            if (previousUserData === newUserData) {
                console.log(chalk.blueBright(
                    `Word Length: ${previousUserData}\n` +
                    `No change performed since identical to current.\n`
                ))
                process.exit(0);
            } else {
                user.settings.word_length = newWordLength
                console.log(chalk.blueBright(
                    `Old Word Length: ${previousUserData}\n` +
                    `New Word Length: ${newUserData}\n`
                ))
            }
            
            break;
        }

        case "hints": {
            let newHints = parseInt(changeSettingTo);
            let currentWordLength = user.settings.word_length;
            if (Number.isNaN(newHints) || newHints < 0 || (newHints > currentWordLength - 2)) {
                console.error(chalk.greenBright(
                    `Invalid entry for new word length.\n` +
                    `Number of hints must be greater than or equal to 0, and must be less than or equal to the number of \n` +
                    `the current word length setting, minus 2.`
                ))
                process.exit(1)
            } 

            previousUserData = user.settings.hints;
            newUserData = newHints;

            if (previousUserData === newUserData) {
                console.log(chalk.blueBright(
                    `Hints: ${previousUserData}\n` +
                    `No change performed since identical to current.\n`
                ))
                process.exit(0);
            } else {
                user.settings.hints = newHints
                console.log(chalk.blueBright(
                    `Old Hints: ${previousUserData}\n` +
                    `New Hints: ${newUserData}\n`
                ))
            }
            break;
        }

        case "show_instructions": {
            if (!CLI_CONSTANTS.VALID_BOOLEANS.includes(changeSettingTo)) {
                console.error(chalk.greenBright(
                    `Invalid entry for skipping instructions.\n` +
                    `Must be either "true" or "false".\n`
                ))
                process.exit(1)
            }

            if (changeSettingTo === "true") {
                console.log(chalk.blueBright(
                    `Will now show instructions before every game.\n`
                ))
                user.settings.show_instructions = true;
            } else {
                console.log(chalk.blueBright(
                    `Will now skip the instructions before every game.\n`
                ))
                user.settings.show_instructions = false;
            }
            break;
        }
        case "allow_repeats": {
            if (!CLI_CONSTANTS.VALID_BOOLEANS.includes(changeSettingTo)) {
                console.error(chalk.greenBright(
                    `Invalid entry for allowing repeat words.\n` +
                    `Must be either "true" or "false".\n`
                ))
                process.exit(1)
            }

            if (changeSettingTo === "true") {
                console.log(chalk.blueBright(
                    `Repeat words are now allowed.\n`
                ))
                user.settings.allow_repeats = true;
            } else {
                console.log(chalk.blueBright(
                    `Words will no longer be repeated.\n`
                ))
                user.settings.allow_repeats = false;
            }
            break;
        }

        default: {
            console.error(chalk.greenBright(
                `Error: Must pass a single username, setting to modify, and what to change the setting to.\n` + 
                INVALID_USERNAME + 
                `Example: "node index -m marypoppins word_length 3"\n` +
                `Must include: ${CLI_CONSTANTS.VALID_SETTINGS.join(" || ")}\n`
            ))
            process.exit(1);
        }
    }

    saveUserData(username);
    process.exit(0);
}

function saveUserData(username){
    // Read in the users file
    let userDataRaw;

    try {
        userDataRaw = fs.readFileSync(CONSTANTS.USERFILE, 'utf8');
    } catch (err) {
        console.error("Error - unable to read the user file");
        process.exit(1);
    }

    const userData = JSON.parse(userDataRaw);

    // Find user in JSON file data
    for (let i = 0; i < userData.length; i++) {
        if (userData[i].username === username) {
            userData[i] = user;
            break;
        }
    }

    try {
        fs.writeFileSync(CONSTANTS.USERFILE, JSON.stringify(userData));
    } catch (err) {
        console.error(`Unable to append user data to database.\nError: ${err}`);
        process.exit(1)
    }
}

async function getAWord(passedArguments) {
    if (passedArguments.length < 1 || passedArguments.length > 2) {
        console.error(chalk.greenBright(
            `Error: Commands take a single integer argument, or no argument.\n` + 
            `Example: "node index -w 5"\n` + 
            `Example: "node index -w"\n`
            ))
        process.exit(1);
    }
    
    let wordLengthRequested;

    if (passedArguments.length === 1) {
        wordLengthRequested = 5;
    } else {
        wordLengthRequested = parseInt(passedArguments[1]);
        if (Number.isNaN(wordLengthRequested) || wordLengthRequested < 3 || wordLengthRequested > 15) {
            console.error(chalk.greenBright(
                `Invalid entry for requested word length. Must be an integer.\n` +
                `Word length can be minimum 3 characters, and max 15 characters.\n`
            ))
            process.exit(1)
        } 
    }

    let waitingForWord = true;
    let pipeData;
    let wordToGuess;

    let wordRequest = {
        request: {
            word_needed: true,
            word_length: wordLengthRequested
        },
        response: {
            word: null,
            new_word: false
        }
    }

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

            if (wordRequest.response.word !== null && wordRequest.response.new_word) {
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

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
