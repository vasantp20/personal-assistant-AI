// import ManageAuth from "../services/admin/ManageAuth"


export function authHeader() {
    const user = localStorage.getItem('token')
    if(user && user) {
        
        return {
            "Authorization": "Bearer " + user,
            'Content-Type': 'application/json'
        }
    }
}