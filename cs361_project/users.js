import fs from 'fs';
import { showLoadingSpinner } from './utils.js';
import { CONSTANTS, newUserOrGuest } from "./constants.js";


export function updateUserRecords(user) {
    let wantsRepeats = "No";
    if (user.settings.allowRepeats) {
        wantsRepeats = "Yes";
    }

    let wantsInstructions = "No";
    if (user.settings.showInstructions) {
        wantsInstructions = "Yes";
    }

    let userRecords = `Username: ${user.username}\n` +
        `Total Wins: ${user.wins}\tTotal Losses: ${user.losses}\n` +
        `Current Word Length: ${user.settings.wordLength}\t Current Hints: ${user.settings.hints}\n` +
        `Wants Instructions Before Game: ${wantsInstructions}\t Allows Repeat Words: ${wantsRepeats}\n` +
        `Specific Word Length Game Statistics:\n\n` 

    userRecords = generateWinLossRecords(user, userRecords)
    return userRecords;
}

function generateWinLossRecords(user, userRecords) {
    for (let i = CONSTANTS.MIN_WORD_LENGTH; i <= CONSTANTS.MAX_WORD_LENGTH; i++) {
        userRecords += ` ${i}: Wins=${user.winLossDetails[i].W} `
        userRecords += `Loss=${user.winLossDetails[i].L} `

        if (i % 2 == 0){
            userRecords += `\n`
        } else if (i != CONSTANTS.MAX_WORD_LENGTH ) {
            userRecords += ` ||`
        }
    }
    userRecords += `\n${user.wordsPlayed.join(" || ")}`
    return userRecords;
}

export function resetSettingsToDefaultSettings(user) {
    user.settings.allowRepeats = true;
    user.settings.wordLength = 5;
    user.settings.hints = 2;
    user.settings.allowRepeats = true;
}

export async function saveUserData(user){
    // Read in the users file
    let userData = await readInUserDatabase();

    // Find user in JSON file data
    for (let i = 0; i < userData.length; i++) {
        if (userData[i].username === user.username) {
            userData[i] = user;
            break;
        }
    }

    await writeToUserDatabase(userData);
}

export async function readInUserDatabase() {
    let userDataRaw;

    try {
        userDataRaw = await fs.promises.readFile(CONSTANTS.USERFILE, 'utf8');
    } catch (err) {
        console.error("Error - unable to read the user file");
        process.exit(1);
    }

    return JSON.parse(userDataRaw);
}

export async function findIfUsernameExists(usernameToCheck) {
    const userData = await readInUserDatabase();
    for (let i = 0; i < userData.length; i++) {
        if (userData[i].username === usernameToCheck) {
            return true;
        }
    }
    return false;
}

export async function writeToUserDatabase(userData) {
    try {
        await fs.promises.writeFile(CONSTANTS.USERFILE, JSON.stringify(userData));
    } catch (err) {
        console.error("Unable to append user data to database");
        process.exit(1)
    }
}

export async function getUserOrCreateUser(usernameToCheck) {
    await showLoadingSpinner(`Getting User Ready...`, 500);
    let user = newUserOrGuest;

    let originalUserData = await readInUserDatabase();
    // Find user in JSON file data, if exists set proper data
    for (let i = 0; i < originalUserData.length; i++) {
        if (originalUserData[i].username === usernameToCheck) {
            user = originalUserData[i];
            return user;
        }
    }
        
    // Create user if not found
    user.username = usernameToCheck
    originalUserData.push(user);

    await writeToUserDatabase(originalUserData);

    return user;
}

export async function getSpecificUserData(usernameToCheck) {
    let originalUserData = await readInUserDatabase();
    let user;

    // Find user in JSON file data, if exists set proper data
    for (let i = 0; i < originalUserData.length; i++) {
        if (originalUserData[i].username === usernameToCheck) {
            user = originalUserData[i];
            return user;
        }
    }
}

export async function addUserToDatabase(usernameToAdd) {
    let originalUserData = await readInUserDatabase();
    let user = newUserOrGuest;
    user.username = usernameToAdd;
    originalUserData.push(user);
    await writeToUserDatabase(originalUserData);
}

export default { 
    updateUserRecords, 
    resetSettingsToDefaultSettings, 
    saveUserData, 
    readInUserDatabase, 
    writeToUserDatabase,
    getUserOrCreateUser,
    findIfUsernameExists,
    addUserToDatabase,
    getSpecificUserData
};
