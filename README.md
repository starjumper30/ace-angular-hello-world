# Ace Angular Hello World

This is an Nx workspace containing one node app using Atlassian Connect Express (ACE) framework to serve one Angular app as a Jira Service Management Add-on.
This app is intended to be deployed to Azure App Services, using Linux and Node 14.

## Writing Service Desk Add-ons

List of extension points: https://developer.atlassian.com/cloud/jira/service-desk/customer-portal/

"Actions" are menu options that will launch your app in a dialog.
You have very little control over the size and location of this dialog (most of the documented options don't actually work).
To get around this, I have the action launch a tiny app (hello-world-entrypoint), whose sole function is then to launch another app (hello-world) inside
a dialog using the ACE dialog API directly.That gives you full control over the dialog, and is the only way I have found to take over the whole screen.

"Panels" are apps that are loaded inline on predefined locations within the portal. These are just apps running in inline iframes.
While they are not launched with dialogs themselves, they are free to launch their own dialogs using the ACE API.
hello-world-panel is an example of such a panel.

## Run server locally to be installed and run from Jira

- Create your own development instance of jira: https://www.atlassian.com/try/cloud/signup?product=confluence.ondemand,jira-software.ondemand,jira-servicedesk.ondemand,jira-core.ondemand&developer=true
- You must first enable Development Mode on your Jira site. Go to Apps -> Manage apps and then click the settings link at the bottom of the page.
- Create an API token for your atlassian account at https://id.atlassian.com/manage-profile/security/api-tokens
- Copy credentials.sample.json to credentials.json and update it with the URL to your jira instance, your username, and your api token
- Build the webapp and run the server:

```
npm run prebuild
nx serve
```

*Note: If you wish to install your local dev copy into a Jira instance that already has your deployed version installed,
you just need to do a find/replace in your local copy of atlassian-connect.json to modify the keys. In the image below,
I am simply prepending every key with "local-". This allows for testing multiple copies of the add-on in a shared Jira sandbox.
When we had multiple developers sharing a sandbox, we each prepended our first name onto the keys in our local config, and this worked well.

![replacing local keys](./docs/local-keys.png 'Replacing local keys')

## Deploy to Azure

- Install the azure CLI on your system and login

```
az login
```

- Turn on persistent file storage to allow storing stdout stderr in your own log files:

```
az webapp config appsettings set --resource-group <group-name> --name <app-name> ----subscription <subscription-name> --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=true
```

### Create an app in Azure App Services

- Login to the Azure web portal with your azure account.
- Under App Services, choose create.
- Give your app a name and chose linux and node 14.
- Finish creation
- On the main page for your new app, under TLS/SSL settings, limit to HTTPS and TLS 1.2

### Create an Azure Cosmos DB instance (Mongo)

- Login to the Azure web portal with your azure account.
- Choose Azure Cosmos DB from Azure services and click create.
- Choose Azure Cosmos DB API for MongoDB.
- Choose the serverless option (for cheapest and non-global)
- Save and go to the main page for this new resource
- Click Data Explorer to see databases and collections under this Mongo account (if firewall rules are turned on, you need to your own IP to the whitelist under "Firewall and virtual networks").
- Create a new database for each deployment slot under this cosmo account (you will configure database name as an environment variable below)
- Copy the Primary Connection String for your new Mongo instance to be used in the command below.

### Update Azure environment config

```
az webapp config appsettings set --name <app-name> --resource-group myResourceGroup --settings MONGODB_URI="mongodb://<cosmosdb-name>:<primary-master-key>@<cosmosdb-name>.documents.azure.com:10250/mean?ssl=true"
az webapp config appsettings set --name <app-name> --resource-group myResourceGroup --settings DATABASE_NAME=<yourdatabase-name>
az webapp config appsettings set --name <app-name> --resource-group myResourceGroup --settings LOCAL_BASE_URL=<app-url>
```

These values can be viewed/added in the azure portal by clicking on "Configuration" under "Settings" in the left nav when viewing the App Service.

### Deploying to Azure from Azure DevOps Pipeline

Assumptions:

- Code is in a repo within the ADO project to which you are adding a pipeline
- Trunk branch is named master
- A Service Principal has already been created for you by Azure admins and set as the FTP/deployment user

#### Create a Service Connection in ADO

- In your ADO project, click on Project Settings in the lower left
- Click on Service Connections under Pipelines in the left nav
- Click to add New Service Connection
- Choose connection type: Azure Resource Manager
- Choose Authentication Method: Service Principal (manual)
- Environment: Azure Cloud
- Scope Level: Subscription
- Enter Subscription ID and Name \*1
- Enter Service Principal Id and Service Principal Key \*2
- Enter Tenant ID \*3
- Enter deploy-connection as the Service Connection Name (this is referenced in the pipeline yaml file)
- Save

*1: In Azure portal, you can find the Subscription ID and Name at the bottom of the properties page for your App Service

*2:

- In Azure portal, you can find the name of the FTP/deployment user on the properties page for your App Service, copy this
- In Azure portal, open Azure Active Directory and search for the deployment user you copied
- Click on the matching result under "App registrations"
- The Application ID listed should be used as the Service Principal ID
- You can also grab the Tenant ID from this page
- In the left nav, click "Certificates & secrets"
- A user with the right permissions should be able to add a secret here, this will be used as the Service Principal Key

*3: In Azure portal home, search for Tenant Properties

#### Create a new Pipeline

- In your ADO project, click on Pipelines > Pipelines in the left nav
- Click to add a New Pipeline
- Where is your code: Choose "Azure Repos Git" and select your repo
- Configure your pipeline: Choose "Existing Azure Pipelines YAML file"
- Select azure-pipelines.yml from the master branch
- Once the file is open in the YAML editor, click the Variables button in the upper right corner
- Click to create a new variable
- Name: WebAppName
- Value: (the name of your App Service)
- Click OK to save the variable
- Click to create a new variable
- Name: ResourceGroup
- Value: (the name of your Resource Group)
- Click OK to save the variable
- In the upper right corner click the chevron next to the Run button to get a Save button

#### Swap to Production

The azure-pipelines.yml is configured to deploy to a staging slot. To promote to production:

- Login to Azure portal
- Open the App Service resource for production slot
- Click Configuration in the left nav and verify you have all the necessary environment variables set
- Click Deployment slots in the left nav
- Click Swap action at the top
- Perform swap from staging to production

### Deploying to Azure using BitBucket pipelines

#### Generate a service account for the deploy:

https://docs.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli#get-an-existing-service-principal

```
az ad sp create-for-rbac
```

The output of this command will give you all of the info that you need to enter into the bitBucket deployment variables. See the variable names in the .bitbucket-pipelines.yml file.

#### Add the deployment variables in bitbucket Pipelines UI

- AZURE_APP_NAME and AZURE_RESOURCE_GROUP can be not secure. These are names you assigned when creating the app service resource in Azure.
- AZURE_PASSWORD, AZURE_TENANT_ID, and AZURE_APP_ID should be added as secure variables. These values are obtained from the output of the generate service account command above.

### Deploying to Azure using Github Actions

In Azure portal for you App, go to deployment center and configure deployment from Github (defaults to using Github actions).
Let it generate and commit a new workflow file for you. This won't have the right build setup. Copy the project specific info from it into the deploy-to-azure.yml file in this repo and then delete the generated one. I believe the app name and publish profile are the only setting you need to modify.

### Accessing Kudu for app in Azure

The Kudu web interface allows you to access and inspect your running container instance (and access log files).

- https://<app-name>.scm.azurewebsites.net
- https://<app-name>.scm.azurewebsites.net/api/vfs/LogFiles/

### Rotating database keys in Azure

https://docs.microsoft.com/en-us/azure/cosmos-db/database-security?tabs=mongo-api#key-rotation

To change the key used by the webapp, each slot (staging, sandbox, production) has to have the MONGODB_URI property updated on the Configuration screen, and then be restarted.
