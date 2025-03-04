import React from "react";
import "./index.css";
import { readDataBlob } from '../../../helper/Tools';
import Axios from "axios";

const Downloader = ({ files = [], remove }) => {
    return (
        <div className="downloader">
            <div className="card">
                <div className="card-header">Descargando archivo</div>
                <ul className="list-group list-group-flush">
                    {files.map((file, idx) => (
                        <DownloadItem
                            key={idx}
                            removeFile={() => remove(file.downloadId)}
                            file={file}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
};

class DownloadItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            progress: 0,
            completed: false,
            total: 0,
            loaded: 0,
        }
    }

    componentDidMount() {
        const options = {
            params: {
                params: this.props.file.params
            },
            onDownloadProgress: (progressEvent) => {
                const { loaded, total } = progressEvent;

                this.setState({
                    progress: Math.floor((loaded * 100) / total),
                    loaded,
                    total,
                    completed: false,
                })

            },
        };


        Axios.get(this.props.file.file, {
            responseType: "blob",
            ...options,
        }).then(async (response) => {
            if (this.props.file.filename == undefined) {
                let result = await readDataBlob(response.data);

                const url = window.URL.createObjectURL(new Blob([result.data], { type: "text/xml" }));

                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", result.name);
                document.body.appendChild(link);
                link.click();
            } else {
                const url = window.URL.createObjectURL(response.data);
    
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", this.props.file.filename);
                document.body.appendChild(link);
                link.click();
            }

            this.setState({
                ...this.state,
                completed: true,
            })

            setTimeout(() => {
                this.props.removeFile();
            }, 4000);
        }).catch(error => {
            this.props.removeFile();
        });
    }


    formatBytes = (bytes) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

    render() {
        return (
            <li className="list-group-item" >
                <div className="row">
                    <div className="col-12 d-flex">
                        <div className="d-inline font-weight-bold text-truncate">{this.props.file.name}</div>
                        <div className="d-inline ml-2">
                            <small>
                                {this.state.loaded > 0 && (
                                    <>
                                        <span className="text-success">
                                            {this.formatBytes(this.state.loaded)}
                                        </span>
                                        / {this.formatBytes(this.state.total)}
                                    </>
                                )}

                                {this.state.loaded === 0 && <>Iniciando...</>}
                            </small>
                        </div>
                        <div className="d-inline ml-2 ml-auto">
                            {this.state.completed && (
                                <span className="text-success">
                                    Completado <i icon="fa fa-check-circle"></i>
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="col-12 mt-2">
                        <div className="progress">
                            <div className="progress-bar progress-bar-striped" role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style={{ "width": `${this.state.progress}%` }}>{`${this.state.progress}%`}</div>
                        </div>
                    </div>
                </div>
            </li>
        );
    }
}

export default Downloader;