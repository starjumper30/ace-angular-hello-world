import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HelloWorldComponent } from './hello-world.component';


@NgModule({
  declarations: [
    HelloWorldComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([{path: '', component: HelloWorldComponent}])
  ]
})
export class HelloWorldModule { }
