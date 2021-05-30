const AuctionManagement = artifacts.require('AuctionManagement')
const Escrow = artifacts.require('Escrow')
const NFTbC = artifacts.require('NFTbC')
const ERC721 = artifacts.require('ERC721')
const truffleAssert = require('truffle-assertions');

require('chai')
	.use(require('chai-as-promised'))
	.should()
	
function toWei(n){
	return web3.utils.toWei(n, 'Ether');
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
    }



contract('Escrow', accounts => {
	let result;
	let auctionManagement;
	
	let owner = accounts[0];
	let bidder = accounts[1];
	let buyer = accounts[2];
	let bidder2 = accounts[3];
	let buyer2 = accounts[4];
	let delegate = accounts[5];	
	let seller = accounts[6];
	
	// Create test data

	let name = 'ERC721'
	let symbol = 'ERC'
	let auctionId = 0;
	let bidAmountInWei = toWei('10');
	let totalSupply = toWei('100');
	//let tokenAddress = accounts[2];
	let currentTimeInUnixEpochSeconds = Math.round(Date.now() / 1000);

	
	// const chance = new Chance();
	
	before(async () => {
		// load smart contracts
		nftbc = await NFTbC.new(totalSupply);
		escrow = await Escrow.new(nftbc.address);
		eRC721 = await ERC721.new(name, symbol);
		auctionManagement = await AuctionManagement.new(nftbc.address)

		//transfer 10 payment tokens to bidder accounts
		await nftbc.transfer(bidder, toWei('10'), {from: owner})		
		await nftbc.transfer(bidder2, toWei('10'), {from: owner})

		
		// transfer NFT with ID 23 to seller
		result = await eRC721.safeTransferFrom(owner, seller, 23, {from: owner})
		// transfer NFT with ID 24 to seller
		result = await eRC721.safeTransferFrom(owner, seller, 24, {from: owner})	

		// create auction with auction ID 0
		await auctionManagement.createNewAuction(
				seller, "TestTitle1", "TestDesc1", 0 ,100, currentTimeInUnixEpochSeconds+100, 
				currentTimeInUnixEpochSeconds+5000, 23, eRC721.address, {from: seller});
		// create auction with auction ID 1
		await auctionManagement.createNewAuction(
				seller, "TestTitle2", "TestDesc2", 0 ,100, currentTimeInUnixEpochSeconds+100, 
				currentTimeInUnixEpochSeconds+5000, 23, eRC721.address, {from: seller});		

	})
	

    beforeEach(async function () {
    });	

	
		
	describe('check initial contract setup', async () => {
			
		it('registers payment token correctly', async () => {
				result = await escrow.paymentToken()
				assert.equal(result.toString(), nftbc.address, 'PaymentToken was not correctly registered');				
		})		
		
	})
	
	
	describe('check function transferBidAmountIntoEscrow()', async () => {
			
		it('transfers bid amount correctly', async () => {
			// check balances before transfer
				// balance of escrow contract
			result = await nftbc.balanceOf(escrow.address)
			assert.equal(result.toString(), 0, "Contract's balance in payment token is incorrect before transfer")
				// balance of bidder
			result = await nftbc.balanceOf(bidder)
			assert.equal(result.toString(), toWei('10'), "Bidder's balance in payment token is incorrect before transfer")
				
			// check approvals before transfer
			result = await nftbc.allowance.call(bidder, escrow.address)
			assert.equal(result.toString(), 0, 'Approval already registered before transfer')
			
			// Register new approval to spend tokens
			await nftbc.approve(escrow.address, toWei('10'), {from:bidder})
			// check if approval was registered correctly
			result = await nftbc.allowance.call(bidder, escrow.address)
			assert.equal(result.toString(), toWei('10'), 'Approval was not correctly registered during transfer')
			result = await nftbc.allowance.call(escrow.address, bidder)
			assert.equal(result.toString(), 0, 'Approval was not correctly registered during transfer')

			// check if transfer is rejected with wrong parameters
					// higher than approved amount	
			await truffleAssert.reverts(escrow.transferBidAmountIntoEscrow.call(
				auctionId, bidder, bidAmountInWei+1, {from: owner}))
					// wrong account as bidder
			await truffleAssert.reverts(escrow.transferBidAmountIntoEscrow.call(
				auctionId, delegate, bidAmountInWei, {from: owner}))	
				
			// conduct transfer  (non-persistent first to get correct return value, then persistent call to alter state)
			result = await escrow.transferBidAmountIntoEscrow.call(
				auctionId, bidder, bidAmountInWei, {from: owner})			// non-persistent call, does not change state but provides return value	
			assert.equal(result.toString(), 'true', 'Error while transfering bid amount into escrow')	
			await escrow.transferBidAmountIntoEscrow(
				auctionId, bidder, bidAmountInWei, {from: owner})			// persistent call to change the blockchain state					
			
			// check if approval has been removed
			result = await nftbc.allowance.call(bidder, escrow.address)
			assert.equal(result.toString(), 0, 'Approval was not removed after transfer')			
			
			// check balances
				// balance of escrow contract
			result = await nftbc.balanceOf(escrow.address)
			assert.equal(result.toString(), toWei('10'), "Contract's balance in payment token is incorrect after transfer")
				// balance of bidder
			result = await nftbc.balanceOf(bidder)
			assert.equal(result.toString(), 0, "Bidder's balance in payment token is incorrect after transfer")
				// balance of owner
			result = await nftbc.balanceOf(owner)
			assert.equal(result.toString(), toWei('80'), "owners's balance in payment token is incorrect after transfer")			
	
			// check payment in escrow log
			result = await escrow.checkAuctionLog.call(0, bidder, bidAmountInWei)
			assert.equal(result.toString(), 'true', 'issue')
			
			// should fail: check of escrow log with bad parameters
			await truffleAssert.fails(escrow.checkAuctionLog.call(0, bidder, 15))
			await truffleAssert.fails(escrow.checkAuctionLog.call(1, bidder, 10))
			await truffleAssert.fails(escrow.checkAuctionLog.call(0, delegate, 10))
		})	
		
		it('does not transfer bid amount without prior approval', async () => {
			// check balance of escrow contract before transfer
			result = await nftbc.balanceOf(escrow.address)
			assert.equal(result.toString(), toWei('10'), 
				"Contract's balance in payment token is incorrect before transfer")
				
			// ensure that no approval exists before transfer
			result = await nftbc.allowance.call(bidder2, escrow.address)
			assert.equal(result.toString(), 0, 'Approval already registered before transfer')				

			// conduct transfer (should fail)
			await truffleAssert.reverts(escrow.transferBidAmountIntoEscrow(auctionId, bidder2, bidAmountInWei, {from: owner}),
				'nftbc: allowance insufficient');
		})	
	})	

	describe('check function transferTokenIntoEscrow()', async () => {
			
		it('does not transfer token without prior approval', async () => {
			// check ownership of token ID 24 before transfer
			result = await eRC721.ownerOf.call(24)			
			assert.equal(result.toString(), seller, 'Owner of token ID 24 is incorrect before escrow');	
				
			// check operator approval before transfer
			result = await eRC721.getApproved.call(24)
			assert.notEqual(result.toString(), escrow.address, 'Token approval already registered before transfer')					
			
			// check operator approval before transfer
			result = await eRC721.isApprovedForAll.call(seller, escrow.address)
			assert.equal(result.toString(), 'false', 'Operator approval already registered before transfer')				

			// request escrow for token
			await truffleAssert.reverts(escrow.transferTokenIntoEscrow(1, seller, eRC721.address, 24, {from: seller}),
				'ERC721: transfer caller is not owner nor approved');

		})
			
		it('transfers token into escrow with prior token approval by seller', async () => {
			// check ownership of token ID 23 before transfer
				// seller address
				result = await eRC721.ownerOf.call(23)			
				assert.equal(result.toString(), seller, 'Owner of token ID 23 is incorrect before escrow');	
				
			// check token approval before transfer
			result = await eRC721.getApproved.call(23)
			assert.notEqual(result.toString(), escrow.address, 'Token approval already registered before transfer')					
			
			// check operator approval before transfer
			result = await eRC721.isApprovedForAll.call(seller, escrow.address)
			assert.equal(result.toString(), 'false', 'Operator approval already registered before transfer')		
			
			// Register new approval for this contract to transfer token ownership
			await eRC721.approve(escrow.address, 23, {from:seller})		

			// check token approval before transfer
			result = await eRC721.getApproved.call(23)
			assert.equal(result.toString(), escrow.address, 'Token approval not correctly registered before transfer')				

			// request escrow for token
			result = await escrow.transferTokenIntoEscrow(0, seller, eRC721.address, 23, {from: seller});
			
			// check ownership of token ID 23 after transfer	
			result = await eRC721.ownerOf.call(23)			
			assert.equal(result.toString(), escrow.address, 'Owner of token ID 23 is incorrect after escrow');
				
			// check tokenEscrowStatus
			// TODO

		})	
		
		it('transfers token into escrow with prior operator approval by seller', async () => {
			// check ownership of token ID 24 before transfer
				// seller address
				result = await eRC721.ownerOf.call(24)			
				assert.equal(result.toString(), seller, 'Owner of token ID 24 is incorrect before escrow');	
				
			// check operator approval before transfer
			result = await eRC721.getApproved.call(24)
			assert.notEqual(result.toString(), escrow.address, 'Token approval already registered before transfer')					
			
			// check operator approval before transfer
			result = await eRC721.isApprovedForAll.call(seller, escrow.address)
			assert.equal(result.toString(), 'false', 'Operator approval already registered before transfer')		
			
			// Register new operator approval for token ID 24
			await eRC721.setApprovalForAll(escrow.address, true, {from:seller})					

			// request escrow for token
			result = await escrow.transferTokenIntoEscrow(1, seller, eRC721.address, 24, {from: seller});
			
			// check ownership of token ID 24 after transfer	
			result = await eRC721.ownerOf.call(24)			
			assert.equal(result.toString(), escrow.address, 'Owner of token ID 24 is incorrect after escrow');
				
			// check tokenEscrowStatus
			// TODO		
		})

	})	
	
})
