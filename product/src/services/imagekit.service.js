
const ImageKit = require('imagekit');
const { v4: uuidv4 } = require("uuid")
require('dotenv').config(); // ensure env vars loaded if service imported directly

class ImageKitAuthError extends Error {
    constructor(message, help) {
        super(message);
        this.name = 'ImageKitAuthError';
        this.help = help;
        this.code = 'IMAGEKIT_AUTH_FAILED';
    }
}

let imagekitInstance = null;

function getImageKit() {
    if (imagekitInstance) return imagekitInstance;

    const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } = process.env;

    const missing = [];
    if (!IMAGEKIT_PUBLIC_KEY) missing.push('IMAGEKIT_PUBLIC_KEY');
    if (!IMAGEKIT_PRIVATE_KEY) missing.push('IMAGEKIT_PRIVATE_KEY');
    if (!IMAGEKIT_URL_ENDPOINT) missing.push('IMAGEKIT_URL_ENDPOINT');

    if (missing.length) {
        const msg = `Missing ImageKit configuration: ${missing.join(', ')}`;
        const help = 'Set the required env vars (IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT).';
        const error = new ImageKitAuthError(msg, help);
        error.code = 'IMAGEKIT_CONFIG_MISSING';
        throw error;
    }

    imagekitInstance = new ImageKit({
        publicKey: IMAGEKIT_PUBLIC_KEY,
        privateKey: IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: IMAGEKIT_URL_ENDPOINT
    });
    return imagekitInstance;
}

async function uploadImage({ buffer, folder = '/products' }) {
    try {
        const ik = getImageKit();
        const res = await ik.upload({
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

module.exports = { getImageKit, uploadImage, ImageKitAuthError };
    