import React from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import {
    spinnerLoading,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    ModalAlertDialog,
    statePrivilegio,
    keyUpSearch
} from '../../helper/Tools';
import Paginacion from '../../helper/Paginacion';
import { setClientesState } from '../../redux/clientesSlice';

class Clientes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props.clientesState,

            add: statePrivilegio(this.props.token.userToken.menus[2].submenu[0].privilegio[0].estado),
            edit: statePrivilegio(this.props.token.userToken.menus[2].submenu[0].privilegio[1].estado),
            remove: statePrivilegio(this.props.token.userToken.menus[2].submenu[0].privilegio[2].estado),
            view: statePrivilegio(this.props.token.userToken.menus[2].submenu[0].privilegio[3].estado),

            idProyecto: this.props.token.project.idProyecto,
        }

        this.refPaginacion = React.createRef();

        this.abortControllerTable = null;
    }

    setStateAsync = (newState) => {
        return new Promise((resolve) => {
            this.setState((prevState) => {

                const nextState = { ...prevState, ...newState };

                const paginacionState = this.refPaginacion.current?.getBounds();

                this.props.setClientesState({
                    ...nextState,
                    paginacionState
                });

                resolve(nextState);

                return newState;
            });
        });
    };

    async componentDidMount() {
        const pagState = this.props.clientesState.paginacionState;

        if (pagState && this.refPaginacion.current) {
            this.refPaginacion.current.setBounds(pagState);
        }

        if (!this.state.lista?.length) {
            this.loadInit();
        }
    }

    componentWillUnmount() {
        this.abortControllerTable?.abort();
    }

    loadInit = async () => {
        if (this.state.loading) return;

        await this.setStateAsync({ paginacion: 1, restart: true });
        this.fillTable(0, "");
        await this.setStateAsync({ opcion: 0 });
    }

    async searchText(text) {
        const value = text.trim();

        if (this.state.loading || !value) return;

        await this.setStateAsync({ paginacion: 1, restart: false });
        this.fillTable(1, value);
        await this.setStateAsync({ opcion: 1 });
    }

    paginacionContext = async (listid) => {
        await this.setStateAsync({ paginacion: listid, restart: false });
        this.onEventPaginacion();
    }

    onEventPaginacion = () => {
        this.fillTable(this.state.opcion, this.state.search);
    }

    fillTable = async (opcion, buscar = "") => {
        this.abortControllerTable?.abort();
        this.abortControllerTable = new AbortController();

        try {
            await this.setStateAsync({ loading: true, lista: [], messageTable: "Cargando información...", messagePaginacion: "Mostranto 0 de 0 Páginas" });

            const result = await axios.get(import.meta.env.VITE_APP_END_POINT + '/api/cliente/list', {
                signal: this.abortControllerTable.signal,
                params: {
                    "opcion": opcion,
                    "buscar": buscar,
                    "idProyecto": this.state.idProyecto,
                    "fill": this.state.fill,
                    "posicionPagina": ((this.state.paginacion - 1) * this.state.filasPorPagina),
                    "filasPorPagina": this.state.filasPorPagina
                }
            });

            const totalPaginacion = Math.ceil(result.data.total / this.state.filasPorPagina);
            let messagePaginacion = `Mostrando ${result.data.result.length} registros | ${totalPaginacion} páginas`;

            await this.setStateAsync({
                loading: false,
                lista: result.data.result,
                totalPaginacion: totalPaginacion,
                messagePaginacion: messagePaginacion
            });
        } catch (error) {
            if (error.code !== "ERR_CANCELED") {
                await this.setStateAsync({
                    loading: false,
                    lista: [],
                    totalPaginacion: 0,
                    messageTable: "Se produjo un error interno, intente nuevamente por favor.",
                    messagePaginacion: "Mostranto 0 de 0 Páginas",
                });
            }
        } finally {
            this.abortControllerTable = null;
        }
    }

    onEventAdd() {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/proceso`
        })
    }

    onEventDetail(idCliente) {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/detalle`,
            search: "?idCliente=" + idCliente
        })
    }

    onEventEdit(idCliente) {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/proceso`,
            search: "?idCliente=" + idCliente
        })
    }

    onEventDelete(idCliente) {
        ModalAlertDialog("Eliminar cliente", "¿Está seguro de que desea eliminar el contacto? Esta operación no se puede deshacer.", async (value) => {
            if (value) {
                try {
                    ModalAlertInfo("Cliente", "Procesando información...")
                    let result = await axios.delete(import.meta.env.VITE_APP_END_POINT + '/api/cliente', {
                        params: {
                            "idCliente": idCliente
                        }
                    })
                    ModalAlertSuccess("Cliente", result.data, () => {
                        this.loadInit();
                    })
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Cliente", error.response.data)
                    } else {
                        ModalAlertWarning("Cliente", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    render() {
        return (
            <>
                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Clientes <small className="text-secondary">LISTA</small></h5>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                        <div className="form-group">
                            <button className="btn btn-outline-info" onClick={() => this.onEventAdd()} disabled={!this.state.add}>
                                <i className="bi bi-file-plus"></i> Nuevo Registro
                            </button>
                            {" "}
                            <button className="btn btn-outline-secondary" onClick={() => this.loadInit()}>
                                <i className="bi bi-arrow-clockwise"></i> Recargar Vista
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-lg-6 col-md-6 col-sm-12 col-xs-12">
                        <div className="form-group">
                            <div className="input-group mb-2">
                                <div className="input-group-prepend">
                                    <div className="input-group-text">
                                        <i className="bi bi-search"></i>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Buscar..."
                                    value={this.state.search}
                                    onChange={(e) => this.setStateAsync({ search: e.target.value })}
                                    onKeyUp={(event) =>
                                        keyUpSearch(event, () => this.searchText(this.state.search))
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4 col-md-6 col-sm-12 col-xs-12">
                        <div className="form-group">
                            <select className="form-control"
                                value={this.state.fill}
                                onChange={async (value) => {
                                    await this.setStateAsync({ fill: value.target.value })
                                    this.loadInit();
                                }}>
                                <option value="any">
                                    Listar clientes por proyecto
                                </option>
                                <option value="all">
                                    Listar todos los clientes
                                </option>
                            </select>
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
                                        <th width="10%">DNI / RUC</th>
                                        <th width="20%">Cliente</th>
                                        <th width="10%">Cel. / Tel.</th>
                                        <th width="15%">Dirección</th>
                                        <th width="15%">Propiedad</th>
                                        <th width="7%">Estado</th>
                                        <th width="5%" className="text-center">Detalle</th>
                                        <th width="5%" className="text-center">Editar</th>
                                        <th width="5%" className="text-center">Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.loading ? (

                                            <tr>
                                                <td className="text-center" colSpan="10">
                                                    {spinnerLoading()}
                                                </td>
                                            </tr>
                                        ) : this.state.lista.length === 0 ? (
                                            <tr className="text-center">
                                                <td colSpan="10">¡No hay datos registrados!</td>
                                            </tr>
                                        ) : (
                                            this.state.lista.map((item, index) => {
                                                return (
                                                    <tr key={index}>
                                                        <td className="text-center">{item.id}</td>
                                                        <td>{item.tipodocumento}{<br />}{item.documento}</td>
                                                        <td>{item.informacion}</td>
                                                        <td>{item.celular}{<br />}{item.telefono}</td>
                                                        <td>{item.direccion}</td>
                                                        <td>{
                                                            item.detalle.map((detalle, indexd) => (
                                                                <div key={indexd}>
                                                                    <span>{detalle.descripcion}{<br />}{<small>{detalle.manzana}</small>}</span>
                                                                    <br />
                                                                    {indexd == item.detalle.length - 1 ? null : <hr />}
                                                                </div>
                                                            ))
                                                        }</td>
                                                        <td className="text-center">
                                                            <div className={`badge ${item.estado === 1 ? "badge-info" : "badge-danger"}`}>
                                                                {item.estado === 1 ? "ACTIVO" : "INACTIVO"}
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-info btn-sm"
                                                                title="Editar"
                                                                onClick={() => this.onEventDetail(item.idCliente)}
                                                                disabled={!this.state.view}>
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-warning btn-sm"
                                                                title="Editar"
                                                                onClick={() => this.onEventEdit(item.idCliente)}
                                                                disabled={!this.state.edit}>
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                title="Editar"
                                                                onClick={() => this.onEventDelete(item.idCliente)}
                                                                disabled={!this.state.remove}>
                                                                <i className="bi bi-trash">
                                                                </i></button>
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
                                        ref={this.refPaginacion}
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
        token: state.principal,
        clientesState: state.clientes
    }
};

const mapDispatchToProps = {
    setClientesState
};

export default connect(mapStateToProps, mapDispatchToProps)(Clientes);