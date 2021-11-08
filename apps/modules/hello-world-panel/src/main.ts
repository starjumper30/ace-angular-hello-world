import { launchDialog } from '@ace-hello-world/hello-world/dialog';

document.getElementById('launch').onclick = () => launchDialog();

const panelType = new URL(document.location.href).searchParams.get('panelType');

document.getElementById('panelFooter').innerText = `${panelType}`;
