import inquirer from 'inquirer';

export default async function askUser(question) {
    return await new Promise(resolve =>
        inquirer.prompt([{ ...question, name: 'answer' }], ({ answer }) => resolve(answer))
    );
}
