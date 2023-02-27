import { CONSTANTS } from "./constants.js";

function updateBottomTitleMainMenuText(user) {
    let bottomTitleTextMainMenu;
    if (user.username === CONSTANTS.GUEST) {
        bottomTitleTextMainMenu = `Playing As: ${user.username}\n` +
            `Note: Your Win/Loss Record and User Settings Will not be Saved\n` +
            `Wins: ${user.wins}    Losses: ${user.losses}    Current Word Length: ${user.settings.wordLength}    Hints Available: ${user.settings.hints}`
    } else {
        bottomTitleTextMainMenu = `Playing As: ${user.username}\n` +
            `Total Wins: ${user.wins}    Total Losses: ${user.losses}    Current Word Length: ${user.settings.wordLength}    Hints Available: ${user.settings.hints}`
    }
    return bottomTitleTextMainMenu;
}

function updateBottomTitleGameText(gameData) {
    let bottomTitleTextGame = `Type /help for help! Type /hint for a hint! Type /exit to return to main menu\n` +
        `Letters Guessed: ${gameData.lettersGuessed.join(",")}\n` + 
        `Guesses Left: ${gameData.guesses}\n` +
        `Hints Left: ${gameData.hintsLeft}\n\n` +
        `YOUR WORD:\n${gameData.correctLetters.join(" ")}`

    return bottomTitleTextGame;
}

function updateSettingsText(user) {
    let instructionsBeforeGame = "No";
    if (user.settings.showInstructions) {
        instructionsBeforeGame = "Yes";
    }

    let allowRepeats = "No";
    if (user.settings.allowRepeats) {
        allowRepeats = "Yes";
    }

    let settingsText = `Current Settings:\n` +
    `Word Length: ${user.settings.wordLength}\nHints: ${user.settings.hints}\n` +
    `Instructions Shown Before Game: ${instructionsBeforeGame}\n` +
    `Allow Repeat Words: ${allowRepeats}`

    return settingsText;
}

export default {
    updateBottomTitleGameText, 
    updateBottomTitleMainMenuText, 
    updateSettingsText
};
