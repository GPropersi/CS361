import inquirer from "inquirer";
import figlet from "figlet";
import chalk from "chalk";
import chalkAnimation from "chalk-animation";
import gradient from "gradient-string";
import align_text from "align-text";

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

async function welcome() {
    figlet.text(`Guess The Word! !\n`,{
        verticalLayout: 'full',
        horizontalLayout: 'full',
    }, 
    (err, data) => {
        console.log(gradient.pastel.multiline(data));
        console.log(
            chalk.green(
                align_text(
                    `Word Guessing Game - Made By Giovanni Propersi`, 
                    33
                )
            )
        )
        
        const answers = inquirer.prompt({
            name: 'question_1',
            type: 'list',
            message: 'JavaScript was created in 10 days then released on\n',
            choices: [
            'May 23rd, 1995',
            'Nov 24th, 1995',
            'Dec 4th, 1995',
            'Dec 17, 1996',
            ],
        });

        return handleAnswer(answers.question_1 === 'Dec 4th, 1995')
        //process.exit(0);
      });

      //await question1();
  };



console.clear();
await welcome();