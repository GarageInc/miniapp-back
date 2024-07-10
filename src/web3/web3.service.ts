import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { LockedBurn, LockedMint, User } from 'src/user/user.schema';
import { createCollectionMintMessage } from './web3.utils';
import { Address, toNano } from '@ton/core';
import { ArtifactService } from 'src/artifact/artifact.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import { TonClient } from '@ton/ton';
import { InjectQueue } from '@nestjs/bull';
import { QUEUE_NAMES } from 'src/queue';
import { Queue } from 'bull';
import { APP_CONFIGS } from 'src/utils/app-configs';
import { NftItem } from '@ton-community/assets-sdk/dist/nft/NftItem';
import { NftCollection } from '@ton-community/assets-sdk/dist/nft/NftCollection';
import { TransactionService } from 'src/database/transaction.service';

export interface INftApiItem {
  address: string;
  collection_address: string;
  owner_address: string;
  init: boolean;
  index: string;
  last_transaction_lt: string;
  code_hash: string;
  data_hash: string;
  content: {
    uri: string;
  };
  collection: {
    address: string;
    owner_address: string;
    last_transaction_lt: string;
    next_item_index: string;
    collection_content: {
      uri: string;
    };
    code_hash: string;
    data_hash: string;
  };
}

//https://cdn.tonchemy.com/nfts/8f53091e8e5236e3be7da240adc697b4.json
export const extractNameFromUri = (uri: string) => {
  return uri.split('/').pop()?.split('.')[0];
};

@Injectable()
export class Web3Service {
  private toncenterBaseEndpoint: string;
  private apiKey: string;
  private secretKey: Buffer;
  private ownerBurnAddress: string;
  private collectionAddress: string;

  private readonly logger = new Logger(Web3Service.name);
  endPoint: string;

  constructor(
    private artifactService: ArtifactService,
    private configService: ConfigService,
    private http: HttpService,
    private transactionService: TransactionService,
    @InjectQueue(QUEUE_NAMES.MINTS) private mintsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.BURNS) private burnsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.STACKED_BURNS) private stakedBurns: Queue,
    @InjectQueue(QUEUE_NAMES.STACKED_MINTS) private stakedMints: Queue,
  ) {
    const isProd =
      this.configService.get<string>('IS_TON_PRODUCTION') === 'true';
    this.toncenterBaseEndpoint = isProd
      ? 'https://toncenter.com'
      : 'https://testnet.toncenter.com';

    this.apiKey = this.configService.get<string>('TONCENTER_API_KEY');
    this.secretKey = Buffer.from(
      this.configService.get<string>('NFT_SECRET_KEY'),
      'hex',
    );
    this.ownerBurnAddress =
      this.configService.get<string>('OWNER_BURN_ADDRESS');

    this.collectionAddress = this.configService.get<string>(
      'NFT_COLLECTION_ADDRESS',
    );

    this.endPoint = isProd
      ? 'https://toncenter.com/api/v2/jsonRPC'
      : 'https://testnet.toncenter.com/api/v2/jsonRPC';
  }

  async getProps() {
    return {
      toncenterBaseEndpoint: this.toncenterBaseEndpoint,
      apiKey: this.apiKey,
      secretKey: this.secretKey.toString('hex'),
      ownerBurnAddress: this.ownerBurnAddress,
      collectionAddress: this.collectionAddress,
      redis: this.configService.get<string>('REDIS_URL'),
      redispwd: this.configService.get<string>('REDIS_PASSWORD'),
    };
  }

  async forceMintsCheck() {
    console.log('start forceMintsCheck');

    await this.stakedMints.add('mints');
    await this.stakedBurns.add('burns');

    console.log('end forceMintsCheck');
    return true;
  }

  async getBurningNft(burn: LockedBurn) {
    const result = await firstValueFrom(
      this.http
        .get(
          `${this.toncenterBaseEndpoint}/api/v3/nft/items?collection_address=${this.collectionAddress}&index=${burn.nftIndex}&limit=1&offset=0`,
          {
            headers: {
              'X-API-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
          },
        )
        .pipe(
          map((res) => {
            return res.data.nft_items[0];
          }),
        )
        .pipe(
          catchError(() => {
            throw new ForbiddenException('API not available');
          }),
        ),
    );

    return result;
  }

  async getTonClient() {
    return new TonClient({
      endpoint: this.endPoint, /// 'https://sandbox-v4.tonhubapi.com', // 'https://go.getblock.io/e1eff37587bd492b8b89cdf6f13ee076',
      apiKey: this.apiKey,
    });
  }

  async checkNftExists(nftIndex: string) {
    const tonClient = await this.getTonClient();

    const nftCollection = tonClient.open(
      NftCollection.createFromAddress(Address.parse(this.collectionAddress)),
    );

    return (await nftCollection.getItemAddress(BigInt(nftIndex))).toRawString();
  }

  async getNftData(nftIndex: string) {
    try {
      const tonClient = await this.getTonClient();

      const nftCollection = tonClient.open(
        NftCollection.createFromAddress(Address.parse(this.collectionAddress)),
      );
      const nftAddress = (
        await nftCollection.getItemAddress(BigInt(nftIndex))
      ).toRawString();

      const nftItem = tonClient.open(
        NftItem.createFromAddress(Address.parse(nftAddress)),
      );

      const data = await nftItem.getData();
      const ds = data.individualContent.beginParse();
      const content = ds.loadStringTail();
      const id = extractNameFromUri(content);

      return {
        initialized: data.initialized,
        index: data.index.toString(),
        collection: data.collection.toRawString(),
        owner: data.owner.toRawString(),
        individualContent: data.individualContent.toString(),
        content,
        id,
      };
    } catch (e) {
      this.logger.error('Error in getNftData', nftIndex, e);
      return undefined;
    }
  }

  async wasMinted(mint: LockedMint) {
    const result = await firstValueFrom(
      this.http
        .get(
          `${this.toncenterBaseEndpoint}/api/v3/nft/items?collection_address=${this.collectionAddress}&index=${mint.nftIndex}&limit=1&offset=0`,
          {
            headers: {
              'X-API-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
          },
        )
        .pipe(
          map((res) => {
            return res.data;
          }),
        )
        .pipe(
          catchError(() => {
            throw new ForbiddenException('API not available');
          }),
        ),
    );

    this.logger.debug('mint nft items by', result?.nft_items.length);
    return result?.nft_items?.length > 0;
  }

  /**
   * 
   * @param userAddress 
  async listNftsForUser(userAddress: string, limit: number, offset: number) {
    // Configure the HTTP client with your host and token
    const httpClient = new HttpClient({
      baseUrl: 'https://testnet.tonapi.io',
      baseApiParams: {
        headers: {
          Authorization: `Bearer ${TONAPI_KEY}`,
          'Content-type': 'application/json',
        },
      },
    });

    // Initialize the API client
    const client = new Api(httpClient);

    console.log('call tonapi');

    const list = await client.accounts.getAccountNftItems(userAddress, {
      collection: this.collectionAddress,
      limit,
      offset,
    });

    console.log('list', list);

    return list;
  }

   * @param limit 
   * @param offset 
   * @returns 
   */
  async listNftsForUser(userAddress: string, limit: number, offset: number) {
    return this.http
      .get(
        `${this.toncenterBaseEndpoint}/api/v3/nft/items?collection_address=${this.collectionAddress}&owner_address=${userAddress}&limit=${limit}&offset=${offset}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      )
      .pipe(map((res) => res.data))
      .pipe(
        catchError(() => {
          throw new ForbiddenException('API not available');
        }),
      );
  }

  async generateNftMintSignature(
    user: User,
    artifactId: string,
    ownerAddress: string,
  ) {
    return this.transactionService.runTransaction(user, async () => {
      const userArtifactInventory = user.inventory.find(
        (item) => item.artifact.id === artifactId,
      );

      if (!userArtifactInventory || userArtifactInventory.count === 0) {
        throw new Error(
          `User does not have this artifact: ${user._id} ${artifactId}`,
        );
      }

      const targetAddress = ownerAddress || user.tonAddress;

      if (!targetAddress) {
        throw new Error('Address is not provided');
      }

      const owner = Address.parse(targetAddress);

      const msg = createCollectionMintMessage({
        // How much commission collection takes
        commissionAmount: toNano(
          userArtifactInventory.artifact.mintingPrice.toString(),
        ),
        // How much is used to deploy the nft (0.05 is a standard value)
        nftForwardAmount: toNano('0.05'),
        secretKey: this.secretKey,
        // address of the owner of NFT
        nftOwner: owner,
        // address of the editor of the NFT
        nftEditor: owner,
        // tail part of the NFT metadata json url, common part is stored in collection
        nftContent: `${artifactId}.json`,
      });

      const hash = msg.message.toBoc().toString('hex');

      const lockedItem = await this.artifactService.lockUserArtifact(
        user,
        artifactId,
        hash,
        msg.nftIndex.toString(),
        targetAddress,
      );

      await this.mintsQueue.add('mint', lockedItem, {
        delay: APP_CONFIGS.TIME_OF_NFT_MINT_WAITING_TASK,
      });

      return {
        signature: hash,
        nftIndex: msg.nftIndex.toString(),
      };
    });
  }

  // TODO: check is user owner of NFT before burn?
  async generateBurnSignature(
    user: User,
    nftIndex: string,
    ownerAddress: string,
  ) {
    return this.transactionService.runTransaction(user, async () => {
      const targetAddress = ownerAddress || user.tonAddress;

      if (!targetAddress) {
        throw new Error('Address is not provided');
      }

      if (await this.artifactService.hasPendingMint(user, nftIndex)) {
        throw new Error('NFT is in mint process');
      }

      const pendingBurn = await this.artifactService.hasPendingBurn(
        user,
        nftIndex,
      );

      if (!pendingBurn) {
        const burnedItem = await this.artifactService.createBurnRecord(
          user,
          nftIndex,
          targetAddress,
        );

        await this.burnsQueue.add('burn', burnedItem, {
          delay: APP_CONFIGS.TIME_OF_NFT_BURN_WAITING_TASK,
        });
      }

      return {
        burnAddress: this.ownerBurnAddress,
      };
    });
  }
}
