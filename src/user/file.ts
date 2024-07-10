import { Storage } from '@google-cloud/storage';
import axios from 'axios';

export const getBucketName = (isProd?: string) => {
  return isProd === 'true' ? 'cdn.tonchemy.com' : OLD_CDN;
};

export const OLD_CDN = 'cdn.devtonchemy.ru';

export const upload = async (
  fileName,
  fileBuffer,
  prefix,
  prodStatus: string,
) => {
  const storage = new Storage({ keyFilename: 'gkey.json' });
  const bucket = storage.bucket(getBucketName(prodStatus));

  return new Promise((res, rej) => {
    try {
      if (!fileBuffer) {
        rej();
        return;
      }

      // Create a new blob in the bucket and upload the file data.
      console.log('prefixed file path', `${prefix}/${fileName}`);
      const blob = bucket.file(`${prefix}/${fileName}`);
      const blobStream = blob.createWriteStream({
        resumable: false,
      });

      blobStream.on('error', (err) => {
        console.log('error', err);
        rej();
      });

      blobStream.on('finish', async (data) => {
        // Create URL for directly file access via HTTP.
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

        /*
        try {
          // Make the file public
          await bucket.file(fileName).makePublic();
        } catch (error) {
          console.log('error', error);
          rej();
          return;
        }*/

        console.log('publicUrl', publicUrl);

        res({
          publicUrl: publicUrl,
        });
      });

      blobStream.end(fileBuffer);
    } catch (err) {
      rej();
    }
  });
};

export const fromUri = async (uri) => {
  const response = await axios.get(uri, { responseType: 'arraybuffer' });
  const imageBuffer = Buffer.from(response.data, 'binary');

  return imageBuffer;
};
