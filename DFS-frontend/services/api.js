import axios from "axios";
import { auth } from "./firebaseConfig";

const API_LINK = process.env.EXPO_PUBLIC_API_LINK;
const api = axios.create({
    baseURL: API_LINK,
    timeout: 8000,
});

// Cliente HTTP único do app para a API própria (DFS-backend), com o ID token
// do Firebase anexado automaticamente — assim cada tela chama `api.get/post`
// normalmente, sem buscar o token manualmente a cada requisição. Exigido
// pelo middleware `autenticar` da API em quase todas as rotas.
api.interceptors.request.use(async (config) => {
    if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
