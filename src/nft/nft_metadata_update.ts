import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import wallet from "../../devnet-wallet.json";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { update, fetchAsset, mplCore } from "@metaplex-foundation/mpl-core";
import { base58 } from "@metaplex-foundation/umi/serializers";

const umi = createUmi(
  process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
);

const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));
umi.use(mplCore());

(async () => {
  try {
    // the asset (NFT) address
    const assetAddress = publicKey("4EGrWfT9KNyRGBG495WA92SdacfssnAgCsSwTsuAfF9B");

    // current on-chain asset
    const asset = await fetchAsset(umi, assetAddress);

    // new values
    const newName = "My Updated Core NFT";
    const newUri =
      "https://gateway.irys.xyz/HahfSi6oCw78u1wHar8FZLJNyy52qchYq4CcwAxhp7b3";

    const tx = await update(umi, {
      asset,
      name: newName,
      uri: newUri,
    }).sendAndConfirm(umi);

    const signature = base58.deserialize(tx.signature)[0];

    console.log(`Update signature: ${signature}`);
    console.log(`Asset ${assetAddress} updated successfully`);
  } catch (error) {
    console.log("error", error);
  }
})();