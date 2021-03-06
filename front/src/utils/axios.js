import axios from "axios";
import { authModule } from "@/store/auth/auth-actions";
axios.defaults.baseURL = "http://localhost:3000/";
axios.interceptors.request.use((config) => {
    const user = localStorage.getItem("user");
    if (user && config.headers) {
        config.headers["x-access-token"] = `Bearer ${JSON.parse(user).accessToken}`;
    }
    return config;
}, (error) => Promise.reject(error));
let refresh = false;
axios.interceptors.response.use((resp) => resp, async (error) => {
    console.log(error);
    if (error.response.status === 401 && !refresh) {
        refresh = true;
        let payload = { refreshToken: "", userId: 0 };
        const user = localStorage.getItem("user");
        if (user) {
            const parsedUser = JSON.parse(user);
            payload = {
                refreshToken: parsedUser.refreshToken,
                userId: parsedUser.id,
            };
        }
        try {
            const { status, data } = await axios.post("/auth/refreshtoken", payload);
            if (status === 200) {
                console.log(data, "data");
                authModule.setUpdatedTokens(data);
                axios.defaults.headers.common["x-access-token"] = `Bearer ${data.accessToken}`;
                console.log(axios.defaults.headers.common["x-access-token"]);
                refresh = false;
                return axios(error.config);
            }
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
    if (error.response.status === 403) {
        authModule.resetData();
    }
    refresh = false;
    return error.response;
});
