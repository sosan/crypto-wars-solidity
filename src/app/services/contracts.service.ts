import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Rx';
import Web3 from 'web3';

import { Web3Service } from './web3.service';
import getWeb3 from '../util/get-web3'

import BuildingsDataContract     from '../../../build/contracts/BuildingsData.json';
import BuildingsQueueContract    from '../../../build/contracts/BuildingsQueue.json';
import ExperimentalTokenContract from '../../../build/contracts/ExperimentalToken.json';
import UserBuildingsContract     from '../../../build/contracts/UserBuildings.json';
import UserResourcesContract     from '../../../build/contracts/UserResources.json';
import UserVaultContract         from '../../../build/contracts/UserVault.json';
import UserVillageContract       from '../../../build/contracts/UserVillage.json';

/* LATEST MIGRATION TO e11 311
  Migrations:         0x7fbd6c1887176338567529edcba1a544bbebe36d
  ExperimentalToken:  0x4feb9bf5aee70f8392a8f8d99864cf64a6017ff2
  SimpleToken:        0xa308f0e23382b0674deac5cddc0770e803666be9
  UserVault:          0x767266d65a510d42b22965d192329ca8022cdf90
  UserResources:      0x810928c24082f0074754854bdf25b1f740840882
  BuildingsData:      0xc70dedb877b90db14cc28af0bb8204b2ec8a4e3b
  UserBuildings:      0x5db5220de8709c5109abd3afbfd230078ae10c0d
  UserVillage:        0x17eb13848de4934596768007309f9e7a7bbe4c60
  BuildingsQueue:     0x739d3935f4fa6d8a0384118115c417d16c030760
*/
declare let window: any;

@Injectable()
export class ContractsService {
  public initialized: boolean = false;
  public error: string = '';

  public BuildingsData: any;
  public BuildingsDataAddress: string = '0xc70dedb877b90db14cc28af0bb8204b2ec8a4e3b';
  public BuildingsDataInstance: any;
  public BuildingsQueue: any;
  public BuildingsQueueAddress: string = '0x739d3935f4fa6d8a0384118115c417d16c030760';
  public BuildingsQueueInstance: any;
  public ExperimentalToken: any;
  public ExperimentalTokenAddress: string = '0x4feb9bf5aee70f8392a8f8d99864cf64a6017ff2';
  public ExperimentalTokenInstance: any;
  public UserBuildings: any;
  public UserBuildingsAddress: string = '0x5db5220de8709c5109abd3afbfd230078ae10c0d';
  public UserBuildingsInstance: any;
  public UserResources: any;
  public UserResourcesAddress: string = '0x810928c24082f0074754854bdf25b1f740840882';
  public UserResourcesInstance: any;
  public UserVault: any;
  public UserVaultAddress: string = '0x767266d65a510d42b22965d192329ca8022cdf90';
  public UserVaultInstance: any;
  public UserVillage: any;
  public UserVillageAddress: string = '0x17eb13848de4934596768007309f9e7a7bbe4c60';
  public UserVillageInstance: any;

  constructor(private web3Service: Web3Service) {
    window.addEventListener('load', (event) => {
      this.bootstrapWeb3();
    });
  }

  public bootstrapWeb3() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3.then((results: any) => {
      // Initialize contracts once web3 provided.
      this.initContracts((error: string) => {
        this.initialized = true;
        this.error = error;
      });
    }).catch(() => {
      console.log('Error finding web3.');
    });

  }

  init(callback: any, retries: number = 0) {
    if (retries > 10) {
      return;
    }
    if (this.initialized) {
      return callback(this.error);
    }
    setTimeout(() => {
      return this.init(callback, retries++);
    }, 100);
  }

  async initContracts(callback: any) {
    let error = null;
    try {
      let contracts = [
        BuildingsDataContract,
        BuildingsQueueContract,
        ExperimentalTokenContract,
        UserBuildingsContract,
        UserResourcesContract,
        UserVaultContract,
        UserVillageContract,
      ];
      for (var i = 0; i < contracts.length; i++) {
        let name = contracts[i].contractName;
        await this.web3Service.artifactsToContract(contracts[i], this[`${name}Address`])
          .then((ContractAbstraction) => this[name] = ContractAbstraction);
        this[name].defaults({gasPrice: 1000000000});
        this[`${name}Instance`] = await this[name].deployed();
      }
    } catch (e) {
      error = e;
    } finally {
      callback(error);
    }

  }

}
