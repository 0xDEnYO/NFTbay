# NFTbay
A social, decentralized marketplace for NFTs 

On this marketplace, you can sell/auction any ERC721 token. The selling commission will go to a user-curated list of non-profit organizations that updates regularly based on user voting results, thus making it a social smart contract. The platform has its own payment token (ERC20) that is used to place bids and pay fees. Sellers receive their funds in the payment token, too. This part is not real-world ideal but helpful for me to play around with ERC20, ERC721 and potentially ERC223 token standards.  


I started this project to deepen my knowledge about Solidity, smart contract development, deployment and testing (with Truffle/Mocha/Chai). I know there are out-of-the-box solutions available in the internet that I could have leveraged but I wanted to come up with my own approach to increase my learning curve.
After all, this exercise is just preparation to get into a paid position as blockchain developer. 

So please consider hiring me :)


Current Status of the project:

DONE:
- Base Auction Data Model
- ERC20 setup
- ERC721 Setup
- Create auction (and move NFT into escrow)
- Place bid (and move bid amount into escrow)
- >60 test cases in truffle

TODO:
- Finalize auction
- Settlement
- Refund of bid amount after outbid
- ERC223 Setup / test
- more testing

  General improvements:
- reduce contract complexity
- reduce contract size / gas consumption
- improve contract architecture
- complete natspec comments
- Frontend
