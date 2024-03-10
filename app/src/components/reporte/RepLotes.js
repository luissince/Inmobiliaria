import React from 'react';
import CryptoJS from 'crypto-js';
import FileDownloader from "./hooks/FileDownloader";
import { connect } from 'react-redux';
import { spinnerLoading } from '../../helper/Tools';

class RepLotes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            idProyecto: this.props.token.project.idProyecto,
            nombreProyecto: this.props.token.project.nombre,

            lote: '',
            loteCheck: true,

            loading: true,
            msgLoading: '',

            porProyecto: "0",
            proyectoCkeck: true,
        }
        this.refUseFile = React.createRef();

        this.abortControllerView = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        this.loadData()
    }

    componentWillUnmount() {
        this.abortControllerView.abort();
    }

    loadData = async () => {
        try {
            await this.setStateAsync({
                loading: false,
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgLoading: "Se produjo un error interno, intente nuevamente."
                });
            }
        }
    }

    async onEventImprimir() {

        const data = {
            // "idLote": this.state.idLote,
            "idProyecto": this.state.idProyecto,
            "estadoLote": this.state.lote === '' ? 0 : this.state.lote,
            "idSede": "SD0001"
        }

        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/lote/reptipolotes?" + params, "_blank");

        //Despliegue 
        // window.open("/api/lote/replotedetalle?idLote=" + this.state.idLote + "&idSede=SD0001", "_blank");

        //Desarrollo
        // try {

        //     let result = await axios.get("/api/lote/replotedetalle", {
        //         responseType: "blob",
        //         params: {
        //             "idLote": this.state.idLote,
        //             "idSede": 'SD0001'
        //         }
        //     });

        //     const file = new Blob([result.data], { type: "application/pdf" });
        //     const fileURL = URL.createObjectURL(file);
        //     window.open(fileURL, "_blank");

        // } catch (error) {
        //     console.log(error)
        // }
    }

    async onEventPdfLoteCobrar() {
        const data = {
            "idSede": "SD0001",
            "idProyecto": this.state.idProyecto,
            "nombreProyecto": this.state.nombreProyecto,
            "porProyecto": this.state.porProyecto
        }
        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();
        let params = new URLSearchParams({ "params": ciphertext });
        window.open("/api/lote/replistardeudaslote?" + params, "_blank");
    }

    async onEventExcelLoteCobrar() {
        const data = {
            "idSede": "SD0001",
            "idProyecto": this.state.idProyecto,
            "nombreProyecto": this.state.nombreProyecto,
            "porProyecto": this.state.porProyecto
        }
        let ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), 'key-report-inmobiliaria').toString();

        this.refUseFile.current.download({
            "name": "Listar de Lotes con Deuda",
            "file": "/api/lote/exacellistardeudaslote",
            "filename": "Listar de Lotes con Deuda.xlsx",
            "params": ciphertext
        });
    }

    render() {
        return (
            <>
                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div> :
                        <>
                            <div className="card my-1">
                                <h6 className="card-header">Reporte de Lotes</h6>
                                <div className="card-body">
                                    <div className="row">

                                        <div className="col">
                                            <div className="form-group">
                                                {/* <label>Metodo de pago(s)</label> */}
                                                <div className="input-group">
                                                    <select
                                                        title="Lista de lotes"
                                                        className="form-control"
                                                        value={this.state.lote}
                                                        disabled={this.state.loteCheck}
                                                        onChange={async (event) => {
                                                            await this.setStateAsync({ lote: event.target.value });
                                                            if (this.state.lote === '') {
                                                                await this.setStateAsync({ loteCheck: true });
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Todos los Lotes</option>
                                                        <option value="1">LOTES DISPONIBLES</option>
                                                        <option value="2">LOTES RESERVADOS</option>
                                                        <option value="3">LOTES VENDIDOS</option>
                                                        <option value="4">LOTES INACTIVOS</option>
                                                    </select>

                                                    <div className="input-group-append">
                                                        <div className="input-group-text">
                                                            <div className="form-check form-check-inline m-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={this.state.loteCheck}
                                                                    onChange={async (event) => {
                                                                        await this.setStateAsync({ loteCheck: event.target.checked })
                                                                        if (this.state.loteCheck) {
                                                                            await this.setStateAsync({ lote: '' });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col text-center">
                                            <button className="btn btn-outline-warning btn-sm" onClick={() => this.onEventImprimir()}><i className="bi bi-file-earmark-pdf-fill"></i> Reporte Pdf</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card my-1">
                                <h6 className="card-header">Reporte de Lotes por Cobrar</h6>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col">
                                            <div className="form-group">
                                                <label>Proyecto<i className="fa fa-asterisk text-danger small"></i></label>
                                                <div className="input-group">
                                                    <select
                                                        title="Año"
                                                        className="form-control"
                                                        disabled={this.state.proyectoCkeck}
                                                        value={this.state.porProyecto}
                                                        onChange={(event) => this.setState({ porProyecto: event.target.value })}>
                                                        <option value={"0"}>{"Por proyecto"}</option>
                                                        <option value={"1"}>{"Todos"}</option>
                                                    </select>
                                                    <div className="input-group-append">
                                                        <div className="input-group-text">
                                                            <div className="form-check form-check-inline m-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={this.state.proyectoCkeck}
                                                                    onChange={async (event) => await this.setStateAsync({ proyectoCkeck: event.target.checked })} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col"></div>
                                    </div>

                                    <div className="row">
                                        <div className="col"></div>
                                        <div className="col">
                                            <button className="btn btn-outline-warning btn-sm" onClick={() => this.onEventPdfLoteCobrar()}><i className="bi bi-file-earmark-pdf-fill"></i> Reporte Pdf</button>
                                        </div>
                                        <div className="col">
                                            <button className="btn btn-outline-success btn-sm" onClick={() => this.onEventExcelLoteCobrar()}><i className="bi bi-file-earmark-excel-fill"></i> Reporte Excel</button>
                                        </div>
                                        <div className="col"></div>
                                    </div>
                                </div>
                            </div>

                            <FileDownloader ref={this.refUseFile} />
                        </>
                }
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(RepLotes);
