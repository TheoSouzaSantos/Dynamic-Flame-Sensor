import axios from "axios";

const API_LINK = process.env.EXPO_PUBLIC_API_LINK;
const api = axios.create({
    baseURL: API_LINK,
    timeout: 5000,
});

export default api
