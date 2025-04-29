import { QueryClient, QueryFunction } from "@tanstack/react-query";
import config from '../config'; // Import the configuration

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  // Change the 'url' parameter to be the relative path (e.g., '/users', '/properties')
  relativePath: string,
  data?: unknown | undefined,
): Promise<T> {
  // Construct the full URL using the base URL from config
  const fullUrl = `${config.apiBaseUrl}${relativePath}`;

  try {
    console.log(`API Request: ${method} ${fullUrl}`, data); // Log the full URL

    const res = await fetch(fullUrl, { // Use the full URL
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // Adjust the check for auth routes if needed based on relativePath
    if (relativePath.includes('/login') || relativePath.includes('/firebase-auth') || relativePath.includes('/logout')) {
      const jsonResponse = await res.json();
      console.log(`Auth API Response:`, jsonResponse);
      return jsonResponse as T;
    }

    await throwIfResNotOk(res);

    if (method === "HEAD" || res.status === 204) {
      return {} as T;
    }

    const jsonResponse = await res.json();
    console.log(`API Response:`, jsonResponse);
    return jsonResponse as T;
  } catch (error) {
    console.error(`API Request Error (${method} ${fullUrl}):`, error); // Log the full URL on error
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Assume queryKey[0] is the relative path
    const relativePath = queryKey[0] as string;
    const fullUrl = `${config.apiBaseUrl}${relativePath}`; // Construct full URL

    const res = await fetch(fullUrl, { // Use the full URL
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };


export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});