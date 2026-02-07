export interface ApiEndpointConfig {
    url: string;
    useSupabaseHeaders: boolean;
}

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const getConfiguredApiBaseUrl = (): string | null => {
    const raw = import.meta.env.VITE_API_BASE_URL;
    if (!raw || raw.trim().length === 0) return null;
    return trimTrailingSlash(raw.trim());
};

const getSupabaseFunctionsBaseUrl = (): string => {
    const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
    return `${trimTrailingSlash(rawSupabaseUrl)}/functions/v1`;
};

const joinPath = (base: string, path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
};

const resolveEndpoint = (customPath: string, supabaseFunctionName: string): ApiEndpointConfig => {
    const apiBaseUrl = getConfiguredApiBaseUrl();
    if (apiBaseUrl) {
        return {
            url: joinPath(apiBaseUrl, customPath),
            useSupabaseHeaders: false,
        };
    }

    const functionsBaseUrl = getSupabaseFunctionsBaseUrl();
    return {
        url: joinPath(functionsBaseUrl, supabaseFunctionName),
        useSupabaseHeaders: true,
    };
};

export const getPushSubscriptionEndpoint = (): ApiEndpointConfig =>
    resolveEndpoint('/api/push-subscription', 'push-subscription');

export const getGameOperationEndpoint = (): ApiEndpointConfig =>
    resolveEndpoint('/api/game/operation', 'game-operation');

export const buildJsonHeaders = (
    endpoint: ApiEndpointConfig,
    accessToken?: string
): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (accessToken && accessToken.length > 0) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    if (endpoint.useSupabaseHeaders) {
        headers.apikey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
    }

    return headers;
};
