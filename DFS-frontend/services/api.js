require('dotenv').config();
import axios from "axios";

const PORT1 = "";
const api = axios.create({
    baseURL: `http://${PORT1}`,
    timeout: 5000,
});

export default api
