// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./AuctionDataModel.sol";

/**
 * @title Bidding
 * @notice Contains functions to place bids and get bidding information
 * 
 * @author d.blaecker@gmail.com
 */	
contract Bidding is AuctionDataModel {


    //---------------------------------------------------------------------
    // EVENTS
    event NewHighBid (uint64 auctionId, uint bidAmountInWei, address bidder);


    /**
     * @notice Returns all essential information for the auction that matches the provided auctionID 
     * 
     * @param _auctionId the ID of the auction
     * 
     * @return success returns true if escrow and bid were successfully placed
     * 
     * Emits an {NewHighBid} event.
     */
	function placeNewBidWithEscrow(uint64 _auctionId, uint _bidAmountInWei)
	public
	validAuctionId(_auctionId)
	//auctionLock(_auctionId)			//TODO: is this necessary?
	returns (bool success)
	{
		//Conduct initial checks
		require(_msgSender() != address(0), "Bidder cannot be 0 address");
		require(_bidAmountInWei > 0, "Bid cannot be 0");
		require(_bidAmountInWei > auctions[_auctionId].highBid.bidAmountInWei, "Bid must be higher than current high bid");

		Auction memory _auction = auctions[_auctionId];
		// check if auction is in status 'HasBids' (=> no action is needed)
		if(_auction.status != AuctionStatus.HasBids)
		{
			//no: check if auction is in status 'Started' (=> update to 'HasBids')
			if(auctions[_auctionId].status == AuctionStatus.Started)
			{				
				// change auction from status 'Started' to 'HasBids'
				auctions[_auctionId].status = AuctionStatus.HasBids;

				// emit event
				emit AuctionStatusChanged (_auctionId, "Started", "HasBids");
			}
			//no: check if auction is in status 'Created'
			else if(auctions[_auctionId].status == AuctionStatus.Created)
			{
				// Check if start date is before current date 
				if(auctions[_auctionId].auctionStarts < block.timestamp)
				{
					// yes: start auction
					auctions[_auctionId].status = AuctionStatus.Started;
					
					// emit event
					emit AuctionStatusChanged (_auctionId, "Created", "Started");
				}else
				{
					// no: revert transaction
					revert("Auction has not started. Bid cannot be placed yet");
				}
			}
			else 
			{
				// auction is in a status that does not allow bids to be placed
				revert("Bid cannot be accepted, auction has not yet started or has finished already");
			}
		}
		
		// DISABLED UNTIL CONTRACT SETUP IS FIXED
		// //transfer bid amount into escrow			
		// if(!transferBidAmountIntoEscrow(_auctionId, tx.origin,_bidAmountInWei))	
			// {	
			// // function returned false = issue in escrow function
			// revert("Error while transfering tokens into escrow.");
			// }		
		
		// update auction 
		auctions[_auctionId].highBid.bidAmountInWei = _bidAmountInWei;
		auctions[_auctionId].highBid.bidder = _msgSender();
	
		// emit event
		emit NewHighBid (_auctionId, _bidAmountInWei, _msgSender());

		return true;
	}



    /**
     * @notice Returns information about the current high bid for the given auction ID
     * 
     * @param _auctionId the ID of the auction 
     * 
     * @return bidder the address if the bidder that placed this bid
     * @return bidAmountInWei the bid amount in Wei
     * @return registeredAtBlock the block timestamp this bid was registered at
     * @return escrowActive	shows if funds for this bid have been placed in escrow (true/false)
     * 
     */	
	function getHighBid(uint64 _auctionId)
	external
	view
	validAuctionId(_auctionId)
	returns (address bidder, uint bidAmountInWei, uint registeredAtBlock, bool escrowActive)
	{
		bidder = auctions[_auctionId].highBid.bidder;
		bidAmountInWei = auctions[_auctionId].highBid.bidAmountInWei;
		registeredAtBlock = auctions[_auctionId].highBid.registeredAtBlock;
		escrowActive = auctions[_auctionId].highBid.escrowActive;		
	}
	


}