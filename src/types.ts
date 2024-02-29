export type JRSCV2Response = {
    status: string
    data: {
        id: string
        content: string
        popularity: number
        origin: {
            title: string
            dynasty: string
            author: string
            content: null | string[]
            translate: null | string[]
        },
        matchTags: null | string []
        recommendedReason: string
        cacheAt: string
    },
    token: string
    ipAddress: `${number}.${number}.${number}.${number}`
};

export type SentenceResponse = {
    content: string;
    origin: string;
    author: string;
    category: string;
    dynasty?: string;
    fullText?: string;
    translate?: string;
}

export type Response = {
    images: string[];
} & SentenceResponse;
