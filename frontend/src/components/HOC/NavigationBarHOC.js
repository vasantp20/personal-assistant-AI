import React from 'react';
import { Link } from 'react-router-dom';


//icons
import AddMemberIcon from "../../assets/AddMemberIcon.png"
import AdminIcon from "../../assets/AdminIcon.png"
import PendingPaymentIcon from "../../assets/PendingPaymentIcon.png"
import RenewalIcon from "../../assets/RenewalIcon.png"
import ReportIcon from "../../assets/ReportIcon.png"
import UpdateMembershipIcon from "../../assets/UpdateMembershipIcon.png"
import LogoutIcon from "../../assets/LogoutIcon.png"







import ApproveMembersComponent from '../admin/DashComponents/ApproveMembers/ApproveMembersComponent';
import UpdatePricingComponent from '../admin/DashComponents/UpdatePricingComponent';
import NavBarComponent from '../../CommonComponents/NavBarComponent';
import GetMembershipComponent from '../admin/DashComponents/UpdateMembershipDetails/GetMembershipComponent';
import ReportComponent from '../admin/DashComponents/Reports/ReportComponent';
import RenewalComponent from '../admin/DashComponents/RenewalComponents/RenewalComponent';
import PendingPaymentComponent from '../admin/DashComponents/PendingComponents/PendingPaymentComponent';
import ManageAuth from '../../services/admin/ManageAuth';


export function NavigationBarHOC(WrappedComponent) {
    return class extends React.Component {

        constructor(props) {
            super(props)
            this.state = {
                "compID": 0,
                "isSideMenuVisible": false,
                "isLoggedIn": false,
                "role": "user"
            }
            this.auth = ManageAuth.getInstance()
        }

        componentDidMount() {
            let isLoggedIn = this.auth.isUserLoggedIn()
            let role = this.auth.getRole()
            this.setState({
                isLoggedIn: isLoggedIn,
                role: role

            })
            
        }

        handleclick = (id) => {
            
            this.setState({ compID: id })
            this.toggleSideMenu()
        }

        logOutClicked = () => {
            this.auth.logout()
        }

        setSelectedComp = (id) => {
            this.setState({
                compID: id
            })
        }

        toggleSideMenu = () => {

            this.setState((prevState) => {
                return {
                    "isSideMenuVisible": !prevState.isSideMenuVisible
                }
            })
        }


        render() {
            let classNameForMenu = " p-5 shadow-xl bg-white flex-none hidden md:block  min-h-screen "
            let isSuperAdmin = false
            if (this.state.isSideMenuVisible) {
                classNameForMenu = "p-5 shadow-xl bg-white flex-none min-h-screen "
            }
            let shouldDisplaySideBar = false
            let linksForUser = <Link to="/admin/login"><AdminDashboardBtnComponent id={6} img={ReportIcon} text="Admin" /></Link>
            let logoutBtn = <AdminDashboardBtnComponent img={LogoutIcon} text="Logout" callback={this.logOutClicked}/>
            let linksForAdmin = (
                <>
                    <Link to="/admin/dashboard/approve-member"><AdminDashboardBtnComponent id={1} img={AddMemberIcon} text="Approve New Member" isSelected={this.state.compID == 1} /></Link>
                    <Link to="/admin/dashboard/pending"><AdminDashboardBtnComponent id={2} img={PendingPaymentIcon} text="Pending Payment" isSelected={this.state.compID == 2} /></Link>
                    <Link to="/admin/dashboard/renewal"><AdminDashboardBtnComponent id={3} img={RenewalIcon} text="Renewal" isSelected={this.state.compID == 3} /></Link>
                    <Link to="/admin/dashboard/rollover"><AdminDashboardBtnComponent id={7} img={RenewalIcon} text="Rollover" isSelected={this.state.compID == 7} /></Link>
                    <Link to="/admin/dashboard/update"><AdminDashboardBtnComponent id={4} img={UpdateMembershipIcon} text="Update Membership" isSelected={this.state.compID == 4} /></Link>
                    <Link to="/admin/dashboard/report"><AdminDashboardBtnComponent id={5} img={ReportIcon} text="View Report" isSelected={this.state.compID == 5} /></Link>
                </>
            )
            let linksForSuperAdmin = (
                <>
                   
                    <Link to="/admin/dashboard/update-pricing"><AdminDashboardBtnComponent id={6} img={ReportIcon} text="Update Pricing" isSelected={this.state.compID == 6} /></Link>

                </>
            )
            let linksToShow = <>{linksForUser}</>
            if (this.state.role === 'user' && this.state.isLoggedIn === false) {
                linksToShow = (<>{linksForUser}</>)
                
            } else if (this.state.isLoggedIn && this.state.role === 'admin') {
                linksToShow = (
                    <>
                        {linksForUser}
                        {linksForAdmin}
                        {logoutBtn}
                    </>
                )
            } else if (this.state.isLoggedIn && this.state.role === 'superAdmin') {
                isSuperAdmin = true
                linksToShow = (<>
                    {linksForUser}
                    {linksForAdmin}
                    {linksForSuperAdmin}
                    {logoutBtn}
                </>)
            }
            return (
                <section>
                    <NavBarComponent callback={this.toggleSideMenu} />
                    <div className='flex justify-center'>
                        <div className={classNameForMenu} >
                        {linksToShow}

                        </div>
                        <div className='flex-1'>
                            <WrappedComponent
                                isSuperAdmin={isSuperAdmin}
                                setSelectedComp={this.setSelectedComp}
                                {...this.props} >

                            </WrappedComponent>
                        </div>

                    </div>
                </section>

            )


        }
    }
}


class AdminDashboardBtnComponent extends React.Component {

    handleClickChild = (event) => {
        this.props.callback(event.target.id)
    }
    render() {
        let classTest = 'bg-black p-2 my-6 rounded'
        if (this.props.isSelected) {
            classTest = 'bg-gray-500 px-2 py-4 my-6 rounded '
        }
        return (
            <div className={classTest}>
                {/* <a href='/admin/addMember'> */}
                {/* <img src={this.props.img} />
                    <div className='text-white'>{this.props.text}</div> */}

                <button onClick={this.handleClickChild} id={this.props.id} type="button" className="mx-2 text-white font-medium rounded-lg text-sm px-5 text-center inline-flex items-center mr-2">
                    <img className="object-contain h-8 w-8 mr-4" src={this.props.img} />
                    {this.props.text}
                </button>
                {/* </a> */}

            </div>


        )


    }
}

