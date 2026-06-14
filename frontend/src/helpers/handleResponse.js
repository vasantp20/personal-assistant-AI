import ManageAuth from '../services/admin/ManageAuth'

export function handleResponse(response) {
    // 
    return response.text().then(text => {
        // 
        const data = text && JSON.parse(text);
        // 
        if (!response.ok) {
            if ([401, 403].indexOf(response.status) !== -1) {
                let auth = ManageAuth.getInstance()
                auth.logout()
                localStorage.removeItem('token')
                
                
                if(response.status === 401) {
                    
                   
                    
                    // authenticationService.refreshToken()
                    // .then(
                    //     res => {
                    //         
                    //         localStorage.setItem("token", res.token)
                            
                    //     },
                    //     err => {
                    //         
                    //     }
                    // )
                }
                // auto logout if 401 Unauthorized or 403 Forbidden response returned from api
                // authenticationService.logout();
                // location.reload(true);
            }
            
            const error = (data && data.message)
            return Promise.reject(error);
        }

        return data;
    });
}