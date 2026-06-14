import React from "react"

export default class Loader extends React.Component {

    constructor(props) {
        super(props)
        this.state = {
            loaderMsg: "Loading"
        }
    }

    componentDidMount() {
        if (this.props.msg && this.props.msg !== '') {
            this.setState({ loaderMsg: this.props.msg })
        }
    }

    render() {
        return (
            <div
                role="status"
                className="fixed top-0 left-0 bottom-0 right-0 inset-0 bg-opacity-10 backdrop-blur-sm flex flex-col justify-center items-center z-100"
            >
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-800 animate-spin" />
                <h1 className="my-2 text-xl animate-text bg-gradient-to-r from-gray-300 to-gray-800 bg-clip-text text-transparent md:text-2xl font-black">
                    {this.state.loaderMsg}
                </h1>
                <span className="sr-only">Loading...</span>
            </div>
        )
    }
}