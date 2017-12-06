import { Component, Input, OnInit } from '@angular/core';
import BigNumber from 'bignumber.js';

import { Web3Service } from '../services/web3.service';
import { ContractsService } from '../services/contracts.service';

import BuildingsMock from '../../../mocks/buildings.json';

const ether = Math.pow(10, 18);

@Component({
  selector: 'app-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.css']
})
export class ResourcesComponent implements OnInit {
  @Input() account: any;
  @Input() balance: any;

  accounts: string[];

  model = {
    amount: 5,
    receiver: ''
  };

  buildingsData = [];
  payoutAddress: string = '';
  status = '';
  userBuildings = [];
  userResources: any = {};

  constructor(private contracts: ContractsService,
              private web3Service: Web3Service) {
  }

  ngOnInit(): void {

  }

  setStatus(status) {
    this.status = status;
    console.log('status: ' + status);
  }

  async getResources() {
    console.log('Getting Resources of ' + this.account);
    const result = await this.web3Service.callContract(
      this.contracts.UserResourcesInstance.getUserResources,
      [ this.account, {from: this.account} ]
    );
    if (!result || result.error) {
      console.log('User has no resources');
      return false;
    } else {
      console.log('User resources');
      let gold = result[0];
      let crystal = result[1];
      let dust = result[2];
      console.log('gold: ' + gold.toNumber());
      console.log('crystal: ' + crystal.toNumber());
      console.log('dust: ' + dust.toNumber());
      return true;
    }
  }

  async getUserPayoutBlock() {
    console.log('Getting Payout Block of ' + this.account);
    const result = await this.web3Service.callContract(
      this.contracts.UserResourcesInstance.getUserPayoutBlock,
      [ this.account, {from: this.account} ]
    );
    if (!result || result.error) {
      console.log('User has no payout block');
      return false;
    } else {
      console.log('User payout block: ' + result.toNumber());
      this.web3Service.web3.eth.getBlock('pending').then((block) => {
        console.log('Current block: ' + block.number);
      });
      return true;
    }
  }

  async payoutResources() {
    let payoutAddress = this.payoutAddress || this.account;
    console.log('Pay Resources to User ' + payoutAddress);
    await this.web3Service.sendContractTransaction(
      this.contracts.UserResourcesInstance.payoutResources,
      [ payoutAddress, {from: this.account, gas: 200000} ],
      (error, data) => {
        console.log(error? error : 'payout ready!');
      }
    );
  }

  async getUserBuildings() {
    console.log('Getting Buildings of ' + this.account);
    const result = await this.web3Service.callContract(
      this.contracts.UserBuildingsInstance.getUserBuildings,
      [ this.account, {from: this.account} ]
    );
    if (!result || result.error) {
      console.log('User has no buildings');
      return false;
    } else {
      console.log('User buildings');
      console.log(result);
      let buildingsIds = [];
      if (result.length) {
        result.forEach(t => {
          buildingsIds.push(t.toNumber());
        });
        this.getBuildingsData(buildingsIds).then(data => {
          this.userBuildings = data;
        });
      }

      return true;
    }
  }

  async getAllBuildingsData() {
    console.log('Getting All Buildings data');
    let buildingsLength = await this.web3Service.callContract(
      this.contracts.BuildingsDataInstance.getBuildingIdsLength,
      [ {from: this.account} ]
    );
    buildingsLength = buildingsLength.toNumber();
    let buildingsIds: any = [];
    for (var i = 0; i < buildingsLength; i++) {
      let buildingId = await this.web3Service.callContract(
        this.contracts.BuildingsDataInstance.buildingIds,
        [ i, {from: this.account} ]
      );
      buildingsIds.push(buildingId.toNumber());
    };
    if (!buildingsIds) {
      console.log('No buildings');
      return false;
    } else {
      console.log('All buildings');
      console.log(buildingsIds);
      this.getBuildingsData(buildingsIds).then(result => {
        this.buildingsData = result;
      });
      return true;
    }
  }

  async getBuildingsData(buildingsIds: number[]) {

    console.log('Getting Buildings data of ' + buildingsIds);
    let buildingsData: any = {};
    for (let buildingId of buildingsIds) {
      let data = await this.web3Service.callContract(
        this.contracts.BuildingsDataInstance.buildings,
        [ buildingId, {from: this.account} ]
      );
      if (data && !data.error) {
        buildingsData[buildingId] = this.parseBuildingData(data);
      }
    };
    if (!buildingsData || !buildingsData == {}) {
      console.log('No buildings data');
      return false;
    } else {
      console.log('Buildings Data');
      console.log(buildingsData);
      return buildingsData;
    }
  }

  parseBuildingData(data) {
    let parsedData: any = {};
    parsedData.name = data[0];
    let properties = BuildingsMock.buildingProperties.stats;
    properties.forEach((property, i) => {
      parsedData[property] = data[i + 1].toNumber();
    })
    return parsedData;
  }
}
