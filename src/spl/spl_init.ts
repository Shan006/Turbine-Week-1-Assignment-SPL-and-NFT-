import {
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  assertIsTransactionMessageWithBlockhashLifetime,
  assertIsTransactionWithBlockhashLifetime,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import {
  getInitializeMintInstruction,
  getMintSize,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import { getCreateAccountInstruction } from "@solana-program/system";

//import your wallet
import wallet from "../../devnet-wallet.json";

// To Send A Transaction Request For Mint Account
const rpc = createSolanaRpc("https://api.devnet.solana.com");

// To See the Live Status Of Transaction
const rpcSubscriptions = createSolanaRpcSubscriptions(
  "wss://api.devnet.solana.com",
);

(async () => {
  try {

  /*

    -- In General : 
    We'll need : 
    - A Signer
    - A keypair, 
    - Size of mint account for space
    - A wallet to pay rent and txn fee.

    -- Mint Specific : 
    We'll need : 
    - Total supply i.e. a number
    - Decimals i.e. a big int
    - Mint authority i.e. a wallet
    - Freeze authority i.e. a wallet

  */

  // Create a signer from your wallet.
  const signer = await createKeyPairSignerFromBytes(new Uint8Array(wallet));

  // Generate a new mint signer for address.
  const mint = await generateKeyPairSigner();

  // Get the size of the mint i.e. 82 bytes
  const space = BigInt(getMintSize());

  // Get the minimum balance for rent exemption i.e. 285,360 lamports
  const rent = await rpc.getMinimumBalanceForRentExemption(space).send();

  // Get the latest blockhash
  const { value: latestBlockHash } = await rpc.getLatestBlockhash().send();

  const sendAndConfirm = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  const msg = createTransactionMessage({ version: 0 });

  const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);

  const msgWithLifetime = setTransactionMessageLifetimeUsingBlockhash(
    latestBlockHash,
    msgWithPayer
  );

  const txMessage = appendTransactionMessageInstructions(
    [
      getCreateAccountInstruction({
        payer: signer,
        newAccount: mint,
        lamports: rent,
        space,
        programAddress: TOKEN_PROGRAM_ADDRESS
      }),

      getInitializeMintInstruction({
        mint: mint.address,
        decimals: 6,
        mintAuthority: signer.address,
      }),
    ],
    msgWithLifetime
  );

  const signedTx = await signTransactionMessageWithSigners(txMessage);

  assertIsTransactionWithBlockhashLifetime(signedTx);

  const signature = getSignatureFromTransaction(signedTx);

  // Send and Confirm the transaction
  await sendAndConfirm(signedTx, {commitment:"confirmed"});

  console.log("mint address: ", mint.address);
  console.log("Transaction Signature: ", signature);

  //  mint address:  BCi3z3HPUaerntYZJNVtztv4YtZ6Tr8gqibpawotWHr2
  //  Transaction Signature:  4bE7S7NjgWeYWnj1aAX1yXxjdXp5hpYchAGnJ4scKFXQsfDJ2artWS8dR9UM1FTAJ8Gn6WWUDdJ1ryoYaooKFkz1

  } catch (error) {
    console.log(error);
  }
})();