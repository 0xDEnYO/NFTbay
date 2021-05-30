// Fetch the xxx contract data from the xxx.json file
const AuctionManagement = artifacts.require("AuctionManagement")
//const AuctionBidding = artifacts.require("AuctionBidding")
//const AuctionDataModel = artifacts.require("AuctionDataModel")
const NFTbC = artifacts.require("NFTbC")
//const Escrow = artifacts.require("Escrow")


// JavaScript export
module.exports = async function(deployer) {
    // Deployer is the Truffle wrapper for deploying contracts to the network
	
	let totalSupply = 1000000
	console.log("1111111111111111111111111")
	
    // Deploy NFTbC_ERC20 contract
	deployer.deploy(NFTbC, totalSupply)
	const nFTbC = await NFTbC.deployed()
	console.log("nFTbC Address:" + nFTbC.address)	
	console.log("2222222222222222222222222")


    //Deploy AuctionManagement contract
	deployer.deploy(AuctionManagement)
	const auctionManagement = await AuctionManagement.deployed()

	console.log("33333333333333333333333")
	console.log("AM Address:" + auctionManagement.address)
	
    // Deploy Escrow contract
	// deployer.deploy(Escrow, auctionManagement.address);
	// const escrow = await Escrow.deployed()

	// console.log("4444444444444444444444444")
	// console.log("Escr address: "+ escrow.address)

	// Deploy AuctionBidding contract
	deployer.deploy(AuctionBidding)
	const auctionBidding = await AuctionBidding.deployed()
}

