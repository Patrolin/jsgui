import { Component } from "../jsgui.mts";

// TODO: fix preloading - don't use .component
const request_cache: Record<string, any> = {};
function defaultOnError(error: Response) {
  console.error(error);
}
type ResponseType = 'json' | 'text' | 'blob';

type UseCachedRequestProps<R extends ResponseType> = {
  component: Component | undefined;
  url: RequestInfo | URL;
  responseType?: R;
  onError?: (error: Response) => void;
} & RequestInit;
type UseCachedRequest<T, R extends ResponseType> = {
  data: R extends 'text' ? string | undefined : (
    R extends 'blob' ? Blob | undefined : T | undefined
  );
  refetch: () => void;
};
export function useCachedRequest<T, R extends ResponseType = 'json'>(props: UseCachedRequestProps<R>): UseCachedRequest<T, R> {
  const {component, url, responseType = 'json', onError = defaultOnError, ...extraOptions} = props;
  const cache_key = [
    url,
    props.method ?? 'GET',
    JSON.stringify(props.headers ?? {}),
    JSON.stringify(props.body ?? {}),
  ].join(',');
  const cached_response = request_cache[cache_key];
  if (cached_response === undefined) {
    request_cache[cache_key] = null;
    fetch(url, extraOptions).then(async (response) => {
      let response_mapped;
      switch (responseType) {
      case 'json':
        response_mapped = await response.json();
        break;
      case 'text':
        response_mapped = await response.text();
        break;
      case 'blob':
        response_mapped = await response.blob();
        break;
      }
      request_cache[cache_key] = response_mapped;
      component?.rerender();
    }).catch(onError);
  }
  return {
    data: cached_response ?? undefined,
    refetch: () => {
      delete request_cache[cache_key];
      component?.rerender();
    },
  };
}
export function clearRequestCache(prefix: string = '') {
  for (let key of Object.keys(request_cache)) {
    if (key.startsWith(prefix)) {
      delete request_cache[key];
    }
  }
}
