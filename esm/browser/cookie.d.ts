export interface CookieOptions {
    secure?: boolean;
    crossSite?: boolean;
    domain?: string;
}
export declare function setCookie(name: string, value: string, expireDelay: number, options?: CookieOptions): Promise<void>;
export declare function getCookie(name: string): Promise<string | undefined>;
export declare function deleteCookie(name: string, options?: CookieOptions): Promise<void>;
