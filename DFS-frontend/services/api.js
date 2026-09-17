import axios from "axios";
import { auth } from "./firebaseConfig";

const API_LINK = process.env.EXPO_PUBLIC_API_LINK;
const api = axios.create({
    baseURL: API_LINK,
    timeout: 8000,
});

// Anexa o ID token do Firebase em toda requisição, exigido pelo middleware `autenticar` da API.
api.interceptors.request.use(async (config) => {
    if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
