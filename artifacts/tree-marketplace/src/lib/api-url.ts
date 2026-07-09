import { setBaseUrl } from '@workspace/api-client-react';

const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}
