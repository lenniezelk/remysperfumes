/**
 * Converts a File object to a base64 data URL string
 * @param file - The File object to convert
 * @returns Promise resolving to base64 data URL string
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
    });
}

/**
 * Validates if a string is a valid base64 image data URL
 * @param base64String - The base64 string to validate
 * @returns true if valid, false otherwise
 */
export function validateBase64Image(base64String: string): boolean {
    const base64Regex = /^data:image\/[^;]+;base64,/;
    return base64Regex.test(base64String);
}

/**
 * Converts a base64 data URL to a Blob object
 * @param base64DataUrl - Base64 data URL string (e.g., "data:image/png;base64,iVBORw0KGgo...")
 * @returns Object containing the Blob and MIME type, or null if invalid format
 */
export function base64ToBlob(base64DataUrl: string): { blob: Blob; mimeType: string } | null {
    // Extract MIME type and base64 data
    const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
        return null;
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    return { blob, mimeType };
}

/**
 * Uploads an image to Cloudflare Images
 * @param blob - The image blob to upload
 * @param filename - The filename for the uploaded image
 * @param metadata - Optional metadata to attach to the image
 * @param accountId - Cloudflare account ID
 * @param apiToken - Cloudflare API token with Images permission
 * @returns The URL of the first variant of the uploaded image, or null if upload failed
 */
export async function uploadToCloudflareImages(
    blob: Blob,
    filename: string,
    metadata: Record<string, any>,
    accountId: string,
    apiToken: string
): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('metadata', JSON.stringify(metadata));

    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;

    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to upload image to Cloudflare: ${JSON.stringify(errorData)}`);
            return null;
        }

        const result = await response.json() as {
            success: boolean;
            errors: any[];
            messages: any[];
            result: {
                id: string;
                filename: string;
                uploaded: string;
                requireSignedURLs: boolean;
                variants: string[];
                meta: Record<string, any>;
            };
        };

        if (!result.success) {
            console.error(`Failed to upload image: ${JSON.stringify(result.errors)}`);
            return null;
        }

        // Return the first variant URL
        if (result.result.variants.length > 0) {
            return result.result.variants[0];
        }

        return null;
    } catch (error) {
        console.error('Error uploading to Cloudflare Images:', error);
        return null;
    }
}
