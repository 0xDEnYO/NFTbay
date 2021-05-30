/**
* TODO:
*	- check out logging and builder EVM
*	https://medium.com/nomic-labs-blog/better-solidity-debugging-console-log-is-finally-here-fc66c54f2c4a
*	- r
*	- 


TODO FOR ALL CONTRACTS:
* Reduce gas consumption
* check pure/view assignment
* Update natspec comments
* Reduce contract sizes: https://soliditydeveloper.com/max-contract-size
*/




// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./AuctionDataModel.sol";
import "./Escrow.sol";
import "./NFTbC.sol";
import "./Bidding.sol";
import "./Settlement.sol";
import "./Pricing.sol";


/**
 * @title AuctionManagement
 * @notice Contains functions to create, adjust and close auctions.
 * 
 * @author d.blaecker@gmail.com
 */
contract AuctionManagement is Escrow, Bidding, Settlement, Pricing {

//---------------------------------------------------------------------
// EVENTS
    
    event AuctionCreated (uint64 auctionId);
    event AuctionRevoked (uint64 auctionId); 

	
//---------------------------------------------------------------------
// MODIFIERS   
    modifier onlySeller(uint64 _auctionId) {
        // Check if caller of the function is also the seller of the specified auction
        require(tx.origin == auctions[_auctionId].seller, "ADM:only seller");
        _;
    }    
    modifier onlyBidder(uint64 _auctionId) {
        // Check if caller of the function is the bidder
        require(tx.origin == auctions[_auctionId].seller, "ADM:only bidder");
        _;
    }

    modifier validToken(uint _tokenId, string memory tokenContract){
                                                                                // TODO: Add token validation
        _;
    } 
	
    modifier auctionLock(uint64 _auctionId){
        // check if auction is currently locked or in status revoked
        require(auctions[_auctionId].locked  == true, "ADM:auction locked");
		require(auctions[_auctionId].status != AuctionStatus.Revoked, "ADM:auction revoked");
		
		// lock auction object
		auctions[_auctionId].locked = true;
		
		// Execute function
		_;
			
		// unlock auction
		auctions[_auctionId].locked = false;
    } 


//---------------------------------------------------------------------
// VARIABLES  
	

    // counter that will provide auctionIds
    uint64 internal auctionIdCounter;



//---------------------------------------------------------------------
// FUNCTIONS   
  

  
	constructor(address _paymentToken) Escrow(_paymentToken){
		// TODO: Check if more action needed here
	}



    /**
     * @notice Creates a new auction
     * 
     * @param _seller  the address of the person selling the item
     * @param _auctionTitle the title (i.e. name) of the newly created auction
     * @param _auctionDesc the description of the auction item
     * @param _startPrice the start price of the newly created auction
     * @param _limitPrice the minimum price the auction must reach to sell (0 = no limit price)
     * @param _auctionStarts the epoch unix timestamp by which the auction is supposed to start (0 = immediately)
     * @param _auctionEnds the epoch unix timestamp by which the auction will end

     * @return _auctionId returns the id of the newly created auction
     * 
     * Emits an {AuctionCreated} event.
     */
     
    function createNewAuction(
        address _seller, 
        string memory _auctionTitle, 
        string memory _auctionDesc,
        uint _startPrice,
        uint _limitPrice, 
        uint64 _auctionStarts, 
        uint64 _auctionEnds,
        uint _tokenId,
        string memory _tokenContract)
        public
        //validToken(_tokenId, _tokenContract)				//TODO
        returns (uint64 _auctionId)
        {
        // Check input values
        // use require instead of assert to save user's gas fees
        require(_seller != address(0), "Seller cannot be 0 address");
        require(bytes(_auctionTitle).length != 0, "Auction title cannot be empty"); 
        require(bytes(_auctionDesc).length != 0, "Auction description cannot be empty");
        if (_limitPrice != 0){
            require(_limitPrice > _startPrice, "Limit price must either be 0 (=no limit price) or higher than start price");
        }
		require(bytes(_tokenContract).length != 0, "TokenContract cannot be empty");
		require(_auctionEnds > _auctionStarts, "Auction end date cannot be same as or before start date");
		
        // get new auctionId from auctionIdCounter
        _auctionId  = auctionIdCounter++;		
		
		// Create new auction object/struct
        Auction storage newAuction = auctions[_auctionId];
		
		// lock instance for access
		newAuction.locked = true;
		
        if(_auctionStarts == 0){
			// Auction starts immediately, assign status 'Started' and timestamp
			newAuction.status = AuctionStatus.Started;
            newAuction.auctionStarts = uint64(block.timestamp);
        } else{
            // auction has a future start date
            require(_auctionStarts >= uint64(block.timestamp), "Auction start date must be in the future");
			newAuction.status = AuctionStatus.Created;
			newAuction.auctionStarts = _auctionStarts;
        }


            
		// Assign input parameter values to struct members
		newAuction.auctionId = _auctionId;
		newAuction.seller = _seller;
		newAuction.auctionTitle = _auctionTitle;
		newAuction.auctionDesc = _auctionDesc;
		newAuction.startPrice = _startPrice;
		newAuction.limitPrice = _limitPrice;
		newAuction.auctionEnds = _auctionEnds;
		newAuction.token.tokenId = _tokenId;
		newAuction.token.tokenContract = parseStringToAddress(_tokenContract);
		
        // emit auction created event
        emit AuctionCreated(newAuction.auctionId);
        
		// unlock file
		newAuction.locked = false;
		
        // return auctionId
        return _auctionId;
    }
	
	
    
    // COMPLETED FUNCTIONS
    /**
     * @dev Adds a new image to an existing auction
     * 
     * Images must be uploaded to IPFS and onlythe image hash will be stored on-chain
     *
     * Returns the position of the new image in the auction gallery (first position = 0)
     */
    // function addImage(        
    //     uint64 _auctionId, 
    //     string memory _imageName,
    //     string memory _imageHash) 
    //     external
    //     validAuctionId(_auctionId)
    //     onlySeller(_auctionId)
    //     returns (uint8)
    //     {
    //         // perform input parameter checks
    //         require(bytes(_imageName).length != 0, "Image name cannot be empty");
    //         require(bytes(_imageHash).length != 0, "Image hash cannot be empty");
            
    //         // saving gas fees by looping instead of saving the count of images in storage
    //         // loop through image mapping to see which is the last position that contains an image
    //         //TODO: Looping will not save gas (since ts not a view vfunction). Change it.
    //         uint8 counter = 0;
    //         Image memory _image;
    //         do{
    //             // get image on counter position
    //             _image = auctions[_auctionId].images[counter++];
                
    //           // continue loop while image hash is not empty (= there is an image at that position)
    //         } while (bytes(_image.imageHash).length != 0);
            
    //         // add image to last position
    //         auctions[_auctionId].images[counter] = Image(_imageName, _imageHash);
            
    //         return counter;
    //     }
        
    
    // /**
     // * @dev Internal function that delivers all images of an auction in an array
     // * 
     // * @param _auctionId the ID of the auction
     // *
     // * @return images a string array containing all (IPFS) image hashes associated with the given auctionID
     // */
    // function _getAuctionImages(uint64 _auctionId) 
    // internal
    // validAuctionId(_auctionId)
    // returns (string[] memory images)
    // {
    //     // Create immage array that will include all the images of the given auction
    //     // Image[] images;                                                        //TODO: not required since in function signature? CHECK!
        
    //     // create counter for while loop
    //     uint8 counter = 0;
        
    //     // get auction image at counter positon, check if imagehash is not empty
    //     // continue loop while image hash is not empty (= there is an image at that position)
    //     while (bytes(auctions[_auctionId].images[counter].imageHash).length != 0){
    //         // add image to image array and increase counter
    //         images[counter] = auctions[_auctionId].images[counter++];
    //     }
        
    //     return images;
    // }
    
     // /**
     // * @dev Swaps the position of two images for a given auction
     // * 
     // * Position 0 (i.e. the first image) will be the main image
     // * 
     // * @param _auctionId the ID of the auction
     // * @param _imageFrom the position of the first image to be swapped
     // * @param _imageTo the position of the second image to be swapped
     // *
     // */   
    // function swapImagePosition(
    //     uint64 _auctionId,
    //     uint8 _imageFrom, 
    //     uint8 _imageTo) 
    // public
    // validAuctionId(_auctionId)
    // onlySeller(_auctionId)
    // {
    //                                                                     // TODO: add checks for image parameters (NECESSARY???)
    //     // temporarily store image in To position
    //     Image memory toImage = auctions[_auctionId].images[_imageTo];
        
    //     // get image on From position and save in To position
    //     auctions[_auctionId].images[_imageTo] = auctions[_auctionId].images[_imageFrom];
        
    //     // save temporarily stored image in From position
    //     auctions[_auctionId].images[_imageFrom] = toImage;
        
    // }



    /**
     * @notice Returns all essential information for the auction that matches the provided auctionID 
     * 
     * @param _auctionId the ID of the auction that should be returned
     * 
     * @return _auction  returns the auction object with all essential information
     * 
     * Emits an {AuctionCreated} event.
     */
    function getAuction(
        uint64 _auctionId) 
        public
        view
        validAuctionId(_auctionId)
        returns (Auction memory _auction)
        {
            return auctions[_auctionId];
        }
    
    /**
     * @dev Revokes a newly created auction if there are no bids on it yet
     * 
     * @param _auctionId the ID of the auction
     *
     * @return _success returns true if the auction was revoked successfully
     * 
     * Emits an {AuctionCreated} event.
     */
    function revokeAuction(uint64 _auctionId) 
    external
    validAuctionId(_auctionId)
    onlySeller(_auctionId)
    returns (bool _success)
    {
        
        // check if auction has status "Created" or "Started"  -> can be immediately revoked
        if(auctions[_auctionId].status == AuctionStatus.Created || 
            auctions[_auctionId].status == AuctionStatus.Started){
                
            // auction is in status created and has no bids
            // set auction status to "Revoked"
            auctions[_auctionId].status = AuctionStatus.Revoked;
            
            // emit event
            emit AuctionRevoked(_auctionId);
                
            return true;
        }


        // auction has a different status than "Created" or "Started" and cannot be revoked
        return false;
    }
	
	
	 /**
     * @notice Returns information about the current high bid for the given auction ID
     * 
     * @param _auctionId the ID of the auction 
     * 
     * @return highBid returns the highest bid for the given auction ID
     * 
     */	
	function _getHighBid(uint64 _auctionId)
	internal
	view
	validAuctionId(_auctionId)
	returns (Bid storage highBid)
	{
		highBid = auctions[_auctionId].highBid;
	}
   
   
   // TODO: POTENTIALLY MOVE INTO UTIL/STRING LIBRARY
   
 	function parseStringToAddress(string memory _a) 
	internal 
	pure 
	returns (address _parsedAddress) {
		bytes memory tmp = bytes(_a);
		uint160 iaddr = 0;
		uint160 b1;
		uint160 b2;
		for (uint i = 2; i < 2 + 2 * 20; i += 2) {
			iaddr *= 256;
			b1 = uint160(uint8(tmp[i]));
			b2 = uint160(uint8(tmp[i + 1]));
			if ((b1 >= 97) && (b1 <= 102)) {
				b1 -= 87;
			} else if ((b1 >= 65) && (b1 <= 70)) {
				b1 -= 55;
			} else if ((b1 >= 48) && (b1 <= 57)) {
				b1 -= 48;
			}
			if ((b2 >= 97) && (b2 <= 102)) {
				b2 -= 87;
			} else if ((b2 >= 65) && (b2 <= 70)) {
				b2 -= 55;
			} else if ((b2 >= 48) && (b2 <= 57)) {
				b2 -= 48;
			}
			iaddr += (b1 * 16 + b2);
		}
		return address(iaddr);
	}

    
}