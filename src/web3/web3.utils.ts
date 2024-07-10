import { Address, beginCell } from '@ton/core';
import { sign } from '@ton/crypto';
import { randomBytes } from 'node:crypto';
import { crc32str } from './crc32';
import { APP_CONFIGS } from 'src/utils/app-configs';

export function createSendNftMessage({
  burnAddress,
  nftForwardAmount,
  responseTo,
}: {
  burnAddress: Address;
  responseTo?: Address;
  nftForwardAmount: bigint;
}) {
  const msgBody = beginCell();
  msgBody.storeUint(0x5fcc3d14, 32); // op-code NFT_TRANSFER
  msgBody.storeUint(0, 64); // query-id
  msgBody.storeAddress(burnAddress);

  msgBody.storeAddress(responseTo || null);
  msgBody.storeBit(false); // no custom payload
  msgBody.storeCoins(nftForwardAmount || 0);
  msgBody.storeBit(0); // no forward_payload

  return {
    message: msgBody.endCell(),
  };
}

export function createCollectionMintMessage(opts: {
  commissionAmount: bigint;
  nftForwardAmount: bigint;
  secretKey: Buffer;
  nftOwner: Address;
  nftEditor: Address;
  nftContent: string;
}) {
  const validUntil =
    Math.floor(Date.now() / 1e3) + APP_CONFIGS.TIME_OF_NFT_WAITING; // 60s * 60 = 1h
  const nftIndex = BigInt('0x' + randomBytes(16).toString('hex')); // random 128bit uint

  const signingMessage = beginCell()
    .storeUint(validUntil, 32)
    .storeUint(nftIndex, 128)
    .storeCoins(opts.commissionAmount)
    .storeCoins(opts.nftForwardAmount)
    .storeRef(
      beginCell()
        .storeAddress(opts.nftOwner)
        .storeRef(beginCell().storeStringTail(opts.nftContent))
        .storeAddress(opts.nftEditor)
        .endCell(),
    );

  const signature = sign(signingMessage.endCell().hash(), opts.secretKey);

  return {
    message: beginCell()
      .storeUint(crc32str('op::user_mint'), 32)
      .storeUint(0, 64)
      .storeBuffer(signature)
      .storeBuilder(signingMessage)
      .endCell(),
    nftIndex,
  };
}
