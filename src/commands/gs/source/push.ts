import {core, flags, SfdxCommand} from '@salesforce/command';
import {AnyJson} from '@salesforce/ts-types';
import shellJS =  require('shelljs');
import fs =  require('fs-extra');
import emoji = require('node-emoji');
const path = require('path');


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
    description: 'validate only the push'}),
    dependenciesfile: flags.string({char: 'p', required: false,
    description: 'path to the sfdx-project.json file'}),
    includedependencies: flags.boolean({char: 'i', required: false,
    description: 'deploy dependent modules as well if any'})
  };

  //This static variable makes the org username required for the command
  protected static requiresUsername = true;

  public async run(): Promise<AnyJson> {

    if(this.flags.modulepath && this.flags.directorypath ||
        this.flags.modulepath && this.flags.filepath ||
        this.flags.directorypath && this.flags.filepath) {
      throw new core.SfdxError(
        'Only one of the parameters out of modulepath, directoryPath and filepath is allowed'
      );
    }

    if(!this.flags.modulepath && !this.flags.directorypath && !this.flags.filepath ) {
      throw new core.SfdxError(
        'One of the parameters out of modulepath, directorypath and filepath must be provided'
      );
    }

    if(this.flags.includedependencies && !this.flags.dependenciesfile) {
      throw new core.SfdxError(
        'Please provide the path to the sfdx-project.json file against the dependenciesfile(p) parameter'
      );
    }

    this.ux.log(emoji.emojify(`:rocket:  Working on it................................... :rocket:`));

    fs.ensureDirSync('tempSFDXProject/tempModule/main/default');
    if(this.flags.modulepath) {
      if(this.flags.includedependencies) {
        //Reading the sfdx-project.json file based on the location provided as param
        const packageObj = await fs.readJSON(`${this.flags.dependenciesfile}`);
        let srcPath = path.dirname(`${this.flags.modulepath}`);
        //Looping through and copying all the modules in single directory(sfdx format app aka module)
        for (const element of packageObj.packageDirectories) {
          console.log(`Copying from ${srcPath}/${element.path}/main/default to tempSFDXProject/tempModule/main/default`);
          fs.copySync(`${srcPath}/${element.path}/main/default`, `tempSFDXProject/tempModule/main/default`);
          if(`${srcPath}/${element.path}` === this.flags.modulepath) {
            break;
          }
        }
      }
      else {
        fs.copySync(`${this.flags.modulepath}/main/default`, 'tempSFDXProject/tempModule/main/default');
      }

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
      shellJS.exec(`rm -rf tempSFDXProject`);
    });

    // Return an object to be displayed with --json
    return { };
  }
}
