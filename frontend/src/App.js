
import './App.css';
import AdminLoginComponent from './components/admin/AuthComponents/AdminLoginComponent';

import AgenticDashboard from './components/Agentic/Dashboard'
import ManageAuth from './services/admin/ManageAuth';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  BrowserRouter,
  Navigate
} from 'react-router-dom';
import PrivateRoutes from './helpers/PrivateRoutes';
import React from 'react';



class App extends React.Component {

  constructor(props) {
    super(props)
    this.authInstance = ManageAuth.getInstance()
    this.state = {
      isLoggedIn: this.authInstance.isUserLoggedIn()
    }
  }

  clearCacheData = () => {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  };
  
  componentDidMount() {

    this.authInstance.addObserver(this.logOut)
    this.clearCacheData()
  }

  logOut = () => {
    
    window.location.reload(false);
  }

  componentWillUnmount() {
    this.authInstance.removeObserver(this.logOut)
  }

  render() {
    return (
      <div>
        <BrowserRouter>
          <Routes>
            <Route exact path='' element={< HomePage />}></Route>
            <Route exact path='/admin/login' element={< AdminLoginComponent />}></Route>
            
            {/* Private Admin Routes */}
            <Route element={<PrivateRoutes />}>
              <Route exact path='/admin/dashboard' element={< AgenticDashboard />}></Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    );
  }
}

function HomePage() {
  return (
    <h1 className="text-3xl font-bold underline">
      Hello world!
    </h1>
  )
}


export default App;
