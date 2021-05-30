const NFTbC = artifacts.require('NFTbC')
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



contract('NFTbC', accounts => {
	let result;
	let auctionManagement;
	
	let owner = accounts[0];
	let seller = accounts[1];
	let buyer = accounts[2];
	let seller2 = accounts[3];
	let buyer2 = accounts[4];
	let delegate = accounts[5];
	
	// Create test data

	let name = 'NFTbC ERC20'
	let symbol = 'NFTbC20'
	let decimals = 18
	let totalSupply = 100;
	//let tokenAddress = accounts[2];

	
	// const chance = new Chance();
	
	before(async () => {
		// load smart contracts
		nftbc = await NFTbC.new(totalSupply);
	})
	

    beforeEach(async function () {
		
		// transfer 10 coins from owner to each seller1 and seller2
		// nftbc = await NFTbC.new(totalSupply);
    });	

	
		
	describe('check if contract has been correctly set up', async () => {
			
		it('has correct name', async () => {
				result = await nftbc.name()
				assert.equal(result.toString(), name, 'Contract name does not match');				
		})	
		
		it('has correct symbol', async () => {
				result = await nftbc.symbol()
				assert.equal(result.toString(), symbol, 'Contract symbol does not match');					
		})		
		
		it('has correct decimals', async () => {
				result = await nftbc.decimals()
				assert.equal(result.toString(), 18, 'Contract decimals do not match');				
		})				
			
		it('has correct total supply', async () => {
				result = await nftbc.totalSupply()
				assert.equal(result.toString(), totalSupply, 'Total supply is incorrect');					
		})				

		it("total supply was assigned to owners's account", async () => {
				// balance of owner should be totalSupply
				result = await nftbc.balanceOf(owner)
				assert.equal(result.toString(), totalSupply, "Total supply was not assigned to owner's account");
				// balance of any other address should be 0
				result = await nftbc.balanceOf(buyer)
				assert.equal(result.toString(), 0, "Error in balanceOf function");
				result = await nftbc.balanceOf(seller2)
				assert.equal(result.toString(), 0, "Error in balanceOf function");				
		})			
	})
	
	describe('check functions approve() and allowance()', async () => {
		it('no approval registered in the beginning', async () => {
				result = await nftbc.allowance(owner, seller);
				assert.equal(result.toString(), 0, 'Allowance erroneously registered');		
				result = await nftbc.allowance(owner, buyer);
				assert.equal(result.toString(), 0, 'Allowance erroneously registered');		
				result = await nftbc.allowance(seller, buyer);
				assert.equal(result.toString(), 0, 'Allowance erroneously registered');		
				result = await nftbc.allowance(buyer, seller);
				assert.equal(result.toString(), 0, 'Allowance erroneously registered');		
				result = await nftbc.allowance(seller2, buyer2);
				assert.equal(result.toString(), 0, 'Allowance erroneously registered');					
				result = await nftbc.allowance(buyer2, seller2);
				assert.equal(result.toString(), 0, 'Allowance erroneously registered');				
		})

		it('registers new allowance correctly', async () => {
			// approve new  (persistent call first, then call that gives actual function return value
			await nftbc.approve(seller, 10, {from: owner});			// persistent call, changes state
			result = await nftbc.approve.call(seller, 10);			// non-persistent call, does not change state but provides return value	
			assert.equal(result.toString(), 'true', 'Error while approving new allowance');	
			
			await nftbc.approve(seller2, 15, {from: owner});		
			result = await nftbc.approve.call(seller2, 15);			
			assert.equal(result.toString(), 'true', 'Error while approving new allowance');	
			
			// check allowance
				// new allowance should be correctly registered
			result = await nftbc.allowance(owner, seller);
			assert.equal(result.toString(), 10, 'Allowance not registered correctly');

			result = await nftbc.allowance(owner, seller2);
			assert.equal(result.toString(), 15, 'Allowance not registered correctly');
			
				// additional tests to make sure nothing gets mixed up
			result = await nftbc.allowance(owner, buyer);
			assert.equal(result.toString(), 0, 'Allowance not registered correctly');
			result = await nftbc.allowance(seller, owner);
			assert.equal(result.toString(), 0, 'Allowance not registered correctly');

			// check balance of owner (should still be = totalSupply)
			result = await nftbc.balanceOf(owner)
			assert.equal(result.toString(), totalSupply, "Owner's balance incorrect after approval");
		})
		
		it('prevents registration of allowances when delegate is same address as owner', async () => {
			
			await truffleAssert.reverts(nftbc.approve(owner, 1, {from: owner}));
			await truffleAssert.reverts(nftbc.approve(buyer, 100, {from: buyer}));
		
		})
			
	})
		
	describe('check function transfer() ', async () => {

		it("correctly transfers 10 coins from owner to seller", async () => {
			// balance of owner should still be totalSupply
			result = await nftbc.balanceOf(owner);
			assert.equal(result.toString(), totalSupply, "Owner's balance incorrect before transfer");
			
			// transfer coins  (persistent call first, then call that gives actual function return value
			await nftbc.transfer(seller, 10, {from: owner});			// persistent call, changes state
			result = await nftbc.transfer.call(seller, 10);			// non-persistent call, does not change state but provides return value	
			assert.equal(result.toString(), 'true', 'Error while transfering tokens');	
			
			// balance of owner should be total supply - 10
			result = await nftbc.balanceOf(owner);
			assert.equal(result.toString(), totalSupply - 10, "Owner's balance incorrect after transfer");
			
			// balance of seller should be 10
			result = await nftbc.balanceOf(seller);
			assert.equal(result.toString(), 10, "Seller's balance incorrect after transfer");	
		})	
		
		it("fails when trying to transfer more coins than available balance", async () => {
			await truffleAssert.reverts(nftbc.transfer(seller, 101, {from: owner}));	
			await truffleAssert.reverts(nftbc.transfer(seller, 10000, {from: owner}));	
			
		})
		
		it("fails when trying to transfer 0 coins", async () => {
			await truffleAssert.reverts(nftbc.transfer(seller, 0, {from: owner}));
		})	
		
		it('prevents transfers when sender and receiver are the same address', async () => {
			
			await truffleAssert.reverts(nftbc.transfer(owner, 1, {from: owner}));
			await truffleAssert.reverts(nftbc.approve(buyer, 1, {from: buyer}));
		
		})
		
	})
		
	describe('check function transferFrom() ', async () => {
		it("transfers 10 coins on behalf of owner after approving allowance", async () => {
			// reset contract to start with clean state
			nftbc = await NFTbC.new(totalSupply);
			
			// check clean state before test
				// balance of owner should still be totalSupply
			result = await nftbc.balanceOf(owner);
			assert.equal(result.toString(), totalSupply, "Owner's balance incorrect before transferFrom");
			// balance of delegate should still be 0
			result = await nftbc.balanceOf(delegate);
			assert.equal(result.toString(), 0, "Delegate's balance incorrect before transferFrom");				
			// balance of buyer should still be 0
			result = await nftbc.balanceOf(buyer);
			assert.equal(result.toString(), 0, "Buyer's balance incorrect before transferFrom");				
				// check if no allowances are registered before test
			result = await nftbc.allowance.call(owner, delegate);
			assert.equal(result.toString(), 0, "Error: Allowance already registered before transferFrom test");
			
			// register new allowance
			await nftbc.approve(delegate, 10, {from: owner});
			
			// check if allowance has been registered
			result = await nftbc.allowance.call(owner, delegate);
			assert.equal(result.toString(), 10, "Error: Allowance was not correctly registered during transferFrom test");	

			// conduct transfer from wrong address = expect fail
			await truffleAssert.reverts(nftbc.transferFrom(owner, buyer, 10, {from: seller2}));	
			// conduct transfer from wrong address (owner himself) = expect fail
			await truffleAssert.reverts(nftbc.transferFrom(owner, buyer, 10, {from: owner}));	
			// conduct transfer with more tokens than approved = expect fail
			await truffleAssert.reverts(nftbc.transferFrom(owner, buyer, 11, {from: delegate}));	
			// conduct transfer with 0 token = expect fail
			await truffleAssert.reverts(nftbc.transferFrom(owner, buyer, 0, {from: delegate}));	
			// conduct transfer with same address for owner and buyer
			await truffleAssert.reverts(nftbc.transferFrom(buyer, buyer, 0, {from: owner}));	

			// conduct transfer
			result = await nftbc.transferFrom.call(owner, buyer, 10, {from: delegate});		// non persistent
			assert.equal(result.toString(), 'true', "Error in function transferFrom()");
			result = await nftbc.transferFrom(owner, buyer, 10, {from: delegate});			// persistent

			// Check balances
			result = await nftbc.balanceOf(owner);
			assert.equal(result.toString(), totalSupply - 10, "Owner's balance incorrect after transferFrom");
			// balance of delegate should still be 0
			result = await nftbc.balanceOf(delegate);
			assert.equal(result.toString(), 0, "Delegate's balance incorrect after transferFrom");				
			// balance of buyer should still be 0
			result = await nftbc.balanceOf(buyer);
			assert.equal(result.toString(), 10, "Buyer's balance incorrect after transferFrom");			
			
			// Check allowance
			result = await nftbc.allowance.call(owner, delegate);
			assert.equal(result.toString(), 0, "Error: Allowance was not correctly removed after transferFrom");	
		})	
		
		it("does not allow transfers without prior approval", async () => {
			// reset contract to start with clean state
			nftbc = await NFTbC.new(totalSupply);
			// check clean state before test
				// balance of owner should still be totalSupply
			result = await nftbc.balanceOf(owner);
			assert.equal(result.toString(), totalSupply, "Owner's balance incorrect before transferFrom");
			// balance of delegate should still be 0
			result = await nftbc.balanceOf(delegate);
			assert.equal(result.toString(), 0, "Delegate's balance incorrect before transferFrom");				
			// balance of buyer should still be 0
			result = await nftbc.balanceOf(buyer);
			assert.equal(result.toString(), 0, "Buyer's balance incorrect before transferFrom");				

				// check if no allowances are registered before test
			result = await nftbc.allowance.call(owner, delegate);
			assert.equal(result.toString(), 0, "Error: Allowance already registered before transferFrom test");	

			// conduct transfers without prior approval
			await truffleAssert.reverts(nftbc.transferFrom(owner, buyer, 1, {from: delegate}));
			await truffleAssert.reverts(nftbc.transferFrom(owner, buyer, 2, {from: owner}));
			await truffleAssert.reverts(nftbc.transferFrom(owner, buyer, 3, {from: buyer}));			
			await truffleAssert.reverts(nftbc.transferFrom(buyer, owner, 1, {from: delegate}));
			await truffleAssert.reverts(nftbc.transferFrom(buyer, owner, 2, {from: owner}));
			await truffleAssert.reverts(nftbc.transferFrom(buyer, owner, 3, {from: buyer}));
		})			
	})
		

	
})	

