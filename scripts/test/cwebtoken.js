// This is an example test file. Hardhat will run every *.js file in `test/`,
// so feel free to add new ones.

// Hardhat tests are normally written with Mocha and Chai.

// We import Chai to use its asserting functions here.
const { expect } = require("chai");

// We use `loadFixture` to share common setups (or fixtures) between tests.
// Using this simplifies your tests and makes them run faster, by taking
// advantage or Hardhat Network's snapshot functionality.
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

// `describe` is a Mocha function that allows you to organize your tests.
// Having your tests organized makes debugging them easier. All Mocha
// functions are available in the global scope.
//
// `describe` receives the name of a section of your test suite, and a
// callback. The callback must define the tests of that section. This callback
// can't be an async function.
describe("CwebToken contract", function () {
  this.timeout(60000);
  // We define a fixture to reuse the same setup in every test. We use
  // loadFixture to run this setup once, snapshot that state, and reset Hardhat
  // Network to that snapshot in every test.
  async function deployTokenFixture() {
    // Get the ContractFactory and Signers here.
    const CwebToken = await ethers.getContractFactory("CwebToken");
    const [
      owner,
      addr1,
      addr2,
      spender,
      from,
      to,
      account,
      _allowances,
      tokenOwner,
    ] = await ethers.getSigners();

    // To deploy our contract, we just have to call CwebToken.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    const hardhatToken = await CwebToken.deploy();

    await hardhatToken.deployed();

    // Fixtures can return anything you consider useful for your tests
    return {
      CwebToken,
      hardhatToken,
      owner,
      addr1,
      addr2,
      spender,
      from,
      to,
      account,
      _allowances,
      tokenOwner,
    };
  }

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    this.timeout(60000);
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.
    //
    // If the callback function is async, Mocha will `await` it.
    it("Should set the right owner", async function () {
      // We use loadFixture to setup our environment, and then assert that
      // things went well
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);

      // Expect receives a value and wraps it in an assertion object. These
      // objects have a lot of utility methods to assert values.

      // This test expects the owner variable stored in the contract to be
      // equal to our Signer's owner.
      expect(await hardhatToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const { hardhatToken, owner } = await loadFixture(deployTokenFixture);
      const ownerBalance = await hardhatToken.balanceOf(owner.address);
      expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    this.timeout(60000);
    it("Should transfer tokens between accounts", async function () {
      const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );
      // Transfer 50 tokens from owner to addr1
      await expect(
        hardhatToken.transfer(addr1.address, 50)
      ).to.changeTokenBalances(hardhatToken, [owner, addr1], [-50, 50]);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await expect(
        hardhatToken.connect(addr1).transfer(addr2.address, 50)
      ).to.changeTokenBalances(hardhatToken, [addr1, addr2], [-50, 50]);
    });

    it("should emit Transfer events", async function () {
      const { hardhatToken, owner, addr1, addr2 } = await loadFixture(
        deployTokenFixture
      );

      // Transfer 50 tokens from owner to addr1
      await expect(hardhatToken.transfer(addr1.address, 50))
        .to.emit(hardhatToken, "Transfer")
        .withArgs(owner.address, addr1.address, 50);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await expect(hardhatToken.connect(addr1).transfer(addr2.address, 50))
        .to.emit(hardhatToken, "Transfer")
        .withArgs(addr1.address, addr2.address, 50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { hardhatToken, owner, addr1 } = await loadFixture(
        deployTokenFixture
      );
      const initialOwnerBalance = await hardhatToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        hardhatToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Not enough tokens");

      // Owner balance shouldn't have changed.
      expect(await hardhatToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });
  describe("Approval", function () {
    this.timeout(60000);

    it("Should return approval from owner and spender", async function () {
      const { hardhatToken, owner, spender, amount } = await loadFixture(
        deployTokenFixture
      );

      expect(await hardhatToken.approve(spender.address, 1000))
        .to.emit(hardhatToken, "Aproved")
        .withArgs(owner.address, spender.address, amount);
    });
  });

  describe("Allowance", function () {
    this.timeout(60000);

    it("Should return allowed balance", async function () {
      const { hardhatToken, tokenOwner, owner, spender } = await loadFixture(
        deployTokenFixture
      );

      const allowedBalance = await hardhatToken.balanceOfAllowance(
        owner.address,
        spender.address
      );
      expect(
        await hardhatToken.balanceOfAllowance(owner.address, spender.address)
      ).to.equal(allowedBalance);
    });
  });

  describe("Transfer from", function () {
    this.timeout(60000);

    it("Should transfer from owner through spender to to address", async function () {
      const { hardhatToken, from, owner, to, spender, _allowances, amount } =
        await loadFixture(deployTokenFixture);

      expect(await hardhatToken.transferFrom(spender.address, to.address, 10))
        .to.emit(hardhatToken, "Transfer ")
        .withArgs(owner.address, to.address, amount);

      const allowedBalance = await hardhatToken.balanceOfAllowance(
        owner.address,
        spender.address
      );
      expect(
        await hardhatToken.balanceOfAllowance(owner.address, spender.address)
      ).to.equal(allowedBalance);
    });
  });
  //=============================================================================

  //============================================================
});
