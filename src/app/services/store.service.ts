import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StoreService {

  // https://dev.to/avatsaev/simple-state-management-in-angular-with-only-services-and-rxjs-41p8

  constructor(
    private http: HttpClient
  ) {
    this.getNanoInfo();
  }

  defaults: UserState = {
    loggedIn: false,
    adminKey: '',
    nanoPriceUsd: 0,
    nanoLogo: '',
    withdrawKeysSet: undefined,
    tradeKeysSet: undefined
  }

  private readonly _userState = new BehaviorSubject<UserState>(this.defaults);
  readonly userState$ = this._userState.asObservable();

  readonly loggedIn$ = this.userState$.pipe(pluck('loggedIn'));
  readonly adminKey$ = this.userState$.pipe(pluck('adminKey'));
  readonly nanoPriceUsd$ = this.userState$.pipe(pluck('nanoPriceUsd'));
  readonly nanoLogo$ = this.userState$.pipe(pluck('nanoLogo'));
  readonly withdrawKeysSet$ = this.userState$.pipe(pluck('withdrawKeysSet'));
  readonly tradeKeysSet$ = this.userState$.pipe(pluck('tradeKeysSet'));

  get userState() {
    return this._userState.getValue();
  }

  // assigning a value to this.state will push it onto the observable
  private set state(state: UserState) {
    this._userState.next(state);
  }

  patchUserState(user: Partial<UserState>) {
    this.state = {...this.userState, ...user};
  }

  getNanoInfo() {
    this.http.get('https://api.coingecko.com/api/v3/coins/nano').subscribe((info: any) => {
      this.state = {
        ...this.userState,
        nanoLogo: info.image.small,
        nanoPriceUsd: info.market_data.current_price.usd
      };
    });
  }

  getGeneralinfo() {
    return this.http.get('https://murmuring-gorge-42529.herokuapp.com/api/info').subscribe((info: any) => {
      this.state = {
        ...this.userState,
        withdrawKeysSet: info.withdrawApiSet ? 'yes' : 'no',
        tradeKeysSet: info.tradingApiSet ? 'yes' : 'no'
      }
    });
  }
}
export interface UserState {
  loggedIn: boolean,
  adminKey: string,
  nanoPriceUsd: number,
  nanoLogo: string,
  withdrawKeysSet: 'yes' | 'no',
  tradeKeysSet: 'yes' | 'no',
}