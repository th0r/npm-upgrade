import inquirer from 'inquirer';

export default async function askUser(question) {
  const {answer} = await inquirer.prompt([{...question, name: 'answer'}]);
  return answer;
}
