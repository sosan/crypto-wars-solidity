const ExperimentalToken = artifacts.require('ExperimentalToken');
const UserVault = artifacts.require('UserVault');
const BuildingsQueue = artifacts.require('BuildingsQueue');
const BuildingsData = artifacts.require('BuildingsData');
const UserResources = artifacts.require('UserResources');
const UserBuildings = artifacts.require('UserBuildings');
const UserVillage = artifacts.require('UserVillage');

var buildingsMock = require('../mocks/buildings');
const { assertRevert } = require('./helpers/assertThrow');

const stat = buildingsMock.stats;

contract('Buildings Queue Test', (accounts) => {
  let buildingsQueue, buildingsData, userResources, userVillage, userVault, experimentalToken = {};

  const Alice = accounts[0];
  const Bob = accounts[1];
  const ether = Math.pow(10,18);
  const initialUserBuildings = [1, 2, 3];

  beforeEach(async () => {
    experimentalToken = await ExperimentalToken.new();
    userVault = await UserVault.new(experimentalToken.address);
    userResources = await UserResources.new();
    buildingsData = await BuildingsData.new();
    buildingsQueue = await BuildingsQueue.new();
    userBuildings = await UserBuildings.new(buildingsData.address);
    userVillage = await UserVillage.new(userVault.address,
                                        userResources.address,
                                        userBuildings.address);

    await buildingsQueue.setBuildingsData(buildingsData.address);
    await userResources.setUserVillage(userVillage.address);
    await userBuildings.setUserVillage(userVillage.address);
    await buildingsQueue.setUserResources(userResources.address);
    await buildingsQueue.setUserBuildings(userBuildings.address);
    await userResources.setBuildingsQueue(buildingsQueue.address);
    await userResources.setUserBuildings(userBuildings.address);
    await userBuildings.setUserResources(userResources.address);
    await userBuildings.setBuildingsQueue(buildingsQueue.address);
    await userBuildings.setBuildingsData(buildingsData.address);
    await userVault.setUserVillage(userVillage.address);
    await userVillage.setBuildingsData(buildingsData.address);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[0].id,
      buildingsMock.initialBuildings[0].name,
      buildingsMock.initialBuildings[0].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[1].id,
      buildingsMock.initialBuildings[1].name,
      buildingsMock.initialBuildings[1].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[2].id,
      buildingsMock.initialBuildings[2].name,
      buildingsMock.initialBuildings[2].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[3].id,
      buildingsMock.initialBuildings[3].name,
      buildingsMock.initialBuildings[3].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[4].id,
      buildingsMock.initialBuildings[4].name,
      buildingsMock.initialBuildings[4].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[5].id,
      buildingsMock.initialBuildings[5].name,
      buildingsMock.initialBuildings[5].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[6].id,
      buildingsMock.initialBuildings[6].name,
      buildingsMock.initialBuildings[6].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[7].id,
      buildingsMock.initialBuildings[7].name,
      buildingsMock.initialBuildings[7].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[8].id,
      buildingsMock.initialBuildings[8].name,
      buildingsMock.initialBuildings[8].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[9].id,
      buildingsMock.initialBuildings[9].name,
      buildingsMock.initialBuildings[9].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[10].id,
      buildingsMock.initialBuildings[10].name,
      buildingsMock.initialBuildings[10].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[11].id,
      buildingsMock.initialBuildings[11].name,
      buildingsMock.initialBuildings[11].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[12].id,
      buildingsMock.initialBuildings[12].name,
      buildingsMock.initialBuildings[12].stats);
    await buildingsData.addBuilding(buildingsMock.initialBuildings[13].id,
      buildingsMock.initialBuildings[13].name,
      buildingsMock.initialBuildings[13].stats);
    await userVillage.setInitialBuildings(initialUserBuildings);

  })

  it('Add building to queue with no resources', async () => {
    return assertRevert(async () => {
      await buildingsQueue.addNewBuildingToQueue(2);
    })
  })

  it('Add free building to queue', async () => {
    let cityCenter = buildingsMock.initialBuildings[0];

    const initialBuildings = await userBuildings.getUserBuildings.call(Alice);
    assert.equal(initialBuildings.toString(), '');

    await buildingsQueue.addNewBuildingToQueue(cityCenter.id);

    const finalBuildings = await userBuildings.getUserBuildings.call(Alice);
    assert.equal(finalBuildings.toString(), cityCenter.id.toString());
  })

  context('User with resources and village period', async () => {
    beforeEach(async () => {
      await experimentalToken.approve(userVault.address, 1 * ether);
      await userVillage.create('My new village!','Cool player');
      await userResources.giveResourcesToUser(Alice, 3000, 3000, 200);

      const [gold, crystal, quantumDust] = await userResources.getUserResources.call(Alice);

      assert.equal(3000, gold.toNumber(), 'gold');
      assert.equal(3000, crystal.toNumber(), 'crystal');
      assert.equal(200, quantumDust.toNumber(), 'quantumDust');
    })

    it('Add gold factory to queue', async () => {
      let goldFactory = buildingsMock.initialBuildings[7];

      await buildingsQueue.addNewBuildingToQueue(goldFactory.id);

      const [id, startBlock, endBlock, queueId] = await buildingsQueue.getLastUserBuilding.call(Alice);

      assert.equal(id.toNumber(), goldFactory.id);
    })

    it('Add crystal factory to queue', async () => {
      let crystalFactory = buildingsMock.initialBuildings[8];
      await buildingsQueue.addNewBuildingToQueue(crystalFactory.id);

      const [id, startBlock, endBlock, queueId] = await buildingsQueue.getLastUserBuilding.call(Alice);

      assert.equal(id.toNumber(), crystalFactory.id);
    })

    it('Add portal to queue (consume quantum)', async () => {
      await buildingsQueue.addNewBuildingToQueue(4);

      const [id, startBlock, endBlock, queueId] = await buildingsQueue.getLastUserBuilding.call(Alice);

      assert.equal(id.toNumber(), 4);
    })

    it('Upgrade gold mine from user buildings', async () => {
      let goldMine = buildingsMock.initialBuildings[1];

      const buildings = await userBuildings.getUserBuildings.call(Alice);
      let index = -1;
      buildings.forEach((id, i) => {
        if (id.toNumber() == goldMine.id) {
          index = i;
        }
      });

      await buildingsQueue.upgradeBuilding(goldMine.id, 2002, index);

      const [id, isActive] = await userBuildings.getUserBuildingIdAndStatus.call(Alice, index);

      assert.equal(false, isActive);
    })

    it('Upgrade gold factory from buildings queue', async () => {
      let building = buildingsMock.initialBuildings[7];

      const initialBuildings = await userBuildings.getUserBuildings.call(Alice);

      await buildingsQueue.addNewBuildingToQueue(building.id);

      const buildings = await userBuildings.getUserBuildings.call(Alice);

      let index = -1;
      buildings.forEach((id, i) => {
        if (id.toNumber() == building.id) {
          index = i;
        }
      });

      for (var i = 0; i < building.stats[stat.blocks] + 1; i++) {
        await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});
      }

      let nextLevelId = 2000 + building.id;

      await buildingsQueue.upgradeBuilding(building.id, nextLevelId, index);

      for (var i = 0; i < building.stats[stat.blocks]; i++) {
        await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});
      }

      let [id, isActive] = await userBuildings.getUserBuildingIdAndStatus.call(Alice, index);

      assert.equal(false, isActive);

      const buildingsInQueue =  await buildingsQueue.getBuildingsInQueue.call(Alice);

      assert.equal(buildingsInQueue.toString(), nextLevelId.toString());

      await buildingsQueue.updateQueue(Alice);

      const finalBuildings = await userBuildings.getUserBuildings.call(Alice);
      const expectedBuildings = [initialBuildings.toString(), nextLevelId.toString()].join();
      const [lastBuildingId, lastBuildingStatus] = await userBuildings.getUserBuildingIdAndStatus.call(Alice, index);

      assert.equal(lastBuildingId.toNumber(), nextLevelId);
      assert.equal(lastBuildingStatus, true);
      assert.equal(finalBuildings.toString(), expectedBuildings);
    })

    it('Try to upgrade gold mine passing wrong upgrade ID', async () => {
      let goldMine = buildingsMock.initialBuildings[2];
      let crystalMine = buildingsMock.initialBuildings[3];
      return assertRevert(async () => {
        await buildingsQueue.upgradeBuilding(goldMine.id, crystalMine.id, 0); // Add to wrong upgrade id
      })
    })

    it('Try to pass non existent building id to upgrade building', async () => {
      return assertRevert(async () => {
        await buildingsQueue.upgradeBuilding(865, 2002, 0); // Add to wrong upgrade id
      })
    })

    it('Try to pass non existent idOfUpgrade to upgrade building', async () => {
      let goldMine = buildingsMock.initialBuildings[2];
      return assertRevert(async () => {
        await buildingsQueue.upgradeBuilding(goldMine.id, 2002 + 420, 0); // Add to wrong upgrade id
      })
    })

    it('Add non-existing building to queue', async () => {
      return assertRevert(async () => {
        await buildingsQueue.addNewBuildingToQueue(678);
      })
    })

    it('Try to create another gold mine (same building type)', async () => {
      return assertRevert(async () => {
        await buildingsQueue.addNewBuildingToQueue(2);
      })
    })

    it('Pass address 0 to update queue', async () => {
      return assertRevert(async () => {
        await buildingsQueue.updateQueue(0);
      })
    })

    it('Remove building that is not in queue', async () => {
      await buildingsQueue.removeBuilding(2, 1);

      const [id, isActive] = await userBuildings.getUserBuildingIdAndStatus.call(Alice, 1);

      assert.equal(isActive, false);
    })

    it('Update queue when none building is ready', async () => {
      await buildingsQueue.addNewBuildingToQueue(5);

      const txData = await buildingsQueue.updateQueue(Alice);

      assert.equal(txData.logs[0].args._ids.toString(), '');
    })

    it('Remove building in queue', async () => {
      const txData = await buildingsQueue.addNewBuildingToQueue(5);
      await buildingsQueue.addNewBuildingToQueue(6);
      const data = txData.logs[0].args;

      await buildingsQueue.removeBuilding(data._id.toNumber(), data._index.toNumber());

      const [ids, indexes] =  await buildingsQueue.getBuildingsIdAndIndex.call(Alice);
      const [id, isActive] = await userBuildings.getUserBuildingIdAndStatus.call(Alice, data._index.toNumber());

      assert.equal(ids.toString(), '6');
      assert.equal(isActive, false);
    })

    it('Add new building to queue after las building in queue finished', async () => {
      let goldFactory = buildingsMock.initialBuildings[7];
      let crystalFactory = buildingsMock.initialBuildings[8];

      await buildingsQueue.addNewBuildingToQueue(goldFactory.id);

      for (var i = 0; i < goldFactory.stats[stat.blocks] + 2; i++) {
        await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});
      }

      await buildingsQueue.addNewBuildingToQueue(crystalFactory.id);
      let blockNumber = web3.eth.blockNumber;

      const [id, startBlock, endBlock] = await buildingsQueue.getLastUserBuilding.call(Alice);

      assert.equal(id.toNumber(), crystalFactory.id);
      assert.equal(startBlock.toNumber(), blockNumber);
      assert.equal(endBlock.toNumber(), crystalFactory.stats[stat.blocks] + blockNumber);
    })

    context('Buildings added to construction queue period', async () => {
      beforeEach(async () => {
        await buildingsQueue.addNewBuildingToQueue(5);
        await buildingsQueue.addNewBuildingToQueue(6);
      })

      it('Check user buildings queue', async () => {
        let expectedBuildings = '5,6';
        const buildings = await buildingsQueue.getBuildingsInQueue.call(Alice);

        assert.equal(buildings.toString(), expectedBuildings);
      })

      it('Make first building be ready and removed from BuildingsQueue and transferred to UserBuildings', async () => {
        let [building_one_id, building_one_endBlock] = await buildingsQueue.getBuildingIdAndEndBlock.call(Alice, 0);
        let blocksToSkip = 0;

        if ((await web3.eth.blockNumber) < building_one_endBlock) {
          blocksToSkip = Math.abs((await web3.eth.blockNumber) - building_one_endBlock.toNumber());
        }

        for (var i = 0; i < blocksToSkip; i++) {
          await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});
        }

        await buildingsQueue.updateQueue(Alice);

        const buildingsInQueue = await buildingsQueue.getBuildingsInQueue.call(Alice);

        assert.equal(buildingsInQueue.toString(), '6');
      })

      it('UpdateQueue of non existent user', async () => {
        return assertRevert(async () => {
          await buildingsQueue.updateQueue(Bob);
        })
      })

      it('Get Last User Building when no buildings in queue', async () => {
        return assertRevert(async () => {
          const lastBuilding = await buildingsQueue.getLastUserBuilding.call(Bob);
        })
      })

      it('Cancel new building in queue', async () => {
        const [id, index] = await buildingsQueue.getBuildingIndex.call(Alice, 1);

        await buildingsQueue.removeBuilding(id, index);

        const buildings = await buildingsQueue.getBuildingsInQueue.call(Alice);

        assert.equal(buildings.toString(), '5', 'The second initial building should be removed from queue, but is not');
      })

      it('Return gold resources to user when building canceled', async () => {
        const [id, index] = await buildingsQueue.getBuildingIndex.call(Alice, 0);
        const [initialUserGold, initialUserCrystal, initialUserQuantum] = await userResources.getUserResources.call(Alice);

        const previousPayoutBlock = await userResources.getUserPayoutBlock.call(Alice);

        let [goldRate, crystalRate] = await userBuildings.getUserRates.call(Alice);
        let [queueGold, queueCrystal] = await buildingsQueue.getUserQueueResources.call(Alice);

        await buildingsQueue.removeBuilding(id, index);

        let blocksDiff = web3.eth.blockNumber - previousPayoutBlock.toNumber();
        let generatedGold =  goldRate.toNumber() * blocksDiff + queueGold.toNumber();

        const [finalUserGold, finalUserCrystal, finalUserQuantum] = await userResources.getUserResources.call(Alice);
        const [price, resourceType, blocksToBuild] = await buildingsData.getBuildingData.call(id);
        assert.equal(0, resourceType.toNumber());

        let total = initialUserGold.toNumber() + price.toNumber()*60/100 + generatedGold;
        assert.equal(finalUserGold.toNumber(), total);
      })

      it('Return crystal resources to user when building canceled', async () => {
        const [id, index] = await buildingsQueue.getBuildingIndex.call(Alice, 1);
        const [initialUserGold, initialUserCrystal, initialUserQuantum] = await userResources.getUserResources.call(Alice);

        const previousPayoutBlock = await userResources.getUserPayoutBlock.call(Alice);

        let [goldRate, crystalRate] = await userBuildings.getUserRates.call(Alice);
        let [queueGold, queueCrystal] = await buildingsQueue.getUserQueueResources.call(Alice);

        await buildingsQueue.removeBuilding(id, index);

        let blocksDiff = web3.eth.blockNumber - previousPayoutBlock.toNumber();
        let generatedCrystal =  crystalRate.toNumber() * blocksDiff + queueCrystal.toNumber();

        const [finalUserGold, finalUserCrystal, finalUserQuantum] = await userResources.getUserResources.call(Alice);
        const [price, resourceType, blocksToBuild] = await buildingsData.getBuildingData.call(id);
        assert.equal(1, resourceType.toNumber());

        let total = initialUserCrystal.toNumber() + price.toNumber()*60/100 + generatedCrystal;
        assert.equal(finalUserCrystal.toNumber(), total);
      })

      it('Check updateQueueBlocks before removed building starts', async () => {
        let crystalFactory = buildingsMock.initialBuildings[8];
        let goldStorage = buildingsMock.initialBuildings[11];
        let crystalStorage = buildingsMock.initialBuildings[12];

        await buildingsQueue.addNewBuildingToQueue(goldStorage.id);
        await buildingsQueue.addNewBuildingToQueue(crystalStorage.id);

        const buildings = await userBuildings.getUserBuildings.call(Alice);

        let index = -1;
        buildings.forEach((id, i) => {
          if (id.toNumber() == crystalFactory.id) {
            index = i;
          }
        });

        let [exists, indexInQueue] = await buildingsQueue.findBuildingInQueue.call(Alice, crystalFactory.id, index);

        const [initialIds, initialStartBlocks, initialEndBlocks] = await buildingsQueue.getIdAndBlocks.call(Alice);

        await buildingsQueue.removeBuilding(crystalFactory.id, index);

        const [finalIds, finalStartBlocks, finalEndBlocks] = await buildingsQueue.getIdAndBlocks.call(Alice);

        indexInQueue = indexInQueue.toNumber();
        const blocksA = initialEndBlocks[initialEndBlocks.length - 1].toNumber() - initialStartBlocks[initialStartBlocks.length - 1].toNumber();
        assert.equal(finalIds[finalIds.length - 1].toNumber(), initialIds[finalIds.length].toNumber());
        assert.equal(finalStartBlocks[indexInQueue].toNumber(), initialStartBlocks[indexInQueue].toNumber());
        assert.equal(finalEndBlocks[finalEndBlocks.length - 1].toNumber(), finalStartBlocks[finalStartBlocks.length - 1].toNumber() + blocksA);
      })

      it('Check updateQueueBlocks after removed building starts', async () => {
        let goldFactory = buildingsMock.initialBuildings[7];
        let goldStorage = buildingsMock.initialBuildings[11];
        let crystalStorage = buildingsMock.initialBuildings[12];

        await buildingsQueue.addNewBuildingToQueue(goldStorage.id);
        await buildingsQueue.addNewBuildingToQueue(crystalStorage.id);

        const buildings = await userBuildings.getUserBuildings.call(Alice);

        let index = -1;
        buildings.forEach((id, i) => {
          if (id.toNumber() == goldFactory.id) {
            index = i;
          }
        });

        let [exists, indexInQueue] = await buildingsQueue.findBuildingInQueue.call(Alice, goldFactory.id, index);

        const [initialIds, initialStartBlocks, initialEndBlocks] = await buildingsQueue.getIdAndBlocks.call(Alice);

        await buildingsQueue.removeBuilding(goldFactory.id, index);

        const [finalIds, finalStartBlocks, finalEndBlocks] = await buildingsQueue.getIdAndBlocks.call(Alice);

        indexInQueue = indexInQueue.toNumber();
        const blocksA = initialEndBlocks[indexInQueue + 1].toNumber() - initialStartBlocks[indexInQueue + 1].toNumber();
        assert.equal(finalIds[indexInQueue].toNumber(), initialIds[indexInQueue + 1].toNumber());
        assert.equal(finalStartBlocks[indexInQueue].toNumber(), web3.eth.blockNumber);
        assert.equal(finalEndBlocks[indexInQueue].toNumber(), finalStartBlocks[indexInQueue].toNumber() + blocksA);
      })

      it('Remove finished building in queue', async () => {
        let goldFactory = buildingsMock.initialBuildings[7];
        let goldStorage = buildingsMock.initialBuildings[11];
        let crystalStorage = buildingsMock.initialBuildings[12];

        await buildingsQueue.addNewBuildingToQueue(goldStorage.id);
        await buildingsQueue.addNewBuildingToQueue(crystalStorage.id);

        const buildings = await userBuildings.getUserBuildings.call(Alice);

        let index = -1;
        buildings.forEach((id, i) => {
          if (id.toNumber() == goldFactory.id) {
            index = i;
          }
        });

        for (var i = 0; i < goldFactory.stats[stat.blocks]; i++) {
          await web3.currentProvider.send({jsonrpc: "2.0", method: "evm_mine", params: [], id: 0});
        }

        let [exists, indexInQueue] = await buildingsQueue.findBuildingInQueue.call(Alice, goldFactory.id, index);
        const [initialIds, initialStartBlocks, initialEndBlocks] = await buildingsQueue.getIdAndBlocks.call(Alice);

        await buildingsQueue.removeBuilding(goldFactory.id, index);

        const [finalIds, finalStartBlocks, finalEndBlocks] = await buildingsQueue.getIdAndBlocks.call(Alice);

        indexInQueue = indexInQueue.toNumber();

        for (var i = indexInQueue; i < finalIds.length; i++) {
          assert.equal(
            finalIds[finalIds.length - i - 1].toNumber(),
            initialIds[initialIds.length - i - 1].toNumber()
          );
          assert.equal(
            finalStartBlocks[finalStartBlocks.length - i - 1].toNumber(),
            initialStartBlocks[initialStartBlocks.length - i - 1].toNumber()
          );
          assert.equal(
            finalEndBlocks[finalEndBlocks.length - i - 1].toNumber(),
            initialEndBlocks[initialEndBlocks.length - i - 1].toNumber()
          );
        }
      })

      it('Remove building passing wrong index', async () => {
        return assertRevert(async () => {
          await buildingsQueue.removeBuilding(2, 5);
        })
      })

      it('Remove building passing non-exitent id', async () => {
        return assertRevert(async () => {
          await buildingsQueue.removeBuilding(854, 5);
        })
      })

      it('Try to get last user building passing 0 as address', async () => {
        return assertRevert(async () => {
          const [id, startBlock, endBlock] = await buildingsQueue.getLastUserBuilding.call(0);
        })
      })

      it('Try to get all buildings in queue passing 0 as address', async () => {
        return assertRevert(async () => {
          const ids = await buildingsQueue.getBuildingsInQueue.call(0);
        })
      })

      it('Try to get builings ids and indexes passing 0 as address', async () => {
        return assertRevert(async () => {
          const [ids, indexes] = await buildingsQueue.getBuildingsIdAndIndex.call(0);
        })
      })

      it('Try to get all ids and blocks in queue passing 0 as address', async () => {
        return assertRevert(async () => {
          const [ids, startBlocks, endBlocks] = await buildingsQueue.getIdAndBlocks.call(0);
        })
      })

      it('Try to get building index passing 0 as address', async () => {
        return assertRevert(async () => {
          const [id, index] = await buildingsQueue.getBuildingIndex.call(0, 1);
        })
      })

      it('Try to pass an index higher or equal to user building length', async () => {
        return assertRevert(async () => {
          const [id, endBlock] = await buildingsQueue.getBuildingIdAndEndBlock.call(Alice, 85);
        })
      })

      it('Try to pass an index higher or equal to user building length to getBuildingIndex', async () => {
        return assertRevert(async () => {
          const [id, index] = await buildingsQueue.getBuildingIndex.call(Alice, 85);
        })
      })

      it('Try to add a building with resources type 8 to queue', async () => {
        let experiment = buildingsMock.initialBuildings[13];
        return assertRevert(async () => {
          await buildingsQueue.addNewBuildingToQueue(experiment.id);
        })
      })

    })
  })
});
