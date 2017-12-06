pragma solidity ^0.4.15;

import 'e11-contracts/contracts/ExperimentalToken.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/NoOwner.sol';
import './UserVillage.sol';

 /**
  * @title UserVault (WIP)
  * @dev Keeps track of users e11 balance inside the game.
  * Additional functionality might be added to allow withdraws, implement time locks on withdraws,
  * and enable internal transfers between users.
  * @dev Issue: * https://github.com/e11-io/crypto-wars-solidity/issues/2
  */
contract UserVault is NoOwner {
  using SafeMath for uint256;

  /**
   * @dev event for adding tokens logging
   * @param owner The address that will receive the tokens.
   * @param amount The amount of tokens to add.
   */
	event VaultAdd(address indexed owner, uint256 amount);

  // Mapping of user -> balance (keeps track of owned balance)
  mapping(address => uint256) public balances;

	ExperimentalToken public experimentalToken;
  UserVillage userVillage;


  /**
   * @dev Constructor
   * @param _experimentalToken The address of the tokens to be used as in-game currency.
   */
	function UserVault(address _experimentalToken) {
		experimentalToken = ExperimentalToken(_experimentalToken);
	}

  /**
   * @notice Instantiate User Village contract.
   * @dev Function to provide User Village address and instantiate it.
   * @param _userVillage the address of User Village contract. (address)
   */
  function setUserVillage(address _userVillage) external onlyOwner {
    userVillage = UserVillage(_userVillage);
  }

  /**
   * @dev Function to add tokens
   * @param _from The address that will receive the tokens.
   * @param _amount The amount of tokens to add.
   * @return A boolean that indicates if the operation was successful.
   */
  function add(address _from, uint256 _amount) external returns(bool) {
    require(msg.sender == address(userVillage));
    require(experimentalToken.transferFrom(_from, this, _amount));
    balances[_from] = balances[_from].add(_amount);
		VaultAdd(_from, _amount);
    return true;
  }

  /**
   * @dev Function to overwrite reclaimToken
   * Do not allow owner to reclaim contract specific tokens.
   * @param _token The token address that will be reclaimed.
   * @return A boolean that indicates if the operation was successful.
   */
  function reclaimToken(ERC20Basic _token) external onlyOwner {
    require(_token != experimentalToken);
    uint256 balance = _token.balanceOf(this);
    _token.safeTransfer(owner, balance);
  }

  /**
   * @dev Gets the balance of the specified address.
   * @param _user The address to query the balance of.
   * @return An uint256 representing the amount owned by the passed address.
   */
  function balanceOf(address _user) external constant returns (uint256 balance) {
    return balances[_user];
  }
}
