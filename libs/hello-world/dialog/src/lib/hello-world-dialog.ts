const AP = window['AP'];
export function launchDialog(
  closeHandler = () => {
    /* no-op */
  }
) {
  AP.dialog
    .create({
      key: 'hello-world-dialog-module-key',
    })
    .on('close', closeHandler);
}

export function closeDialog() {
  AP.dialog.close({});
}
