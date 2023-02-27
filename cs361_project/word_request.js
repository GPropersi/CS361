import fs from 'fs';
import { CONSTANTS, startingWordRequest } from "./constants.js";
import { showLoadingSpinner } from './utils.js';
import { HELP_TEXT } from "./text_constants.js";
import { helpBlock } from './index.js';

async function requestWordOfDefinedLength(user, gameData) {
    let wordRequest = prepareToWriteToPipeForDefinedWordRequest(user);
    let waitingForWord = true;
    while (waitingForWord) {

        await requestDefinedLengthWordFromPipe(wordRequest);
        await showLoadingSpinner(`Requesting a ${user.settings.wordLength} letter word...`, 1500)

        try {
            let wordToGuess = await readAndVerifyDefinedLengthWordFromPipe();

            if (user.settings.allowRepeats || !user.wordsPlayed.includes(wordToGuess)) {
                waitingForWord = false;
                await foundDefinedLengthWordToPlay(user, gameData, wordToGuess)

            } else {
                await showLoadingSpinner(
                    `${wordToGuess} has already been played, trying again...`, 
                    500, 
                    true
                    );
            }            
        } catch (err) {
            await showLoadingSpinner(`Error`, 1500, false, err);
            console.error(`Error reading ${CONSTANTS.PIPE_TO_API} for word`);
            process.exit(1);
        }
    }
}

function prepareToWriteToPipeForDefinedWordRequest(user) {
    let wordRequest = startingWordRequest;
    wordRequest.request.wordNeeded = true;
    wordRequest.request.wordLength = user.settings.wordLength;
    wordRequest.response.word = null;
    wordRequest.response.newWord = false;
    return wordRequest;
}

async function requestDefinedLengthWordFromPipe(wordRequest) {
    try {
        await fs.promises.writeFile(CONSTANTS.PIPE_TO_API, JSON.stringify(wordRequest));
    } catch (err) {
        console.error(`Error - game needs ${CONSTANTS.PIPE_TO_API} file`);
        process.exit(1);
    }
}

async function readAndVerifyDefinedLengthWordFromPipe() {
    let pipeData = await fs.promises.readFile(CONSTANTS.PIPE_TO_API);
    let wordRequest = JSON.parse(pipeData);

    if (wordRequest.response.word === null || !wordRequest.response.newWord) {
        console.error(`Unable to process new word.`);
        process.exit(1);
    }

    return wordRequest.response.word;
}

async function foundDefinedLengthWordToPlay(user, gameData, newWord) {
    assignGameDataWithNewWord(newWord, gameData, user);
    gameData.isRandomGame = false;

    await showLoadingSpinner(`Word found! Get Ready..`, 1000, true);

    if (user.settings.showInstructions) {
        await helpBlock(HELP_TEXT);
    }
}

async function requestWordofRandomLength(user, gameData) {
    let waitingForWord = true;

    while (waitingForWord) {
        await requestRandomLengthWordFromPipe();
        await showLoadingSpinner(`Requesting a R-A-N-D-O-M letter word...`, 1500)

        try {
            const newWord = await readAndVerifyRandomWordFromPipe();

            if (!user.settings.allowRepeats && user.wordsPlayed.includes(newWord)) {
                await showLoadingSpinner(
                    `${newWord} has already been played, trying again...`, 
                    500, 
                    true);
            } else {
                waitingForWord = false;
                await foundRandomWordToPlay(user, gameData, newWord);
            }

        } catch (err) {
            await showLoadingSpinner(`Error`, 1500, false, err);
            console.error(`Error reading ${CONSTANTS.PARTNER_MICROSERVICE} for word`);
            process.exit(1);
        }
    }
}

async function requestRandomLengthWordFromPipe() {
    try {
        await fs.promises.writeFile(CONSTANTS.PARTNER_MICROSERVICE, "run");
    } catch (err) {
        console.error(`Error - game needs ${CONSTANTS.PARTNER_MICROSERVICE} file`);
        process.exit(1);
    }
}

async function readAndVerifyRandomWordFromPipe() {
    let pipeData = await fs.promises.readFile(CONSTANTS.PARTNER_MICROSERVICE, 'utf-8');
    let newWord = pipeData.replace(/[^\w\s]/gi, '');
    newWord = newWord.replace((/  |\r\n|\n|\r/gm),"");
    return newWord;
}

async function foundRandomWordToPlay(user, gameData, newWord) {
    assignGameDataWithNewWord(newWord, gameData, user, true);
    gameData.isRandomGame = true;
    await showLoadingSpinner(`Word found! Get Ready..`, 1000, true);

    if (user.settings.showInstructions) {
        await helpBlock(HELP_TEXT);
    }
}

function assignGameDataWithNewWord(newWord, gameData, user, isRandom = false) {
    gameData.correctWord = newWord;
    gameData.wordArray = newWord.split("");
    gameData.hintsLeft = user.settings.hints;
    gameData.guesses = newWord.length + 2;
    gameData.lettersGuessed = [];
    gameData.correctLetters = [];
    for (let i = 0; i < newWord.length; i++) {
        gameData.correctLetters.push("_")
    }  

    if (isRandom) {
        gameData.hintsLeft = newWord.length - 2
    }
}

export default {
    requestWordOfDefinedLength,
    requestWordofRandomLength
}