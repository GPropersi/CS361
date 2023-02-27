import fs from 'fs';
import { CONSTANTS, newUserOrGuest, startingWordRequest } from "./constants.js";

async function makeFolderIfDoesNotExist() {
    // Make db folder if it doesn't exist
    try{
        await fs.promises.mkdir(CONSTANTS.DB_FOLDER);
    } catch (err) {
        if (err.code == 'EEXIST') {
            return
        }
        console.error(err)
        process.exit(1)
    }
}

async function prepareFilesForGame() {
    // Make user file if it doesn't exist
    const userFileExists = await checkIfFileExists(CONSTANTS.USERFILE);
    if (!userFileExists) {
        try {
            await fs.promises.writeFile(CONSTANTS.USERFILE, JSON.stringify([newUserOrGuest]));
        } catch (err) {
            console.error(`Error - game needs ${CONSTANTS.USERFILE} file`);
            process.exit(1);
        }
    }

    // The pipe file should be reset at the start of a game, regardless if it exists
    try {
        await fs.promises.writeFile(CONSTANTS.PIPE_TO_API, JSON.stringify(startingWordRequest));
    } catch (err) {
        console.error(`Error - game needs ${file} file`);
        process.exit(1);
    }
}

async function checkIfFileExists (path) {  
    try {
        await fs.promises.access(path);
        return true
    } catch {
        return false
    }
}

export async function prepareForGame() {
    await makeFolderIfDoesNotExist();
    await prepareFilesForGame();
}

