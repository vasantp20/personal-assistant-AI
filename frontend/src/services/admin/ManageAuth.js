// import { authenticationService } from "./auth.service";

export default class ManageAuth {
    constructor() {
        this.observers = [];
        this.loginobservers = [];
    }
    static myInstance = null;
    token = null;

    static getInstance() {
        if(ManageAuth.myInstance == null) {
            this.myInstance = new ManageAuth()
            return this.myInstance
        } else {
            return this.myInstance
        }
    }

    // Add an observer to this.observers.
  addObserver(observer) {
    // 
    this.observers.push(observer);
  }

  // Remove an observer from this.observers.
  removeObserver(observer) {
    const removeIndex = this.observers.findIndex(obs => {
      return observer === obs;
    });

    if (removeIndex !== -1) {
      this.observers = this.observers.slice(removeIndex, 1);
    }
  }

    logout() {
        
        this.token = null
        this.role = null
        localStorage.clear()
        this.notify()
    }

    notify() {
        if (this.observers.length > 0) {
          this.observers.forEach(observer => observer());
        }
      }

    getRole() {
      if(this.role) {
        return this.role
      }
      const localRole = localStorage.getItem('role');
      if(localRole) {
        this.role = localRole
        return localRole
      } else {
        this.logout()
      }
      
    }
    
    isUserLoggedIn() {
        if(this.token) {
            
            return true
        } 
        let localToken = localStorage.getItem("token")
        
        if(localToken) {
            
            this.token = localToken
            return true
        }
        return false
    }


    login(token,role) {
        this.token = token
        this.role = role
        localStorage.setItem("token", token)
        localStorage.setItem("role", role)
        
    }

}