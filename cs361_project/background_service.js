import axios from 'axios';
import { createSpinner } from "nanospinner";
import fs from 'fs';

// const sleep = (ms = 1500) => new Promise((r) => setTimeout(r, ms));
const PIPE_TO_API = "./listener_for_random_word.json";
const spinner = createSpinner("Waiting for Request\n")

let wordRequest = {
    request: {
        wordNeeded: false,
        wordLength: 0
    },
    response: {
        word: null,
        newWord: false
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

async function sitAndListen() {
    let randomWordSuccess;
    spinner.start();
    while (true) {
        await sleep(50);
        await checkFile();

        if (wordRequest.request.wordNeeded) {
            spinner.update({text: `Request received for a ${wordRequest.request.wordLength} letter word!`});
            await sleep(300);
            randomWordSuccess = await getRandomWord();

            if (randomWordSuccess) {
                spinner.update({text: `"${wordRequest.response.word}" is the new Random Word! `})
                await updatePipeFile();
                await sleep(3000);
                spinner.update({text: `Waiting for Request\n`})
            }
        }
    }
}

async function checkFile() {
    let wordRequestRaw;
    try {
        wordRequestRaw = await fs.promises.readFile(PIPE_TO_API, 'utf-8');
        wordRequest = JSON.parse(wordRequestRaw);
    } catch (err) {
        console.error(`Error - microservice needs ${PIPE_TO_API} file.\n${err}`);
        process.exit(1);
    }
}

async function updatePipeFile(newWord) {
    wordRequest.request.wordLength = 0;
    wordRequest.request.wordNeeded = false;
    wordRequest.response.newWord = true;

    try {
        await fs.promises.writeFile(PIPE_TO_API, JSON.stringify(wordRequest));
    } catch (err) {
        spinner.error({text: `Error - microservice needs ${file} file.\nError: ${err}`, mark: ':('})
        process.exit(1);
    }
}

async function getRandomWord() {
    // https://random-word-api.vercel.app/api?words=1&length=3
    try {
        const randomWordResponse = await axios.get('https://random-word-api.vercel.app/api', {
            params: {
                words: 1,
                length: wordRequest.request.wordLength
            }
        })
        wordRequest.response.word = randomWordResponse.data[0];
        return true;
    } catch (err) {
        spinner.error({text: err, mark: ':('})
        return false;
    }
}


async function makePipeFile() {
    try {
        await fs.promises.writeFile(PIPE_TO_API, JSON.stringify(wordRequest));
    } catch (err) {
        console.error(`Error - microservice needs ${file} file`);
        process.exit(1);
    }
}

await makePipeFile();
await sitAndListen();
