
import CryptoJS from 'crypto-js';

const seperator = '\n';

export interface ApiSignature {
    sign(
        url: string,
        date: string, 
        method: string,
        body: string,
        contentType: string,
        headers: any
    ): string;
}

export class ApiSignatureImplement implements ApiSignature {
    private readonly apiSecret: string;

    constructor(apiSecret: string) {
        this.apiSecret = apiSecret;
    }

    public sign(url: string,
        date: string, 
        method: string,
        body: string,
        contentType: string,
        headers: any): string {
        const canonicalizedHeader = this.canonicalizedHeaders(headers);
        const resource = this.canonicalizedResource(url);
        const s = this.signString(
            method,
            body,
            contentType,
            date, canonicalizedHeader, resource);
        return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(s, this.apiSecret));
    }

    private canonicalizedHeaders(headers: any): string {
        if (headers.length === 0) {
            return "";
        }

        const keys: string[] = [];
        const newHeaders: any = {};
        for (const key in headers) {
            const newKey = key.toLowerCase();
            if (newKey.indexOf("as-") === -1) {
                continue;
            }
            keys.push(newKey);
            newHeaders[newKey] = headers[key].trim();
        }
        keys.sort();

        const result: string[] = [];
        for (let i = 0; i < keys.length; i++) {
            result.push(keys[i] + ":" + newHeaders[keys[i]]);
        }
        return result.join(seperator);
    }

    private canonicalizedResource(url: string) {
        const u = new URL(url);
        const params = u.search.split('?');
        if (params.length < 2) {
            return u.pathname;
        }
        const sortedParams = new URLSearchParams(params[1]);
        sortedParams.sort();
        return u.pathname + "?" + sortedParams.toString();
    }

    private signString(method: string, body: string, contentType: string, date: string, canonicalizedHeader: string, resource: string): string {
        let result: string = method + seperator;
        if (body === undefined || body.length === 0) {
            contentType = '';
            body = '';
        } else {
            body = CryptoJS.MD5(body).toString().toUpperCase();
        }
        result += body + seperator;
        result += contentType + seperator;
        result += date + seperator;
        result += canonicalizedHeader + seperator;
        result += resource;
        return result;
    }
}