import {core, flags, SfdxCommand} from '@salesforce/command';
import {AnyJson} from '@salesforce/ts-types';
import shellJS = require('shelljs');
import fs = require('fs-extra');
import emoji = require('node-emoji');

// Initialize Messages with the current plugin directory
core.Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
//const messages = core.Messages.loadMessages('sfdx-selective-retrieve-deploy', 'push');

export default class Push extends SfdxCommand {
  //This static variable sets the command description for help
  public static description = 'Deploys a module in source-format from a sepcified location'//messages.getMessage('pushCommandDescription');

  public static examples = [
    `sfdx gs:source:push --modulePath app
    // deploys app module to the target org`
  ];

  //This static variale sets the flags/params for the commands along with
  //their description for the help
  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    modulepath: flags.string({char: 'm', required: true, description: 'Name of the component/s to retrieve'}),
  };

  //This static variable makes the org username required for the command
  protected static requiresUsername = true;

  public async run(): Promise<AnyJson> {
    this.ux.log(emoji.emojify(`:rocket:  Working on it................................... :rocket:`));

    fs.ensureDirSync('tempSFDXProject/tempModule/main/default');
    fs.copySync(`${this.flags.modulepath}/main/default`, 'tempSFDXProject/tempModule/main/default')

    //change the working directory to a temporary SFDX project
    shellJS.cd('tempSFDXProject');

    //Create and write the sfdx-project.json to tempSFDXProject
    //to give it the sfdx nature so that sfdx force:source:convert
    //can work
    fs.writeJson('sfdx-project.json', {
      packageDirectories: [{
        path: "tempModule",
        default: true}],
      namespace: "",
      sfdcLoginUrl: "https://login.salesforce.com",
      sourceApiVersion: await this.org.retrieveMaxApiVersion()}, err => {
      if (err) return console.error(err)
      this.ux.log(emoji.emojify(`:arrow_forward: Deployment started.......`));
      fs.ensureDirSync('md-tempModule');
      //Convert the source
      shellJS.exec('sfdx force:source:convert -d md-tempModule');
      //Deploy
      shellJS.exec(`sfdx force:mdapi:deploy --deploydir md-tempModule --targetusername ${this.org.getUsername()} --wait 20`);
      //Switch to the parent direcroty
      shellJS.cd('..');
      //Print the current working directory
      shellJS.exec('pwd');
      //Delete the temporary SFDX project
      shellJS.exec(`rm -rf tempSFDXProject`);
    });

    // Return an object to be displayed with --json
    return { };
  }
}
