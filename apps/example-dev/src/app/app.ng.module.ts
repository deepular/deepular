import { NgModule } from '@angular/core';
import { AppService } from './app.service';
import { AppComponent } from './app.component';

@NgModule({
  providers: [AppService],
  imports: [AppComponent],
  exports: [],
})
export class AppNgModule {}
