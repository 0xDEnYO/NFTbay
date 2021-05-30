// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";


contract NFTbC is Context, IERC20, Ownable{

    string public constant name = "NFTbC ERC20";
    string public constant symbol = "NFTbC20";
    uint8 public constant decimals = 18;  
	address private _owner;

    mapping(address => uint256) public balances;

    mapping(address => mapping (address => uint256)) allowed;
    
    uint256 public override totalSupply;


   constructor(uint256 _totalSupply){  
		// make sure totalSupply is not 0
		require(_totalSupply != 0, "Error: total supply cannot be 0");
		// assign total supply 
		totalSupply = _totalSupply;
		balances[_msgSender()] = totalSupply;
		// derived from Ownable contract, therefore with leading underscore (as opposed to other variables)
		_owner = _msgSender();
	}  
    
    function balanceOf(address tokenOwner) 
	public 
	view 
	override
	returns (uint) {
		return balances[tokenOwner];
    }

    function approve(address delegate, uint numTokens) 
	public 
	override
	returns (bool) {
		// add entry to allowance log (allowed) containing delegate's address and allowance amount
		allowed[_msgSender()][delegate] = numTokens;
		
		// make sure sender and receiver are not the same
		require(_msgSender() != delegate, "owner and delegate cannot be the same (address)");
	
		// emit event
		emit Approval(_msgSender(), delegate, numTokens);
		
		return true;
    }

    function allowance(address owner, address delegate) 
	public 
	view
	override	
	returns (uint) {
		// return the amount of token that the delegate is allowed to transfer on the owner's behalf
        return allowed[owner][delegate];
    }
	
    function transfer(address receiver, uint numTokens) 
	public
	override	
	returns (bool) {
		// prevent transfer of 0 coins
		require(numTokens > 0, "Cannot transfer 0 tokens");
		
		// check if sender's balance is sufficient
		require(numTokens <= balances[_msgSender()], "Balance of sender is not sufficient for this transfer");
		
		// make sure sender and receiver are not the same
		require(_msgSender() != receiver, "sender and receiver cannot be the same (address)");
		
		// subtract amount to be sent from sender's balance
		balances[_msgSender()] = balances[_msgSender()] - numTokens;
					
		// add transfer amount to receiver's balance
		balances[receiver] = balances[receiver] + numTokens;

		// emit event
		emit Transfer(_msgSender(), receiver, numTokens);
		
		return true;
    }

    function transferFrom(address owner, address receiver, uint numTokens) 
	public
	override	
	returns (bool) {
		// prevent transfer of 0 coins
		require(numTokens > 0, "Cannot transfer 0 tokens");
		
		// check if owner has sufficient balance for this transfer
        require(numTokens <= balances[owner], "blabla1");    
		
		// check if _msgSender() has sufficient allowance to transfer specified token amount on behalf of the sender
        require(numTokens <= allowed[owner][_msgSender()], "nftbc: allowance insufficient");
        //require(numTokens <= allowed[owner][_msgSender()], "blabla2.2");		//TODO: Understand why I cannot use this here !?
		
		// make sure owner and receiver are not the same
		require(owner != receiver, "sender and receiver cannot be the same (address)");
		
		// subtract amount to be sent from sender's balance 
        balances[owner] = balances[owner] - numTokens;
		
		// reduce allowance balance by transfered amount
        allowed[owner][_msgSender()] = allowed[owner][_msgSender()] - numTokens;

		// add transfer amount to receiver's balance		
        balances[receiver] = balances[receiver] + numTokens;
        
		// emit event 
		emit Transfer(owner, receiver, numTokens);
        
		return true;
    }
	
	
}