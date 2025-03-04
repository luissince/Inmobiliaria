import React from 'react';
import axios from 'axios';
import {
  isNumeric,
  keyNumberInteger,
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

class MetodosPago extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      idMetodo: '',
      nombre: '',
      codigo: '',
      estado: true,
      idUsuario: this.props.token.userToken.idUsuario,

      add: statePrivilegio(this.props.token.userToken.menus[5].submenu[6].privilegio[0].estado),
      edit: statePrivilegio(this.props.token.userToken.menus[5].submenu[6].privilegio[1].estado),
      remove: statePrivilegio(this.props.token.userToken.menus[5].submenu[6].privilegio[2].estado),

      loadModal: false,
      nameModal: 'Nuevo Metodo de Pago',
      messageWarning: '',
      msgModal: 'Cargando datos...',

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
    this.refNombre = React.createRef();
    this.refPorcentaje = React.createRef();
    this.refCodigo = React.createRef();

    this.refTxtSearch = React.createRef();

    this.idCodigo = "";
    this.abortControllerTable = new AbortController();
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve)
    });
  }

  async componentDidMount() {
    this.loadInit();

    viewModal("modalMetodoPago", () => {
      this.abortControllerModal = new AbortController();

      if (this.idCodigo !== "") {
        this.loadDataId(this.idCodigo)
      } else {
        this.loadDataId("")
      }

    });

    clearModal("modalMetodoPago", async () => {
      this.abortControllerModal.abort();
      await this.setStateAsync({
        idMetodo: '',
        nombre: '',
        codigo: '',
        estado: true,

        loadModal: false,
        nameModal: 'Nuevo Metodo de Pago',
        messageWarning: '',
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

      const result = await axios.get(import.meta.env.VITE_APP_END_POINT+'/api/metodopago/list', {
        signal: this.abortControllerTable.signal,
        params: {
          "opcion": opcion,
          "buscar": buscar,
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
      showModal('modalMetodoPago')
      await this.setStateAsync({ nameModal: "Nuevo Metodo de Pago" });
    } else {
      showModal('modalMetodoPago')
      this.idCodigo = id;
      await this.setStateAsync({ idMetodo: id, nameModal: "Editar Metodo de Pago", loadModal: true });
    }
  }

  loadDataId = async (id) => {
    try {
      if (id !== "") {
        const result = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/metodoPago/id", {
          signal: this.abortControllerModal.signal,
          params: {
            idMetodo: id
          }
        });

        await this.setStateAsync({
          idMetodo: result.data.idMetodo,
          nombre: result.data.nombre,
          codigo: result.data.codigo,
          estado: result.data.estado === 1 ? true : false,
          loadModal: false
        });
      } else {
        const result = await axios.get(import.meta.env.VITE_APP_END_POINT+"/api/metodoPago/codigo", {
          signal: this.abortControllerModal.signal,
        });
        
        await this.setStateAsync({
          codigo: parseInt(result.data.codigo) + 1,
          loadModal: false
        });
      }


    } catch (error) {
      if (error.message !== "canceled") {
        await this.setStateAsync({
          msgModal: "Se produjo un error interno, intente nuevamente"
        });
      }
    }
  }

  async onEventGuardar() {
    if (this.state.nombre === "") {
      await this.setStateAsync({ messageWarning: "Ingrese el nombre." });
      this.refNombre.current.focus();
    } else {
      try {
        ModalAlertInfo("Metodo de Pago", "Procesando información...");
        hideModal("modalMetodoPago");
        if (this.state.idMetodo !== "") {
          const result = await axios.post(import.meta.env.VITE_APP_END_POINT+'/api/metodoPago/edit', {
            "idMetodo": this.state.idMetodo,
            "nombre": this.state.nombre,
            "codigo": this.state.codigo,
            "estado": this.state.estado,
            "idUsuario": this.state.idUsuario,
          });

          ModalAlertSuccess("modalMetodoPago", result.data, () => {
            this.onEventPaginacion();
          });
        } else {
          const result = await axios.post(import.meta.env.VITE_APP_END_POINT+'/api/metodoPago/add', {
            "nombre": this.state.nombre,
            "codigo": this.state.codigo,
            "estado": this.state.estado,
            "idUsuario": this.state.idUsuario,
          });

          ModalAlertSuccess("modalMetodoPago", result.data, () => {
            this.loadInit();
          });
        }
      } catch (err) {
        ModalAlertWarning("modalMetodoPago", "Se produjo un error un interno, intente nuevamente.");
      }
    }
  }

  onEventDelete(item) {
    console.log(item)
    ModalAlertDialog("metodoPago", "¿Estás seguro de eliminar el metodo de pago?", async (event) => {
      if (event) {
        try {
          ModalAlertInfo("metodoPago", "Procesando información...")
          let result = await axios.delete(import.meta.env.VITE_APP_END_POINT+'/api/metodoPago', {
            params: {
              "idMetodo": item.idMetodo,
              "codigo": item.codigo
            }
          })
          ModalAlertSuccess("metodoPago", result.data, () => {
            this.loadInit();
          })
        } catch (error) {
          if (error.response !== undefined) {
            ModalAlertWarning("metodoPago", error.response.data)
          } else {
            ModalAlertWarning("metodoPago", "Se genero un error interno, intente nuevamente.")
          }
        }
      }
    })
  }

  render() {
    return (
      <>
        {/* inicio modal */}
        <div className="modal fade" id="modalMetodoPago" data-bs-keyboard="false" data-bs-backdrop="static">
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
                  : null}

                {
                  this.state.messageWarning === '' ? null :
                    <div className="alert alert-warning" role="alert">
                      <i className="bi bi-exclamation-diamond-fill"></i> {this.state.messageWarning}
                    </div>
                }

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre: <i className="fa fa-asterisk text-danger small"></i></label>
                    <input
                      type="text"
                      placeholder="Digite..."
                      className="form-control"
                      id="nombre"
                      ref={this.refNombre}
                      value={this.state.nombre}
                      onChange={(event) => this.setState({ nombre: event.target.value })} />
                  </div>
                  <div className="form-group col-md-6">
                    <label htmlFor="numeracion">Código:</label>
                    <input
                      type="text"
                      placeholder="Digite..."
                      className="form-control"
                      id="numeracion"
                      ref={this.refCodigo}
                      value={this.state.codigo}
                      onChange={(event) => this.setState({ codigo: event.target.value })}
                      disabled="true"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="switch1"
                      checked={this.state.estado}
                      onChange={(value) => this.setState({ estado: value.target.checked })} />
                    <label className="custom-control-label" htmlFor="switch1">Activo o Inactivo</label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => this.onEventGuardar()}>Guardar</button>
                <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
        {/* fin modal */}

        <div className="row">
          <div className="col-md-12">
            <div className="form-group">
              <h5>Metodos de pago <small className="text-secondary">LISTA</small></h5>
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
          <div className="col-md-12 col-sm-12">
            <div className="table-responsive">
              <table className="table table-striped table-bordered rounded">
                <thead>
                  <tr>
                    <th width="5%" className="text-center">#</th>
                    <th width="40%" >Nombre</th>
                    <th width="15%" >Código</th>
                    <th width="15%" >Estado</th>
                    <th width="5%" className="text-center">Editar</th>
                    <th width="5%" className="text-center">Anular</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    this.state.loading ? (
                      <tr>
                        <td className="text-center" colSpan="8">
                          {spinnerLoading()}
                        </td>
                      </tr>
                    ) : this.state.lista.length === 0 ? (
                      <tr>
                        <td className="text-center" colSpan="8">¡No hay registros!</td>
                      </tr>
                    ) :
                      this.state.lista.map((item, index) => {
                        return (
                          <tr key={index}>
                            <td className="text-center">{item.id}</td>
                            <td>{item.nombre}</td>
                            <td>{item.codigo}</td>
                            <td className="text-center"><div className={`badge ${item.estado === 1 ? "badge-info" : "badge-danger"}`}>{item.estado === 1 ? "ACTIVO" : "INACTIVO"}</div></td>
                            <td className="text-center">
                              <button
                                className="btn btn-outline-warning btn-sm"
                                title="Editar"
                                onClick={() => this.openModal(item.idMetodo)}
                                disabled={!this.state.edit}>
                                <i className="bi bi-pencil"></i>
                              </button>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-outline-danger btn-sm"
                                title="Anular"
                                onClick={() => this.onEventDelete(item)}
                                disabled={!this.state.remove}>
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        )
                      })
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
    token: state.principal
  }
}

export default connect(mapStateToProps, null)(MetodosPago);