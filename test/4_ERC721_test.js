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



contract('ERC721', accounts => {
	let result;
	
	let owner = accounts[0];
	let seller = accounts[1];
	let buyer = accounts[2];
	let seller2 = accounts[3];
	let buyer2 = accounts[4];
	let delegate = accounts[5];
	let buyer3 = accounts[6];
	let zeroAddress = '0x0000000000000000000000000000000000000000'
	
	// Create test data

	let name = 'ERC721'
	let symbol = 'ERC'
	
	before(async () => {
		// load smart contracts
		nftbc = await NFTbC.new(100000);
		escrow = await Escrow.new(nftbc.address);
		eRC721 = await ERC721.new(name, symbol);
	})
	

    beforeEach(async function () {
    });	

	
		
	describe('check if contract has been correctly set up', async () => {
			
		it('has correct name', async () => {
				result = await eRC721.name()
				assert.equal(result.toString(), name, 'Contract name does not match');				
		})	
		
		it('has correct symbol', async () => {
				result = await eRC721.symbol()
				assert.equal(result.toString(), symbol, 'Contract symbol does not match');					
		})						
			
	})		
	
	describe.skip('check correct implementation of EIP-165', async () => {
			
		it('confirms support for IERC721', async () => {
			
		})				
		it('confirms support for ERC165', async () => {

		})	
		
		it('confirms support for IERC721Metadata', async () => {

		})						
			
	})
	
	describe('check token issuance', async () => {
			
		it('issues 30 tokens (ID 0 - 29) on contract creation', async () => {
			result = await eRC721.balanceOf.call(owner)
			assert.equal(result.toString(), 30, 'Number of tokens owned by owner is incorrect after contract creation');				
		})	
		
		it("has 0 balance for any other address than the owner's", async () => {			
			result = await eRC721.balanceOf.call(owner)			
			assert.equal(result.toString(), 30, 'Number of tokens owned by owner is incorrect after contract creation');	
			result = await eRC721.balanceOf.call(buyer)			
			assert.equal(result.toString(), 0, 'Number of tokens owned by buyer is incorrect after contract creation');	
			result = await eRC721.balanceOf.call(seller)			
			assert.equal(result.toString(), 0, 'Number of tokens owned by seller is incorrect after contract creation');	
			result = await eRC721.balanceOf.call(delegate)			
			assert.equal(result.toString(), 0, 'Number of tokens owned by delegate is incorrect after contract creation');				
		})	
					
		it('function ownerOf(tokenId) returns expected results', async () => {
			result = await eRC721.ownerOf.call(0)
			assert.equal(result.toString(), owner, 'TokenId 0 does not have a correct owner after contract creation');	
			result = await eRC721.ownerOf.call(1)
			assert.equal(result.toString(), owner, 'TokenId 1 does not have a correct owner after contract creation');	
			result = await eRC721.ownerOf.call(5)
			assert.equal(result.toString(), owner, 'TokenId 5 does not have a correct owner after contract creation');	
			result = await eRC721.ownerOf.call(29)
			assert.equal(result.toString(), owner, 'TokenId 29 does not have a correct owner after contract creation');	
			await truffleAssert.reverts(eRC721.ownerOf.call(30))
			await truffleAssert.reverts(eRC721.ownerOf.call(300))
			await truffleAssert.reverts(eRC721.ownerOf.call(233434))
			
		})						
	})
	
	describe('check function approve()', async () => {
		it('correctly registers approval for delegate', async () => {				
			// ensure that currently no token approval is registered for delegate
			result = await eRC721.getApproved.call(10)
			assert.notEqual(result.toString(), delegate, 'TokenId 10 has approval registered for delegate before approval was requested');				
			
			// register approval for delegate by owner of token ID 10
			await truffleAssert.passes(eRC721.approve(delegate, 10, {from: owner}))			
						
			// ensure that token approval is correctly registered 
			result = await eRC721.getApproved.call(10)
			assert.equal(result.toString(), delegate, 'Token approval for tokenId 5 for delegate was not registered correctly');

			// delete token approval
			await truffleAssert.passes(eRC721.approve(zeroAddress, 10, {from: owner}))				
		})
		
		it('correctly deletes approval for delegate', async () => {				
			// register approval for delegate by owner of token ID 10
			await truffleAssert.passes(eRC721.approve(delegate, 10, {from: owner}))			
						
			// ensure that token approval is correctly registered 
			result = await eRC721.getApproved.call(10)
			assert.equal(result.toString(), delegate, 'Token approval for tokenId 5 for delegate was not registered correctly');	
			
			// delete approval for delegate by owner of token ID 10
			await truffleAssert.passes(eRC721.approve(zeroAddress, 10, {from: owner}))	
						
			// ensure that token approval is removed
			result = await eRC721.getApproved.call(10)
			assert.notEqual(result.toString(), delegate, 'Token approval for tokenId 10 for delegate was not removed after deletion');				
			
		})

		it('prevents setting token approval from other address than owner/operator', async () => {

			// ensure that currently no operator approval is registered for buyer3
			result = await eRC721.isApprovedForAll.call(owner, buyer3)
			assert.equal(result.toString(), 'false', 'operator approval registered for delegate before approval was requested');
			// ensure that currently no token approvals are registered for buyer3
			result = await eRC721.getApproved.call(0)
			assert.notEqual(result.toString(), buyer3, 'token approval registered for delegate before approval was requested');
			result = await eRC721.getApproved.call(5)
			assert.notEqual(result.toString(), buyer3, 'token approval registered for delegate before approval was requested');
			result = await eRC721.getApproved.call(21)
			assert.notEqual(result.toString(), buyer3, 'token approval registered for delegate before approval was requested');


			//should fail: approval calls from unapproved sender
			await truffleAssert.reverts(eRC721.approve(buyer2, 0, {from: buyer3}),
				'ERC721: approve caller is not owner nor approved for all')	
			await truffleAssert.reverts(eRC721.approve(buyer2, 5, {from: buyer3}),
				'ERC721: approve caller is not owner nor approved for all')	
			await truffleAssert.reverts(eRC721.approve(buyer3, 21, {from: buyer3}),
				'ERC721: approve caller is not owner nor approved for all')	
		})		
	})
	
	describe('check function setApprovalForAll()', async () => {

		it('correctly registers operator approval for delegate', async () => {				
			// ensure that currently no operator approval is registered for delegate
			result = await eRC721.isApprovedForAll.call(owner, delegate)
			assert.equal(result.toString(), 'false', 'Operator approval registered for delegate before approval was requested');				
			
			// register operator approval for delegate by owner 
			await truffleAssert.passes(eRC721.setApprovalForAll(delegate, true, {from: owner}))			
						
			// ensure that operator approval is correctly registered 
			result = await eRC721.isApprovedForAll.call(owner, delegate)
			assert.equal(result.toString(), 'true', 'Operator approval for delegate was not registered correctly');

			// delete operator approval
			await truffleAssert.passes(eRC721.setApprovalForAll(delegate, false, {from: owner}))					
		})
		
		it('correctly deletes operator approval for delegate', async () => {				
			// register approval for delegate by owner of token ID 10
			await truffleAssert.passes(eRC721.approve(delegate, 10, {from: owner}))			
						
			// ensure that token approval is correctly registered 
			result = await eRC721.getApproved.call(10)
			assert.equal(result.toString(), delegate, 'Token approval for tokenId 5 for delegate was not registered correctly');	
			
			// delete approval for delegate by owner of token ID 10
			await truffleAssert.passes(eRC721.approve(zeroAddress, 10, {from: owner}))	
						
			// ensure that token approval is removed
			result = await eRC721.getApproved.call(10)
			assert.notEqual(result.toString(), delegate, 'Token approval for tokenId 10 for delegate was not removed after deletion');					
		})	
		
	})
	
	describe('check function safeTransferFrom()', async () => {							
		it('prevents transfer by delegate if approval is missing', async () => {
			// ensure that currently no token approval is registered for delegate
			result = await eRC721.getApproved.call(0)
			assert.notEqual(result.toString(), delegate, '#1TokenId 5 has approval registered for delegate before approval was requested');			
			
			// ensure that currently no operator approval is registered for delegate
			result = await eRC721.isApprovedForAll.call(owner, delegate)
			assert.equal(result.toString(), 'false', '#2operator approval registered for delegate before approval was requested');	

			// ensure correct ownership before transfer
			result = await eRC721.ownerOf.call(0)
			assert.equal(result.toString(), owner, 'TokenId 0 does not have a correct owner before transfer');
			result = await eRC721.balanceOf.call(buyer)
			assert.equal(result.toString(), 0, "Buyer's token balance incorrect before transfer");	
			
			// try to transfer token ownership
			await truffleAssert.reverts(eRC721.safeTransferFrom.call(owner, buyer, 0, {from: delegate}), 
				'ERC721: transfer caller is not owner nor approved'); 
		})
		
		it('prevents transfer to 0 address', async () => {
			await truffleAssert.reverts(eRC721.safeTransferFrom(owner, '0x0000000000000000000000000000000000000000', 0), 
				'ERC721: transfer to the zero address'); 			
		})
		
		it("prevents transfer if sender's address does not own or have approval to send the token", async () => {		
			await truffleAssert.reverts(eRC721.safeTransferFrom.call(owner, seller, 0, {from: delegate}), 
				'ERC721: transfer caller is not owner nor approved'); 
		})
		
		it('allows transfer by owner without prior approval', async () => {
			// ensure correct ownership before transfer
			result = await eRC721.ownerOf.call(0)
			assert.equal(result.toString(), owner, 'TokenId 0 does not have a correct owner before transfer');
			result = await eRC721.balanceOf.call(buyer)
			assert.equal(result.toString(), 0, "Buyer's token balance incorrect before transfer");	
			
			// transfer token with ID 0 by owner
			result = await eRC721.safeTransferFrom(owner, buyer, 0, {from: owner}); 

			// ensure correct ownership after transfer
			result = await eRC721.ownerOf.call(0)
			assert.equal(result.toString(), buyer, 'TokenId 0 does not have a correct owner after transfer');
			result = await eRC721.balanceOf.call(buyer)
			assert.equal(result.toString(), 1, "Buyer's token balance incorrect after transfer");			
		})		
		
		it('allows transfer of token ID 5 by delegate with prior token approval', async () => {
			// ensure correct ownership before transfer
			result = await eRC721.ownerOf.call(5)
			assert.equal(result.toString(), owner, 'TokenId 5 does not have a correct owner before transfer');
			result = await eRC721.balanceOf.call(buyer2)
			assert.equal(result.toString(), 0, "Buyer's token balance incorrect before transfer");	
					
			// ensure that currently no token approval is registered for delegate
			result = await eRC721.getApproved.call(5)
			assert.notEqual(result.toString(), delegate, 'TokenId 5 has approval registered for delegate before approval was requested');			
			
			// ensure that currently no operator approval is registered for delegate
			result = await eRC721.isApprovedForAll.call(owner, delegate)
			assert.equal(result.toString(), 'false', 'operator approval registered for delegate before approval was requested');	
			
			// register approval for delegate by owner for token ID 5
			await truffleAssert.passes(eRC721.approve(delegate, 5, {from: owner}))	
			
			// transfer token with ID 5 by delegate
			result = await eRC721.safeTransferFrom(owner, buyer2, 5, {from: delegate}); 

			// ensure correct ownership after transfer
			result = await eRC721.ownerOf.call(5)
			assert.equal(result.toString(), buyer2, 'TokenId 0 does not have a correct owner after transfer');
			result = await eRC721.balanceOf.call(buyer2)
			assert.equal(result.toString(), 1, "Buyer's token balance incorrect after transfer");	
		
			// ensure that approval for delegate has been removed
			result = await eRC721.getApproved.call(5)
			assert.notEqual(result.toString(), delegate, 'TokenId 5 still has approval registered after transfer');			

		})		
		it('allows transfer of token ID 8 by delegate with prior operator approval', async () => {
			// ensure correct ownership before transfer
			result = await eRC721.ownerOf.call(8)
			assert.equal(result.toString(), owner, 'TokenId 8 does not have a correct owner before transfer');
			result = await eRC721.balanceOf.call(buyer3)
			assert.equal(result.toString(), 0, "Buyer's token balance incorrect before transfer");	
					
			// ensure that currently no token approval is registered for delegate
			result = await eRC721.getApproved.call(8)
			assert.notEqual(result.toString(), delegate, 'TokenId 8 has approval registered for delegate before approval was requested');			
			
			// ensure that currently no operator approval is registered for delegate
			result = await eRC721.isApprovedForAll.call(owner, delegate)
			assert.equal(result.toString(), 'false', 'operator approval registered for delegate before approval was requested');	
			
			// register operator approval for delegate by owner
			await truffleAssert.passes(eRC721.setApprovalForAll(delegate, 'true', {from: owner}))	
			
			// transfer token with ID 8 by delegate
			result = await eRC721.safeTransferFrom(owner, buyer3, 8, {from: delegate}); 

			// ensure correct ownership after transfer
			result = await eRC721.ownerOf.call(8)
			assert.equal(result.toString(), buyer3, 'TokenId 8 does not have a correct owner after transfer');
			result = await eRC721.balanceOf.call(buyer3)
			assert.equal(result.toString(), 1, "Buyer's token balance incorrect after transfer");	
		
			// ensure that operator approval for delegate is still valid
			result = await eRC721.isApprovedForAll.call(owner, delegate)
			assert.equal(result.toString(), 'true', 'Operator approval was incorrectly removed after token transfer (ID8)');
		
		})
		
		it('allows transfer of token ID 17 to contract address that is ERC721Receiver', async () => {
			// check ownership of owner and escrow contract (which implements ERC721Receiver)
			result = await eRC721.ownerOf.call(17)
			assert.equal(result.toString(), owner, 'TokenId 17 does not have a correct owner before transfer');
			result = await eRC721.balanceOf.call(escrow.address)
			assert.equal(result.toString(), 0, "escrow's token balance incorrect before transfer");	
			
			// transfer token with ID 17 by owner
			result = await eRC721.safeTransferFrom(owner, escrow.address, 17, {from: owner}); 
			
			// check ownership after transfer
			result = await eRC721.ownerOf.call(17)
			assert.equal(result.toString(), escrow.address, 'TokenId 17 does not have a correct owner after transfer');
			result = await eRC721.balanceOf.call(escrow.address)
			assert.equal(result.toString(), 1, "escrow's token balance incorrect after transfer");	
		})	
		
		it('prevents transfer of token ID 19 to contract address that is not ERC721Receiver', async () => {
			// check ownership of owner and nftbc contract (which does not implement ERC721Receiver)
			result = await eRC721.ownerOf.call(19)
			assert.equal(result.toString(), owner, 'TokenId 19 does not have a correct owner before transfer');
			result = await eRC721.balanceOf.call(nftbc.address)
			assert.equal(result.toString(), 0, "nftbc's token balance incorrect before transfer");	
			
			// transfer token with ID 19 by owner
			await truffleAssert.reverts(eRC721.safeTransferFrom(owner, nftbc.address, 19, {from: owner}),
				'ERC721: transfer to non ERC721Receiver implementer'); 
			
			// check ownership after transfer
			result = await eRC721.ownerOf.call(19)
			assert.equal(result.toString(), owner, 'TokenId 19 does not have a correct owner after transfer');
			result = await eRC721.balanceOf.call(nftbc.address)
			assert.equal(result.toString(), 0, "nftbc's token balance incorrect after transfer");
		})		
	})
})