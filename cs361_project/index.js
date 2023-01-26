import inquirer from "inquirer";
import figlet from "figlet";
import chalk from "chalk";
import chalkAnimation from "chalk-animation";
import gradient from "gradient-string";
import align_text from "align-text";
import center_align from "center-align";
import fs from "fs";
import { createSpinner } from "nanospinner";

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

const GUEST = 'WordGuesser3000';
const USERFILE = "./db_files/users.json";
const DB_FOLDER = "./db_files";
const PIPE_TO_API = "./listener_for_random_word.json";
const ui = new inquirer.ui.BottomBar();
let current_username;

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
    }
}

function titleBlockMain() {
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
    return toDoNext();
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
        'Exit',
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
    await getUserOrCreateUser()
}

async function getUserOrCreateUser() {
    await showLoadingSpinner("Getting User Ready");

    // Read in the users file
    fs.readFile(USERFILE, 'utf8', (err, data) => {
        if (err) {
            console.error("Error - unable to read the user file");
            process.exit(1);
        }
        let userData = JSON.parse(data);
        
        // Find user in JSON file
        for (const existing_user of userData) {
            if (existing_user.username === current_username) {
                user = userData;
                return;
            }
        }

        // Create user if not found
        user.username = current_username
        userData.push(user)
        fs.writeFile(USERFILE, JSON.stringify(userData), (err) => {
            if (err) {
                console.error("Unable to append user data to database");
                process.exit(1)
            }
        })
        return;
    })
}

async function showLoadingSpinner(updateText) {
    const spinner = createSpinner(updateText).start()
    await sleep();
    spinner.success();
}

async function showBottomBar(barText) {
    ui.updateBottomBar(barText);
}
const mainMenuLines = '\n\n\n\n\n\n\n\n\n\n\n';

async function mainMenuGuest() {
    const answers = await inquirer.prompt({
        name: 'main_menu_option',
        type: 'list',
        prefix: mainMenuLines,
        message: 'Select an Option Below Using the Return Key:',
        choices: [
        'Guess A Word!',
        'Settings',
        'Exit'
        ],
    });

    if (answers.main_menu_option === 'Exit') {
        console.clear();
        process.exit(0);
    }

    console.log(answers)
}

async function mainMenu() {
    const answers = await inquirer.prompt({
        name: 'main_menu_option',
        type: 'list',
        prefix: mainMenuLines,
        message: 'Select an Option Below Using the Return Key:',
        choices: [
        'Guess A Word!',
        'Settings',
        'Records',
        'Save and Exit'
        ],
    });

    if (answers.main_menu_option === 'Save and Exit') {
        console.clear();
        process.exit(0);
    }

    console.log(answers)
}

async function makeFilesIfDoNotExist() {
    // Make db folder if it doesn't exist
    fs.access(DB_FOLDER, fs.constants.F_OK, (err) => {
        if (err) {
            fs.mkdir(DB_FOLDER, (err) => {
                if (err) {
                    console.error("Error - database needs '/db_files' folder");
                    process.exit(1);
                }
            })
        };

    });

    const necessary_files = [USERFILE, PIPE_TO_API];
    let data_to_append;
    for (const file of necessary_files) {
        // Make user and pipe file if they do not exist
        fs.access(file, fs.constants.F_OK, (err) =>{
            if (err) {
                if (file === USERFILE) {
                    data_to_append = JSON.stringify([user]);
                } else {
                    data_to_append = JSON.stringify('{}')
                }
                fs.appendFile(file, data_to_append, (err) => {
                    if (err) {
                        console.error(`Error - game needs ${file} file`);
                        process.exit(1);
                    }
                });
            }
        });
    }

    return true
}

async function settings() {
    
}

await makeFilesIfDoNotExist();
await titleBlock('A Node.js CLI Word Guessing Game - Made By Giovanni Propersi', askIfGuest);

if (current_username === GUEST) {
    const bottomTitleText = `Playing As: ${current_username}\n` +
        `Note: Your Win/Loss Record and User Settings Will not be Saved\n` +
        `Wins: ${user.wins}    Losses: ${user.losses}    Current Word Length: ${user.settings.word_length}`
    await titleBlock(bottomTitleText, mainMenuGuest);
} else {
    const bottomTitleText = `Playing As: ${current_username}\n` +
        `Total Wins: ${user.wins}    Total Losses: ${user.losses}    Current Word Length: ${user.settings.word_length}`
    await titleBlock(bottomTitleText, mainMenu);
}
