import {
  address,
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import wallet from "../../devnet-wallet.json";
import {
  findAssociatedTokenPda,
  getCreateAssociatedTokenInstructionAsync,
  getTransferCheckedInstruction,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";

const rpc = createSolanaRpc("https://api.devnet.solana.com");

const rpcSubscriptions = createSolanaRpcSubscriptions(
  "wss://api.devnet.solana.com",
);

//paste your mint address got from spl_init.ts
const mint = address("BCi3z3HPUaerntYZJNVtztv4YtZ6Tr8gqibpawotWHr2");

//paste the address of the recipient
const to = address("F7pspR69SXxTUHkaYDzY9H3rBqk4AkShZSNF8wwyHpEv");

(async () => {
  try {
    const signer = await createKeyPairSignerFromBytes(new Uint8Array(wallet));
    const sendAndConfirm = sendAndConfirmTransactionFactory({
      rpc,
      rpcSubscriptions,
    });

    const [fromAta] = await findAssociatedTokenPda({
      mint,
      owner: signer.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    console.log(`Your fromAta is : ${fromAta}`);

    const [toAta] = await findAssociatedTokenPda({
      mint,
      owner: to,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });
    console.log(`Your toAta is : ${toAta}`);

    const createAtaIx = await getCreateAssociatedTokenInstructionAsync({
      payer: signer,
      mint: mint,
      owner: to,
      ata: toAta
    });

    const transferTx = getTransferCheckedInstruction({
      source: fromAta,
      mint: mint,
      destination: toAta,
      authority: signer.address,
      amount: 10n,
      decimals: 6,
    });

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const msg = createTransactionMessage({ version: 0 });

    const msgWithPayer = setTransactionMessageFeePayerSigner(signer, msg);

    const msgWithLiftime = setTransactionMessageLifetimeUsingBlockhash(
      latestBlockhash,
      msgWithPayer,
    );

    const txMessage = appendTransactionMessageInstructions(
      [createAtaIx, transferTx],
      msgWithLiftime,
    );

    const signedTx = await signTransactionMessageWithSigners(txMessage);

    assertIsTransactionWithBlockhashLifetime(signedTx);

    const signature = getSignatureFromTransaction(signedTx);

    await sendAndConfirm(signedTx, { commitment: "confirmed" });

    console.log(`mint txid: ${signature}`);
  } catch (error) {
    console.log(error);
  }
})();



// Your fromAta is : 2GLuKbpgSH7Nmfq2ZWpk3RfRotf7yND25LcRPPbGHHTZ
// Your toAta is : 7PbmnmKBHJBRLqrGWiHJSSCdnXYcUti1NBRdMGmyixCB
// mint txid: 5whFeJerQeHKqjxntjPrydhrEFWZc3i99PZh4sL7PAVYDeexTsjupCaLa7ZuBoow42psvo5sMq932fEdF6mw53zH