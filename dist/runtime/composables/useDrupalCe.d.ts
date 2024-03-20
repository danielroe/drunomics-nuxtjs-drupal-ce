export declare const useDrupalCe: () => {
    fetchPage: (path: string, useFetchOptions?: UseFetchOptions<any>, overrideErrorHandler?: ((error?: any) => void) | undefined) => Promise<any>;
    fetchMenu: (name: string, useFetchOptions?: UseFetchOptions<any>, overrideErrorHandler?: ((error?: any) => void) | undefined) => Promise<any>;
    getMessages: () => Ref;
    getPage: () => Ref;
    renderCustomElements: (customElements: Record<string, any> | Array<Object>) => any;
    passThroughHeaders: (nuxtApp: any, pageHeaders: any) => void;
    useFetchDrupal: (path: string, fetchOptions?: UseFetchOptions<any>) => any;
    getCeApiEndpoint: (localize?: boolean) => any;
};
