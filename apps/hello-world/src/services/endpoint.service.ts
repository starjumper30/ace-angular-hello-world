import { Request } from 'express';
import { HostClient } from 'atlassian-connect-express';

// account id of an admin user
const adminUser = process.env.JIRA_ADMIN_USER;

export interface AddonRequest extends Request {
  context: {
    http: HostClient; // wraps this API https://github.com/request/request#readme
    title: string;
    addonKey: string;
    clientKey: string;
    token: string;
    license: string;
    localBaseUrl: string;
    hostBaseUrl: string;
    hostUrl: string;
    hostStylesheetUrl: string;
    hostScriptUrl: string;
    userAccountId: string;
    context: { jira: { project: any } };
  };
}

function getHttpClient(req: AddonRequest, runAsAdminUser: boolean) {
  let http = req.context.http;
  if (runAsAdminUser) {
    http = http.asUserByAccountId(adminUser);
  }
  return http;
}

export async function hostGet<T>(
  options: {
    uri: string;
    qs?: { [key: string]: string | number | boolean };
    headers?: { [key: string]: string };
  },
  req: AddonRequest,
  runAsAdminUser = false
): Promise<T> {
  return new Promise((resolve, reject) => {
    getHttpClient(req, runAsAdminUser).get(
      options,
      httpCallback(resolve, reject)
    );
  });
}

export async function hostPut<T>(
  options: {
    uri: string;
    qs?: { [key: string]: string | number | boolean };
    headers?: { [key: string]: string };
    body?: any;
  },
  req: AddonRequest,
  runAsAdminUser = false
): Promise<T> {
  return new Promise((resolve, reject) => {
    getHttpClient(req, runAsAdminUser).put(
      options,
      httpCallback(resolve, reject)
    );
  });
}

function httpCallback(resolve, reject) {
  return (error, response, body) => {
    if (error) {
      reject(error);
    } else if (response.statusCode >= 300) {
      reject(body);
    } else {
      const data = JSON.parse(body);
      resolve(data);
    }
  };
}
export async function hostPost<T>(
  options: {
    uri: string;
    qs?: { [key: string]: string | number | boolean };
    headers?: { [key: string]: string };
    body?: any;
  },
  req: AddonRequest,
  runAsAdminUser = false
): Promise<T> {
  return new Promise((resolve, reject) => {
    getHttpClient(req, runAsAdminUser).post(
      options,
      httpCallback(resolve, reject)
    );
  });
}
