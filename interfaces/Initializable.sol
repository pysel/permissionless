// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

interface IInitializable {
    function initialized() external view returns (bool);

    function setContractAddresses(address _registry) external;
}
