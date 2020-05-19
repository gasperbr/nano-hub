import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterEvent, Event, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RebuyService } from './services/rebuy.service';
import { StoreService } from './services/store.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  @ViewChild('topTag', {static: false}) topTag: ElementRef;
  
  tabIndex = 0;
  nanoPriceUsd$ = this.storeService.nanoPriceUsd$;

  constructor(
    private storeService: StoreService,
    public router: Router
  ) {
    storeService.getGeneralinfo();
    
    router.events.pipe(
      filter((e: Event): e is RouterEvent => e instanceof NavigationEnd)
      ).subscribe((e: RouterEvent) => {
        console.log(e);
        // this.topTag && console.log(this.topTag.nativeElement);
        // this.topTag && this.topTag.nativeElement.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }


}
