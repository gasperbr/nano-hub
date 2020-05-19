import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as CryptoJS from 'crypto-js';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RebuyService {

  constructor(
    private http: HttpClient
  ) { }

  /* executeStrategy() {
    return this.http.get(`https://murmuring-gorge-42529.herokuapp.com/api/execute?adminKey=${CryptoJS.SHA1('oskar123').toString()}`);
  } */

  getSetup() {
    return this.http.get('https://murmuring-gorge-42529.herokuapp.com/api/rebuy');
  }

  getAccountBalance(address) {
    return this.http.get(`https://murmuring-gorge-42529.herokuapp.com/api/nano-balance/${address}`).pipe(map((info: any) => {
    return {
      balance: parseInt(info.account.balance) / (10 ** 30),
      pending: parseInt(info.account.pending) / (10 ** 30)
    }}));
  }

  addSetup(setup: Setup, key) {
    const hash = CryptoJS.SHA1(key).toString();
    return this.http.post(`https://murmuring-gorge-42529.herokuapp.com/api/rebuy?adminKey=${hash}`, setup);
  }
  
  updateSetup(setup: Setup, key) {
    const hash = CryptoJS.SHA1(key).toString();
    return this.http.put(`https://murmuring-gorge-42529.herokuapp.com/api/rebuy/?id=${setup._id}&adminKey=${hash}`, setup);
  }
}

export interface Setup {
  nanoLimit: number,
  exchange: string,
  pair: string,
  status: 'up' | 'down',
  address: string,
  _id?: string,
  history?: {
    lastExecution: string,
    message: string,
    nanoBought: number
  }
}