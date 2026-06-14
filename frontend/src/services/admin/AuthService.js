import { handleResponse } from "../../helpers/handleResponse"
import AppConfig from "../../AppConfig";
export const AuthService = {
    login: login,
    adminsignup: adminsignup,
};



    function login(email,password) {
        const requestHeader = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "email": email,
                "password": password
            })
        }
        return fetch(AppConfig.baseUrl + "/api/v1/auth/login", requestHeader).then(handleResponse)
    }

    function adminsignup(mobileNumber,password, name, pic) {
        const requestHeader = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "mobileNumber": mobileNumber,
                "password": password,
                "name": name,
                'pic': pic
            })
        }
        return fetch(AppConfig.baseUrl + "/admin/register", requestHeader).then(handleResponse)
    }
