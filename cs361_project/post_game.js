import figlet from "figlet";
import chalk from "chalk";
import gradient from "gradient-string";
import center_align from "center-align";
import { CONSTANTS, STRINGS } from "./constants.js";
import users from "./users.js";
import prompts from "./inquirer_prompts.js"
import requestWords from "./word_request.js"
import { mainMenuChoice } from "./index.js";


function winningScreenTitle() {
    console.clear()
    console.log(gradient.rainbow.multiline(figlet.textSync(`You Won!\n\n\n`, {
        verticalLayout: 'full',
        horizontalLayout: 'full',
        width: 200,
    })));
}

export async function winningScreen(user, gameData) {
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
    await afterGameScreenMenu(user, gameData);
}

function losingScreenTitle() {
    console.clear()
    console.log(gradient.passion.multiline(figlet.textSync(`You Lost :(\n\n\n`, {
        verticalLayout: 'full',
        horizontalLayout: 'full',
        width: 200,
    })));
}

export async function losingScreen(user, gameData) {
    console.clear();
    losingScreenTitle();
    console.log(chalk.green(
        center_align(
            `\n\nYou'll Get it Next Time!\n\n` +
            `The word was: "${gameData.correctWord}"\n\n`,
            110
        )
    ));
    await afterGameScreenMenu(user, gameData);
}

async function afterGameScreenMenu(user, gameData) {
    const answers = await prompts.afterGameMenuPrompt(user);

    if (user.username !== CONSTANTS.GUEST) {
        await users.saveUserData(user);
    }

    switch (answers.afterGameMenuOption) {
        case STRINGS.PLAY_AGAIN: {
            gameData.isPlaying = true;
            if (gameData.isRandomGame) {
                await requestWords.requestWordofRandomLength(user, gameData);
            } else {
                await requestWords.requestWordOfDefinedLength(user, gameData);
            }
            break;
        }
        case STRINGS.MAIN_MENU: {
            gameData.isPlaying = false;
            // mainMenuChoice(user, gameData);
            break;
        }
        case STRINGS.SAVE_AND_EXIT: {
            gameData.isPlaying = false;
            await utils.showLoadingSpinner('Saving User Data', 500);
            console.clear();
            process.exit(0);
            break;
        }
    }
}

export default {
    losingScreen,
    winningScreen
}
