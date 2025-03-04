import React from 'react';
import axios from 'axios';
import {
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    spinnerLoading,
    keyNumberInteger,
    getExtension,
    readDataURL,
    imageSizeData
} from '../../../helper/Tools';
import { connect } from 'react-redux';
import SearchBar from "../../../helper/SearchBar";

class SedeProceso extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            idSede: '',

            nombreSede: '',
            direccion: '',

            idUbigeo: '',
            ubigeo: '',

            celular: '',
            telefono: '',
            email: '',
            web: '',
            descripcion: '',

            filter: false,
            filteredData: [],

            loading: true,
            messageWarning: '',
            msgLoading: 'Cargando datos...',

        }

        this.refNombreSede = React.createRef();
        this.refCelular = React.createRef();

        this.refDireccion = React.createRef();
        this.refUbigeo = React.createRef();

        this.selectItem = false;
        this.abortControllerModal = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        const url = this.props.location.search;
        const idSede = new URLSearchParams(url).get("idSede");
        if (idSede !== null) {
            this.loadDataId(idSede)
        } else {
            this.props.history.goBack();
        }
    }

    componentWillUnmount() {
    }

    loadDataId = async (id) => {
        try {
            const result = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/sede/id", {
                signal: this.abortControllerModal.signal,
                params: {
                    "idSede": id
                }
            });

            const data = result.data;

            await this.setStateAsync({
                idSede: data.idSede,
    
                nombreSede: data.nombreSede,
                direccion: data.direccion,

                idUbigeo: data.idUbigeo.toString(),
                ubigeo: data.departamento + "-" + data.provincia + "-" + data.distrito + " (" + data.ubigeo + ")",

                celular: data.celular,
                telefono: data.telefono,
                email: data.email,
                web: data.web,
                descripcion: data.descripcion,

                loading: false
            });

        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    msgModal: "Se produjo un error interno, intente nuevamente"
                });
            }
        }
    }

    async onEventGuardar() {

       if (this.state.nombreSede === "") {
            this.refNombreSede.current.focus();
        } else if (this.state.direccion === "") {
            this.refDireccion.current.focus();
        } else if (this.state.idUbigeo === "") {
            this.refUbigeo.current.focus();
        } else if (this.state.celular === "") {
            this.refCelular.current.focus();
        } else {
            try {

                ModalAlertInfo("Sede", "Procesando información...");

                if (this.state.idSede !== '') {
                    let result = await axios.post(import.meta.env.VITE_APP_END_POINT+'/api/sede/update', {                    
                        "nombreSede": this.state.nombreSede.trim().toUpperCase(),
                        "direccion": this.state.direccion.trim().toUpperCase(),

                        "idUbigeo": this.state.idUbigeo,

                        "celular": this.state.celular.trim(),
                        "telefono": this.state.telefono.trim(),
                        "email": this.state.email.trim().toUpperCase(),
                        "web": this.state.web.trim().toUpperCase(),
                        "descripcion": this.state.descripcion.trim().toUpperCase(),


                        "idSede": this.state.idSede
                    })

                    ModalAlertSuccess("Sede", result.data, () => {
                        this.props.history.goBack();
                    });
                } else {
                    let result = await axios.post(import.meta.env.VITE_APP_END_POINT+'/api/sede/add', {
                        "nombreSede": this.state.nombreSede.trim().toUpperCase(),
                        "direccion": this.state.direccion.trim().toUpperCase(),

                        "idUbigeo": this.state.idUbigeo,

                        "celular": this.state.celular.trim(),
                        "telefono": this.state.telefono.trim(),
                        "email": this.state.email.trim().toUpperCase(),
                        "web": this.state.web.trim().toUpperCase(),
                        "descripcion": this.state.descripcion.trim().toUpperCase()
                    });

                    ModalAlertSuccess("Sede", result.data, () => {
                        this.props.history.goBack();
                    });
                }

            } catch (error) {
                if (error.response) {
                    ModalAlertWarning("Sede", error.response.data);
                } else {
                    ModalAlertWarning("Sede", "Se produjo un error un interno, intente nuevamente.");
                }
            }
        }
    }

    handleFilter = async (event) => {

        const searchWord = this.selectItem ? "" : event.target.value;
        await this.setStateAsync({ idUbigeo: '', ubigeo: searchWord });
        this.selectItem = false;
        if (searchWord.length === 0) {
            await this.setStateAsync({ filteredData: [] });
            return;
        }

        if (this.state.filter) return;

        try {
            await this.setStateAsync({ filter: true });
            let result = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/ubigeo/", {
                params: {
                    filtrar: searchWord,
                },
            });
            await this.setStateAsync({ filter: false, filteredData: result.data });
        } catch (error) {
            await this.setStateAsync({ filter: false, filteredData: [] });
        }
    }

    onEventSelectItem = async (value) => {
        await this.setStateAsync({
            ubigeo: value.departamento + "-" + value.provincia + "-" + value.distrito + " (" + value.ubigeo + ")",
            filteredData: [],
            idUbigeo: value.idUbigeo
        });
        this.selectItem = true;
    }

    onEventClearInput = async () => {
        await this.setStateAsync({ filteredData: [], idUbigeo: '', ubigeo: "" });
        this.selectItem = false;
    }

    render() {
        return (
            <>
                {
                    this.state.loading ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgLoading)}
                        </div> :
                        null
                }

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <section className="content-header">
                            <h5>
                                <span role="button" onClick={() => this.props.history.goBack()}><i className="bi bi-arrow-left-short"></i></span> Editar Sede
                            </h5>
                        </section>
                    </div>
                </div>

                {
                    this.state.loadModal ?
                        <div className="clearfix absolute-all bg-white">
                            {spinnerLoading(this.state.msgModal)}
                        </div>
                        : null
                }


                <div className="form-row">
                    <div className="form-group col-md-6">
                        <label>Nombre de Sede: <i className="fa fa-asterisk text-danger small"></i></label>
                        <input
                            type="text"
                            className="form-control"
                            ref={this.refNombreSede}
                            value={this.state.nombreSede}
                            onChange={(event) => this.setState({ nombreSede: event.target.value })}
                            placeholder="Ingrese el nombre de la sede" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group col-md-6">
                        <label>Dirección: <i className="fa fa-asterisk text-danger small"></i></label>
                        <input
                            type="text"
                            className="form-control"
                            ref={this.refDireccion}
                            value={this.state.direccion}
                            onChange={(event) => this.setState({ direccion: event.target.value })}
                            placeholder="Ingrese el la dirección" />
                    </div>
                    <div className="form-group col-md-6">
                        <label>Ubigeo: <i className="fa fa-asterisk text-danger small"></i></label>
                        <SearchBar
                            placeholder="Escribe para iniciar a filtrar..."
                            refTxtUbigeo={this.refUbigeo}
                            ubigeo={this.state.ubigeo}
                            filteredData={this.state.filteredData}
                            onEventClearInput={this.onEventClearInput}
                            handleFilter={this.handleFilter}
                            onEventSelectItem={this.onEventSelectItem}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group col-md-6">
                        <label>celular: <i className="fa fa-asterisk text-danger small"></i></label>
                        <input
                            type="text"
                            className="form-control"
                            ref={this.refCelular}
                            value={this.state.celular}
                            onChange={(event) => this.setState({ celular: event.target.value })}
                            onKeyPress={keyNumberInteger}
                            placeholder="Ingrese el número de celular" />
                    </div>
                    <div className="form-group col-md-6">
                        <label>Telefono: </label>
                        <input
                            type="text"
                            className="form-control"
                            value={this.state.telefono}
                            onChange={(event) => this.setState({ telefono: event.target.value })}
                            onKeyPress={keyNumberInteger}
                            placeholder="Ingrese el número de telefono" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group col-md-6">
                        <label>Página Web:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={this.state.web}
                            onChange={(event) => this.setState({ web: event.target.value })}
                            placeholder="Ingrese la url" />
                    </div>
                    <div className="form-group col-md-6">
                        <label>Email:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={this.state.email}
                            onChange={(event) => this.setState({ email: event.target.value })}
                            placeholder="Ingrese el email" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group col-md-12">
                        <label>Descripción:</label>
                        <input
                            type="text"
                            className="form-control"

                            value={this.state.descripcion}
                            onChange={(event) => this.setState({ descripcion: event.target.value })}
                            placeholder="Ingrese una descripción" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <button type="button" className="btn btn-primary" onClick={() => this.onEventGuardar()}>Guardar</button>
                        {" "}
                        <button type="button" className="btn btn-danger" onClick={() => this.props.history.goBack()}>Cerrar</button>
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

export default connect(mapStateToProps, null)(SedeProceso);
