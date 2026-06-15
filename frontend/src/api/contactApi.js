import axiosInstance from "./axiosConfig";

const contactApi = {
    createContact: (data) =>
        axiosInstance.post("/contacts", data).then((r) => r.data),
};

export default contactApi;