/**
* TODO:
*	- CHECK TO USE ERC223 TOKEN FOR PAYMENT
*	https://github.com/Dexaran/ERC223-token-standard
*
*	- Clear Todos in comments
*/




// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./AuctionDataModel.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

/**
 * @title Escrow
 * @notice Contains functions to place tokens (payment and object for sale) into and release them from escrow
 *
 * @author d.blaecker@gmail.com
 */
contract Escrow is AuctionDataModel, IERC721Receiver{


//---------------------------------------------------------------------
// VARIABLES

	IERC20 public paymentToken;
	bool private locked;
	// Save all bids for every auction
	// _auctionId => bidder address => Bid
	mapping(uint64 => mapping (address => Bid)) internal auctionBidLog;					//TODO: Does it make sense/is it necessary to store this data?

	mapping(address => uint) internal bidderFundsInEscrow;
																						

    // mapping that will store all auctions
	// TODO: REMOVE AND REPLACE BY CENTRAL STORAGE
    //mapping (uint => Auction) public auctions;																							

constructor(address _paymentTokenAddress)
	{
		paymentToken = IERC20(_paymentTokenAddress);
	}

modifier contractLock() {
		// Check if lock is active, otherwise activate
		require(locked == false, "Function is currently locked");
		locked = true;
		_;
		// deactivate contract lock
		locked = false;
}


    /**
     * @notice Transfers the bid amount from bidder's payment token balance to escrow contract's balance
     * 
     * @param _auctionId the ID of the auction
     * @param _bidder the address of the bidder
     * @param _bidAmountInWei the bid amount (=the escrow amount)
     * 
     * @return success  returns true if funds were successfully placed into escrow
     * 
     */
	function transferBidAmountIntoEscrow(uint64 _auctionId, address _bidder, uint _bidAmountInWei)
	public
	//validAuctionId(_auctionId)
	contractLock
	returns (bool success)
	{
		//Check correct input parameters
		require(_bidder != address(0), "Bidder cannot be 0 address");
		
		// Check this contract's balance of the payment token BEFORE the transferBidAmountIntoEscrow
		// TODO: Dangerous, since balance could be changed through other sources - better to remove?
		uint balance = paymentToken.balanceOf(address(this));
		
		// Transfer bid amount from bidder to this smart contract
		paymentToken.transferFrom(_bidder, address(this), _bidAmountInWei);
		
		// Check contract balance of the payment token AFTER the transferBidAmountIntoEscrow 
		// TODO: Dangerous, since balance could be changed through other sources - better to remove?
		require(paymentToken.balanceOf(address(this)) == (balance + _bidAmountInWei), 
			"Escrow: Contract's payment token balance is not correct after token transfer");
		
		// update escrow log (add funds)
		// doing this as a first step to follow checks-effects-interactions-pattern  		
		// TODO: check if this is correctly implemented
		bidderFundsInEscrow[_bidder] += _bidAmountInWei;
		
		// Create new auction bid log entry
		Bid storage newBid = auctionBidLog[_auctionId][_bidder];
		newBid.bidder = _bidder;
		newBid.registeredAtBlock = block.timestamp;
		newBid.bidAmountInWei = _bidAmountInWei;
		newBid.escrowActive = true;
		
		return true;
	}

    /**
     * @notice Transfers the token for sale from seller's ownershipt to escrow contract's ownership. Approval is insufficient here as it could be removed by the seller during auction.
     * 
     * @param _auctionId the ID of the auction
     * @param _seller the address of the seller
     * @param _tokenContract the address of the contract by which the NFT was created
     * @param _tokenId the native ID of the NFT given by its contract
     * 
     * @return success  returns true if the token was successfully placed into escrow
     * 
     */	
	function transferTokenIntoEscrow(uint64 _auctionId, address _seller, address _tokenContract, uint _tokenId)
	public
	validAuctionId(_auctionId)
	contractLock
	returns (bool success)
	{
		//Check correct input parameters
		require(_seller != address(0), "Seller cannot be 0 address");
		require(_tokenContract != address(0), "TokenContract cannot be 0 address");

		// get contract object
		IERC721 tokenContract = IERC721(_tokenContract);
		
		// Transfer token													
		//TODO: Would it reduce gas if I combine this and the last statement?	
		tokenContract.safeTransferFrom(_seller, address(this), _tokenId);
		
		// Validate new ownership of token by this smart contract
		require(tokenContract.ownerOf(_tokenId) == address(this), "Error: Transfer of token into escrow failed");
		
		// UPDATE LOGS
		Token storage newToken = auctions[_auctionId].token;	
		newToken.tokenId = _tokenId;
		newToken.tokenContract = _tokenContract;
		newToken.escrowActive = true;
		
		// Update auction status
		// TODO
		
		return true;
	}
	
    /**
     * @notice Releases funds that from escrow for bids that were outbid by higher bids
     * 
     * @param _auctionId the ID of the auction
     * @param _bidder the address of the bidder
     * @param _bidAmountInWei the bid amount that should be released from escrow
     * 
     * @return success returns true if the funds were successfully released from escrow
     * 
     */	
	function releaseTokenFromEscrow(uint64 _auctionId, address _bidder, uint _bidAmountInWei)
	public
	validAuctionId(_auctionId)
	//TODO: Add onlyBidder functionality
	contractLock
	returns (bool success)
	{
		//TODO: Check if it is possible that an escrow payment was made for a bid even though another bid with same amount is already registered
	
		//Check correct input parameters
		require(_bidder != address(0), "Bidder cannot be 0 address");
		require(_bidAmountInWei > 0, "Bid amount cannot be 0");
		
		// require(auctions[_auctionId].highestBid < _bidAmountInWei, 
			// "You cannot request escrow release for a bid that is higher than the current high bid");
			
		// check if bid is registered/escrow was placed for this bid
		require(auctionBidLog[_auctionId][_bidder].escrowActive == true, "No such bid registered/escrowed");
		
		// check if the highest bid on this auction is higher than the bid for which escrow should be released
		//if(auctions[_auctionId].highestBid == _bidAmountInWei)
		
		Bid memory highBid = auctions[_auctionId].highBid;						//TODO: THIS WILL NOT WORK (WRONG DATA CONTEXT)- Find other solution
		
		
		if(highBid.bidAmountInWei == _bidAmountInWei)
		{
				if(highBid.bidder == _bidder)
				{	
					// bid amount is equal and bidder is the same => bid is still active
					revert("Escrow locked, bid is still active");
				} else
				{	
					// Bid amount is equal but bidder does not match
					// IT SHOULD NOT BE POSSIBLE THAT ESCROW WAS PAID FOR A BID BUT ANOTHER BID WITH SAME AMOUNT IS REGISTERED HIGH BID			
					// TODO: IMPROVE - no support available :)
					revert("Escrow cannot be released for this bid. Please contact support for further assistance.");
				}
		} else 
		{
			// a higher bid is reqistered for this auction, escrow can be released
			// save current contract balance 
			uint balance = paymentToken.balanceOf(address(this));
			
			// check if contract balance is sufficient (THIS SHOULD NEVER FAIL) 									
			// TODO: What to do in this case?
			// TODO: Every check costs gas - what is the right balance between checking and gas fees?
			require(balance > _bidAmountInWei, "Contract has insufficient balance for refund");
			
			// remove bid from auction bid log to free storage space
			// reminder: mapping(uint64 => mapping (address => Bid) private bidsWithEscrow;
			delete(auctionBidLog[_auctionId][_bidder]);
			
			// transfer token
			paymentToken.transferFrom(address(this),_bidder, _bidAmountInWei);
			
			// check if contract balance has been decreased by bid amount
			require(paymentToken.balanceOf(address(this)) == balance - _bidAmountInWei, "Error in token transfer for escrow release");
			
			return true;	
		}	

	}
	
    /**
     * @notice This function is required by contracts in order to confirm receipt of ERC721 token after safeTransfer
     * 
     * param address the address that initiated this transfer
     * param address the address of the owner from which the token gets transfered
     * param uint256 the native ID of the token given by its contract
     * param bytes custom data that be used for further verification
     * 
     * @return hash returns a hash of the onERC721Received function signature
     * 
     */	
	function onERC721Received(address, address , uint256 , bytes calldata)
	external
	pure
	override
	returns (bytes4 hash)
	{
		//return bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));
		return this.onERC721Received.selector;
	}

    /**
     * @notice Allows to swap the ERC20 payment token which is used to pay fees and bids
     * 
     * @param _newPaymentToken the address of the new payment token contract
     * 
     * @return success returns true if the replacement
     * 
     */	
	function changePaymentTokenAddress(address _newPaymentToken)
	external
	onlyOwner
	returns (bool success)
	{
		// check input parameter
		require(_newPaymentToken != address(0), "New payment token contract cannot be 0 address");
		
		//TODO: how to deal with funds in escrow with the old contract?
		
		
		// add new token as payment token
		paymentToken = IERC20(_newPaymentToken);
		
		success = true;
	}
	
	
	
	// TODO
	// IS THIS FUNCTION STILL NEEDED? OTHERWISE :> Remove
	// function checkAuctionLog(uint64 _auctionId, address _bidder, uint _bidAmountInWei)
	// view
	// public
	// validAuctionId(_auctionId)
	// returns (bool success)
	// // _auctionId => bidder address => Bid
	// {
		// require(auctionBidLog[_auctionId][_bidder].bidder == _bidder, "bid could not be confirmed#1");
		// require(auctionBidLog[_auctionId][_bidder].bidAmountInWei == _bidAmountInWei, "bid could not be confirmed#2");
		// success = true;
	// }
	
}




