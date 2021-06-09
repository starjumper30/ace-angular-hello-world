import { Component } from '@angular/core';
import { closeDialog } from '@ace-hello-world/hello-world/dialog';

@Component({
  selector: 'ace-hello-world-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  readonly isDialog: boolean;

  constructor() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    this.isDialog = urlParams.get('dialog') === 'true';
  }

  close() {
    closeDialog();
  }
}
