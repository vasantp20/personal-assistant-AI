import React from 'react';
import { AuthService } from '../../../services/admin/AuthService';
import ManageAuth from "../../../services/admin/ManageAuth";
import { Navigate   } from "react-router-dom";
import Loader from '../../../helpers/Loader/loader';




class RegisterComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      'name': '',
      'email': null,
      'password': '',
      'redirectDashboard': false,
      'isLoading': false
    };
    console.log("ADmin register")
    this.handleEmail = this.handleEmail.bind(this);
    this.handlePassword = this.handlePassword.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleName(event) {
    this.setState({ name: event.target.value });
  }

  handleEmail(event) {
    this.setState({ mobileNumber: event.target.value });
  }

  handlePassword(event) {
    this.setState({ password: event.target.value });
  }

  handleSubmit(event) {
    // alert('A name was submitted: ' + this.state.email + this.state.password);
    // event.preventDefault();
    
    this.setState({"isLoading": true})
    AuthService.register(this.state.name ,this.state.mobileNumber, this.state.password)
      .then(
        res => {
          
          var auth = ManageAuth.getInstance()
          auth.login(res.token, res.role)
          this.setState({"isLoading":false})
          this.navigateToDashboard()
        },
        error => {
          
          this.setState({"isLoading":false})
          // localStorage.clear()
        })

  }

  
  navigateToDashboard() {
    this.setState({
      'redirectDashboard': true,
      'isLoading': false,
    })
    
  }


  render() {
    let loader = <div></div>;
    if(this.state.isLoading) {
      loader = <Loader />
    }
    if (this.state.redirectDashboard) {
      return <Navigate to={{
        pathname: '/dashboard'
      }} />
    }

    return (<div>
      
      <section className="">
      {loader}
        <div className="w-full lg:w-4/12 px-4 mx-auto pt-6 ">
          <div className="relative flex pt-4 flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-white bg-blueGray-200 border-0">
            <h1>Register</h1>
            <div className="flex-auto px-4 lg:px-10 py-10 pt-0">

              <form onSubmit={this.handleSubmit}>
                <div className="relative w-full mb-3">
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2" htmlFor="grid-password">Email</label><input type="text" className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150" placeholder="Name" value={this.state.name} onChange={this.handleName} />
                </div>

                <div className="relative w-full mb-3">
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2" htmlFor="grid-password">Email</label><input type="text" className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150" placeholder="Mobile Number" value={this.state.mobileNumber} onChange={this.handleEmail} />
                </div>
                <div className="relative w-full mb-3">
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2" htmlFor="grid-password">Password</label><input type="password" className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150" placeholder="Password" value={this.state.password} onChange={this.handlePassword} />
                </div>
                <div>
                  <label className="inline-flex items-center cursor-pointer"><input id="customCheckLogin" type="checkbox" className="form-checkbox border-0 rounded text-blueGray-700 ml-1 w-5 h-5 ease-linear transition-all duration-150" /><span className="ml-2 text-sm font-semibold text-blueGray-600">Remember me</span></label>
                </div>
                <div className="text-center mt-6">
                  <button onClick={this.handleSubmit} className="bg-black text-white active:bg-blue-600 text-sm font-bold uppercase px-6 py-3 rounded-xl shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150" type="button"> Sign In </button>
                </div>
              </form>
            </div>
          </div>
        </div>

      </section>
    </div>)
  }
}
export default RegisterComponent;