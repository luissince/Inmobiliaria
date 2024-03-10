import Downloader from "../downloader";
import React from "react";

const guid = () => {
    let s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

class useFileDownloader extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            files: []
        }
    }

    download = (file) => {
        this.state.files.push({ ...file, downloadId: guid() })

        this.setState({
            files: this.state.files
        });
    }

    remove = (removeId) => {
        this.setState({
            files: [...this.state.files.filter((file) => file.downloadId !== removeId),]
        });
    }

    render() {
        return this.state.files.length > 0 ? (
            <Downloader files={this.state.files} remove={(e) => this.remove(e)} />
        ) : null;
    }
};

export default useFileDownloader;