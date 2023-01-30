import chalk from "chalk";
import fs from 'fs';

const CLI_HELP_TEXT = `Possible arguments include:\n` +
    `-r or --register\t\tRegister a username if it is not already registered\n` +      // Add username
    `\tA username can be entered following the previous command, and will be added if it doesn't exist\n` + 
    `\tExample: "> node index -r marypoppins" or "> node index --register marypoppins"\n\n` +
    `-g or --get     \t\tGet a username's game info\n` +      // Get user data
    `\tA username can be entered following the previous command to get all user data\n` +
    `\tExample: "> node index -g marypoppins" or "> node index --get marypoppins"\n` +
    `\tOtherwise, the following commands can be appended to provide more specificity regarding the user's data\n` +
    `\tNote that this only returns the current setting\n\n` +
    `\tword_length      \tNote that word length can range from 3 to 15 characters\n` +
    `\thints            \tNote that the max number of hints is word_length - 2\n` +
    `\tshow_instructions\tWhether to show the instructions before a game\n` +
    `\tallow_repeats    \tWhether the same word can be played again\n\n` +
    `-m                 \t\tModify a username's settings. \n\tFollow this flag by the username, and then the setting to edit.\n` +      // Modify user data
    `\tExample: "node index -m marypoppins word_length 8" or "node index -m marypoppins allow_repeats true"\n\n` +
    `\tword_length      \tNote that word length can range from 3 to 15 characters. Pass an integer.\n` +
    `\thints            \tNote that the max number of hints is word_length - 2. Pass an integer.\n` +
    `\tshow_instructions\tWhether to show the instructions before a game. Modified by "true" or "false"\n` +
    `\tallow_repeats    \tWhether the same word can be played again. Modified by "true" or "false"\n\n` +
    `-w or -W           \t\tGet a random word. Can be followed by an integer for a specific length\n` +      // Modify user settings
    `\tDefault word length is 5. Note that word length can be anywhere from 3 to 15 characters\n\n` +      // Get a random word
    `-game              \tExplains the game!\n` +      // Command explaining the game
    `-h or --help: Provides this help menu`

const VALID_COMMANDS = ["r", "register", "g", "get", "m", "w", "W", "game", "h", "help"];
const VALID_SETTINGS = ["word_length", "hints", "show_instructions", "allow_repeats"];
const VALID_BOOLEANS = ["true", "false"];
const USERFILE = "./db_files/users.json";
const DB_FOLDER = "./db_files";
const PIPE_TO_API = "./listener_for_random_word.json";
const GUEST = 'WordGuesser3000';

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

export async function parseCommandLineArguments(passedArguments) {
    try {
        if (passedArguments[0][0] !== "-") {
            console.error(chalk.greenBright(`Invalid Arguments.\n`, CLI_HELP_TEXT));
            process.exit(1);
        }
    } catch (err) {
        console.error(chalk.greenBright(`Invalid Arguments.\n`, CLI_HELP_TEXT));
        process.exit(1);
    }

    let main_argument = passedArguments[0].replace("-", "");;
    while (main_argument.includes("-")) {
        main_argument = main_argument.replace("-", "");
    }

    if (!VALID_COMMANDS.includes(main_argument)) {
        console.error(chalk.greenBright(`Invalid Arguments.\n`, CLI_HELP_TEXT));
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
            console.log(chalk.greenBright(CLI_HELP_TEXT))
            process.exit(0);
        }
        default: {
            console.error(chalk.greenBright(`Invalid Arguments.\n`, CLI_HELP_TEXT))
            process.exit(1);
        }
    }
}

function showGameHelp(){
    const GAME_HELP_TEXT = `Welcome to.... Guess The Word!!\n\n` + 
    `You can move around in the menus using your arrow keys, typing when necessary!\n` +
    `If you want to keep track of your wins/losses and user settings, set up a username. No password needed!\n` +
    `Otherwise, feel free to play as a guest just to mess around and guess for fun!\n` +
    `You can alter most settings via the "Settings" menu in game - note that these won't be saved if you're a guest.\n` +
    `The length of words you can guess are from 3 letters, to 15 letters long!\n` + 
    `You are allowed to set your number of hints given to you during the game, up to a max number of hints of\n\tword length minus 2!\n` +
    `The objective of the game is to guess a word by inputting letters, one at a time.\n` +
    `The number of guesses you get is the number of letters in the word, plus 2.\n\n` + 
    `At anytime during the game, if you need a hint, type "/hint", and a random correct letter will be given to you!\n` + 
    `Hints do not count towards your guesses!\n` + 
    `If there are multiple instances of that same letter, all will be given to you!\n\n` +
    `During the game, type in a single letter and press the return key to guess the letter.\n` + 
    `An error will pop up if you guess anything but a letter, or a letter that was already guessed.\n\n` +
    `The program also has a Command Line Interface - try passing "-h" or "-help" as an argument to get more info!\n` +
    `Type "/help" during the game to bring up the game instructions.\n` +
    `Type "/exit" during the game to return to the main menu.\n` +
    `Have fun guessing!\n`

    console.clear();
    console.log(chalk.cyanBright(GAME_HELP_TEXT));
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

    const usernameIsValid = potentialUsername.match(
        /^[A-Za-z][A-Za-z0-9_]{2,29}$/
    )

    if (!usernameIsValid) {
        console.error(chalk.greenBright(
            `Error: Invalid username entered.\n` +
            INVALID_USERNAME +
            `Example: "node index -r marypoppins"\n`
        ))
        process.exit(1);
    }

    let originalUserDataRaw;
    try {
        originalUserDataRaw = fs.readFileSync(USERFILE, 'utf8');
    } catch (err) {
        console.error(`Error - unable to read the user file\n${err}`);
        process.exit(1);
    }

    const originalUserData = JSON.parse(originalUserDataRaw);
    // Find user in JSON file data, if exists set proper data
    for (let i = 0; i < originalUserData.length; i++) {
        if (originalUserData[i].username === potentialUsername) {
            console.error(chalk.greenBright(
                `Error: Username already exists. Please try again.\n`
            ))
            process.exit(1);
        }
    }
        
    // Create user if not found
    user.username = potentialUsername;
    originalUserData.push(user)

    try {
        fs.writeFileSync(USERFILE, JSON.stringify(originalUserData));
    } catch (err) {
        console.error(`Error: Unable to append user data to database\n${err}`);
        process.exit(1)
    }

    console.log(chalk.blueBright(
        `Success: ${potentialUsername} has been registered`
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

    const usernameIsValid = potentialUsername.match(
        /^[A-Za-z][A-Za-z0-9_]{2,29}$/
    )

    if (!usernameIsValid) {
        console.error(chalk.greenBright(
            `Error: Invalid username entered.\n` +
            INVALID_USERNAME +
            `Example: "node index -g marypoppins word_length"\n` +
            `Example: "node index -g marypoppins"\n`
        ))
        process.exit(1);
    }

    switch (passedArguments.length) {
        case 1: {
            // just a username passed
            readAllUserInfo(potentialUsername);
            break
        }
        case 2: {
            // username and specific attribute
            if (!VALID_SETTINGS.includes(passedArguments[1])) {
                console.error(chalk.greenBright(
                    `Error: Invalid user setting requested.\n` +
                    `Must include: ${VALID_SETTINGS.join(" || ")}\n` +
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
        allUserData = fs.readFileSync(USERFILE, 'utf-8')
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

    let wantsInstructions;
    let wantsRepeats;

    if (user.settings.allow_repeats) {
        wantsRepeats = "Yes";
    } else {
        wantsRepeats = "No";
    }

    if (user.settings.show_instructions) {
        wantsInstructions = "Yes";
    } else {
        wantsInstructions = "No";
    }

    console.log(chalk.blueBright(
        `Username: ${user.username}\n` +
        `Total Wins: ${user.wins}\tTotal Losses: ${user.losses}\n` +
        `Current Word Length: ${user.settings.word_length}\t Current Hints: ${user.settings.hints}\n` +
        `Wants Instructions Before Game: ${wantsInstructions}\t Allows Repeat Words: ${wantsRepeats}\n` +
        `Specific Word Length Statistics:\n` +
        `3: Wins=${user.win_loss_details[3].W} Loss=${user.win_loss_details[3].L}  || 4: Wins=${user.win_loss_details[4].W} Loss=${user.win_loss_details[4].L}\n` +
        `5: Wins=${user.win_loss_details[5].W} Loss=${user.win_loss_details[5].L}  || 6: Wins=${user.win_loss_details[6].W} Loss=${user.win_loss_details[6].L}\n` +
        `7: Wins=${user.win_loss_details[7].W} Loss=${user.win_loss_details[7].L}  || 8: Wins=${user.win_loss_details[8].W} Loss=${user.win_loss_details[8].L}\n` +
        `9: Wins=${user.win_loss_details[9].W} Loss=${user.win_loss_details[9].L}  || 10: Wins=${user.win_loss_details[10].W} Loss=${user.win_loss_details[10].L}\n` +
        `11: Wins=${user.win_loss_details[11].W} Loss=${user.win_loss_details[11].L} || 12: Wins=${user.win_loss_details[12].W} Loss=${user.win_loss_details[12].L}\n` +
        `13: Wins=${user.win_loss_details[13].W} Loss=${user.win_loss_details[13].L} || 14: Wins=${user.win_loss_details[14].W} Loss=${user.win_loss_details[14].L}\n` +
        `15: Wins=${user.win_loss_details[15].W} Loss=${user.win_loss_details[15].L}\n\n` +
        `Words played:\n` +
        `${user.words_played.join(" || ")}`
    ))

    process.exit(0)
}

function readSpecificUserInfo(username, setting) {
    let allUserData;
    try {
        allUserData = fs.readFileSync(USERFILE, 'utf-8')
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
            `Must include: ${VALID_SETTINGS.join(" || ")}\n`
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

    if (!VALID_SETTINGS.includes(settingToChange)) {
        console.error(chalk.greenBright(
            `Error: Invalid user setting requested.\n` +
            `Must include: ${VALID_SETTINGS.join(" || ")}\n` +
            `Example: "node index -m marypoppins word_length 3"\n`
        ))
    }

    let allUserData;
    try {
        allUserData = fs.readFileSync(USERFILE, 'utf-8')
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
    // ["word_length", "hints", "show_instructions", "allow_repeats"];
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
            if (!VALID_BOOLEANS.includes(changeSettingTo)) {
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
            if (!VALID_BOOLEANS.includes(changeSettingTo)) {
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
                `Must include: ${VALID_SETTINGS.join(" || ")}\n`
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
        userDataRaw = fs.readFileSync(USERFILE, 'utf8');
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
        fs.writeFileSync(USERFILE, JSON.stringify(userData));
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

    wordRequest.request.word_needed = true
    wordRequest.request.word_length = wordLengthRequested

    console.log(chalk.blueBright(`Requesting a ${wordLengthRequested} letter word...\n`))
    try {
        fs.writeFileSync(PIPE_TO_API, JSON.stringify(wordRequest));
    } catch (err) {
        console.error(`Error - game needs ${PIPE_TO_API} file`);
        process.exit(1);
    }

    while (waitingForWord) {
        try {
            await sleep(50);
            pipeData = fs.readFileSync(PIPE_TO_API, 'utf-8');
            wordRequest = JSON.parse(pipeData);

            if (wordRequest.response.word !== null && wordRequest.response.new_word) {
                wordToGuess = wordRequest.response.word;
                waitingForWord = false;
            }
        } catch (err) {
            console.error(`Error reading ${PIPE_TO_API} for word.\n${err}`);
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
