# AceHelloWorld


## Deploying to Azure using BitBucket pipelines
### Generate a service account for the deploy:
- install the azure CLI on your system
- Generate the service account (https://docs.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli#get-an-existing-service-principal). The output of this command will give you all of the info that you need to enter into the bitBucket deployment variables. See the variable names in the .bitbucket-pipelines.yml file.
```
az ad sp create-for-rbac
```
### Add the deployment variables in bitbucket Pipelines UI
- AZURE_APP_NAME and AZURE_RESOURCE_GROUP can be not secure. These are names you assigned when creating the app service resource in Azure.
- AZURE_PASSWORD, AZURE_TENANT_ID, and AZURE_APP_ID should be added as secure variables. These values are obtained from the output of the generate service account command above.


# Deploying to Azure using Github Actions


This project was generated using [Nx](https://nx.dev).

