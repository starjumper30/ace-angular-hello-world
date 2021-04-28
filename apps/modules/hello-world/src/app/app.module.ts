import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(
      [
        {
          path: '',
          pathMatch: 'full',
          redirectTo: 'hello',
        },
        {
          path: 'hello',
          loadChildren: () =>
            import('./hello-world/hello-world.module').then(
              (m) => m.HelloWorldModule
            ),
        },
      ],
      { initialNavigation: 'enabled' }
    ),
  ],
  providers: [{ provide: APP_BASE_HREF, useValue: environment.baseHref }],
  bootstrap: [AppComponent],
})
export class AppModule {}
