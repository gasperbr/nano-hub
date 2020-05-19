import { Component, OnInit } from '@angular/core';
import { StoreService } from 'src/app/services/store.service';
import { RebuyService, Setup } from 'src/app/services/rebuy.service';
import { FormBuilder, FormControl, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from '../dialog/dialog.component';
import { filter } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import isValid from 'nano-address-validator';

@Component({
  selector: 'app-rebuy',
  templateUrl: './rebuy.component.html',
  styleUrls: ['./rebuy.component.scss']
})
export class RebuyComponent implements OnInit {

  pairs = ['NANOUSDT', 'NANOBUSD', 'NANOBTC', 'NANOETH', 'NANOBNB'];
  exchanges = ['Binance'];
  
  apiKeysSet$ = this.store.withdrawKeysSet$;
  
  updatingSetup = false;
  apiCall = false;
  setupId;
  nanoBalance;
  nanoBalancePending;
  history;

  address = new FormControl(undefined, [this.badNanoAddressValidator]);
  nanoLimit = new FormControl(undefined, [Validators.min(1)]);
  exchange = new FormControl(undefined);
  pair = new FormControl(undefined);
  status = new FormControl(undefined);

  constructor(
    private store: StoreService,
    private rebuyService: RebuyService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private _snackBar: MatSnackBar
  ) { }

  ngOnInit() {

    this.apiCall = true;
    this.rebuyService.getSetup().subscribe((apisetup: Setup[]) => {
      
      this.apiCall = false;
      const setup = apisetup[0];

      this.setupId = setup && setup._id;

      if (setup) {
        this.address.patchValue(setup.address);
        this.nanoLimit.patchValue(setup.nanoLimit);
        this.exchange.patchValue(setup.exchange);
        this.pair.patchValue(setup.pair);
        this.status.patchValue(setup.status);
        this.history = setup.history;
      }
    });

    this.address.valueChanges.pipe(filter(value => this.address.valid)).subscribe((value) => {
      if (value.length > 60) {
        this.getAccountBalance(value);
      }
    });
  }

  badNanoAddressValidator(control: AbstractControl) {
    if (!control.value) {
      return null;
    }
    const badAddress = !isValid(control.value, ['nano', 'xrb']);
    return badAddress ? {'badAddress': {value: control.value}} : null;
  }

  toggleStatus(event) {
    this.status.patchValue(event.checked ? 'up' : 'down');
  }

  getAccountBalance(address: string) {
    this.rebuyService.getAccountBalance(address).subscribe(account => {
      this.nanoBalance = account.balance;
      this.nanoBalancePending = account.pending;
    });
  }

  save(adminKey?) {
    console.log(this.address);
    if (this.address.value && this.address.valid && this.nanoLimit.value &&
      this.nanoLimit.valid && this.exchange.value && this.pair) {
        
      if (adminKey) {
        this.updatingSetup = true;
        if (this.setupId) {
          console.log(this.setupId);
          this.update(adminKey);
        } else {
          this.addNew(adminKey);
        }
      } else {
        this.openDialog();
      }
    }
  }

  update(adminKey) {
    this.rebuyService.updateSetup({
      _id: this.setupId,
      address: this.address.value,
      nanoLimit: this.nanoLimit.value,
      exchange: this.exchange.value,
      pair: this.pair.value,
      status: this.status.value
    }, adminKey).subscribe(res => {

      this.updatingSetup = false;
      this.openSnackBar('Successfully updated settings!');

    }, err => {
      this.updatingSetup = false;
      this.openSnackBar((err && err.message) ? err.message : err);
    });
  }

  addNew(adminKey) {
    this.rebuyService.addSetup({
      address: this.address.value,
      nanoLimit: this.nanoLimit.value,
      exchange: this.exchange.value,
      pair: this.pair.value,
      status: 'up'
    }, adminKey).subscribe((res: Setup) => {

      this.updatingSetup = false;
      this.openSnackBar('Successfully updated settings!');
      this.setupId = res._id;
      this.status.setValue(res.status);

    }, err => {
      this.updatingSetup = false;
      this.openSnackBar((err && err.message) ? err.message : err);
    });
  }

  openDialog(): void {

    let key;
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '250px',
      data: {key}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.save(result);
      }
    });
  }

  openSnackBar(message) {
    this._snackBar.open(message, undefined, {
      duration: 2000,
    });
  }

  isRecent(date) {
    return new Date().getTime() - new Date(date).getTime() < 3600000;
  }
}
