import chalk from "chalk";
import center_align from "center-align";
import {titleBlockMain} from "./index.js";
import post_game from "./post_game.js"
import prompts from "./inquirer_prompts.js";
import users from "./users.js";
import { CONSTANTS, INGAME_COMMANDS } from "./constants.js";
import { HELP_TEXT } from "./text_constants.js";
import utils from "./utils.js";

export async function helpBlock(underTitleText) {
    console.clear();
    titleBlockMain();
    console.log(chalk.cyanBright(
        center_align(
            `${underTitleText}\n`, 
            110
        )
    ));
    
    const _ = await prompts.anyKeyToContinuePrompt();
}

export async function runGame(user, gameData) {
    const guessingGame = await prompts.runGamePrompt(gameData);

    const lettGuess = guessingGame.gameGuess[0].toLowerCase();
    const letterInWord = gameData.wordArray.includes(lettGuess);
    
    if (lettGuess === '/') { 
        let command = guessingGame.gameGuess.split("/")[1].toLowerCase();
        await handleInGameCommand(command, gameData, user);
    } else if (letterInWord) {

        handleGuessedLetter(lettGuess, gameData);
        for (let i = 0; i < gameData.wordArray.length; i++) {
            if (gameData.wordArray[i] === lettGuess) {
                gameData.correctLetters[i] = lettGuess
            }
        }
        
        if (checkIfWordGuessed(gameData)){
            await handleIfWordGuessed(user, gameData);
        } else {
            await utils.showLoadingSpinner(`Correctly guessed a letter`, 800)
        }
    } else if (!letterInWord) {
        handleGuessedLetter(lettGuess, gameData)
        await utils.showLoadingSpinner(`Incorrect letter`, 800)
    }

    if (gameData.guesses === -1) {
        // Game over
        await handleIfWordNotGuessed(user, gameData);
    }
}

function handleGuessedLetter(guessedLetter, gameData) {
    gameData.guesses -= 1
    gameData.lettersGuessed.push(guessedLetter);
    gameData.lettersGuessed.sort();    
}

function checkIfWordGuessed(gameData) {
    for (let i = 0; i < gameData.wordArray.length; i++) {
        if (gameData.wordArray[i] !== gameData.correctLetters[i]){
            return false;
        }
    }
    return true;
}

async function handleInGameCommand(command, gameData, user) {
    switch (command) {
        case INGAME_COMMANDS.HELP: {
            await helpBlock(HELP_TEXT);
            break;
        }
        case INGAME_COMMANDS.HINT: {
            // Hint goes here;
            if (gameData.hintsLeft === 0) {
                await utils.showLoadingSpinner(`Checking for hints...`, 500, false, `No more hints left...`, 1500);
            } else {
                gameData.hintsLeft -= 1
                giveHint(gameData);

                if (checkIfWordGuessed(gameData)){
                    await handleIfWordGuessed(user, gameData);
                }
            }
            break;
        }
        case INGAME_COMMANDS.EXIT: {
            // Returns user to main menu
            gameData.isPlaying = false;
            break;
        }
        default: {
            await utils.showLoadingSpinner(`Invalid command... use "/help" for help,` +
                        `"/hint" for a hint, "/exit" to return to main menu`, 
                        2000, 
                        false, 
                        `Invalid command... use "/help" for help or "/hint" for a hint`
                        );
            break;
        }
    }   
}

function giveHint(gameData) {
    let randomNum = -1;
    do {
        randomNum = getRandomInt(gameData.correctWord.length); 
    } while (gameData.correctLetters[randomNum] !== '_');

    let charAtRandomNum = gameData.wordArray[randomNum];
    for (let i = 0; i < gameData.correctWord.length; i++) {
        if (gameData.wordArray[i] === charAtRandomNum) {
            gameData.correctLetters[i] = charAtRandomNum
        }
    }

    gameData.lettersGuessed.push(charAtRandomNum);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

async function handleIfWordGuessed(user, gameData) {
    await utils.showLoadingSpinner(`Correctly guessed the word!`, 1500)
    user.wins += 1
    user.winLossDetails[gameData.correctWord.length].W += 1
    user.wordsPlayed.push(gameData.wordArray.join(""))
    if (user.username !== CONSTANTS.GUEST) {
        await users.saveUserData(user);
    }
    await post_game.winningScreen(user, gameData);    
}

async function handleIfWordNotGuessed(user, gameData) {
    await utils.showLoadingSpinner(`Game over :(`, 1000)
    user.losses += 1
    user.winLossDetails[gameData.correctWord.length].L += 1
    user.wordsPlayed.push(gameData.wordArray.join(""))
    if (user.username !== CONSTANTS.GUEST) {
        await users.saveUserData(user);
    }
    await post_game.losingScreen(user, gameData);
}

