import "dotenv/config";
import { SENTENCE_API } from "./const";
import { BingImageCreator } from "./bing-image-creator";
import type { JRSCV2Response, SentenceResponse, Response } from "./types";


/**
 * Get the sentence
 * @returns SentenceResponse
 * @throws {Error} The error
 **/
async function getSentence(): Promise<SentenceResponse> {
    try {
        const res = await fetch(SENTENCE_API, {
            headers: {
                'X-User-Token': process.env.jrsc_token
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

async function getImageBySentence(): Promise<Response> {
    const bingImageCreator = new BingImageCreator();

    const res = await getSentence();
    console.log("getSentence Result: ", res);

    const targetTxt = res.translate || res.content
    const prompt = `"""${targetTxt}""", textless`;    

    try {
        const images = await bingImageCreator.createImage(prompt);
        return {
            images,
            ...res
        };
    } catch (error) {
        throw new Error(`Bing Image create failed: ${error.message}`);
    }
}

export { getImageBySentence };
