import inquirer from 'inquirer';

export default async function askUser(questions) {
    return await new Promise(resolve => inquirer.prompt(questions, resolve));
}