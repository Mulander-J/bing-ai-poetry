import { BaseImageGenerator, ImageGeneratorConfig, ImageGenerationResult } from "./base";
import { sleep } from '../utils';

const BING_URL: string = "https://www.bing.com";
const HEADERS: { [key: string]: string } = {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "content-type": "application/x-www-form-urlencoded",
    referrer: "https://www.bing.com/images/create/",
    origin: "https://www.bing.com",
    "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
};

interface BingImageConfig extends ImageGeneratorConfig {
    cookie: string;
}

export class BingImageGenerator extends BaseImageGenerator {
    protected readonly providerName: string = "Bing Image Creator";
    protected _header: any;

    constructor(config: BingImageConfig) {
        super(config);
        this._header = {
            cookie: config.cookie,
            ...HEADERS,
        };
    }

    protected validateConfig(config: ImageGeneratorConfig): void {
        if (!config.cookie) {
            throw new Error("Bing cookie is required");
        }
    }

    public async createImage(prompt: string): Promise<string[]> {
        const encodedPrompt = encodeURIComponent(prompt);
        let formData = new FormData();
        formData.append("q", encodedPrompt);
        formData.append("qa", "ds");
        console.log("Sending request...");
        const url = `${BING_URL}/images/create?q=${encodedPrompt}&rt=3&FORM=GENCRE`;

        try {
            const { redirect_url, request_id } = await this.fetchRedirectUrl(url, formData);
            const result = await this.fetchResult(encodedPrompt, redirect_url, request_id);
            return result.images;
        } catch (e) {
            return this.handleError(e);
        }
    }

    protected async handleResponse(response: any): Promise<ImageGenerationResult> {
        if (!response || response.includes("errorMessage")) {
            throw new Error("Invalid response from Bing API");
        }
        const images = this.parseResult(response);
        return { images };
    }

    private async fetchRedirectUrl(url: string, formData: FormData) {
        const response = await fetch(url, {
            method: "POST",
            mode: "cors",
            credentials: "include",
            headers: this._header,
            body: formData,
            redirect: "manual",
        });
        if (response.ok) {
            throw new Error("Request failed as 200");
        } else {
            const redirect_url = response.headers.get("location").replace("&nfy=1", "");
            const request_id = redirect_url.split("id=")[1];
            return { redirect_url, request_id };
        }
    }

    private async fetchResult(encodedPrompt: string, redirect_url: string, request_id: string) {
        try {
            await fetch(`${BING_URL}${redirect_url}`, {
                method: "GET",
                mode: "cors",
                credentials: "include",
                headers: this._header,
            });
        } catch (e) {
            throw new Error(`Request redirect_url failed ${e.message}`);
        }

        const getResultUrl = `${BING_URL}/images/create/async/results/${request_id}?q=${encodedPrompt}`;
        const start_wait = Date.now();
        let result = "";
        while (true) {
            console.log("Waiting for result...");
            if (Date.now() - start_wait > 200000) {
                throw new Error("Timeout");
            }

            await sleep(1000);
            const response = await fetch(getResultUrl, {
                method: "GET",
                mode: "cors",
                credentials: "include",
                headers: this._header,
            });
            if (response.status !== 200) {
                throw new Error("Bad status code");
            }
            result = await response.text();
            if (result && !result.includes("errorMessage")) {
                break;
            }
        }
        return await this.handleResponse(result);
    }

    private parseResult(result: string): string[] {
        console.log("Parsing result...");
        const regex = /src="([^"]*)"/g;
        const matches = [...result.matchAll(regex)].map((match) => match[1]);
        const normal_image_links = matches.map((link) => link.split("?w=")[0]);
        const safe_image_links = normal_image_links
            .filter((link) => !/r.bing.com\/rp/i.test(link))
            .filter((link) => !/rp/i.test(link))
            .filter((link) => link.startsWith("http"));

        if (safe_image_links.length === 0) {
            throw new Error("No valid images found");
        }
        return [...new Set(safe_image_links)];
    }
}