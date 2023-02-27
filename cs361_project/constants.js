export const CONSTANTS = {
   GUEST: 'WordGuesser3000',
   USERFILE: "./db_files/users.json",
   DB_FOLDER: "./db_files",
   PIPE_TO_API: "./listener_for_random_word.json",
   PARTNER_MICROSERVICE: "./service.txt",
   MIN_WORD_LENGTH: 3,
   MAX_WORD_LENGTH: 9,
   MAIN_MENU_LINES: '\n',
   SETTINGS_DELAY: 30,   
}

export const STRINGS = {
    PLAY_AGAIN: 'Play Again?',
    MAIN_MENU: 'Main Menu',
    SAVE_AND_EXIT: 'Save and Exit',
    SETTINGS: 'Settings',
    EXIT: 'Exit',
    GUESS_WORD: 'Guess A Word!',
    GUESS_RANDOM_WORD: 'Guess A Random Length Word!',
    RECORDS: 'Records',
    PLAY_AS_GUEST: 'Play as Guest -- Jump Right In!',
}

export const SETTINGS_STRINGS = {
    WORD_LENGTH: "word_length",
    HINTS: "hints",
    SHOW_INSTRUCTIONS: "show_instructions",
    ALLOW_REPEATS: "allow_repeats"
}

export const SETTINGS_MENU = {
    WORD_LENGTH: "Word Length",
    WORD_HINTS: "Word Hints",
    SKIP_INSTRUCTIONS: "Skip Instructions on New Game",
    REPEAT_WORDS: "Okay to Repeat Words",
    DEFAULT_SETTINGS: "Set Settings to Default",
    SAVE_AND_RETURN: "Save and Return to Menu"
}

export const INGAME_COMMANDS = {
    HELP: "help",
    HINT: "hint",
    EXIT: "exit"
}

export const SETTINGS_OPTIONS = {
    RETURN_TO_MENU: "Return to Menu",
    YES: "Yes",
    NO: "No"
}

export const ARG_DEFINITIONS = {
    MAIN_ARGUMENTS: 'mainArguments',
    FOLLOW_ON_ARGUMENTS: 'followOnArguments'
}

export const CLI_CONSTANTS = {
    VALID_COMMANDS: ["r", "register", "g", "get", "m", "w", "W", "game", "h", "help"],
    VALID_USER_SETTINGS: [
        SETTINGS_STRINGS.WORD_LENGTH, 
        SETTINGS_STRINGS.HINTS, 
        SETTINGS_STRINGS.SHOW_INSTRUCTIONS, 
        SETTINGS_STRINGS.ALLOW_REPEATS
    ],
    VALID_BOOLEANS: ["true", "false"],
}

export let newUserOrGuest = {
    username: CONSTANTS.GUEST,
    wins: 0,
    losses: 0,
    settings: {
        wordLength: 5,
        hints: 2,
        showInstructions: true,
        allowRepeats: true,
    },
    winLossDetails: {
        3: {W: 0, L: 0},
        4: {W: 0, L: 0},
        5: {W: 0, L: 0},
        6: {W: 0, L: 0},
        7: {W: 0, L: 0},
        8: {W: 0, L: 0},
        9: {W: 0, L: 0},
    },
    wordsPlayed: [],
}

export let newGameData = {
    lettersGuessed: [],
    hintsLeft: -1,
    wordArray: [],
    correctLetters: [],
    guesses: -1,
    correctWord: null,
    isRandomGame: false,
    isPlaying: false,
    isSetting: false,
    menuSelection: null
}

export let startingWordRequest = {
    request: {
        wordNeeded: false,
        wordLength: 0
    },
    response: {
        word: null,
        newWord: false
    }
}
