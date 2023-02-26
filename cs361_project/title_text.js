import { CONSTANTS } from "./constants.js";

function updateBottomTitleMainMenuText(user) {
    let bottomTitleTextMainMenu;
    if (user.username === CONSTANTS.GUEST) {
        bottomTitleTextMainMenu = `Playing As: ${user.username}\n` +
            `Note: Your Win/Loss Record and User Settings Will not be Saved\n` +
            `Wins: ${user.wins}    Losses: ${user.losses}    Current Word Length: ${user.settings.word_length}    Hints Available: ${user.settings.hints}`
    } else {
        bottomTitleTextMainMenu = `Playing As: ${user.username}\n` +
            `Total Wins: ${user.wins}    Total Losses: ${user.losses}    Current Word Length: ${user.settings.word_length}    Hints Available: ${user.settings.hints}`
    }
    return bottomTitleTextMainMenu;
}

function updateBottomTitleGameText(gameData) {
    let bottomTitleTextGame = `Type /help for help! Type /hint for a hint! Type /exit to return to main menu\n` +
        `Letters Guessed: ${gameData.letters_guessed.join(",")}\n` + 
        `Guesses Left: ${gameData.guesses}\n` +
        `Hints Left: ${gameData.hints_left}\n\n` +
        `YOUR WORD:\n${gameData.correct_letters.join(" ")}`

    return bottomTitleTextGame;
}

function updateSettingsText(user) {
    let instructionsBeforeGame = "No";
    if (user.settings.show_instructions) {
        instructionsBeforeGame = "Yes";
    }

    let allowRepeats = "No";
    if (user.settings.allow_repeats) {
        allowRepeats = "Yes";
    }

    let settingsText = `Current Settings:\n` +
    `Word Length: ${user.settings.word_length}\nHints: ${user.settings.hints}\n` +
    `Instructions Shown Before Game: ${instructionsBeforeGame}\n` +
    `Allow Repeat Words: ${allowRepeats}`

    return settingsText;
}

export default {updateBottomTitleGameText, updateBottomTitleMainMenuText, updateSettingsText}
