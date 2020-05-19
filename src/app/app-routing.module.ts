import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BotsComponent } from './components/bots/bots.component';
import { ConfigComponent } from './components/config/config.component';
import { RebuyComponent } from './components/rebuy/rebuy.component';


const routes: Routes = [
  {
    path: 'my-bots',
    component: BotsComponent
  },
  {
    path: 'config',
    component: ConfigComponent
  },
  {
    path: 're-buy',
    component: RebuyComponent
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: 're-buy'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
