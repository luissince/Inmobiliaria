import React from 'react';
import axios from 'axios';
import {
    ModalAlertDialog,
    ModalAlertInfo,
    ModalAlertSuccess,
    ModalAlertWarning,
    spinnerLoading,
    statePrivilegio,
    keyUpSearch
} from '../../helper/Tools';
import { connect } from 'react-redux';
import SearchBarManzana from "../../helper/SearchBarManzana";
import Paginacion from '../../helper/Paginacion';
import { setLotesState } from '../../redux/lotesSlice';

class Lotes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            ...props.lotesState,

            add: statePrivilegio(this.props.token.userToken.menus[3].submenu[1].privilegio[0].estado),
            view: statePrivilegio(this.props.token.userToken.menus[3].submenu[1].privilegio[1].estado),
            edit: statePrivilegio(this.props.token.userToken.menus[3].submenu[1].privilegio[2].estado),
            remove: statePrivilegio(this.props.token.userToken.menus[3].submenu[1].privilegio[3].estado),

            idProyecto: this.props.token.project.idProyecto,
        }

        this.refManzana = React.createRef();
        this.refPaginacion = React.createRef();

        this.abortControllerTable = null;
    }

    setStateAsync = (newState) => {
        return new Promise((resolve) => {
            this.setState((prevState) => {

                const nextState = { ...prevState, ...newState };

                const paginacionState = this.refPaginacion.current?.getBounds();

                this.props.setLotesState({
                    ...nextState,
                    paginacionState
                });

                resolve(nextState);

                return newState;
            });
        });
    };

    async componentDidMount() {
        const pagState = this.props.lotesState.paginacionState;

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

        await this.setStateAsync({ paginacion: 1, restart: true, manzana: "", nameLote: "" });
        this.fillTable(0);
        await this.setStateAsync({ opcion: 0 });
    }

    async searchText(text) {
        const value = text.trim();

        if (this.state.loading || !value) return;

        await this.setStateAsync({ paginacion: 1, restart: false, manzana: "" });
        this.fillTable(1, value, this.state.manzana);
        await this.setStateAsync({ opcion: 1, nameLote: value });
    }

    paginacionContext = async (listid) => {
        await this.setStateAsync({ paginacion: listid, restart: false });
        this.onEventPaginacion();
    }

    onEventPaginacion = () => {
        this.fillTable(this.state.opcion, this.state.search, this.refManzana.current.value);
    }

    fillTable = async (opcion, lote = "", manzana = "") => {
        this.abortControllerTable?.abort();
        this.abortControllerTable = new AbortController();

        try {
            await this.setStateAsync({ loading: true, lista: [], messageTable: "Cargando información...", messagePaginacion: "Mostranto 0 de 0 Páginas" });

            const result = await axios.get(import.meta.env.VITE_APP_END_POINT + '/api/lote/list', {
                params: {
                    "idProyecto": this.state.idProyecto,
                    "opcion": opcion,
                    "buscar": lote.trim(),
                    "manzana": manzana,
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

    handleMostrar(idLote) {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/detalle`,
            search: "?idLote=" + idLote
        })
    }

    handleCrear() {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/proceso`
        })
    }

    handleEditar(idLote) {
        this.props.history.push({
            pathname: `${this.props.location.pathname}/proceso`,
            search: "?idLote=" + idLote
        })
    }

    handleEliminar(idLote) {
        ModalAlertDialog("Lote", "¿Estás seguro de eliminar el lote?", async (accept) => {
            if (accept) {
                try {
                    ModalAlertInfo("Lote", "Procesando información...")
                    let result = await axios.delete(import.meta.env.VITE_APP_END_POINT + '/api/lote', {
                        params: {
                            "idLote": idLote
                        }
                    })
                    ModalAlertSuccess("Lote", result.data, async () => {
                        await this.loadInit();
                    })
                } catch (error) {
                    if (error.response !== undefined) {
                        ModalAlertWarning("Lote", error.response.data)
                    } else {
                        ModalAlertWarning("Lote", "Se genero un error interno, intente nuevamente.")
                    }
                }
            }
        })
    }

    handleClearInputManzana = async () => {
        await this.setStateAsync({ manzanas: [], idManzana: '', manzana: "" });

        this.fillTable(1, this.state.nameLote, "");
    }

    handleFilterManzana = async (event) => {
        const searchWord = event.target.value;

        await this.setStateAsync({ idManzana: '', manzana: searchWord });

        if (searchWord.length === 0) {
            await this.setStateAsync({ manzanas: [] });
            return;
        }

        if (this.state.filterManzana) return;

        try {
            await this.setStateAsync({ filterManzana: true });

            let result = await axios.get(import.meta.env.VITE_APP_END_POINT + "/api/manzana/listComboByLote", {
                params: {
                    idProyecto: this.state.idProyecto,
                    buscar: searchWord,
                    nameLote: this.state.nameLote
                },
            });

            await this.setStateAsync({ filterManzana: false, manzanas: result.data });
        } catch (error) {
            await this.setStateAsync({ filterManzana: false, manzanas: [] });
        }
    }

    handleSelectItemManzana = async (value) => {
        await this.setStateAsync({
            manzanas: [],
            idManzana: value.idManzana,
            manzana: value.nombre
        });

        this.fillTable(1, this.state.nameLote, value.nombre);
    }

    render() {
        return (
            <>
                <div className='row'>
                    <div className='col-lg-12 col-md-12 col-sm-12 col-xs-12'>
                        <div className="form-group">
                            <h5>Lotes de Terreno <small className="text-secondary">LISTA</small></h5>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-4 col-sm-12">
                        <div className="form-group">
                            <div className="input-group mb-2">
                                <div className="input-group-prepend">
                                    <div className="input-group-text"><i className="bi bi-search"></i></div>
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
                    <div className="col-md-4 col-sm-12">
                        <div className="form-group">
                            <SearchBarManzana
                                placeholder="Filtrar manzana..."
                                refManzana={this.refManzana}
                                manzana={this.state.manzana}
                                manzanas={this.state.manzanas}
                                onEventClearInput={this.handleClearInputManzana}
                                handleFilter={this.handleFilterManzana}
                                onEventSelectItem={this.handleSelectItemManzana}
                            />
                        </div>
                    </div>
                    <div className="col-md-4 col-sm-12">
                        <div className="form-group">
                            <button className="btn btn-outline-info" onClick={() => this.handleCrear()} disabled={!this.state.add}>
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
                                        <th width="15%">Descripción</th>
                                        <th width="25%">P. Venta</th>
                                        <th width="20%">M.F(ML)</th>
                                        <th width="20%">M.C.D(ML)</th>
                                        <th width="20%">Area(M2)</th>
                                        <th width="10%">Estado</th>
                                        <th width="5%">Mostar</th>
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
                                                        <td>{item.descripcion}{<br />}{<small>{item.manzana}</small>}</td>
                                                        <td>{item.precio}</td>
                                                        <td>{item.medidaFondo}</td>
                                                        <td>{item.medidaFrontal}</td>
                                                        <td>{item.areaLote}</td>
                                                        <td>
                                                            {
                                                                item.estado === 1 ? <span className="badge badge-warning">Disponible</span>
                                                                    : item.estado === 2 ? <span className="badge badge-info">Reservado</span>
                                                                        : item.estado === 3 ? <span className="badge badge-success">Vendido</span>
                                                                            : <span className="badge badge-warnin">Inactivo</span>
                                                            }
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-info btn-sm"
                                                                title="Detalle"
                                                                onClick={() => this.handleMostrar(item.idLote)}
                                                                disabled={!this.state.view}>
                                                                <i className="bi bi-eye"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-warning btn-sm"
                                                                title="Editar"
                                                                onClick={() => this.handleEditar(item.idLote)}
                                                                disabled={!this.state.edit}>
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                        </td>
                                                        <td className="text-center">
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                title="Anular"
                                                                onClick={() => this.handleEliminar(item.idLote)}
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
        lotesState: state.lotes
    }
}

const mapDispatchToProps = {
    setLotesState
};

export default connect(mapStateToProps, mapDispatchToProps)(Lotes);
