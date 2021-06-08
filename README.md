# AceHelloWorld
This is an Nx workspace containing one node app using Atlassian Connect Express (ACE) framework to serve one Angular app as a Jira Plugin.
This app is intended to be deployed to Azure App Services, using Linux and Node 14

## Run locally
You must run ngrok if you wish to install your locally running app in Jira.
In one terminal:
```
ngrok http 3000
```

You must copy the ngrok url that is created and update the localBaseUrl property for development env in apps/hello-world/src/config.json.

In another terminal build the webap and run the server:
```
npm run prebuild
npm start
```

In Jira, go to Manage Apps and upload using the ngrok url.

## Deploy to Azure
- Install the azure CLI on your system
- Turn on persistent file storage to allow storing stdout stderr in your own log files:
```
az webapp config appsettings set --resource-group <group-name> --name <app-name> --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=true
```
### Create an app in Azure App Services
- Login to the Azure web portal with your azure account.
- Under App Services, choose create. 
- Give your app a name and chose linux and node 14.

### Create an Azure Cosmos DB instance (Mongo)
- Login to the Azure web portal with your azure account. 
- Choose Azure Cosmos DB from Azure services and click create.
- Choose Azure Cosmos DB API for MongoDB.
- Choose the serverless option (for cheapest and non-global)
- Save and go to the main page for this new resource
- Create a new database under this cosmo account (you will configure database name as an environment variable below)  
- Copy the Primary Connection String for your new Mongo instance to be used in the command below.

### Update Azure environment config
```
az login
az webapp config appsettings set --name <app-name> --resource-group myResourceGroup --settings MONGODB_URI="mongodb://<cosmosdb-name>:<primary-master-key>@<cosmosdb-name>.documents.azure.com:10250/mean?ssl=true"
az webapp config appsettings set --name <app-name> --resource-group myResourceGroup --settings DATABASE_NAME=<yourdatabase-name>
az webapp config appsettings set --name <app-name> --resource-group myResourceGroup --settings LOCAL_BASE_URL=<app-url>
```


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
