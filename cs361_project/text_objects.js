export const HELP_TEXT = `\n\n` + 
    `Welcome to.... Guess The Word!!\n\n` + 
    `The objective of the game is to guess a word by inputting letters, one at a time.\n` +
    `The number of guesses you get is the number of letters in the word, plus 2.\n\n` + 
    `At anytime during the game, if you need a hint, type "/hint", and a random` + 
    ` correct letter will be given to you!\n` +
    `Hints do not count towards your guesses!\n` + 
    `If there are multiple instances of that same letter, all will be given to you!\n\n` +
    `You can set how long of a word you want to guess, and how many hints you receive\n` + 
    ` from the "Settings" screen on the Main Menu!\n\n` +
    `Note that the max number of hints you can have is the length of the word, minus 2.\n\n` +
    `During the game, type in a single letter and press the return key to guess the letter.\n` + 
    `An error will pop up if you guess anything but a letter, ` +
    `or a letter that was already guessed.\n\n` +
    `Type "/help" to bring up this help menu again!\n` + 
    `Type "/exit" to return to the main menu.`

export const TEXTS = {
    GUEST_TEXT: '\n\n\n#############################################################################' + 
                '\n## Registering or Logging in will save your Wins/Losses and User Settings. ##\n' +
                '## Guests will not have their Wins/Losses and User Settings saved.         ##\n' +
                '#############################################################################\n',

    CLI_HELP_TEXT: `Possible arguments include:\n` +
            `-r or --register\t\tRegister a username if it is not already registered\n` +      // Add username
            `\tA username can be entered following the previous command, and will be added if it doesn't exist\n` + 
            `\tExample: "> node index -r marypoppins" or "> node index --register marypoppins"\n\n` +
            `-g or --get     \t\tGet a username's game info\n` +      // Get user data
            `\tA username can be entered following the previous command to get all user data\n` +
            `\tExample: "> node index -g marypoppins" or "> node index --get marypoppins"\n` +
            `\tOtherwise, the following commands can be appended to provide more specificity regarding the user's data\n` +
            `\tNote that this only returns the current setting\n\n` +
            `\tword_length      \tNote that word length can range from 3 to 15 characters\n` +
            `\thints            \tNote that the max number of hints is word_length - 2\n` +
            `\tshow_instructions\tWhether to show the instructions before a game\n` +
            `\tallow_repeats    \tWhether the same word can be played again\n\n` +
            `-m                 \t\tModify a username's settings. \n\tFollow this flag by the username, and then the setting to edit.\n` +      // Modify user data
            `\tExample: "node index -m marypoppins word_length 8" or "node index -m marypoppins allow_repeats true"\n\n` +
            `\tword_length      \tNote that word length can range from 3 to 15 characters. Pass an integer.\n` +
            `\thints            \tNote that the max number of hints is word_length - 2. Pass an integer.\n` +
            `\tshow_instructions\tWhether to show the instructions before a game. Modified by "true" or "false"\n` +
            `\tallow_repeats    \tWhether the same word can be played again. Modified by "true" or "false"\n\n` +
            `-w or -W           \t\tGet a random word. Can be followed by an integer for a specific length\n` +      // Modify user settings
            `\tDefault word length is 5. Note that word length can be anywhere from 3 to 15 characters\n\n` +      // Get a random word
            `-game              \tExplains the game!\n` +      // Command explaining the game
            `-h or --help: Provides this help menu`,

    CLI_GAME_HELP: `Welcome to.... Guess The Word!!\n\n` + 
            `You can move around in the menus using your arrow keys, typing when necessary!\n` +
            `If you want to keep track of your wins/losses and user settings, set up a username. No password needed!\n` +
            `Otherwise, feel free to play as a guest just to mess around and guess for fun!\n` +
            `You can alter most settings via the "Settings" menu in game - note that these won't be saved if you're a guest.\n` +
            `The length of words you can guess are from 3 letters, to 15 letters long!\n` + 
            `You are allowed to set your number of hints given to you during the game, up to a max number of hints of\n\tword length minus 2!\n` +
            `The objective of the game is to guess a word by inputting letters, one at a time.\n` +
            `The number of guesses you get is the number of letters in the word, plus 2.\n\n` + 
            `At anytime during the game, if you need a hint, type "/hint", and a random correct letter will be given to you!\n` + 
            `Hints do not count towards your guesses!\n` + 
            `If there are multiple instances of that same letter, all will be given to you!\n\n` +
            `During the game, type in a single letter and press the return key to guess the letter.\n` + 
            `An error will pop up if you guess anything but a letter, or a letter that was already guessed.\n\n` +
            `The program also has a Command Line Interface - try passing "-h" or "-help" as an argument to get more info!\n` +
            `Type "/help" during the game to bring up the game instructions.\n` +
            `Type "/exit" during the game to return to the main menu.\n` +
            `Have fun guessing!\n`
}