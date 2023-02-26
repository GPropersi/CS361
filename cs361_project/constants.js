export const CONSTANTS = {
   GUEST: 'WordGuesser3000',
   USERFILE: "./db_files/users.json",
   DB_FOLDER: "./db_files",
   PIPE_TO_API: "./listener_for_random_word.json",
   PARTNER_MICROSERVICE: "./service.txt",
   MIN_WORD_LENGTH: 3,
   MAX_WORD_LENGTH: 15,
   MAIN_MENU_LINES: '\n',
   SETTINGS_DELAY: 30,  
}

export const CLI_CONSTANTS = {
    VALID_COMMANDS: ["r", "register", "g", "get", "m", "w", "W", "game", "h", "help"],
    VALID_SETTINGS: ["word_length", "hints", "show_instructions", "allow_repeats"],
    VALID_BOOLEANS: ["true", "false"],
}

export let newUserOrGuest = {
    username: CONSTANTS.GUEST,
    wins: 0,
    losses: 0,
    settings: {
        word_length: 5,
        hints: 2,
        show_instructions: true,
        allow_repeats: true,
    },
    win_loss_details: {
        3: {W: 0, L: 0},
        4: {W: 0, L: 0},
        5: {W: 0, L: 0},
        6: {W: 0, L: 0},
        7: {W: 0, L: 0},
        8: {W: 0, L: 0},
        9: {W: 0, L: 0},
        10: {W: 0, L: 0},
        11: {W: 0, L: 0},
        12: {W: 0, L: 0},
        13: {W: 0, L: 0},
        14: {W: 0, L: 0},
        15: {W: 0, L: 0},
    },
    words_played: [],
}

export let newGameData = {
    letters_guessed: [],
    hints_left: -1,
    word_array: [],
    correct_letters: [],
    guesses: -1,
    correctWord: null,
    isRandomGame: false,
    isPlaying: false,
    isSetting: false,
    menuSelection: null
}
