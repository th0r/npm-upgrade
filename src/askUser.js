import inquirer from 'inquirer'

export default async function askUser(questions) {
    return new Promise(resolve => inquirer.prompt(questions, resolve));
}