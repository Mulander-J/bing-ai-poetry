import type { JRSCV2Response, SentenceResponse, Response } from "./types";
import { BingImageGenerator } from "./image-generator";

// export const SENTENCE_API = "https://v1.jinrishici.com/all";
const SENTENCE_API = "https://v2.jinrishici.com/sentence";


/**
 * Get the sentence
 * @returns SentenceResponse
 * @throws {Error} The error
 **/
async function getSentence(token:string): Promise<SentenceResponse> {
    try {
        const res = await fetch(SENTENCE_API, {
            headers: {
                'X-User-Token': token
            },
        });
        const { data }: JRSCV2Response = await res.json();
        return {
            content: data.content,
            origin: data.origin.title,
            author: data.origin.author,
            category: data.matchTags?.join() || '',
            dynasty: data.origin.dynasty,
            fullText: data.origin.content?.join('') || '',
            translate: data.origin.translate?.join('') || ''
        };
    } catch (e) {
        throw new Error("Request Sentence failed: ", e?.message || e);
    }
}

interface ImageGeneratorParams extends Record<string, string> {
    apiKey?: string;
    token: string;
}

async function getImageBySentence(params: ImageGeneratorParams): Promise<Response> {
    const res = await getSentence(params.token);
    console.log("getSentence Result: ", res);

    const targetTxt = res.translate || res.content;
    const prompt = `"""${targetTxt}"""`;
    try {
        let imageGenerator = new BingImageGenerator({cookie:params.apiKey});
        const images = await imageGenerator.createImage(prompt);
        return {
            ...res,
            images
        };
    } catch (error) {
        throw new Error(`Image creation failed: ${error.message}`);
    }
}

export { getImageBySentence };
