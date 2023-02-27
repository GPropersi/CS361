import { createSpinner } from "nanospinner";
import figlet from "figlet";
import chalk from "chalk";
import center_align from "center-align";
import gradient from "gradient-string";

export const sleep = (ms = 1500) => new Promise((r) => setTimeout(r, ms));

export async function showLoadingSpinner(updateText, ms = 1500, success = true, error_message = '', error_ms = 500) {
    const spinner = createSpinner(updateText).start()
    await sleep(ms);
    
    if (success) {
        spinner.success();
        await sleep(error_ms)
    } else {
        spinner.error({text: error_message, mark: `:(`})
        await sleep(1000);
    }
}


export default {
    sleep,
    showLoadingSpinner,
}
