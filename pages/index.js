import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import {
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";


export default function Home() {

  const zero = BigNumber.from(0);

  const [ tokensToBeClaimed, setTokensToBeClaimed ] = useState(zero);
  const [ balanceOfCryptoDevsToken, setBalanceOfCryptoDevsToken ] = useState(zero);
  const [ tokenAmount, setTokenAmount ] = useState(zero);
  const [ totalTokenMinted, setTotalTokenMinted ] = useState(zero);

  const [ loading, setLoading ] = useState(false);
  const [ walletConnected, setWalletConnected ] = useState(false);
  const [ isOwner, setIsOwner ] = useState(false);

  const web3ModalRef = useRef();

  const getTokensToBeClaimed = async () => {

    try{ 

      const provider = await getProviderOrSigner();
      const signer = await getProviderOrSigner(true);

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer
      );
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider
      );

      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      
      if(balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        var amount = 0;
        for(var i = 0; i < balance; i++) {
          console.log('nftContract:::::::::::', nftContract)
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenClaimedIds(tokenId);
          if(!claimed) {
            amount += 1;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch(err) {
      console.error(err);
      setTokensToBeClaimed(zero);
    }
  }

  const getBalanceOfCryptoDevTokens = async () => {
    try{

      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider
      );
      const signer = await getProviderOrSigner(true);
      const _address = signer.getAddress();
      const balance = await tokenContract.balanceOf(_address);
      setBalanceOfCryptoDevsToken(balance);

    } catch(err) {
      console.error(err);
    }
  }

  const mintCryptoDevTokens = async(amount) => {
    try {

      const signer = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer
      );
      const _amount = amount * 0.001; //price per token
      const tx = await tokenContract.mint({
        value: utils.parseEther(_amount.toString()),
        gasLimit: utils.parseEther("0.0000000000001"),
      });
      setLoading(true);
      tx.wait();
      setLoading(false);
      window.alert("Sucessfully minted Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();

    } catch(err) {
      console.error(err);
    }
  }

  const claimCryptoDevTokens = async () => {
    try {

      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer
      )
      const tx = await tokenContract.claim();
      setLoading(true);
      tx.wait();
      setLoading(false);
      window.alert("Sucessfully claimed Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();


    } catch(err) {
      console.error(err);
    }
  }

  const getTotalTokensMinted = async() => {
    try {
      
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider
      )
      const totalTokens = await tokenContract.totalSupply();
      setTotalTokenMinted(totalTokens);

    } catch(err) {
      console.error(err);
    }
  }

  const getOwner = async() => {
    try {

      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider
      );
      const _owner = await tokenContract.owner();
      const signer = await getProviderOrSigner(true);
      const _signer_address = await signer.getAddress();
      if (_owner.toLowerCase() === _signer_address.toLowerCase()) {
        setIsOwner(true);
      }

    } catch(err) {
      console.error(err);
    }
  }

  const withdrawCoins = async () => {
    try {

      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer
      );
      const tx = await tokenContract.withdraw();
      setLoading(true);
      tx.wait();
      setLoading(false);
      await getOwner();

    } catch (err) {
      console.error(err);
    }
  }

  const getProviderOrSigner = async(needSigner = false) => {

    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork("rinkeby")
    if(chainId !== 4) {
      window.alert('Change network to rinkeby test network.');
      throw new Error("Change network to Rinkeby");
    }
    if(needSigner) {
      const signer = await web3Provider.getSigner();
      return signer;
    }
    return web3Provider;

  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner(true);
      setWalletConnected(true);
    }catch(err) {
      console.error(err);
    }
  }

  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);

  /*
        renderButton: Returns a button based on the state of the dapp
      */
  const renderButton = () => {
    // If we are currently waiting for something, return a loading button
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }
    // if owner is connected, withdrawCoins() is called
    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button1} onClick={withdrawCoins}>
            Withdraw Coins
          </button>
        </div>
      );
    }
    // If tokens to be claimed are greater than 0, Return a claim button
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} Tokens can be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }
    // If user doesn't have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
          <div className={styles.description}>
            You can claim or mint Crypto Dev tokens here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevsToken)} Crypto
                Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(totalTokenMinted)}/10000 have been minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}