import React from 'react';
import axios from 'axios';
import {
    timeForma24,
    showModal,
    hideModal,
    viewModal,
    clearModal,
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    spinnerLoading,
    statePrivilegio,
    keyUpSearch
} from '../../helper/Tools';
import { connect } from 'react-redux';
import Paginacion from '../../helper/Paginacion';

class Perfiles extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            token: this.props.token.userToken.token,

            idPerfil: '',
            descripcion: '',
            idUsuario: this.props.token.userToken.idUsuario,

            idComprobante: '',
            loadModal: false,
            nameModal: 'Nuevo Comprobante',
            msgModal: 'Cargando datos...',

            add: statePrivilegio(this.props.token.userToken.menus[1].submenu[0].privilegio[0].estado),
            edit: statePrivilegio(this.props.token.userToken.menus[1].submenu[0].privilegio[1].estado),
            remove: statePrivilegio(this.props.token.userToken.menus[1].submenu[0].privilegio[2].estado),

            loading: false,
            lista: [],
            restart: false,

            opcion: 0,
            paginacion: 0,
            totalPaginacion: 0,
            filasPorPagina: 10,
            messageTable: 'Cargando información...',
            messagePaginacion: 'Mostranto 0 de 0 Páginas'
        }

        this.refDescripcion = React.createRef();

        this.refTxtSearch = React.createRef();

        this.idCodigo = "";
        this.abortControllerTable = new AbortController();
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    componentDidMount() {
        this.loadInit();

        viewModal("modalPerfil", () => {
            this.abortControllerModal = new AbortController();

            if (this.idCodigo !== "") {
                this.loadDataId(this.idCodigo);
            } else {
                this.loadData();
            }
            this.refDescripcion.current.focus();
        });

        clearModal("modalPerfil", async () => {
            this.abortControllerModal.abort();
            await this.setStateAsync({
                descripcion: '',
                idPerfil: '',
                loadModal: false,
                idComprobante: '',
                nameModal: 'Nuevo Comprobante',
                msgModal: 'Cargando datos...',
            });
            this.idCodigo = "";
        });

    }

    componentWillUnmount() {
        this.abortControllerTable.abort();
    }

    loadInit = async () => {
        if (this.state.loading) return;

        await this.setStateAsync({ paginacion: 1, restart: true });
        this.fillTable(0, "");
        await this.setStateAsync({ opcion: 0 });

    }

    async searchText(text) {
        if (this.state.loading) return;

        if (text.trim().length === 0) return;

        await this.setStateAsync({ paginacion: 1, restart: false });
        this.fillTable(1, text.trim());
        await this.setStateAsync({ opcion: 1 });
    }

    paginacionContext = async (listid) => {
        await this.setStateAsync({ paginacion: listid, restart: false });
        this.onEventPaginacion();
    }

    onEventPaginacion = () => {
        switch (this.state.opcion) {
            case 0:
                this.fillTable(0, "");
                break;
            case 1:
                this.fillTable(1, this.refTxtSearch.current.value);
                break;
            default: this.fillTable(0, "");
        }
    }

    fillTable = async (opcion, buscar) => {
        try {
            await this.setStateAsync({ loading: true, lista: [], messageTable: "Cargando información...", messagePaginacion: "Mostranto 0 de 0 Páginas" });

            const result = await axios.get('/api/perfil/list', {
                signal: this.abortControllerTable.signal,
                headers: {
                    Authorization: "Bearer " + this.state.token
                },
                params: {
                    "opcion": opcion,
                    "buscar": buscar.trim().toUpperCase(),
                    "posicionPagina": ((this.state.paginacion - 1) * this.state.filasPorPagina),
                    "filasPorPagina": this.state.filasPorPagina
                }
            });

            let totalPaginacion = parseInt(Math.ceil((parseFloat(result.data.total) / this.state.filasPorPagina)));
            let messagePaginacion = `Mostrando ${result.data.result.length} de ${totalPaginacion} Páginas`;

            await this.setStateAsync({
                loading: false,
                lista: result.data.result,
                totalPaginacion: totalPaginacion,
                messagePaginacion: messagePaginacion
            });
        } catch (error) {
            if (error.message !== "canceled") {
                await this.setStateAsync({
                    loading: false,
                    lista: [],
                    totalPaginacion: 0,
                    messageTable: "Se produjo un error interno, intente nuevamente por favor.",
                    messagePaginacion: "Mostranto 0 de 0 Páginas",
                });
            }
        }
    }

    async openModal(id) {
        if (id === '') {
            showModal('modalPerfil')
            await this.setStateAsync({ nameModal: "Nuevo Perfil", loadModal: true });
        }
        else {
            showModal('modalPerfil')
            this.idCodigo = id;
            await this.setStateAsync({ idPerfil: id, nameModal: "Editar Perfil", loadModal: true });
        }
    }

    loadData = async () => {
        await this.setStateAsync({ loadModal: false });
    }

    loadDataId = async (id) => {
        try {
            const perfil = await axios.get("/api/perfil/id", {
                signal: this.abortControllerModal.signal,
                headers: {
                    Authorization: "Bearer " + this.state.token
                },
                params: {
                    idPerfil: id
                }
            });

            await this.setStateAsync({
                descripcion: perfil.data.descripcion,
                idPerfil: perfil.data.idPerfil,
                loadModal: false
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
        if (this.state.descripcion === "") {
            await this.setStateAsync({ messageWarning: "Ingrese una descripción de perfil" });
            this.refDescripcion.current.focus();
            return;
        }

        ModalAlertDialog("Perfil", "¿Estás seguro de continuar?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Perfil", "Procesando información...");
                    hideModal("modalPerfil");
                    if (this.state.idPerfil !== '') {
                        let result = await axios.post('/api/perfil/update', {
                            "descripcion": this.state.descripcion.trim().toUpperCase(),
                            "idSede": "SD0001",
                            "idUsuario": this.state.idUsuario,
                            "idPerfil": this.state.idPerfil
                        }, {
                            headers: {
                                Authorization: "Bearer " + this.state.token
                            },
                        });

                        ModalAlertSuccess("Perfil", result.data, () => {
                            this.onEventPaginacion();
                        });
                    } else {
                        let result = await axios.post('/api/perfil/add', {
                            "descripcion": this.state.descripcion.trim().toUpperCase(),
                            "idSede": "SD0001",
                            "idUsuario": this.state.idUsuario,
                        }, {
                            headers: {
                                Authorization: "Bearer " + this.state.token
                            },
                        });

                        ModalAlertSuccess("Comprobante", result.data, () => {
                            this.loadInit();
                        });
                    }
                } catch (error) {
                    ModalAlertWarning("Comprobante", "Se produjo un error un interno, intente nuevamente.");
                }
            }
        });
    }

    onEventDelete(idPerfil) {
        ModalAlertDialog("Perfil", "¿Estás seguro de eliminar el perfil?", async (event) => {
            if (event) {
                try {
                    ModalAlertInfo("Perfil", "Procesando información...")
                    let result = await axios.delete('/api/perfil', {
                        headers: {
                            Authorization: "Bearer " + this.state.token
                        },
                        params: {
                            "idPerfil": idPerfil
                        }
                    })
                    ModalAlertSuccess("Perfil", result.data, () => {
                        this.loadInit();
                    })
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Perfil", error.response.data)
                    } else {
                        ModalAlertWarning("Perfil", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    render() {
        return (
            <>
                {/* Inicio modal */}
                <div className="modal fade" id="modalPerfil" data-bs-keyboard="false" data-bs-backdrop="static">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{this.state.nameModal}</h5>
                                <button type="button" className="close" data-bs-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                {this.state.loadModal ?
                                    <div className="clearfix absolute-all bg-white">
                                        {spinnerLoading(this.state.msgModal)}
                                    </div>
                                    : null
                                }
                                <div className="form-row">
                                    <div className="form-group col-md-12">
                                        <label>Descripción: <i className="fa fa-asterisk text-danger small"></i></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={this.state.descripcion}
                                            ref={this.refDescripcion}
                                            onChange={(event) =>
                                                this.setState({ descripcion: event.target.value })
                                            }
                                            onKeyPress={(event) => {
                                                event.persist();
                                                if (event.key === 'Enter') {
                                                    this.onEventGuardar();
                                                }
                                            }}
                                            placeholder='Ingrese la descripción' />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-primary" onClick={() => this.onEventGuardar()}>Aceptar</button>
                                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* fin modal */}

                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Perfiles <small className="text-secondary">LISTA</small></h5>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            <div className="input-group mb-2">
                                <div className="input-group-prepend">
                                    <div className="input-group-text"><i className="bi bi-search"></i></div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar..."
                                    ref={this.refTxtSearch}
                                    onKeyUp={(event) => keyUpSearch(event, () => this.searchText(event.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6 col-sm-12">
                        <div className="form-group">
                            <button className="btn btn-outline-info" onClick={() => this.openModal('')} disabled={!this.state.add}>
                                <i className="bi bi-file-plus"></i> Nuevo Registro
                            </button>
                            {" "}
                            <button className="btn btn-outline-secondary" onClick={() => this.loadInit()}>
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered rounded">
                                <thead>
                                    <tr>
                                        <th width="5%" className="text-center">#</th>
                                        <th width="30%">Descripción</th>
                                        <th width="30%">Empresa</th>
                                        <th width="20%">Creación</th>
                                        <th width="5%" className="text-center">Editar</th>
                                        <th width="5%" className="text-center">Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (
                                            <tr>
                                                <td className="text-center" colSpan="6">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="6">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center">{item.id}</td>
                                                        <td>{item.descripcion}</td>
                                                        <td>{item.empresa}</td>
                                                        <td>{<span>{item.fecha}</span>}{<br></br>}{<span>{timeForma24(item.hora)}</span>}</td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-warning btn-sm"
                                                                title="Editar"
                                                                onClick={() => this.openModal(item.idPerfil)}
                                                                disabled={!this.state.edit}>
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                title="Anular"
                                                                onClick={() => this.onEventDelete(item.idPerfil)}
                                                                disabled={!this.state.remove}>
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )
                                    }
                                </tbody>

                            </table>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-sm-12 col-md-5">
                        <div className="dataTables_info mt-2" role="status" aria-live="polite">{this.state.messagePaginacion}</div>
                    </div>
                    <div className="col-sm-12 col-md-7">
                        <div className="dataTables_paginate paging_simple_numbers">
                            <nav aria-label="Page navigation example">
                                <ul className="pagination justify-content-end">
                                    <Paginacion
                                        loading={this.state.loading}
                                        totalPaginacion={this.state.totalPaginacion}
                                        paginacion={this.state.paginacion}
                                        fillTable={this.paginacionContext}
                                        restart={this.state.restart}
                                    />
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        token: state.reducer
    }
}

export default connect(mapStateToProps, null)(Perfiles);