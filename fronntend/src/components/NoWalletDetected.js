import React from "react";
import "./ConnectWallet.css";
export function NoWalletDetected() {
  return (
    <div className="connect__wallet-container">
      <div className="content-items">
        <div className="connect-box">
          <p>
            No Ethereum wallet was detected. <br />
            Please install{" "}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
            >
              MetaMask
            </a>
            .
          </p>
          <p>
            *Get Goerli Testnet ether with your wallet address from{" "}
            <a
              href="https://goerlifaucet.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              goerlifaucet
            </a>{" "}
            for paying gas transaction fees.
          </p>
        </div>
      </div>
    </div>
  );
}
