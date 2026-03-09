import React from 'react';
import axios from 'axios';
import {
    isNumeric,
    keyNumberFloat,
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    spinnerLoading
} from '../../../helper/Tools';
import { connect } from 'react-redux';

class LoteProceso extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            msgLoading: 'Cargando datos...',
            title: "Crear",

            messageWarning: '',

            idLote: '',
            idManzana: '',
            manzanas: [],
            manzanasCombo: [],
            manzana: '',
            idConcepto: '',
            conceptos: [],
            descripcion: '',
            costo: '',
            precio: '',
            idMedida: '',
            medidas: [],
            estado: '',
            medidaFrontal: '',
            costadoDerecho: '',
            costadoIzquierdo: '',
            medidaFondo: '',
            areaLote: '',
            numeroPartida: '',
            limiteFrontal: '',
            limiteDerecho: '',
            limiteIzquierdo: '',
            limitePosterior: '',
            ubicacionLote: '',
            nameLote: '',
            idProyecto: this.props.token.project.idProyecto,
            idUsuario: this.props.token.userToken.idUsuario,
        }

        this.refManzana = React.createRef();
        this.refConcepto = React.createRef();
        this.refDescripcion = React.createRef();
        this.refCosto = React.createRef();
        this.refPrecio = React.createRef();
        this.refMedida = React.createRef();
        this.refEstado = React.createRef();

        this.refMedidaFrontal = React.createRef();
        this.refCostadoDerecho = React.createRef();
        this.refCostadoIzquiero = React.createRef();
        this.refMedidaFondo = React.createRef();
        this.refAreaLote = React.createRef();
        this.refNumeroPartida = React.createRef();

        this.abortController = null;
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async componentDidMount() {
        const url = this.props.location.search;
        const idLote = new URLSearchParams(url).get("idLote");

        if (idLote) {
            this.loadDataId(idLote);
        } else {
            this.loadData();
        }
    }

    componentWillUnmount() {
        this.abortController?.abort();
    }

    async loadData() {
        this.abortController?.abort();
        this.abortController = new AbortController();

        try {
            let manzana = await axios.get(import.meta.env.VITE_APP_END_POINT + '/api/manzana/listcombo', {
                signal: this.abortController.signal,
                params: {
                    "idProyecto": this.state.idProyecto,
                }
            });

            let medida = await axios.get(import.meta.env.VITE_APP_END_POINT + '/api/medida/listcombo', {
                signal: this.abortController.signal,
            });

            const concepto = await axios.get(import.meta.env.VITE_APP_END_POINT + "/api/concepto/listcombo", {
                signal: this.abortController.signal,
            });

            await this.setStateAsync({
                title: "Crear",
                manzanas: manzana.data,
                medidas: medida.data,
                conceptos: concepto.data,
                loading: false
            });
        } catch (error) {
            if (error.code !== "ERR_CANCELED") {
                await this.setStateAsync({
                    msgModal: "Se produjo un error interno, intente nuevamente"
                });
            }
        } finally {
            this.abortController = null;
        }
    }

    async loadDataId(id) {
        this.abortController?.abort();
        this.abortController = new AbortController();

        try {
            let manzana = await axios.get(import.meta.env.VITE_APP_END_POINT + '/api/manzana/listcombo', {
                signal: this.abortController.signal,
                params: {
                    "idProyecto": this.state.idProyecto,
                }
            });

            const concepto = await axios.get(import.meta.env.VITE_APP_END_POINT + "/api/concepto/listcombo", {
                signal: this.abortController.signal,
            });

            let medida = await axios.get(import.meta.env.VITE_APP_END_POINT + '/api/medida/listcombo', {
                signal: this.abortController.signal,
            });

            let result = await axios.get(import.meta.env.VITE_APP_END_POINT + '/api/lote/id', {
                signal: this.abortController.signal,
                params: {
                    "idLote": id
                }
            });

            await this.setStateAsync({
                title: "Editar",
                idLote: result.data.idLote,
                idManzana: result.data.idManzana,
                idConcepto: result.data.idConcepto,
                descripcion: result.data.descripcion,
                costo: result.data.costo.toString(),
                precio: result.data.precio.toString(),
                idMedida: result.data.idMedida,
                estado: result.data.estado,
                medidaFrontal: result.data.medidaFrontal.toString(),
                costadoDerecho: result.data.costadoDerecho,
                costadoIzquierdo: result.data.costadoIzquierdo,
                medidaFondo: result.data.medidaFondo,
                areaLote: result.data.areaLote,
                numeroPartida: result.data.numeroPartida,
                limiteFrontal: result.data.limiteFrontal,
                limiteDerecho: result.data.limiteDerecho,
                limiteIzquierdo: result.data.limiteIzquierdo,
                limitePosterior: result.data.limitePosterior,
                ubicacionLote: result.data.ubicacionLote,

                manzanas: manzana.data,
                medidas: medida.data,
                conceptos: concepto.data,

                loading: false
            });
        } catch (error) {
            if (error.code !== "ERR_CANCELED") {
                await this.setStateAsync({
                    msgModal: "Se produjo un error interno, intente nuevamente"
                });
            }
        } finally {
            this.abortController = null;
        }
    }

    async onEventGuardar() {
        if (this.state.idManzana === "") {
            this.onFocusTab("info-tab", "info");
            this.refManzana.current.focus();
            return;
        }

        if (this.state.idConcepto === "") {
            this.onFocusTab("info-tab", "info");
            this.refConcepto.current.focus();
            return;
        }

        if (this.state.descripcion === "") {
            this.onFocusTab("info-tab", "info");
            this.refDescripcion.current.focus();
            return;
        }

        if (!isNumeric(this.state.costo)) {
            this.onFocusTab("info-tab", "info");
            this.refCosto.current.focus();
            return;
        }

        if (!isNumeric(this.state.precio)) {
            this.onFocusTab("info-tab", "info");
            this.refPrecio.current.focus();
            return;
        }

        if (this.state.idMedida === "") {
            this.onFocusTab("info-tab", "info");
            this.refMedida.current.focus();
            return;
        }

        if (this.state.estado === "") {
            this.onFocusTab("info-tab", "info");
            this.refEstado.current.focus();
            return;
        }

        try {
            ModalAlertDialog("Lote", "¿Estás seguro de continuar?", async (accept) => {
                if (accept) {
                    ModalAlertInfo("Lote", "Procesando información...");
                    
                    if (this.state.idLote !== '') {
                        let result = await axios.put(import.meta.env.VITE_APP_END_POINT + "/api/lote", {
                            "idLote": this.state.idLote,
                            "idManzana": this.state.idManzana,
                            "idConcepto": this.state.idConcepto,
                            "descripcion": this.state.descripcion.trim().toUpperCase(),
                            "costo": this.state.costo,
                            "precio": this.state.precio,
                            "idMedida": this.state.idMedida,
                            "estado": this.state.estado,
                            "medidaFrontal": isNumeric(this.state.medidaFrontal) ? this.state.medidaFrontal : 0,
                            "costadoDerecho": isNumeric(this.state.costadoDerecho) ? this.state.costadoDerecho : 0,
                            "costadoIzquierdo": isNumeric(this.state.costadoIzquierdo) ? this.state.costadoIzquierdo : 0,
                            "medidaFondo": isNumeric(this.state.medidaFondo) ? this.state.medidaFondo : 0,
                            "areaLote": isNumeric(this.state.areaLote) ? this.state.areaLote : 0,
                            "numeroPartida": isNumeric(this.state.numeroPartida) ? this.state.numeroPartida : 0,
                            "limiteFrontal": this.state.limiteFrontal,
                            "limiteDerecho": this.state.limiteDerecho,
                            "limiteIzquierdo": this.state.limiteIzquierdo,
                            "limitePosterior": this.state.limitePosterior,
                            "ubicacionLote": this.state.ubicacionLote,
                            "idUsuario": this.state.idUsuario
                        });

                        ModalAlertSuccess("Lote", result.data, () => {
                            this.props.history.goBack();
                        });
                    } else {
                        let result = await axios.post(import.meta.env.VITE_APP_END_POINT + "/api/lote", {
                            "idManzana": this.state.idManzana,
                            "idConcepto": this.state.idConcepto,
                            "descripcion": this.state.descripcion.trim().toUpperCase(),
                            "costo": this.state.costo,
                            "precio": this.state.precio,
                            "idMedida": this.state.idMedida,
                            "estado": this.state.estado,
                            "medidaFrontal": isNumeric(this.state.medidaFrontal) ? this.state.medidaFrontal : 0,
                            "costadoDerecho": isNumeric(this.state.costadoDerecho) ? this.state.costadoDerecho : 0,
                            "costadoIzquierdo": isNumeric(this.state.costadoIzquierdo) ? this.state.costadoIzquierdo : 0,
                            "medidaFondo": isNumeric(this.state.medidaFondo) ? this.state.medidaFondo : 0,
                            "areaLote": isNumeric(this.state.areaLote) ? this.state.areaLote : 0,
                            "numeroPartida": isNumeric(this.state.numeroPartida) ? this.state.numeroPartida : 0,
                            "limiteFrontal": this.state.limiteFrontal,
                            "limiteDerecho": this.state.limiteDerecho,
                            "limiteIzquierdo": this.state.limiteIzquierdo,
                            "limitePosterior": this.state.limitePosterior,
                            "ubicacionLote": this.state.ubicacionLote,
                            "idUsuario": this.state.idUsuario
                        });

                        ModalAlertSuccess("Lote", result.data, () => {
                            this.props.history.goBack();
                        });
                    }
                }
            });
        } catch (error) {
            ModalAlertWarning("Lote", "Se produjo un error un interno, intente nuevamente.");
        }
    }

    onFocusTab(idTab, idContent) {
        if (!document.getElementById(idTab).classList.contains('active')) {
            for (let child of document.getElementById('myTab').childNodes) {
                child.childNodes[0].classList.remove('active')
            }
            for (let child of document.getElementById('myTabContent').childNodes) {
                child.classList.remove('show', 'active')
            }
            document.getElementById(idTab).classList.add('active');
            document.getElementById(idContent).classList.add('show', 'active');
        }
    }

    render() {
        return (
            <>
                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>
                                <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Lote
                                <small className="ml-1 text-secondary">{this.state.title}</small>
                            </h5>
                        </div>
                    </div>
                </div>

                {
                    this.state.loading && (
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div>
                    )
                }

                <div className="row">
                    <div className="col">

                        {
                            this.state.messageWarning === '' ? null :
                                <div className="alert alert-warning" role="alert">
                                    <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                                </div>
                        }

                        <ul className="nav nav-tabs" id="myTab" role="tablist">
                            <li className="nav-item" role="presentation">
                                <a className="nav-link active" id="info-tab" data-bs-toggle="tab" href="#info" role="tab" aria-controls="info" aria-selected="true">
                                    <i className="bi bi-info-circle"></i> Descripcion
                                </a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a className="nav-link" id="medida-tab" data-bs-toggle="tab" href="#medida" role="tab" aria-controls="medida" aria-selected="false">
                                    <i className="bi bi-aspect-ratio"></i> Medidas
                                </a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a className="nav-link" id="limite-tab" data-bs-toggle="tab" href="#limite" role="tab" aria-controls="limite" aria-selected="false">
                                    <i className="bi bi-pip"></i> Limite
                                </a>
                            </li>
                        </ul>

                        <div className="tab-content pt-2" id="myTabContent">
                            <div className="tab-pane fade active show" id="info" role="tabpanel" aria-labelledby="info-tab">
                                <div className="form-group">
                                    <label htmlFor="manzana">Manzana <i className="fa fa-asterisk text-danger small"></i></label>
                                    <select
                                        className="form-control"
                                        id="manzana"
                                        ref={this.refManzana}
                                        value={this.state.idManzana}
                                        onChange={(event) => {
                                            this.setState({ idManzana: event.target.value })
                                        }}
                                    >
                                        <option value="">- Seleccione -</option>
                                        {
                                            this.state.manzanas.map((item, index) => (
                                                <option key={index} value={item.idManzana}>{item.nombre}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="manzana">Concepto <i className="fa fa-asterisk text-danger small"></i></label>
                                    <select
                                        className="form-control"
                                        id="manzana"
                                        ref={this.refConcepto}
                                        value={this.state.idConcepto}
                                        onChange={(event) => {
                                            this.setState({ idConcepto: event.target.value })
                                        }}
                                    >
                                        <option value="">- Seleccione -</option>
                                        {
                                            this.state.conceptos.map((item, index) => (
                                                <option key={index} value={item.idConcepto}>{item.nombre}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="descripción">Descripción del Lote <i className="fa fa-asterisk text-danger small"></i></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="descripcion"
                                        placeholder='ej. Lote 07'
                                        ref={this.refDescripcion}
                                        value={this.state.descripcion}
                                        onChange={(event) => {
                                            this.setState({ descripcion: event.target.value })
                                        }}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="cAproximado">Costo Aproximado <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="cAproximado"
                                            placeholder='0.00'
                                            ref={this.refCosto}
                                            value={this.state.costo}
                                            onChange={(event) => {
                                                this.setState({ costo: event.target.value })
                                            }}
                                            onKeyPress={keyNumberFloat}
                                        />
                                    </div>

                                    <div className="form-group col-md-6">
                                        <label htmlFor="pvContado">Precio Venta Contado <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="pvContado"
                                            placeholder='0.00'
                                            ref={this.refPrecio}
                                            value={this.state.precio}
                                            onChange={(event) => {
                                                this.setState({ precio: event.target.value })
                                            }}
                                            onKeyPress={keyNumberFloat}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="medidaSunat">Tipo de Medida(Sunat) <i className="fa fa-asterisk text-danger small"></i></label>
                                        <select
                                            className="form-control"
                                            id="medidaSunat"
                                            ref={this.refMedida}
                                            value={this.state.idMedida}
                                            onChange={(event) => {
                                                this.setState({ idMedida: event.target.value })
                                            }}>
                                            <option value="">- Seleccione -</option>
                                            {
                                                this.state.medidas.map((item, index) => (
                                                    <option key={index} value={item.idMedida}>{item.nombre}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                    <div className="form-group col-md-6">
                                        <label htmlFor="estado">Estado <i className="fa fa-asterisk text-danger small"></i></label>
                                        <select
                                            className="form-control"
                                            id="estado"
                                            ref={this.refEstado}
                                            value={this.state.estado}
                                            onChange={(event) => {
                                                this.setState({ estado: event.target.value })
                                            }}
                                        >
                                            <option value="">- Seleccione -</option>
                                            <option value="1">Disponible</option>
                                            <option value="2">Reservado</option>
                                            <option value="3">Vendido</option>
                                            <option value="4">Inactivo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="tab-pane fade" id="medida" role="tabpanel" aria-labelledby="medida-tab">
                                <div className="form-group">
                                    <label htmlFor="mFrontal">Medida Frontal (ML)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="mFrontal"
                                        placeholder='0'
                                        ref={this.refMedidaFrontal}
                                        value={this.state.medidaFrontal}
                                        onChange={(event) => {
                                            this.setState({ medidaFrontal: event.target.value })
                                        }}
                                        onKeyPress={keyNumberFloat}
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="coDerecho">Costado Derecho (ML)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="coDerecho"
                                            placeholder='0'
                                            ref={this.refCostadoDerecho}
                                            value={this.state.costadoDerecho}
                                            onChange={(event) => {
                                                this.setState({ costadoDerecho: event.target.value })
                                            }}
                                            onKeyPress={keyNumberFloat}
                                        />
                                    </div>

                                    <div className="form-group col-md-6">
                                        <label htmlFor="coIzquierdo">Costado Izquierdo (ML)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="coIzquierdo"
                                            placeholder='0'
                                            ref={this.refCostadoIzquiero}
                                            value={this.state.costadoIzquierdo}
                                            onChange={(event) => {
                                                this.setState({ costadoIzquierdo: event.target.value })
                                            }}
                                            onKeyPress={keyNumberFloat}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group col-md-6">
                                        <label htmlFor="mFondo">Medida Fondo (ML)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="mFondo"
                                            placeholder='0'
                                            ref={this.refMedidaFondo}
                                            value={this.state.medidaFondo}
                                            onChange={(event) => {
                                                this.setState({ medidaFondo: event.target.value })
                                            }}
                                            onKeyPress={keyNumberFloat}
                                        />
                                    </div>

                                    <div className="form-group col-md-6">
                                        <label htmlFor="aLote">Area Lote (M2)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="aLote"
                                            placeholder='0'
                                            ref={this.refAreaLote}
                                            value={this.state.areaLote}
                                            onChange={(event) => {
                                                this.setState({ areaLote: event.target.value })
                                            }}
                                            onKeyPress={keyNumberFloat}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="nPartida">N° Partida</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="nPartida"
                                        placeholder='0'
                                        ref={this.refNumeroPartida}
                                        value={this.state.numeroPartida}
                                        onChange={(event) => {
                                            this.setState({ numeroPartida: event.target.value })
                                        }}
                                        onKeyPress={keyNumberFloat}
                                    />
                                </div>
                            </div>

                            <div className="tab-pane fade" id="limite" role="tabpanel" aria-labelledby="limite-tab">
                                <div className="form-group">
                                    <label htmlFor="lFrontal">Limite, Frontal / Norte / Noreste</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="lFrontal"
                                        placeholder='Limite'
                                        value={this.state.limiteFrontal}
                                        onChange={(event) => {
                                            this.setState({ limiteFrontal: event.target.value })
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lDerecho">Limite, Derecho / Este / Sureste</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="lDerecho"
                                        placeholder='Limite'
                                        value={this.state.limiteDerecho}
                                        onChange={(event) => {
                                            this.setState({ limiteDerecho: event.target.value })
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lIzquierdo">Limite, Izquierdo / Sur / Suroeste</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="lIzquierdo"
                                        placeholder='Limite'
                                        value={this.state.limiteIzquierdo}
                                        onChange={(event) => {
                                            this.setState({ limiteIzquierdo: event.target.value })
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="lPosterior">Limite, Posterior / Oeste / Noroeste</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="lPosterior"
                                        placeholder='Limite'
                                        value={this.state.limitePosterior}
                                        onChange={(event) => {
                                            this.setState({ limitePosterior: event.target.value })
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="ubicacionLote">Ubicación del Lote</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="ubicacionLote"
                                        placeholder='ej. Frente al parque'
                                        value={this.state.ubicacionLote}
                                        onChange={(event) => {
                                            this.setState({ ubicacionLote: event.target.value })
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col">
                        <button type="button" className="btn btn-primary mr-1" onClick={() => this.onEventGuardar()}>Aceptar</button>
                        <button type="button" className="btn btn-danger ml-1" onClick={() => this.props.history.goBack()}>Cerrar</button>
                    </div>
                </div>
            </>
        );
    }
}


const mapStateToProps = (state) => {
    return {
        token: state.principal
    }
}

export default connect(mapStateToProps, null)(LoteProceso);
