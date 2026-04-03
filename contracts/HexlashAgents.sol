// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HexlashAgents
 * @notice ERC-1155 Agent License NFTs for Hexlash Club Mode.
 * Token ID 1 = Standard Agent License. Future IDs for archetype-specific/limited editions.
 */
contract HexlashAgents is ERC1155, Ownable {
    uint256 public constant STANDARD_AGENT = 1;

    uint256 public mintPrice;
    uint256 public maxSupply;
    uint256 public totalMinted;
    uint256 public maxPerWallet;

    mapping(address => uint256) public mintedPerWallet;

    bool public mintingEnabled;

    constructor(
        string memory uri_,
        uint256 _mintPrice,
        uint256 _maxSupply,
        uint256 _maxPerWallet
    ) ERC1155(uri_) Ownable(msg.sender) {
        mintPrice = _mintPrice;
        maxSupply = _maxSupply;
        maxPerWallet = _maxPerWallet;
        mintingEnabled = false;
    }

    function mint(uint256 amount) external payable {
        require(mintingEnabled, "Minting not enabled");
        require(amount > 0 && amount <= 5, "Invalid amount");
        require(totalMinted + amount <= maxSupply, "Max supply reached");
        require(mintedPerWallet[msg.sender] + amount <= maxPerWallet, "Wallet limit reached");
        require(msg.value >= mintPrice * amount, "Insufficient payment");

        _mint(msg.sender, STANDARD_AGENT, amount, "");
        mintedPerWallet[msg.sender] += amount;
        totalMinted += amount;
    }

    function setMintingEnabled(bool _enabled) external onlyOwner {
        mintingEnabled = _enabled;
    }

    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
    }

    function setMaxPerWallet(uint256 _max) external onlyOwner {
        maxPerWallet = _max;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function ownerMint(address to, uint256 amount) external onlyOwner {
        require(totalMinted + amount <= maxSupply, "Max supply reached");
        _mint(to, STANDARD_AGENT, amount, "");
        totalMinted += amount;
    }
}
