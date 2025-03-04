import logoEmpresa from '../../recursos/images/INMOBILIARIA.png';

const NotFound = (props) => {
    return (
        <div className="px-4 py-5 my-5 text-center">
            <img className="d-block mx-auto mb-4" src={logoEmpresa} alt="Logo" width="150" />
            <h1 className="display-5 fw-bold">Error 404 página no encontrada</h1>
            <div className="col-lg-6 mx-auto">
                <p className="lead mb-4">No se encuentra la página que ha solicitado.</p>
                <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                    <button type="button" onClick={() => props.history.goBack()} className="btn btn-outline-secondary btn-lg px-4">
                        <i className="bi bi-arrow-left"></i> Regresar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default NotFound;