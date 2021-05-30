const AuctionManagement = artifacts.require('AuctionManagement')
const Escrow = artifacts.require('Escrow')
const NFTbC = artifacts.require('NFTbC')
const truffleAssert = require('truffle-assertions');

require('chai')
	.use(require('chai-as-promised'))
	.should()
	
function tokens(n){
	return web3.utils.toWei(n, 'Ether');
}

contract('AuctionManagement', accounts => {
	let result;
	let auctionManagement;
	
	let seller = accounts[0];
	let bidder = accounts[1];
	let buyer = accounts[2];
	
	// Create test data
    let title = 'TestTitle';
    let desc  = 'TestDesc';
	let startprice = 0;
	let limitprice = 100;
    //let auctionStarts = Math.round(Date.now() / 1000) + 500;
    let auctionStarts = Math.round(Date.now() / 1000) + 500;
    let auctionEnds = Math.round(Date.now() / 1000) + 5000;
    let tokenId = 12104279;
    let tokenContract = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';
	let zeroAddress = 	'0x0000000000000000000000000000000000000000';
	//let tokenAddress = accounts[2];

	
	// const chance = new Chance();
	
	
	before(async () => {
		// load smart contracts
		auctionManagement = await AuctionManagement.new(tokenContract)
		nftbc = await NFTbC.new(50000);
		escrow = await Escrow.new(nftbc.address);
		
		// create 3 test auctions
		//1 
		await auctionManagement.createNewAuction(
				seller, "TestTitle1", "TestDesc1", 0 ,100, auctionStarts, 
				auctionEnds, tokenId, tokenContract, {from: seller});
				
		//2 
		await auctionManagement.createNewAuction(
				seller, "TestTitle2", "TestDesc2", 100,200, auctionStarts, 
				auctionEnds, 12104280, tokenContract, {from: seller});
				
		//3 
		// has start date 0 = should start immediately after setup
		await auctionManagement.createNewAuction(
				seller, "TestTitle3", "TestDesc3", 100,101, 0, 
				auctionEnds, 0, tokenContract, {from: seller});
	})
	
	beforeEach(async () => {


	})
		describe('check correct assignment of values to data model', async () => {
			it('checking data of test auction #1', async () => {
				result = await auctionManagement.getAuction(0)
				result.auctionTitle.should.equal('TestTitle1');
				result.auctionDesc.should.equal('TestDesc1');
				result.startPrice.should.equal('0');
				result.limitPrice.should.equal('100');								
				assert.equal(result.auctionStarts, auctionStarts, 'AuctionStarts date did not match')
				result.auctionStarts.should.equal(String(auctionStarts));			
				result.auctionEnds.should.equal(String(auctionEnds));
				//result.auctionEnds.should.equal(auctionEnds);		//TODO Why does this test fail?
				result.token.tokenId.should.equal('12104279');
				result.token.tokenId.should.equal(String(tokenId));
				//result.token.tokenContract.should.equal('0x627306090abaB3A6e1400e9345bC60c78a8BEf57');
				assert.equal(result.token.tokenContract, tokenContract, 'TokonContract string did not match')
				result.status.should.equal('0');
			})
			
			it('checking data of test auction #2', async () => {
				result = await auctionManagement.getAuction(1)
				result.auctionTitle.should.equal('TestTitle2');
				result.auctionDesc.should.equal('TestDesc2');
				result.startPrice.should.equal('100');
				result.limitPrice.should.equal('200');
				result.auctionStarts.should.equal(String(auctionStarts));			
				result.auctionEnds.should.equal(String(auctionEnds));
				result.token.tokenId.should.equal(String(12104280));
				result.token.tokenContract.should.equal(String(tokenContract));
				result.status.should.equal('0');
			})
			
			it('checking data of test auction #3', async () => {
				result = await auctionManagement.getAuction(2)
				result.auctionTitle.should.equal('TestTitle3');
				result.auctionDesc.should.equal('TestDesc3');
				result.startPrice.should.equal('100');
				result.limitPrice.should.equal('101');
				//result.auctionStarts.should.equal(String(auctionStarts));			
				result.auctionEnds.should.equal(String(auctionEnds));
				result.token.tokenId.should.equal(String(0));
				result.token.tokenContract.should.equal(String(tokenContract));
				result.status.should.equal('2');  // Status: STARTED
			})
		})
	
		describe('test function getAuction()', async () => {
			// All tests depends on 3 test auctions being created before test execution
			it('returns correct object for auctionId=0', async () => {				
			result = await auctionManagement.getAuction.call(0);
			assert.equal(result.auctionId, '0', 'Wrong auctionId returned by getAuction() function');
			})
		
			it('returns correct object for auctionId=1', async () => {				
			result = await auctionManagement.getAuction.call(1);
			assert.equal(result.auctionId, '1', 'Wrong auctionId returned by getAuction() function');
			})
		
			it('returns correct object for auctionId=2', async () => {				
			result = await auctionManagement.getAuction.call(2);
			assert.equal(result.auctionId, '2', 'Wrong auctionId returned by getAuction() function');
			})
		
		})
		
		describe('test function createNewAuction()', async () => {
			describe('check for correct return values (auctionId)', async () => {
				it('returns correct auctionId (3)', async () => {
					//
					result = await auctionManagement.createNewAuction.call(
						seller, title, desc, startprice,limitprice, auctionStarts, 
						auctionEnds, tokenId, tokenContract, {from: seller});
					(result.toString()).should.equal('3');
				
				})
				
				it('emits event with auctionId (3) and increases auctionIdCount on auction creation', async () => {	
				// This test depends on 3 test auctions being submitted before execution				
					result = await auctionManagement.createNewAuction(
						seller, title, desc, startprice,limitprice, auctionStarts, 
						auctionEnds, tokenId, tokenContract, {from: seller});
					truffleAssert.eventEmitted(result, 'AuctionCreated', (ev) => {
					return ev.auctionId == 3;
					})
				})

				it('returns correct auctionId (4)', async () => {					
					result = await auctionManagement.createNewAuction.call(
						seller, title, desc, startprice,limitprice, auctionStarts, 
						auctionEnds, tokenId, tokenContract, {from: seller});
					(result.toString()).should.equal('4');
				})						
			})
			
			describe('check correct detection of invalid input parameters', async () => {
				it('sent from 0 address', async () => {										
					await truffleAssert.reverts(auctionManagement.createNewAuction.call(
					zeroAddress, title, desc, startprice,limitprice, auctionStarts, 
					auctionEnds, tokenId, tokenContract, {from: seller}), 'Seller cannot be 0 address');	
				})
				
				it('auction title empty', async () => {			
					await truffleAssert.reverts(auctionManagement.createNewAuction.call(
					seller, "",  desc, startprice,limitprice, auctionStarts, 
					auctionEnds, tokenId, tokenContract, {from: seller}), 'Auction title cannot be empty');
				})				
								
				it('auction description empty', async () => {			
					await truffleAssert.reverts(auctionManagement.createNewAuction.call(
					seller, title, '', startprice,limitprice, auctionStarts, 
					auctionEnds, tokenId, tokenContract, {from: seller}), 'Auction description cannot be empty');
				})	
				
				it('starting price below 0', async () => {				
					await truffleAssert.fails(auctionManagement.createNewAuction.call(
					seller, title, desc, '-1',limitprice, auctionStarts, 
					auctionEnds, tokenId, tokenContract, {from: seller}));
				})				
								
				it('limit price below 0', async () => {									// TODO: Check if I really need to test these cases that EVM prevents			
					await truffleAssert.fails(auctionManagement.createNewAuction.call(
					seller, title, desc, startprice,'-1', auctionStarts, 
					auctionEnds, tokenId, tokenContract, {from: seller}));
				})

				it('limit price very (too) large number', async () => {			
					await truffleAssert.fails(auctionManagement.createNewAuction.call(
					seller, title, desc, startprice,'123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890', auctionStarts, 
					auctionEnds, tokenId, tokenContract, {from: seller}));
				})				
				
				it('auction end date equal to start date', async () => {			
					await truffleAssert.fails(auctionManagement.createNewAuction.call(
					seller, title, desc, startprice, limitprice, auctionStarts, 
					auctionStarts, tokenId, tokenContract, {from: seller}), 'Auction end date cannot be same as or before start date');
				})				
								
				it('auction end date before start date', async () => {			
					await truffleAssert.fails(auctionManagement.createNewAuction.call(
					seller, title, desc, startprice, limitprice, auctionStarts, 
					auctionStarts-1, tokenId, tokenContract, {from: seller}), 'Auction end date cannot be same as or before start date');
				})				
				
			})
			
		})	
			
		describe('test function revokeAuction()', async () => {
			// All tests depends on 3 test auctions being created before test execution
			it('returns correct object for auctionId=1 with AuctionStatus=0', async () => {	
			// make sure auctionId = 1 exists with status 0 before revocation
			result = await auctionManagement.getAuction.call(1);
			assert.equal(result.auctionId, '1');
			assert.equal(result.status, '0', 'Auction with ID 0 does not exist or has other status than 0');
			})
		
			it('revokes auction with ID=1 and emits event', async () => {	
			// revoke auction with ID 1		
			result = await auctionManagement.revokeAuction(1);
			truffleAssert.eventEmitted(result, 'AuctionRevoked', (ev) => {
				return ev.auctionId == 1;
				})			
			})
		
			it('auction with ID 1 now has status "Revoked (1)"', async () => {	
			// revoke auction with ID 1		
			result = await auctionManagement.getAuction.call(1);
			assert.equal(result.auctionId, '1');
			assert.equal(result.status, '1');
			})
		
		})
				
		describe('test modifiers', async () => {
			// All tests depends on 3 test auctions being created before test execution
			it('test modifier onlySeller allows execution by seller', async () => {	
			// call auction as seller
			truffleAssert.passes(auctionManagement.revokeAuction(0,{from: seller}));
			})

			it('test modifier onlySeller prevents execution by other addresses', async () => {	
			// call auction as seller
			//console.log(await auctionManagement.revokeAuction(2);
			await truffleAssert.reverts(auctionManagement.revokeAuction(2,{from: bidder}), 
				'This function is only available to the seller of the item');			
			})
			
			it('test modifier validAuctionId allows execution with valid auctionId', async () => {	
			truffleAssert.passes(auctionManagement.getAuction(0));
			})

			it('test modifier validAuctionId prevents execution with invalid auctionId', async () => {	
			await truffleAssert.reverts(auctionManagement.getAuction(5,{from: bidder}), 
				'Invalid auction ID provided');			
			})
	
		
		})
		
	describe.skip('check function placeNewBidWithEscrow()', async () => {
			
		it('place one bid and see if it registers properly', async () => {
			//Create clean test auction
			//non-persistent call to get return value (=new auction ID )
			let newAuctionId = await auctionManagement.createNewAuction.call(
				seller, "TestTitle1", "TestDesc1", 0 ,100, 0, 
				auctionEnds, tokenId, tokenContract, {from: seller});
			// persistent call to actually create auction 
			result = await auctionManagement.createNewAuction(
				seller, "TestTitle1", "TestDesc1", 0 ,100, 0, 
				auctionEnds, tokenId, tokenContract, {from: seller});	
			
			// check if new auction was correctly set up
			result = await auctionManagement.getAuction.call(newAuctionId);
			assert.equal(result.auctionId, newAuctionId, 'Auction IDs do not match');
			assert.equal(result.status, '2', 'Auction with ID 0 is not in status "started"');
			
			// register new allowance for escrow contract to spend token
			await nftbc.approve(escrow.address, 10, {from: owner});
			
			// place bid on auction
			await auctionManagement.placeNewBidWithEscrow(newAuctionId, 10, {from: owner});
			
			
			// result = await auctionManagement.getAuction.call(1);
			// assert.equal(result.auctionId, '1', 'Auction with ID 0 does not exist');			
			// assert.equal(result.status, '0', 'Auction with ID 1 is not in status "created"');
			// result = await auctionBidding.placeNewBidWithEscrow(0, 1243234536546);
				
		})				
	})
		
})
