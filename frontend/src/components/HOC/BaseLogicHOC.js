import React from 'react';
import InfoModalComponent from '../../CommonComponents/InfoModal/InfoModalComponent';
import InfoModalOkBtnComponent from '../../CommonComponents/InfoModal/InfoModalOkBtnComponent';
import NavBarComponent from '../../CommonComponents/NavBarComponent';
import Loader from '../../helpers/Loader/loader';
import { MainServices } from '../../services/MainServices';

export function BaseLogicHOC(WrappedComponent) {

    return class extends React.Component {
        constructor(props) {
            super(props)
            this.state = {
                "isLoading": false,
                showWarn: false,
                warnMsg: "",
                'shouldShowModal': false,
                'modalType': 'success',
                'modalMessage': 'Test',
                'redirectURL': '',
                'loaderMsg': "Loading"

            }
            this.success='success'
            this.failure='failure'
        }

        showWarn = (warnMsg, callback) => {
            
            this.setState({ showWarn: true, warnMsg: warnMsg, callback: callback })
        }

        hideWarn = () => {
            this.setState({ showWarn: false })
        }
        showModal = (modalType, modalMessage, redirectURL) => {
            console.log('🚀🚀🚀===  redirectURL BaseLogicHOC.js [37] ===', redirectURL );
            this.setState({ modalType: modalType, modalMessage: modalMessage, shouldShowModal: true, redirectURL: redirectURL })
        }
        hideModal = () => {
            
            this.setState({ shouldShowModal: false })
        }
        setLoaderMsg = (msg) => {
            this.setState({
                loaderMsg: msg
            })
        }

        showLoader = () => {
            this.setState({ isLoading: true })
        }

        hideLoader = () => {
            this.setState({ isLoading: false })
        }

        render() {
            console.log('🚀🚀🚀=== this.state.redirectURL BaseLogicHOC.js [59] ===', this.state.redirectURL);
            return (
                <>
                    {this.state.isLoading && <Loader msg={this.state.loaderMsg} />}
                    <InfoModalOkBtnComponent
                    showModal={this.state.showWarn}
                    modalType='failure'
                    modalMessage={this.state.warnMsg}
                    hideModal={this.hideWarn}
                    btnTxt = "Ok, Continue"
                    callback={this.state.callback}
                />

                <InfoModalComponent
                    showModal={this.state.shouldShowModal}
                    modalType={this.state.modalType}
                    modalMessage={this.state.modalMessage}
                    hideModal={this.hideModal}
                    redirectURL={this.state.redirectURL}
                />
                {/* <NavBarComponent  callback={this.toggleSideMenu} /> */}
                    <WrappedComponent 
                    showLoader={this.showLoader}
                    hideLoader={this.hideLoader}
                    showWarn={this.showWarn}
                    hideWarn={this.hideWarn}
                    showModal={this.showModal}
                    hideModal={this.hideModal}
                    success={this.success}
                    failure={this.failure}  
                    {...this.props} >
                        
                    </WrappedComponent>
                </>
            )
        }
    }

}

