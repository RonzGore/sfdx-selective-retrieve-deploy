import {core, flags, SfdxCommand} from '@salesforce/command';
import {AnyJson} from '@salesforce/ts-types';
import shellJS =  require('shelljs');
import fs =  require('fs-extra');
import emoji = require('node-emoji');
const path = require('path');
//import path = require('path-parse');


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
    //deploys app module to the target org to the default org

    sfdx gs:source:push -filepath app/main/default/permissionsets/MyPermissionSet -u MyTargerOrg
    //deploys the MyPermissionSet to an org with alias MyTargetOrg

    sfdx gs:source:push -directorypath myFolder/PermissionSets -c -u MyTargetOrg
    //validates the deployment of all the permission sets from the directory myFolder/PermissionSets on MyTargetOrg`
  ];

  //This static variale sets the flags/params for the commands along with
  //their description for the help
  protected static flagsConfig = {
    // flag with a value (-m, --modulepath=force-app)
    modulepath: flags.string({char: 'm', required: false,
    description: 'path of the sfdx aka source format module to be pushed from a multi-module sfdx project'}),
    directorypath: flags.string({char: 'd', required: false,
    description: 'path of the directory to be pushed'}),
    filepath: flags.string({char: 'f', required: false,
    description: 'path of the file to be pushed'}),
    validate: flags.boolean({char: 'c', required: false,
    description: 'validate only the push'})
  };

  //This static variable makes the org username required for the command
  protected static requiresUsername = true;

  public async run(): Promise<AnyJson> {
    console.log(this.flags.modulepath);
    console.log(this.flags.directorypath);
    console.log(this.flags.filepath);

    if(this.flags.modulepath && this.flags.directorypath ||
        this.flags.modulepath && this.flags.filepath ||
        this.flags.directorypath && this.flags.filepath) {
      this.ux.log('Only one of the parameters out of modulepath, directoryPath and filepath is allowed');
      process.exit(1);
    }

    this.ux.log(emoji.emojify(`:rocket:  Working on it................................... :rocket:`));

    fs.ensureDirSync('tempSFDXProject/tempModule/main/default');
    if(this.flags.modulepath) {
      fs.copySync(`${this.flags.modulepath}/main/default`, 'tempSFDXProject/tempModule/main/default');
    }
    else if(this.flags.directorypath) {
      fs.copySync(`${this.flags.directorypath}`, 'tempSFDXProject/tempModule/main/default');
    }
    else{
      fs.copySync(`${this.flags.filepath}`, 'tempSFDXProject/tempModule/main/default/'
      +path.basename(`${this.flags.filepath}`));
    }

    const validateOnly = this.flags.validate?'-c':'';


    //Change the working directory to a temporary SFDX project
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
      shellJS.exec(`sfdx force:mdapi:deploy --deploydir md-tempModule ${validateOnly} --targetusername ${this.org.getUsername()} --wait 20`);
      //Switch to the parent direcroty
      shellJS.cd('..');
      //Print the current working directory
      shellJS.exec('pwd');
      //Delete the temporary SFDX project
      //shellJS.exec(`rm -rf tempSFDXProject`);
    });

    // Return an object to be displayed with --json
    return { };
  }
}
