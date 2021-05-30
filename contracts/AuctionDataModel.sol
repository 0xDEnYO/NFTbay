/**
* TODO:
*	- add bidding steps 
*		>> percentage amount of bidding
*/




// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

/**
 * @title AuctionDataModel
 * @notice 
 * 
 * @author d.blaecker@gmail.com
 */
contract AuctionDataModel is Context, Ownable{
  

//---------------------------------------------------------------------
// MODIFIERS    
    modifier validAuctionId(uint64 _auctionId){
        // check if this auction object has a title i.e. exists
        require(bytes(auctions[_auctionId].auctionTitle).length != 0, "ADM:invalid auction id");
        _;
    }  
    
	
//---------------------------------------------------------------------
// VARIABLES
	

    
    // mapping that will store all auctions
    mapping (uint => Auction) public auctions;
	
	// create enum for auction status
    /// enum values (0...5) = { Created, Revoked, Started, HasBids, Ended, Settled }
    enum AuctionStatus {Created, Revoked, Started, HasBids, Ended, Settled }
	

    // mapping that will store all active auctions  (auctionId => true/false)
    // active = AuctionStatus "Created", "Started" or "HasBids"
    // inactive = AuctionStatus "Revoked", "Ended" or "Settled"
    uint64[] internal activeAuctions;                       	
	//TODO: do i need this? or better loop through all and mark as view?
	//TODO: Add functionality to fill this variable
	
    // struct for product images that have been uploaded to IPFS
    struct Image{
      string imageTitle;
      string imageHash;                                    //TODO: do I need any other information about images????
    }


	// the Token struct represents an ERC721 token that should be auctioned
	struct Token{
	
		uint tokenId;
		
		address tokenContract; 
		
		string tokenImage;
		
		bool escrowActive;
	}
    
    /// the "bid" struct represents one bid on a specific auction item
    struct Bid{
        address bidder;
        
        uint bidAmountInWei;
        uint registeredAtBlock;
		
		bool escrowActive;
    }
	
    // struct for auction objects
    // grouped by type to reduce gas fees
    struct Auction {
        
        uint64 auctionId;			//TODO: remove > redundant
        uint64 auctionStarts;
        uint64 auctionEnds;
        
        uint startPrice;
        uint limitPrice;
        
        string auctionTitle;
        string auctionDesc;
     
        address seller;
			
		bool locked;
        
        AuctionStatus status;
		
		Bid highBid;
		
		Token token;
    }


//---------------------------------------------------------------------
// EVENTS
    event AuctionStatusChanged (uint64 auctionId, string oldStatus, string newStatus);
    
//---------------------------------------------------------------------
// UTIL FUNCTIONS    
    function _auctionStatusToString(AuctionStatus _status)
	public 
	pure
	returns (string memory auctionStatus)
	{
		if(_status == AuctionStatus.Created){
		return "Created";
		}		
		if(_status == AuctionStatus.Revoked){
		return "Revoked";
		}		
		if(_status == AuctionStatus.Started){
		return "Started";
		}		
		if(_status == AuctionStatus.HasBids){
		return "HasBids";
		}		
		if(_status == AuctionStatus.Ended){
		return "Ended";
		}
		if(_status == AuctionStatus.Settled){
		return "Settled";
		}
	    
	    // return error message in case none of the cases above was valid
	    return "Error in auctionStatusToString()";
	}



	

   
    
}

