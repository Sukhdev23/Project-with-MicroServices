
const ImageKit = require('imagekit');
const { v4: uuidv4 } = require("uuid")

class ImageKitAuthError extends Error {
    constructor(message, help) {
        super(message);
        this.name = 'ImageKitAuthError';
        this.help = help;
        this.code = 'IMAGEKIT_AUTH_FAILED';
    }
}



const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'test_public',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'test_private',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/demo',
});

async function uploadImage({ buffer, folder = '/products' }) {
    try {
        const res = await imagekit.upload({
            file: buffer,
            fileName: uuidv4(),
            folder,
        });
        return {
            url: res.url,
            thumbnail: res.thumbnailUrl || res.url,
            id: res.fileId,
        };
    }
    catch (err) {
        // ImageKit auth errors contain a help field and a specific message
        if (err?.help && /cannot be authenticated/i.test(err.message || '')) {
            throw new ImageKitAuthError(err.message, err.help);
        }
        throw err; // rethrow others
    }
}

module.exports = { imagekit, uploadImage, ImageKitAuthError };
    