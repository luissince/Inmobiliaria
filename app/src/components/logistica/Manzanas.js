import React from "react";
import axios from "axios";
import {
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
  keyUpSearch,
} from "../../helper/Tools";
import { connect } from "react-redux";
import Paginacion from "../../helper/Paginacion";
import {
  comboProyectos,
  listarManzana,
  trasladarManzana,
} from "../../network/rest/principal.network";
import SuccessReponse from "../../model/class/response";
import ErrorResponse from "../../model/class/error";
import { CANCELED } from "../../model/types/types";

class Manzanas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      idManzana: "",
      nombre: "",
      idProyecto: this.props.token.project.idProyecto,
      idUsuario: this.props.token.userToken.idUsuario,

      add: statePrivilegio(
        this.props.token.userToken.menus[3].submenu[0].privilegio[0].estado
      ),
      edit: statePrivilegio(
        this.props.token.userToken.menus[3].submenu[0].privilegio[1].estado
      ),
      remove: statePrivilegio(
        this.props.token.userToken.menus[3].submenu[0].privilegio[2].estado
      ),
      move: statePrivilegio(
        this.props.token.userToken.menus[3].submenu[0].privilegio[3].estado
      ),

      loadModal: false,
      nameModal: "Nuevo Manzana",
      msgModal: "Cargando datos...",

      loadModalTraslado: false,
      nameModalTraslado: "Nuevo Manzana",
      msgModalTraslado: "Cargando datos...",

      idProyectoTrasladar: "",
      proyectos: [],
      messageWarning: "",

      loading: false,
      lista: [],
      restart: false,

      opcion: 0,
      paginacion: 0,
      totalPaginacion: 0,
      filasPorPagina: 10,
      messageTable: "Cargando información...",
      messagePaginacion: "Mostranto 0 de 0 Páginas",
    };

    this.refNombre = React.createRef();

    this.refTxtSearch = React.createRef();

    this.idCodigo = "";
    this.abortControllerTable = new AbortController();
  }

  setStateAsync(state) {
    return new Promise((resolve) => {
      this.setState(state, resolve);
    });
  }

  async componentDidMount() {
    this.loadInit();

    viewModal("modalManzana", () => {
      this.abortControllerModal = new AbortController();

      if (this.idCodigo !== "") this.loadDataId(this.idCodigo);
    });

    clearModal("modalManzana", async () => {
      this.abortControllerModal.abort();
      await this.setStateAsync({
        idManzana: "",
        nombre: "",

        loadModal: false,
        nameModal: "Nueva Manzana",
        msgModal: "Cargando datos...",
      });
      this.idCodigo = "";
    });

    viewModal("modalManzanaTraslado", () => {
      this.abortControllerModalTraslado = new AbortController();
      this.loadComboProyecto();
    });

    clearModal("modalManzanaTraslado", async () => {
      this.abortControllerModalTraslado.abort();
      await this.setStateAsync({
        idManzana: "",
        idProyectoTrasladar: "",
        messageWarning: "",
        proyectos: [],

        loadModalTraslado: false,
        nameModalTraslado: "Trasladar",
        msgModalTraslado: "Cargando datos...",
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
  };

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
  };

  onEventPaginacion = () => {
    switch (this.state.opcion) {
      case 0:
        this.fillTable(0, "");
        break;
      case 1:
        this.fillTable(1, this.refTxtSearch.current.value);
        break;
      default:
        this.fillTable(0, "");
    }
  };

  fillTable = async (opcion, buscar) => {
    /**
     * Restablecer las variables para la busqueda
     */
    await this.setStateAsync({
      loading: true,
      lista: [],
      messageTable: "Cargando información...",
      messagePaginacion: "Mostranto 0 de 0 Páginas",
    });

    /**
     * Parametros para iniciar la consulta
     */
    const params = {
      idProyecto: this.state.idProyecto,
      opcion: opcion,
      buscar: buscar.trim().toUpperCase(),
      posicionPagina: (this.state.paginacion - 1) * this.state.filasPorPagina,
      filasPorPagina: this.state.filasPorPagina,
    };

    /**
     * Peticion http
     */
    const response = await listarManzana(
      params,
      this.abortControllerTable.signal
    );

    /**
     * Si la respuesta fue existosa
     */
    if (response instanceof SuccessReponse) {
      const data = response.data;

      const totalPaginacion = parseInt(
        Math.ceil(parseFloat(data.total) / this.state.filasPorPagina)
      );
      const messagePaginacion = `Mostrando ${data.result.length} de ${totalPaginacion} Páginas`;

      await this.setStateAsync({
        loading: false,
        lista: data.result,
        totalPaginacion: totalPaginacion,
        messagePaginacion: messagePaginacion,
      });
    }

    /**
     * Si la respuesta fallo o fue cancelada
     */
    if (response instanceof ErrorResponse) {
      if (response.getType() === CANCELED) return;

      await this.setStateAsync({
        loading: false,
        lista: [],
        totalPaginacion: 0,
        messageTable: response.getMessage(),
        messagePaginacion: "Mostranto 0 de 0 Páginas",
      });
    }
  };

  async openModal(id) {
    if (id === "") {
      showModal("modalManzana");
      await this.setStateAsync({ nameModal: "Nueva Manzana" });
    } else {
      showModal("modalManzana");
      this.idCodigo = id;
      await this.setStateAsync({
        idManzana: id,
        nameModal: "Editar Manzana",
        loadModal: true,
      });
    }
  }

  async loadDataId(id) {
    try {
      let result = await axios.get("/api/manzana/id", {
        signal: this.abortControllerModal.signal,
        params: {
          idManzana: id,
        },
      });
      await this.setStateAsync({
        idManzana: result.data.idManzana,
        nombre: result.data.nombre,
        loadModal: false,
      });
    } catch (error) {
      if (error.message !== "canceled") {
        await this.setStateAsync({
          msgModal: "Se produjo un error interno, intente nuevamente",
        });
      }
    }
  }

  async openModalTraslado(id) {
    showModal("modalManzanaTraslado");
    await this.setStateAsync({
      idManzana: id,
      nameModalTraslado: "Trasladar",
      loadModalTraslado: true,
    });
  }

  async loadComboProyecto() {
    const response = await comboProyectos(
      this.abortControllerModalTraslado.signal
    );
    if (response instanceof SuccessReponse) {
      await this.setStateAsync({
        proyectos: response.data.filter(
          (item) => item.idProyecto !== this.state.idProyecto
        ),
        loadModalTraslado: false,
      });
    }

    if (response instanceof ErrorResponse) {
      if (response.getType() === CANCELED) return;

      await this.setStateAsync({
        msgModalTraslado: response.getMessage(),
      });
    }
  }

  onEventGuardar = async () => {
    if (this.state.nombre === "") {
      this.refNombre.current.focus();
      return;
    }

    try {
      ModalAlertInfo("Manzana", "Procesando información...");
      hideModal("modalManzana");
      if (this.state.idManzana === "") {
        const result = await axios.post("/api/manzana/", {
          nombre: this.state.nombre,
          idProyecto: this.state.idProyecto,
          idUsuario: this.state.idUsuario,
        });

        ModalAlertSuccess("Manzana", result.data, () => {
          this.loadInit();
        });
      } else {
        const result = await axios.put("/api/manzana", {
          idManzana: this.state.idManzana,
          nombre: this.state.nombre,
          idProyecto: this.state.idProyecto,
          idUsuario: this.state.idUsuario,
        });

        ModalAlertSuccess("Manzana", result.data, () => {
          this.onEventPaginacion();
        });
      }
    } catch (error) {
      ModalAlertWarning(
        "Manzana",
        "Se produjo un error un interno, intente nuevamente."
      );
    }
  };

  onEventDelete = (idManzana) => {
    ModalAlertDialog(
      "Manzana",
      "¿Estás seguro de eliminar la Manzana?",
      async (event) => {
        if (event) {
          try {
            ModalAlertInfo("Moneda", "Procesando información...");
            let result = await axios.delete("/api/manzana", {
              params: {
                idManzana: idManzana,
              },
            });
            ModalAlertSuccess("Manzana", result.data, () => {
              this.loadInit();
            });
          } catch (error) {
            if (error.response !== undefined) {
              ModalAlertWarning("Manzana", error.response.data);
            } else {
              ModalAlertWarning(
                "Manzana",
                "Se genero un error interno, intente nuevamente."
              );
            }
          }
        }
      }
    );
  };

  onEventTrasladar = async () => {
    if (this.state.idProyectoTrasladar == "") {
      this.setState({
        messageWarning: "Seleccione el proyecto a donde trasladar.",
      });
      return;
    }

    ModalAlertDialog("Manzana", "¿Está seguro de continuar?", async (value) => {
      if (value) {
        const params = {
          idManzana: this.state.idManzana,
          idProyecto: this.state.idProyecto,
          idProyectoTrasladar: this.state.idProyectoTrasladar,
          idUsuario: this.state.idUsuario,
        };

        ModalAlertInfo("Moneda", "Procesando información...");
        hideModal("modalManzanaTraslado");
        
        const response = await trasladarManzana(params);

        if (response instanceof SuccessReponse) {
          console.log(response.data);

          ModalAlertSuccess("Manzana", response.data, () => {
            this.loadInit();
          });
        }

        if (response instanceof ErrorResponse) {
          ModalAlertWarning("Manzana", response.getMessage());
        }
      }
    });
  };

  render() {
    return (
      <>
        {/* Inicio modal nuevo cliente*/}
        <div
          className="modal fade"
          id="modalManzana"
          tabIndex="-1"
          aria-labelledby="modalManzanaLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{this.state.nameModal}</h5>
                <button
                  type="button"
                  className="close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {this.state.loadModal ? (
                  <div className="clearfix absolute-all bg-white">
                    {spinnerLoading(this.state.msgModal)}
                  </div>
                ) : null}

                <div className="form-group">
                  <label htmlFor="manzana">
                    Nombre Manzana{" "}
                    <i className="fa fa-asterisk text-danger small"></i>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ingrese el nombre de la manzana"
                    ref={this.refNombre}
                    value={this.state.nombre}
                    onChange={(event) =>
                      this.setState({ nombre: event.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => this.onEventGuardar()}
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  data-bs-dismiss="modal"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* fin modal nuevo cliente*/}

        {/* Inicio modal nuevo cliente*/}
        <div
          className="modal fade"
          id="modalManzanaTraslado"
          tabIndex="-1"
          aria-labelledby="modalManzanaLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{this.state.nameModalTraslado}</h5>
                <button
                  type="button"
                  className="close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {this.state.loadModalTraslado ? (
                  <div className="clearfix absolute-all bg-white">
                    {spinnerLoading(this.state.msgModalTraslado)}
                  </div>
                ) : null}

                {this.state.messageWarning === "" ? null : (
                  <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-diamond-fill"></i>{" "}
                    {this.state.messageWarning}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="proyecto">
                    Proyectos{" "}
                    <i className="fa fa-asterisk text-danger small"></i>
                  </label>
                  <select
                    className="form-control"
                    id="proyecto"
                    value={this.state.idProyectoTrasladar}
                    onChange={(event) => {
                      this.setState({
                        idProyectoTrasladar: event.target.value,
                        messageWarning:
                          event.target.value == ""
                            ? "Seleccione el proyecto a donde trasladar."
                            : "",
                      });
                    }}
                  >
                    <option value="">- Seleccione -</option>
                    {this.state.proyectos.map((item, index) => (
                      <option key={index} value={item.idProyecto}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Seleccione un proyecto para que puedas continuar.
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => this.onEventTrasladar()}
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  data-bs-dismiss="modal"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* fin modal nuevo cliente*/}

        <div className="row">
          <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12">
            <div className="form-group">
              <h5>
                Manzanas <small className="text-secondary">LISTA</small>
              </h5>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 col-sm-12">
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
                  ref={this.refTxtSearch}
                  onKeyUp={(event) =>
                    keyUpSearch(event, () =>
                      this.searchText(event.target.value)
                    )
                  }
                />
              </div>
            </div>
          </div>
          <div className="col-md-6 col-sm-12">
            <div className="form-group">
              <button
                className="btn btn-outline-info"
                onClick={() => this.openModal("")}
                disabled={!this.state.add}
              >
                <i className="bi bi-file-plus"></i> Nuevo Registro
              </button>{" "}
              <button
                className="btn btn-outline-secondary"
                onClick={() => this.loadInit()}
              >
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
                    <th width="5%" className="text-center">
                      #
                    </th>
                    <th width="15%">Manzana</th>
                    <th width="25%">Proyecto</th>
                    <th width="5%" className="text-center">
                      Trasladar
                    </th>
                    <th width="5%" className="text-center">
                      Editar
                    </th>
                    <th width="5%" className="text-center">
                      Eliminar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.loading ? (
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
                          <td>{item.nombre}</td>
                          <td>{item.proyecto}</td>
                          <td className="text-center">
                            <button
                              className="btn btn-outline-info btn-sm"
                              title="Editar"
                              onClick={() =>
                                this.openModalTraslado(item.idManzana)
                              }
                              disabled={!this.state.move}
                            >
                              <i className="bi bi-arrow-left-right"></i>
                            </button>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-outline-warning btn-sm"
                              title="Editar"
                              onClick={() => this.openModal(item.idManzana)}
                              disabled={!this.state.edit}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-outline-danger btn-sm"
                              title="Anular"
                              onClick={() => this.onEventDelete(item.idManzana)}
                              disabled={!this.state.remove}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12 col-md-5">
            <div
              className="dataTables_info mt-2"
              role="status"
              aria-live="polite"
            >
              {this.state.messagePaginacion}
            </div>
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
    token: state.reducer,
  };
};

export default connect(mapStateToProps, null)(Manzanas);
