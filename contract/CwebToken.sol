//SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract CwebToken is Initializable {
    string public name;
    string public symbol;
    address public owner;
    uint256 public totalSupply;

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    mapping(address => mapping(address => uint256)) private tokenAllowed;

    mapping(address => uint256[]) usedAllowance;
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    function initialize() external initializer {
        name = "Cweb Token";
        symbol = "CBT";
        totalSupply = 20000000;
        balances[msg.sender] = totalSupply;
        owner = msg.sender;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Not enough tokens");

        console.log(
            "Transferring from %s to %s %s tokens",
            msg.sender,
            to,
            amount
        );

        // Transfer the amount.
        balances[msg.sender] -= amount;
        balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function allowance(address tokenOwner, address spender)
        public
        view
        returns (uint256)
    {
        return _allowances[tokenOwner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        address tokenOwner = msg.sender;
        _approve(tokenOwner, spender, amount);
        console.log(
            "Approved  %s CBT token from  %s to %s",
            amount,
            tokenOwner,
            spender
        );

        return true;
    }

    function _approve(
        address tokenOwner,
        address spender,
        uint256 amount
    ) internal virtual {
        require(
            tokenOwner != address(0),
            "ERC20: approve from the zero address"
        );
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[tokenOwner][spender] = amount;
        tokenAllowed[tokenOwner][spender] = amount;
        emit Approval(tokenOwner, spender, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool success) {
        address tokenOwner = msg.sender;
        _spendAllowance(from, tokenOwner, amount);
        _transfer(from, to, amount);
        console.log(
            "Transfer %s CBT tokens from %s to %s ",
            amount,
            tokenOwner,
            to
        );
        return true;
    }

    function _spendAllowance(
        address from,
        address tokenOwner,
        uint256 amount
    ) internal virtual {
        uint256 currentAllowance = allowance(from, tokenOwner);
        console.log("current Allowance is . . . %s ", currentAllowance);

        if (currentAllowance != type(uint256).max) {
            require(
                currentAllowance >= amount,
                "ERC20: insufficient allowance"
            );
            unchecked {
                _approve(tokenOwner, from, currentAllowance - amount);
            }
        }
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");

        address spender = msg.sender;
        uint256 fromBalance = balances[from];
        uint256 allowedBalance = _allowances[from][spender];
        uint256 alloweToken = tokenAllowed[from][spender];

        uint256[] storage spentBalance = usedAllowance[spender];

        uint256 addSpentBalance = 0;

        for (uint256 i = 0; i < spentBalance.length; i++) {
            addSpentBalance = addSpentBalance + spentBalance[i];
        }

        require(
            addSpentBalance != alloweToken,
            "ERC20: Allowed Balance exhausted"
        );
        require(
            fromBalance >= amount,
            "ERC20: transfer amount exceeds balance"
        );
        unchecked {
            usedAllowance[spender].push(amount);
            balances[from] = fromBalance - amount;
            // Overflow not possible: the sum of all balances is capped by totalSupply, and the sum is preserved by
            // decrementing then incrementing.
            balances[to] += amount;
            _allowances[from][spender] = allowedBalance - amount;
        }

        emit Transfer(from, to, amount);
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function balanceOfAllowance(address tokenOwner, address spender)
        external
        view
        returns (uint256)
    {
        return _allowances[tokenOwner][spender];
    }
}
