import { AddonRequest } from './endpoint.service';

const hosts: string[] = process.env.HOSTS
  ? JSON.parse(process.env.HOSTS)
  : ['https://od-ex.atlassian.net'];
console.debug(hosts);

export function isConfiguredHost(host: string) {
  return hosts.includes(host);
}

export function getHost(req: AddonRequest): string {
  return req.context.hostBaseUrl;
}

export function logHosts() {
  console.log('Known Hosts:', hosts);
}
