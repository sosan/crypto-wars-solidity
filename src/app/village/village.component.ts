import { Component, Input, OnInit } from '@angular/core';
import BigNumber from 'bignumber.js';

import { ContractsService } from '../services/contracts.service';
import { Web3Service } from '../services/web3.service';

const ether = Math.pow(10, 18);

@Component({
  selector: 'app-village',
  templateUrl: './village.component.html',
  styleUrls: ['./village.component.css']
})
export class VillageComponent implements OnInit {
  @Input() account: any;
  @Input() balance: any;

  accounts: string[];

  amount: number = 5;
  receiver: string = '0xf8e16b483cafae8d55d9d4067447990de27ddbdd';

  status = '';
  userName: string = 'Lucho';
  villageName: string = 'Experimental';

  approveAddress: string = '';
  approveAmount: number = 1;

  constructor(private contracts: ContractsService,
              private web3Service: Web3Service) {
  }

  ngOnInit(): void {
    this.contracts.init((error: boolean) => {
      if (error) return;
      this.approveAddress = this.contracts.UserVaultInstance.address;
    });
  }

  setStatus(status) {
    this.status = status;
    console.log('status: ' + status);
  }

  async sendEther() {
    console.log('Sending ethers ' + this.amount + ' to ' + this.receiver);
    await this.web3Service.sendTransaction({from: this.account, to: this.receiver, value: this.amount * ether},
      (error, data) => {
        console.log(error? error : 'ether sent!');
      }
    );
  }

  async sendCoin() {
    console.log('Sending tokens ' + this.amount + ' to ' + this.receiver);
    await this.web3Service.sendContractTransaction(
      this.contracts.ExperimentalTokenInstance.transfer,
      [ this.receiver, this.amount * ether, {from: this.account} ],
      (error, data) => {
        console.log(error? error : 'token sent!');
      }
    );
  }

  async approve() {
    console.log('Approving ' + this.approveAmount * ether + ' tokens to ' + this.approveAddress);
    await this.web3Service.sendContractTransaction(
      this.contracts.ExperimentalTokenInstance.approve,
      [ this.approveAddress, this.approveAmount * ether, {from: this.account} ],
      (error, data) => {
        console.log(error? error : 'token approved!');
      }
    );
  }

  async createVillage() {
    //  Check if user already has a village
    let userHasVillage = await this.getVillage();
    if (userHasVillage) {
      this.setStatus('User already has a village');
      return;
    }
    // Check if user already has a village
    let vaultAllowance: any = await this.getVaultAllowance();
    if (vaultAllowance instanceof BigNumber) {
      vaultAllowance = new new BigNumber(vaultAllowance);
      vaultAllowance = vaultAllowance.dividedBy(ether).toNumber()
      console.log('vaultAllowance');
      console.log(vaultAllowance);
      this.setStatus('User has not allowed enough tokens to vault contract');
      return;
    }

    console.log('Creating Village: ' + this.villageName + ' by ' + this.userName);
    await this.web3Service.sendContractTransaction(
      this.contracts.UserVillageInstance.create,
      [ this.villageName, this.userName, {from: this.account} ],
      (error, data) => {
        console.log(error? error : 'village created!');
      }
    );
  }

  async getVillage() {
    console.log('Getting Village of ' + this.account);
    const result = await this.web3Service.callContract(
      this.contracts.UserVillageInstance.villages,
      [ this.account, {from: this.account} ]
    );
    console.log(result.error? result.error : result);
  }

  async getVaultAllowance() {
    console.log('Getting vault allowance of ' + this.account);
    const result = await this.web3Service.callContract(
      this.contracts.UserVillageInstance.allowance,
      [ this.account, this.contracts.UserVaultInstance.address, {from: this.account} ]
    );
    console.log(result.error? result.error : result);
  }

}
