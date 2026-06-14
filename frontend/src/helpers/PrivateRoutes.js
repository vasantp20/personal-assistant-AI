import ManageAuth from "../services/admin/ManageAuth"
import { Outlet, Navigate} from "react-router-dom"

import { Redirect, Route } from 'react-router-dom';

const PrivateRoutes = () => {
    let auth = ManageAuth.getInstance()
    let isLoggedIn = auth.isUserLoggedIn()
    
    return (
        isLoggedIn ? <Outlet /> : <Navigate to="/admin/login"/>
    )
}



export default PrivateRoutes
