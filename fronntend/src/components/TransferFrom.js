import React from "react";
import styled from "styled-components";
import withRouter from "./withRouter";
import "./TransferFrom.css";
// We'll use ethers to interact with the Ethereum network and our contract
import { ethers } from "ethers";

// We import the contract's artifacts and address here, as we are going to be
// using them with ethers
import TokenArtifact from "../contracts/CwebToken.json";
import contractAddress from "../contracts/contract-address.json";
import { Loading } from "./Loading";
import { NoTokensMessage } from "./NoTokensMessage";
import { Link } from "react-router-dom";
// All the logic of this dapp is contained in the Dapp component.
// These other components are just presentational ones: they don't have any
// logic. They just render HTML.

import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";

const GOERLI_NETWORK_ID = "5";
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

class TransferFrom extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      // The info of the token (i.e. It's Name and symbol)
      tokenData: undefined,
      // The user's address and balance
      selectedAddress: undefined,
      balance: undefined,
      // The ID about transactions being sent, and any possible error with them
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
      transactionPerformed: undefined,
    };

    this.state = this.initialState;
  }
  componentDidMount() {
    this._connectWallet();
  }

  componentWillUnmount() {
    // We poll the user's balance, so we have to stop doing that when Dapp
    // gets unmounted
    this._stopPollingData();
  }

  _checkNetwork() {
    if (window.ethereum.networkVersion === GOERLI_NETWORK_ID) {
      return true;
    }

    // this.setState({
    //   networkError: "Please connect Metamask to Localhost:8545",
    // });

    this.setState({
      networkError: "Please connect Metamask to Goerli TestNet",
    });

    return false;
  }

  async _connectWallet() {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.

    // Once we have the address, we can initialize the application.

    // First we check the network
    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(this.props.params.selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      window.location.replace("/");
    });

    // We reset the dapp state if the network is changed
    window.ethereum.on("chainChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    // Then, we initialize ethers, fetch the token's data, and start polling
    // for the user's balance.

    // Fetching the token data and the user's balance are specific to this
    // sample project, but you can reuse the same initialization pattern.
    this._initializeEthers();
    this._getTokenData();
    this._startPollingData();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    // Then, we initialize the contract using that provider and the token's
    // artifact. You can do this same thing with your contracts.
    this._token = new ethers.Contract(
      contractAddress.Token,
      TokenArtifact.abi,
      this._provider.getSigner(0)
    );
  }

  async _updateBalance() {
    const balance = await this._token.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
  }

  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 20000);

    // We run it once immediately so we don't have to wait for it
    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _getTokenData() {
    const name = await this._token.name();
    const symbol = await this._token.symbol();

    this.setState({ tokenData: { name, symbol } });
  }

  async _transferFromAccount(sender, to, amount) {
    try {
      this._dismissTransactionError();

      const tx = await this._token.transferFrom(sender, to, amount);
      this.setState({ txBeingSent: tx.hash });

      const receipt = await tx.wait();

      // The receipt, contains a status flag, which is 0 to indicate an error.
      if (receipt.status === 0) {
        // We can't know the exact error that made the transaction fail when it
        // was mined, so we throw this generic one.
        throw new Error("Transfer Between Account failed");
      }

      // If we got here, the transaction was successful, so you may want to
      // update your state. Here, we update the user's balance.
      await this._getAllowedBalance(sender);
      await this._updateBalance();
      await this._getTransactionEvent();
    } catch (error) {
      // We check the error code to see if this error was produced because the
      // user rejected a tx. If that's the case, we do nothing.
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      // Other errors are logged and stored in the Dapp's state. This is used to
      // show them to the user, and for debugging.
      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      // If we leave the try/catch, we aren't sending a tx anymore, so we clear
      // this part of the state.
      this.setState({ txBeingSent: undefined });
    }
  }

  async _getTransactionEvent() {
    this._token.on("Transfer", (from, to, value, event) => {
      let info = {
        from: from,
        to: to,
        value: ethers.utils.formatUnits(value, 6),
        data: event,
      };
      console.log(JSON.stringify(info, null, 4));
      this.setState({ transactionPerformed: info });
    });
  }

  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  async _getAllowedBalance(spender) {
    const approvedAmount = await this._token.allowance(
      this.state.selectedAddress,
      spender
    );
    this.setState({ approvedAmount });
  }

  render() {
    console.log(this._token);
    if (!this.state.tokenData || !this.state.balance) {
      return <Loading />;
    }

    return (
      <div className="container">
        <div className="alert-box">
          <div className="alert-success">
            {this.state.transactionPerformed === undefined ? null : (
              <div>
                <div>From: {this.state.transactionPerformed.from}</div>
                <div>To: {this.state.transactionPerformed.to}</div>
                <div>Value: {this.state.transactionPerformed.value}</div>
              </div>
            )}
          </div>
          <div className="alert-success">
            {this.state.txBeingSent && (
              <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
            )}
          </div>
          <div className="alert-error">
            {this.state.transactionError && (
              <TransactionErrorMessage
                message={this._getRpcErrorMessage(this.state.transactionError)}
                dismiss={() => this._dismissTransactionError()}
              />
            )}
          </div>
        </div>
        <div className="content-items">
          <div className="content-box">
            <div className="nav-items">
              <NavLink onClick={() => {}} to={`/`}>
                Back
              </NavLink>
              <div>Your Balance: {this.state.balance.toString()}</div>
            </div>
            <div>
              {this.state.balance.eq(0) && (
                <NoTokensMessage selectedAddress={this.state.selectedAddress} />
              )}
            </div>

            {this.state.balance.gt(0) && (
              <div className="form-items">
                <h4>Transfer To an Account</h4>
                <form
                  onSubmit={(event) => {
                    // This function just calls the transferTokens callback with the
                    // form's data.
                    event.preventDefault();

                    const formData = new FormData(event.target);
                    const sender = formData.get("sender");
                    const to = formData.get("to");
                    const amount = formData.get("amount");

                    if (sender && to && amount) {
                      this._transferFromAccount(sender, to, amount);
                    }
                  }}
                >
                  <div className="form-group">
                    <label>Amount of {this.state.tokenData.symbol}</label>
                    <input
                      className="form__control-amount"
                      type="number"
                      step="1"
                      name="amount"
                      placeholder="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Giver's address</label>
                    <input
                      className="form-control"
                      type="text"
                      name="sender"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Recipient address</label>
                    <input
                      className="form-control"
                      type="text"
                      name="to"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      className="btn btn-primary"
                      type="submit"
                      value="Send"
                    />
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(TransferFrom);
const NavLink = styled(Link)`  

text-decoration:none;
width:12%
hight:3.5%
border-radius:15px;
box-shadow: 0 10px 50px #000;

outline:none;
cursor:pointer;

margin-left:1%;

display: inline-block;
font-weight: 400;
color: #212529;
text-align: center;
vertical-align: middle;
-webkit-user-select: none;
-moz-user-select: none;
-ms-user-select: none;
user-select: none;
background-color: rgb(0, 123, 255);
border: 1px solid transparent;
padding: 0.375rem 0.75rem;
font-size: 1rem;
line-height: 1.5;
border-radius: 0.25rem;
margin-top: 5%;
transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

`;
