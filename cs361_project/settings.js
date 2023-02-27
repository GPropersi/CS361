import chalk from "chalk";
import { saveUserData } from "./users.js";
import { CONSTANTS, SETTINGS_MENU, SETTINGS_OPTIONS } from "./constants.js";
import utils from "./utils.js";
import texts from "./title_text.js";
import prompts from "./inquirer_prompts.js"
import { titleBlock } from "./index.js";

export async function settingsMenu(user, gameData) {
    if (user.username !== CONSTANTS.GUEST) {
        await saveUserData(user);
    }
    const settingsAnswer = await prompts.settingsPrompt();

    await handleSettingsMenuSelection(settingsAnswer.settingsSelection, user, gameData);

}

async function returnToSettings(user) {
    await utils.showLoadingSpinner(`Returning to Settings...`, CONSTANTS.SETTINGS_DELAY);
    const settingsText = texts.updateSettingsText(user);

    if (user.username !== CONSTANTS.GUEST) {
        await saveUserData(user);
    }

    await titleBlock(settingsText, settingsMenu);

}

async function handleSettingsMenuSelection(selection, user, gameData) {
    switch (selection) {
        case SETTINGS_MENU.WORD_LENGTH: {
            await utils.showLoadingSpinner(`Getting Current Word Length`, CONSTANTS.SETTINGS_DELAY);
            await titleBlock(`Choose Your Word Length\nCurrent Word Length: ${user.settings.wordLength}`, editWordLength)
            break;
        }
        case SETTINGS_MENU.WORD_HINTS: {
            await utils.showLoadingSpinner('Getting Current Number of Word Hints', CONSTANTS.SETTINGS_DELAY);
            await titleBlock(`Choose Your Number of Hints\nCurrent Number of Hints: ${user.settings.hints}`, editWordHints)
            break;
        }
        case SETTINGS_MENU.SKIP_INSTRUCTIONS: {
            await utils.showLoadingSpinner('Getting Current Selection for Skipping Instructions...', CONSTANTS.SETTINGS_DELAY);
            await titleBlock('Want to Skip the Instructions?', editSkipInstructions)
            break;
        }
        case SETTINGS_MENU.REPEAT_WORDS: {
            await utils.showLoadingSpinner('Getting Current Selection for Repeating Words...', CONSTANTS.SETTINGS_DELAY);
            await titleBlock('Want to Allow Words to Repeat?', editRepeatWords)
            break;
        }
        case SETTINGS_MENU.DEFAULT_SETTINGS: {
            await titleBlock('Are you Sure You Want to Reset your Settings to Default?', resetToDefaultSettings)
            break;
        }
        case SETTINGS_MENU.SAVE_AND_RETURN: {
            gameData.isSetting = false;
            await utils.showLoadingSpinner('Saving Settings...', CONSTANTS.SETTINGS_DELAY);
            if (user.username !== CONSTANTS.GUEST) {
                await saveUserData(user);
            }
            break;
        }
    }
}

async function editWordLength(user) {
    const currentWordLength = user.settings.wordLength;
    const newChoices = generateWordLengthChoices();

    const wordLengthAnswer = await prompts.wordLengthPrompt(currentWordLength, newChoices);

    if (wordLengthAnswer.wordLengthSelection !== "Return to Settings Menu") {
        user.settings.wordLength = wordLengthAnswer.wordLengthSelection;
        if (user.settings.hints >= user.settings.wordLength - 1) {
            user.settings.hints = user.settings.wordLength - 2
        }
    }
    await returnToSettings(user);
}

function generateWordLengthChoices() {
    let wordLengthChoices = [];

    for (let i = CONSTANTS.MIN_WORD_LENGTH; i <= CONSTANTS.MAX_WORD_LENGTH; i++) {
        wordLengthChoices.push({
            name: `${i}`,
            short: `You want words ${i} characters long`
        })
    }

    wordLengthChoices.push({
        name: "Return to Settings Menu",
        short: "Nevermind about this!"
    })

    return wordLengthChoices
}

async function editWordHints(user) {
    const currentWordHints = user.settings.hints;
    let newChoices = generateWordHintOptions(user.settings.wordLength);

    const wordHintsAnswer = await prompts.wordHintsPrompt(currentWordHints, newChoices);

    if (wordHintsAnswer.wordHintsSelection !== "Return to Settings Menu") {
        user.settings.hints = wordHintsAnswer.wordHintsSelection
    }

    await returnToSettings(user);
}

function generateWordHintOptions(currentWordLength) {
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
    return newChoices
}

async function editSkipInstructions(user) {
    let defaultOption = SETTINGS_OPTIONS.YES;
    if (user.settings.showInstructions) {
        defaultOption = SETTINGS_OPTIONS.NO;
    }

    const newChoices = generateSkipInstructionsChoices();
    const skipInstructionsAnswer = await prompts.skipInstructionsPrompt(defaultOption, newChoices);

    if (skipInstructionsAnswer.skipInstructionsSelection === SETTINGS_OPTIONS.YES) {
        user.settings.showInstructions = false
    } else if (skipInstructionsAnswer.skipInstructionsSelection === SETTINGS_OPTIONS.NO) {
        user.settings.showInstructions = true
    }

    await returnToSettings(user);
}

function generateSkipInstructionsChoices() {
    const returnToMenuOption = {
        name: SETTINGS_OPTIONS.RETURN_TO_MENU,
        short: `Nevermind about this!`
    }
    const skipInstructionsOption = {
        name: SETTINGS_OPTIONS.YES,
        short: `No More Instructions For You!`
    }
    const doNotSkipInstructionsOption = {
        name: SETTINGS_OPTIONS.NO,
        short: `All of the Instructions!`
    }

   return [skipInstructionsOption, doNotSkipInstructionsOption, returnToMenuOption];
}

async function editRepeatWords(user) {
    let defaultOption = SETTINGS_OPTIONS.NO;;
    if (user.settings.allowRepeats) {
        defaultOption = SETTINGS_OPTIONS.YES
    }

    const newChoices = generateRepeatWordsChoices();
    const editRepeatsAnswer = await prompts.repeatWordsPrompt(defaultOption, newChoices);

    if (editRepeatsAnswer.editRepeatsSelection === SETTINGS_OPTIONS.YES) {
        user.settings.allowRepeats = true
    } else if (editRepeatsAnswer.editRepeatsSelection === SETTINGS_OPTIONS.NO) {
        user.settings.allowRepeats = false
    }

    await returnToSettings(user);
}

function generateRepeatWordsChoices() {
    const returnToMenuOption = {
        name: SETTINGS_OPTIONS.RETURN_TO_MENU,
        short: `Nevermind about this!`
    }
    const allowRepeatsOption = {
        name: SETTINGS_OPTIONS.YES,
        short: `Deja Vu?!`
    }
    const doNotAllowRepeatsOption = {
        name: SETTINGS_OPTIONS.NO,
        short: `Let's Get Fresh Words in Here!`
    }

    return [allowRepeatsOption, doNotAllowRepeatsOption, returnToMenuOption];
}

function cliModifyWordLength(user, newWordLength) {
    if (user.settings.wordLength === newWordLength) {
        console.log(chalk.blueBright(
            `Word Length: ${user.settings.wordLength}\n` +
            `No change performed since identical to current.\n`
        ))
        process.exit(0);
    } else {
        const previousUserData = user.settings.wordLength;
        user.settings.wordLength = newWordLength
        console.log(chalk.blueBright(
            `Old Word Length: ${previousUserData}\n` +
            `New Word Length: ${newWordLength}\n`
        ))
    }

    return user;
}

function cliModifyWordHints(user, newNumHints) {
    if (user.settings.hints === newNumHints) {
        console.log(chalk.blueBright(
            `Hints: ${user.settings.hints}\n` +
            `No change performed since identical to current.\n`
        ))
        process.exit(0);
    } else {
        const previousUserData = user.settings.hints;
        user.settings.hints = newHints
        console.log(chalk.blueBright(
            `Old Hints: ${previousUserData}\n` +
            `New Hints: ${newNumHints}\n`
        ))
    }

    return user;
}

function cliModifyShowInstructions(user, showInstructions) {
    if (showInstructions === "true") {
        console.log(chalk.blueBright(
            `Will now show instructions before every game.\n`
        ))
        user.settings.showInstructions = true;
    } else {
        console.log(chalk.blueBright(
            `Will now skip the instructions before every game.\n`
        ))
        user.settings.showInstructions = false;
    }

    return user;
}

function cliModifyAllowRepeats(user, allowRepeats) {
    if (allowRepeats === "true") {
        console.log(chalk.blueBright(
            `Repeat words are now allowed.\n`
        ))
        user.settings.allowRepeats = true;
    } else {
        console.log(chalk.blueBright(
            `Words will no longer be repeated.\n`
        ))
        user.settings.allowRepeats = false;
    }

    return user;
}

export default {
    cliModifyWordLength,
    cliModifyWordHints,
    cliModifyShowInstructions,
    cliModifyAllowRepeats,
}
