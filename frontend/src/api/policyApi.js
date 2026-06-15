import axiosInstance from "./axiosConfig";

const policyApi = {
    getAll: () =>
        axiosInstance.get("/policies").then((r) => r.data),

    getByType: (type) =>
        axiosInstance.get(`/policies/${type}`).then((r) => r.data),
};

export default policyApi;