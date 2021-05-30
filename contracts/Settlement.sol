/**
* TODO:
*	- 
*
*	- 
*/




// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./AuctionDataModel.sol";

contract Settlement is AuctionDataModel {

//---------------------------------------------------------------------
// EVENTS
	event AuctionEnded (uint64 auctionId, uint endPrice);  // TODO: redundant to event "AuctionStatusChanged" ???
	
	
//---------------------------------------------------------------------
// VARIABLES
	
	// User > paymentTokenContract > Balance available
	mapping (address => mapping(address => uint)) internal ReadyForWithdrawal;

	// User > paymentTokenContract > Balance available
	mapping (address => mapping(address => uint)) internal lockedInEscrow;

//---------------------------------------------------------------------
// FUNCTIONS

	// Settle auction
		// Must be seller or owner
		// Check if auction ended
		// call internal function depending on what to do

	// Withdraw funds after overbid
		// msg.sender must be bidder
		// Check balance in readyForWithdrawal
		// transfer coins
		// update logs
}