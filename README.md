@rohanatgwcs/sfdx-selective-retrieve-deploy
===========================================

SFDX plugin to selectively retrieve metadata of a particular type from a scratch org to a specified directory and to deploy a particular module in source format to a scratch org.

[![Version](https://img.shields.io/npm/v/@rohanatgwcs/sfdx-selective-retrieve-deploy.svg)](https://npmjs.org/package/@rohanatgwcs/sfdx-selective-retrieve-deploy)
[![Downloads/week](https://img.shields.io/npm/dw/@rohanatgwcs/sfdx-selective-retrieve-deploy.svg)](https://npmjs.org/package/@rohanatgwcs/sfdx-selective-retrieve-deploy)
[![License](https://img.shields.io/npm/l/@rohanatgwcs/sfdx-selective-retrieve-deploy.svg)](https://github.com/rohanatgwcs/sfdx-selective-retrieve-deploy/blob/master/package.json)


## How to install
```
$ sfdx plugins:install @rohanatgwcs/sfdx-selective-retrieve-deploy

```

### `sfdx gs:source:pull`

Retrieves specific metadata/s to a sepcified location

```
USAGE
  $ sfdx gs:source:pull

OPTIONS
  -d, --targetdir=targetdir                       (required) Path of target directory where the component needs to be
                                                  pulled

  -i, --includedir                                If you want to retrieve the directory as well along with the metadata
                                                  components

  -n, --names=names                               (required) Name of the component/s to retrieve

  -t, --type=type                                 (required) Type of the components to retrieve, only support one
                                                  component at a time

  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org

  --apiversion=apiversion                         override the api version used for api requests made by this command

  --json                                          format output as json

  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLES
  sfdx gs:source:pull --type ApexClass --names MyClass1,MyClass2 --targetdir app/main/default/classes
       // retrieves MyClass1 and MyClass2 from an org (sratch/non-scratch) to the provided directory location
    
  sfdx gs:source:pull --type Layout --names Layout1 --targetdir app/main/default --includedir
       // retrieves Layout1 along with the layouts folder from an org (sratch/non-scratch) to the provided directory 
  location

METADATA TYPES THAT CAN BE PASSED AS AN ARGUMENT AGAINST THE NAME PARAMETER
  'AccountCriteriaBasedSharingRule', 'AccountOwnerSharingRule', 'AnalyticSnapshot', 'ApexClass',
  'ApexComponent', 'ApexPage', 'ApexTrigger', 'ApprovalProcess', 'AppMenu', 'AssignmentRules',
  'AuraDefinitionBundle', 'AuthProvider', 'AutoResponseRules', 'Certificate', 'CleanDataService',
  'Community', 'CompactLayout', 'CustomApplication', 'CustomApplicationComponent', 'CustomField',
  'CustomLabels', 'CustomObject', 'CustomMetadata', 'CustomObjectTranslation', 'CustomPageWebLink',
  'CustomPermission', 'CustomSite', 'CustomTab', 'DelegateGroup', 'DuplicateRule', 'EscalationRules',
  'ExternalDataSource', 'FlexiPage', 'Flow', 'FlowDefinition', 'GlobalValueSet',
  'GlobalValueSetTranslation', 'Group', 'HomePageComponent', 'HomePageLayout', 'Layout', 'Letterhead', 'ListView', 'ManagedTopics', 'MatchingRule', 'MatchingRules', 'Network',
  'PathAssistant', 'PermissionSet', 'Profile', 'Queue', 'QuickAction', 'RecordType', 'RemoteSiteSetting', 'ReportType', 'Role', 'SharingRules', 'SharingCriteriaRule',
  'SharingOwnerRule', 'SharingTerritoryRule', 'SiteDotCom', 'StandardValueSet',
  'StandardValueSetTranslation', 'StaticResource', 'Territory', 'Translations', 'ValidationRule',
  'WebLink', 'Workflow', 'WorkflowAlert', 'WorkflowFieldUpdate', 'WorkflowRule', 'Settings',
  'WaveApplication', 'WaveDashboard', 'WaveDataflow', 'WaveLens', 'WaveTemplateBundle', 'Wavexmd',
  'WaveDataset'`

```

_See code: [src/commands/gs/source/pull.ts](https://github.com/rohanatgwcs/sfdx-selective-retrieve-deploy/blob/v1.0.1/src/commands/gs/source/pull.ts)_

### `sfdx gs:source:push`

Deploys a module in source-format from a sepcified location

```
USAGE
  $ sfdx gs:source:push

OPTIONS
  -m, --modulepath=modulepath                     (required) Name of the component/s to retrieve
  -u, --targetusername=targetusername             username or alias for the target org; overrides default target org
  --apiversion=apiversion                         override the api version used for api requests made by this command
  --json                                          format output as json
  --loglevel=(trace|debug|info|warn|error|fatal)  logging level for this command invocation

EXAMPLE
  sfdx gs:source:push --modulePath app
       // deploys app module to the target org

```

_See code: [src/commands/gs/source/push.ts](https://github.com/rohanatgwcs/sfdx-selective-retrieve-deploy/blob/v1.0.1/src/commands/gs/source/push.ts)_

##Motivation behind this plugin:
``` 
1. sfdx gs:source:pull
Selectively pull a specific type of metadata to a directory of your choice. The sfdx force:source:pull command does not give you flexibility regarding what you want to pull and where. 
Use cases:
a. You are working in a multi-module sfdx project and pull a specific metadata to your module/folder of choice without messing around with the sfdx-project.json and .forceignore files.
b. You created/changed some Components in the scratch org, but do not want to pull all of them into your local sfdx project.
c. You changed the name of a field, and this field is being referenced in a layout and a record type. There is no way sfdx force:source:pull retrieves layout and record type for you. This plugin comes in handy then.
d. Pull the changed community binary file after every change in the community, sfdx force: source:pull does not seems to support it.

Known Limitations: Currently the plugin does not retrieve objects and its related metadata like fields, record types, validation rules, assignment rules, and escalation rules instead it spits it out in the mdapi format. 
I am planning to release this in the next version. 
Also currently the target directory is a mandatory parameter, support for a default directory based on sfdx-package.json would be helpful. I will wait for feedback before starting to work on this.

2. sfdx gs:source:push
Push the module of your choice to the scratch org. Unlike sfdx force:sorce:pull, this command does not rely on the changes you made to be pushed to the repo, instead explicitly tries to deploy the folder/module to your scratch org. 
Use Cases: 
a. sfdx force:source:push can bring your org into indeed an inconsistent state due to its default and non-controllable way of selectively deploying components. This command comes in handy in such situations to bring your org to the right state.
b. If you are working on a multi-module approach and do not want to deploy all the modules to the org and at the same time also do not wish to play around with sfdx-project.json and .forceignore file, this command can be at your rescue.

Note: Both these commands work equally well with sandboxes and even prod orgs as long as you have authenticated the target org with SFDX CLI. So if you are using them in non-scratch orgs, use them with utmost care as they are powerful and can alter/override the things in any target environment.

```
