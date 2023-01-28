import axios from 'axios';
import { createSpinner } from "nanospinner";
import fs from 'fs';

// const sleep = (ms = 1500) => new Promise((r) => setTimeout(r, ms));
const PIPE_TO_API = "./listener_for_random_word.json";
const spinner = createSpinner("Waiting for Request")

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

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

async function sitAndListen() {
    let randomWordSuccess;
    while (true) {
        spinner.start();
        await sleep(300);
        await checkFile();

        if (wordRequest.request.word_needed) {
            spinner.update({text: `Request received for a ${wordRequest.request.word_length} letter word!`});
            await sleep(300);
            await sleep(300);
            spinner.update({text: `Request received for a ${wordRequest.request.word_length} letter word!`});
            randomWordSuccess = await getRandomWord();

            if (randomWordSuccess) {
                spinner.update({text: `"${wordRequest.response.word}" is the new Random Word! `})
                await updatePipeFile();
                await sleep(3000);
                console.clear();
                spinner.update({text: `Waiting for Request`})
            }
        }
    }
}

async function checkFile() {
    let wordRequestRaw;
    try {
        wordRequestRaw = await fs.promises.readFile(PIPE_TO_API);
        wordRequest = JSON.parse(wordRequestRaw);
    } catch (err) {
        console.error(`Error - microservice needs ${file} file`);
        process.exit(1);
    }
}

async function updatePipeFile(newWord) {
    wordRequest.request.word_length = 0;
    wordRequest.request.word_needed = false;
    wordRequest.response.new_word = true;

    try {
        await fs.promises.writeFile(PIPE_TO_API, JSON.stringify(wordRequest));
    } catch (err) {
        spinner.error({text: `Error - microservice needs ${file} file.\nError: ${err}`, mark: ':('})
        process.exit(1);
    }
}

async function getRandomWord() {
    // https://random-word-api.herokuapp.com/word?length=5&lang=en&number=10
    try {
        const randomWordResponse = await axios.get('https://random-word-api.herokuapp.com/word', {
            params: {
                length: wordRequest.request.word_length
            }
        })
        wordRequest.response.word = randomWordResponse.data[0]
        return true;
    } catch (err) {
        spinner.error({text: err, mark: ':('})
        return false;
    }
}


async function showLoadingSpinner(updateText) {
    await sleep();
    spinner.success();
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
